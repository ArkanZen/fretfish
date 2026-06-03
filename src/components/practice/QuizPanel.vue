<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import Fretboard from '../Fretboard.vue'
import { createQuiz } from '../../composables/useQuiz.js'
import { saveScore } from '../../composables/useSettings.js'
import { useAudio } from '../../composables/useAudio.js'

const props = defineProps({
  content: String, direction: String, range: String, soundOn: Boolean,
  bare: { type: Boolean, default: false },
  inkColor: { type: String, default: '#1f2937' },
})
const TOTAL = 20
const { playMidi, playCorrect, playWrong } = useAudio()

const quiz = ref(null)
const question = ref(null)
const feedback = ref('') // '', 'ok', 'no'
const finished = ref(false)
const chosen = ref(null)
const bWrong = ref(false)

let advanceTimer = null

function start() {
  clearTimeout(advanceTimer)
  quiz.value = createQuiz({ direction: props.direction, content: props.content, range: props.range, total: TOTAL })
  finished.value = false
  feedback.value = ''
  chosen.value = null
  question.value = quiz.value.next()
}
watch(() => [props.direction, props.range, props.content], start, { immediate: true })

onBeforeUnmount(() => clearTimeout(advanceTimer))

function advance() {
  feedback.value = ''
  chosen.value = null
  if (quiz.value.stats.index >= TOTAL) {
    finished.value = true
    saveScore({ ...quiz.value.stats, direction: props.direction, content: props.content })
  } else {
    question.value = quiz.value.next()
  }
}

function answerA(opt) {
  if (feedback.value) return
  chosen.value = opt
  const ok = quiz.value.submitA(opt)
  feedback.value = ok ? 'ok' : 'no'
  if (props.soundOn) (ok ? playCorrect : playWrong)()
  advanceTimer = setTimeout(advance, ok ? 700 : 1200)
}
function onFretSelect(cell) {
  if (feedback.value) return
  const isTarget = question.value.positions.some((p) => p.string === cell.string && p.fret === cell.fret)
  const done = quiz.value.submitB({ string: cell.string, fret: cell.fret })
  if (props.soundOn) {
    if (done) playCorrect()
    else if (isTarget) playMidi(cell.midi) // 点对一个但还没全找到：响该音
    else playWrong()
  }
  if (done) { feedback.value = 'ok'; advanceTimer = setTimeout(advance, 700) }
  else if (!isTarget) { bWrong.value = true; setTimeout(() => (bWrong.value = false), 400) }
}
function highlightA(cell) {
  return question.value?.type === 'A'
    && cell.string === question.value.target.string
    && cell.fret === question.value.target.fret
}
function highlightB(cell) {
  if (question.value?.type !== 'B') return false
  return question.value.found.has(`${cell.string}-${cell.fret}`)
}
</script>

<template>
  <div class="quiz" :class="{ bare }" :style="bare ? { '--ink': inkColor } : {}">
    <div class="quizbar">
      <div class="q">第 {{ quiz.stats.index }} 题 / 共 {{ TOTAL }} 题</div>
      <div class="stats">
        <span>✅ {{ quiz.stats.correct }}</span>
        <span>❌ {{ quiz.stats.wrong }}</span>
        <span>🔥 连对 {{ quiz.stats.streak }}</span>
      </div>
    </div>

    <div v-if="finished" class="result">
      <h2>本轮完成！</h2>
      <p>正确 {{ quiz.stats.correct }} / 错误 {{ quiz.stats.wrong }}。</p>
      <button @click="start">再来一轮</button>
    </div>

    <template v-else>
      <template v-if="question.type === 'A'">
        <p class="hint">下面高亮位置是什么{{ content === 'solfege' ? '唱名' : '音' }}？</p>
        <Fretboard :content="'note'" :showAccidentals="true" :highlightFn="highlightA" :hideLabels="true" :bare="bare" :inkColor="inkColor" />
        <div class="answers">
          <button
            v-for="o in question.options"
            :key="o"
            :class="{ correct: feedback && o === question.answer, wrong: feedback === 'no' && o === chosen }"
            @click="answerA(o)"
          >{{ o }}</button>
        </div>
      </template>
      <template v-else>
        <p class="hint" :class="{ bwrong: bWrong }">在指板上点出所有的 <b>{{ question.targetNote }}</b></p>
        <Fretboard :content="'note'" :showAccidentals="true" :highlightFn="highlightB" :hideLabels="true" :bare="bare" :inkColor="inkColor" @select="onFretSelect" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.quizbar { display: flex; justify-content: space-between; background: #1e293b; color: #fff; border-radius: 12px; padding: 12px 18px; margin-bottom: 14px; }
.stats { display: flex; gap: 16px; }
.hint { font-size: 16px; }
.answers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; max-width: 480px; }
.answers button { padding: 14px 0; font-size: 18px; font-weight: 700; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; cursor: pointer; }
.answers button.correct { background: #22c55e; color: #fff; border-color: #22c55e; }
.answers button.wrong { background: #ef4444; color: #fff; border-color: #ef4444; }
.hint.bwrong { color: #ef4444; }
.result { text-align: center; padding: 30px; background: #fff; border-radius: 12px; }
.result button { padding: 10px 20px; border: none; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }

/* 摸鱼模式：计分条/提示/选项透明化，跟随自定义字体色 */
.quiz.bare { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-family: 'Helvetica Neue', Arial, system-ui, sans-serif; font-weight: 300; }
.quiz.bare .quizbar { background: transparent; color: var(--ink); padding: 2px 4px; margin-bottom: 6px; font-size: 12px; }
.quiz.bare .stats b, .quiz.bare .stats span { color: var(--ink); }
.quiz.bare .hint { color: var(--ink); font-weight: 300; }
.quiz.bare .answers button { background: transparent; color: var(--ink); border-color: color-mix(in srgb, var(--ink) 45%, transparent); font-weight: 300; }
.quiz.bare .answers button.correct { background: transparent; color: #22c55e; border-color: #22c55e; }
.quiz.bare .answers button.wrong { background: transparent; color: #ef4444; border-color: #ef4444; }
.quiz.bare .result { background: transparent; color: var(--ink); }
</style>
