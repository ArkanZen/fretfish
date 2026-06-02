<script setup>
defineProps({
  mode: String,        // 'reference' | 'practice'
  content: String,     // 'note' | 'solfege' | 'shape'
  showAccidentals: Boolean,
  soundOn: Boolean,
})
const emit = defineEmits(['update:mode', 'update:content', 'update:showAccidentals', 'update:soundOn'])
</script>

<template>
  <div class="toolbar">
    <div class="group">
      <span class="label">模式</span>
      <button :class="{ active: mode === 'reference' }" @click="emit('update:mode', 'reference')">参考</button>
      <button :class="{ active: mode === 'practice' }" @click="emit('update:mode', 'practice')">练习</button>
    </div>
    <div class="group">
      <span class="label">内容</span>
      <button :class="{ active: content === 'note' }" @click="emit('update:content', 'note')">音名</button>
      <button :class="{ active: content === 'solfege' }" @click="emit('update:content', 'solfege')">简谱</button>
      <button :class="{ active: content === 'shape' }" @click="emit('update:content', 'shape')">指型</button>
    </div>
    <div class="group">
      <button :class="{ active: showAccidentals }" @click="emit('update:showAccidentals', !showAccidentals)">显示升降音</button>
      <button :class="{ active: soundOn }" @click="emit('update:soundOn', !soundOn)">🔊 发音</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 22px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.group { display: flex; gap: 8px; align-items: center; }
.label { color: #475569; font-size: 13px; }
button { padding: 6px 13px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-size: 14px; cursor: pointer; }
button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
</style>
