<script setup>
import { computed } from 'vue'
const props = defineProps({ cell: { type: Object, default: null } })
const emit = defineEmits(['replay'])

const OCTAVE_WORD = { '-2': '倍低音', '-1': '低音', 0: '中音', 1: '高音', 2: '倍高音' }
const solfegeText = computed(() => {
  if (!props.cell || props.cell.solfege == null) return '—'
  const word = OCTAVE_WORD[props.cell.octave] ?? ''
  return word ? `${props.cell.solfege}（${word}）` : props.cell.solfege
})
</script>

<template>
  <div class="info-bar" v-if="cell">
    <div class="big">{{ cell.note }}</div>
    <div class="fields">
      <div class="f"><span>音名</span><b>{{ cell.note }}</b></div>
      <div class="f"><span>简谱(C调)</span><b>{{ solfegeText }}</b></div>
      <div class="f"><span>位置</span><b>{{ cell.string }}弦 · {{ cell.fret === 0 ? '空弦' : '第' + cell.fret + '品' }}</b></div>
      <div class="f"><span>所属指型</span><b>{{ cell.shapes.length ? cell.shapes.join('/') + ' 指型' : '—' }}</b></div>
      <div class="f"><span>根音</span><b>{{ cell.isRoot ? '是' : '否' }}</b></div>
    </div>
    <button class="play" @click="emit('replay')">🔊 再听一次</button>
  </div>
  <div class="info-bar empty" v-else>点击指板上任意音查看详情</div>
</template>

<style scoped>
.info-bar { margin-top: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.info-bar.empty { color: #94a3b8; justify-content: center; }
.big { font-size: 44px; font-weight: 800; color: #ef4444; min-width: 52px; text-align: center; }
.fields { display: flex; gap: 26px; flex-wrap: wrap; flex: 1; }
.f { display: flex; flex-direction: column; gap: 3px; }
.f span { color: #64748b; font-size: 12px; }
.f b { color: #0f172a; font-size: 16px; }
.play { padding: 9px 16px; border: none; border-radius: 8px; background: #0f766e; color: #fff; cursor: pointer; }
</style>
