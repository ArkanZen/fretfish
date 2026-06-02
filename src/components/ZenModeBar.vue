<script setup>
import { watch } from 'vue'
import { useWindow } from '../composables/useWindow.js'

const props = defineProps({
  opacity: Number,
  scale: Number,
  onTop: Boolean,
})
const emit = defineEmits(['update:opacity', 'update:scale', 'update:onTop', 'exit'])
const { setAlwaysOnTop, hide } = useWindow()

watch(() => props.onTop, (v) => setAlwaysOnTop(v), { immediate: true })
</script>

<template>
  <div class="zenbar" data-tauri-drag-region>
    <span class="drag" data-tauri-drag-region>⠿ 拖动</span>
    <label>透明
      <input type="range" min="0.3" max="1" step="0.05" :value="opacity"
        @input="emit('update:opacity', +$event.target.value)" />
    </label>
    <label>缩放
      <input type="range" min="0.6" max="1.6" step="0.1" :value="scale"
        @input="emit('update:scale', +$event.target.value)" />
    </label>
    <button :class="{ active: onTop }" @click="emit('update:onTop', !onTop)">置顶</button>
    <button @click="hide()">隐藏 (⌘⇧H 呼出)</button>
    <button @click="emit('exit')">退出摸鱼</button>
  </div>
</template>

<style scoped>
.zenbar { display: flex; gap: 12px; align-items: center; background: rgba(15, 23, 42, .82); color: #fff; padding: 6px 12px; border-radius: 10px; font-size: 13px; flex-wrap: wrap; margin-bottom: 10px; }
.drag { cursor: move; opacity: .8; user-select: none; }
label { display: flex; align-items: center; gap: 4px; }
input[type=range] { vertical-align: middle; }
button { background: #334155; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 13px; }
button.active { background: #0f766e; }
</style>
