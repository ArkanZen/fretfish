<script setup>
defineProps({
  mode: String,        // 'reference' | 'practice'
  content: String,     // 'note' | 'solfege' | 'shape'
  showAccidentals: Boolean,
  soundOn: Boolean,
  range: String,
  direction: String,
  zen: Boolean,
  canZen: { type: Boolean, default: false }, // 仅桌面应用可用
  inkColor: { type: String, default: '#1f2937' },
})
const emit = defineEmits(['update:mode', 'update:content', 'update:showAccidentals', 'update:soundOn', 'update:range', 'update:direction', 'update:zen', 'update:inkColor'])
</script>

<template>
  <div class="toolbar" :class="{ zen }" :data-tauri-drag-region="zen || null">
    <template v-if="!zen">
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
      <div class="group" v-if="mode === 'practice'">
        <span class="label">范围</span>
        <button :class="{ active: range === 'all' }" @click="emit('update:range', 'all')">全指板</button>
        <button :class="{ active: range === 'low5' }" @click="emit('update:range', 'low5')">1-5品</button>
        <button :class="{ active: range === 'naturalsOnly' }" @click="emit('update:range', 'naturalsOnly')">仅自然音</button>
      </div>
      <div class="group" v-if="mode === 'practice'">
        <span class="label">方向</span>
        <button :class="{ active: direction === 'A' }" @click="emit('update:direction', 'A')">看位置答音名</button>
        <button :class="{ active: direction === 'B' }" @click="emit('update:direction', 'B')">看音名点位置</button>
      </div>
    </template>

    <div class="group">
      <input
        v-if="zen"
        class="ink"
        type="color"
        :value="inkColor"
        title="字体颜色"
        @input="emit('update:inkColor', $event.target.value)"
      />
      <button
        class="fish"
        :class="{ active: zen }"
        :disabled="!canZen"
        :title="canZen ? '摸鱼透明悬浮窗' : '仅桌面应用可用'"
        @click="emit('update:zen', !zen)"
      >Fish</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 22px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.group { display: flex; gap: 8px; align-items: center; }
.label { color: #475569; font-size: 13px; }
button { padding: 6px 13px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-size: 14px; cursor: pointer; }
button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
button:disabled { opacity: .45; cursor: not-allowed; }
/* 摸鱼模式：工具条可拖动窗口，仅留 Fish 按钮 */
.toolbar.zen { margin-bottom: 6px; cursor: move; }
.toolbar.zen .fish { opacity: .55; }
.toolbar.zen .fish:hover { opacity: 1; }
.ink { width: 26px; height: 26px; padding: 0; border: 1px solid #cbd5e1; border-radius: 6px; background: none; cursor: pointer; }
</style>
