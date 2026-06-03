<script setup>
import { ref, watch } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Fretboard from './components/Fretboard.vue'
import NoteInfoBar from './components/NoteInfoBar.vue'
import QuizPanel from './components/practice/QuizPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useAudio } from './composables/useAudio.js'
import { useWindow } from './composables/useWindow.js'
import { loadSettings, saveSettings } from './composables/useSettings.js'

const saved = loadSettings({
  mode: 'reference', content: 'note', showAccidentals: false, soundOn: true,
  range: 'naturalsOnly', direction: 'A', inkColor: '#1f2937', opacity: 1,
  timbre: 'classical', fishFontSize: 19, fishFontWeight: 100, fishLineWidth: 1,
})

const mode = ref(saved.mode)
const content = ref(saved.content)
const showAccidentals = ref(saved.showAccidentals)
const soundOn = ref(saved.soundOn)
const range = ref(saved.range)
const direction = ref(saved.direction)
const inkColor = ref(saved.inkColor)
const opacity = ref(saved.opacity)
const timbre = ref(saved.timbre)
const fishFontSize = ref(saved.fishFontSize)
const fishFontWeight = ref(saved.fishFontWeight)
const fishLineWidth = ref(saved.fishLineWidth)
const selected = ref(null)
const settingsOpen = ref(false)

// 摸鱼模式（窗口能力，仅桌面应用）
const { inTauri, setDecorations, setAlwaysOnTop, setShadow } = useWindow()
const zen = ref(false) // 每次启动默认非摸鱼

const { playMidi } = useAudio()

function onSelect(cell) {
  selected.value = cell
  if (soundOn.value) playMidi(cell.midi, timbre.value)
}
function replay() {
  if (selected.value && soundOn.value) playMidi(selected.value.midi, timbre.value)
}

// 进入摸鱼：去边框 + 去窗口阴影 + 自动置顶；退出：恢复
watch(zen, (v) => {
  setDecorations(!v)
  setShadow(!v)
  setAlwaysOnTop(v)
})

watch([mode, content, showAccidentals, soundOn, range, direction, inkColor, opacity, timbre, fishFontSize, fishFontWeight, fishLineWidth], () => {
  saveSettings({
    mode: mode.value, content: content.value, showAccidentals: showAccidentals.value,
    soundOn: soundOn.value, range: range.value, direction: direction.value,
    inkColor: inkColor.value, opacity: opacity.value, timbre: timbre.value,
    fishFontSize: fishFontSize.value, fishFontWeight: fishFontWeight.value,
    fishLineWidth: fishLineWidth.value,
  })
})
</script>

<template>
  <main class="app" :class="{ zen }" :style="zen ? { opacity } : {}" :data-tauri-drag-region="zen ? 'deep' : null">
    <h1 v-if="!zen">吉他指板记忆器</h1>

    <Toolbar
      v-model:mode="mode"
      v-model:content="content"
      v-model:showAccidentals="showAccidentals"
      v-model:soundOn="soundOn"
      v-model:range="range"
      v-model:direction="direction"
      v-model:zen="zen"
      :canZen="inTauri"
      @open-settings="settingsOpen = true"
    />
    <template v-if="mode === 'reference'">
      <Fretboard :content="content" :showAccidentals="showAccidentals" :selected="selected" :bare="zen" :inkColor="inkColor" :fishFontSize="fishFontSize" :fishFontWeight="fishFontWeight" :fishLineWidth="fishLineWidth" @select="onSelect" />
      <NoteInfoBar v-if="!zen" :cell="selected" @replay="replay" />
    </template>
    <QuizPanel
      v-else
      :content="content"
      :direction="direction"
      :range="range"
      :soundOn="soundOn"
      :bare="zen"
      :inkColor="inkColor"
      :timbre="timbre"
      :fishFontSize="fishFontSize"
      :fishFontWeight="fishFontWeight"
      :fishLineWidth="fishLineWidth"
    />

    <SettingsPanel
      v-model:open="settingsOpen"
      v-model:timbre="timbre"
      v-model:inkColor="inkColor"
      v-model:opacity="opacity"
      v-model:fishFontSize="fishFontSize"
      v-model:fishFontWeight="fishFontWeight"
      v-model:fishLineWidth="fishLineWidth"
    />
  </main>
</template>

<style>
body { font-family: system-ui, -apple-system, "PingFang SC", sans-serif; margin: 0; background: #f1f5f9; }
.app { max-width: 1100px; margin: 0 auto; padding: 24px; }
h1 { font-size: 20px; }

/* 摸鱼模式：窗口与页面背景透明，只剩指板线条浮在桌面上 */
.app.zen { padding: 8px; max-width: none; background: transparent; cursor: move; }
body:has(.app.zen) { background: transparent; }
</style>
