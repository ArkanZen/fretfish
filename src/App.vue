<script setup>
import { ref } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Fretboard from './components/Fretboard.vue'
import NoteInfoBar from './components/NoteInfoBar.vue'
import QuizPanel from './components/practice/QuizPanel.vue'
import { useAudio } from './composables/useAudio.js'

const mode = ref('reference')
const content = ref('note')
const showAccidentals = ref(false)
const soundOn = ref(true)
const selected = ref(null)
const range = ref('naturalsOnly')
const direction = ref('A')

const { playMidi } = useAudio()

function onSelect(cell) {
  selected.value = cell
  if (soundOn.value) playMidi(cell.midi)
}
function replay() {
  if (selected.value && soundOn.value) playMidi(selected.value.midi)
}
</script>

<template>
  <main class="app">
    <h1>吉他指板记忆器</h1>
    <Toolbar
      v-model:mode="mode"
      v-model:content="content"
      v-model:showAccidentals="showAccidentals"
      v-model:soundOn="soundOn"
      v-model:range="range"
      v-model:direction="direction"
    />
    <template v-if="mode === 'reference'">
      <Fretboard :content="content" :showAccidentals="showAccidentals" :selected="selected" @select="onSelect" />
      <NoteInfoBar :cell="selected" @replay="replay" />
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
</style>
