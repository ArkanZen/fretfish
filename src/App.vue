<script setup>
import { ref, watch } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Fretboard from './components/Fretboard.vue'
import NoteInfoBar from './components/NoteInfoBar.vue'
import QuizPanel from './components/practice/QuizPanel.vue'
import { useAudio } from './composables/useAudio.js'
import { useWindow } from './composables/useWindow.js'
import { loadSettings, saveSettings } from './composables/useSettings.js'

const saved = loadSettings({
  mode: 'reference', content: 'note', showAccidentals: false, soundOn: true,
  range: 'naturalsOnly', direction: 'A', inkColor: '#1f2937',
})

const mode = ref(saved.mode)
const content = ref(saved.content)
const showAccidentals = ref(saved.showAccidentals)
const soundOn = ref(saved.soundOn)
const range = ref(saved.range)
const direction = ref(saved.direction)
const inkColor = ref(saved.inkColor)
const selected = ref(null)

// 摸鱼模式（窗口能力，仅桌面应用）
const { inTauri, setDecorations, setAlwaysOnTop } = useWindow()
const zen = ref(false) // 每次启动默认非摸鱼

const { playMidi } = useAudio()

function onSelect(cell) {
  selected.value = cell
  if (soundOn.value) playMidi(cell.midi)
}
function replay() {
  if (selected.value && soundOn.value) playMidi(selected.value.midi)
}

// 进入摸鱼：去边框 + 自动置顶；退出：恢复
watch(zen, (v) => {
  setDecorations(!v)
  setAlwaysOnTop(v)
})

watch([mode, content, showAccidentals, soundOn, range, direction, inkColor], () => {
  saveSettings({
    mode: mode.value, content: content.value, showAccidentals: showAccidentals.value,
    soundOn: soundOn.value, range: range.value, direction: direction.value,
    inkColor: inkColor.value,
  })
})
</script>

<template>
  <main class="app" :class="{ zen }">
    <h1 v-if="!zen">吉他指板记忆器</h1>

    <Toolbar
      v-model:mode="mode"
      v-model:content="content"
      v-model:showAccidentals="showAccidentals"
      v-model:soundOn="soundOn"
      v-model:range="range"
      v-model:direction="direction"
      v-model:zen="zen"
      v-model:inkColor="inkColor"
      :canZen="inTauri"
    />
    <template v-if="mode === 'reference'">
      <Fretboard :content="content" :showAccidentals="showAccidentals" :selected="selected" :bare="zen" :inkColor="inkColor" @select="onSelect" />
      <NoteInfoBar v-if="!zen" :cell="selected" @replay="replay" />
    </template>
    <QuizPanel
      v-else
      :content="content"
      :direction="direction"
      :range="range"
      :soundOn="soundOn"
    />
  </main>
</template>

<style>
body { font-family: system-ui, -apple-system, "PingFang SC", sans-serif; margin: 0; background: #f1f5f9; }
.app { max-width: 1100px; margin: 0 auto; padding: 24px; }
h1 { font-size: 20px; }

/* 摸鱼模式：窗口与页面背景透明，只剩指板线条浮在桌面上 */
.app.zen { padding: 8px; max-width: none; background: transparent; }
body:has(.app.zen) { background: transparent; }
</style>
