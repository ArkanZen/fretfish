<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { TIMBRES } from '../composables/useAudio.js'

const props = defineProps({
  open: Boolean,
  timbre: { type: String, default: 'classical' },
  inkColor: { type: String, default: '#1f2937' },
  opacity: { type: Number, default: 1 },
  fishFontSize: { type: Number, default: 19 },
  fishFontWeight: { type: Number, default: 100 },
  fishLineWidth: { type: Number, default: 1 },
})
const emit = defineEmits([
  'update:open', 'update:timbre', 'update:inkColor',
  'update:opacity', 'update:fishFontSize', 'update:fishFontWeight', 'update:fishLineWidth',
])

function close() { emit('update:open', false) }

function onKey(e) { if (e.key === 'Escape') close() }
// 打开时监听 Esc，关闭时移除
watch(() => props.open, (v) => {
  if (typeof window === 'undefined') return
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <!-- Teleport 到 body：避免被 .app.zen 的 opacity 连带变透明；同时脱离 fish 整窗拖动区 -->
  <Teleport to="body">
  <!-- 遮罩 + 浮层：fish 模式整窗可拖动，这里显式关闭拖动避免误移窗口 -->
  <div v-if="open" class="overlay" data-tauri-drag-region="false" @click.self="close">
    <div class="panel" data-tauri-drag-region="false">
      <div class="phead">
        <span>设置</span>
        <button class="close" title="关闭" @click="close">×</button>
      </div>

      <div class="row">
        <span class="rlabel">音色</span>
        <div class="seg">
          <button
            v-for="t in TIMBRES"
            :key="t.id"
            :class="{ active: timbre === t.id }"
            @click="emit('update:timbre', t.id)"
          >{{ t.label }}</button>
        </div>
      </div>

      <div class="divider"><span>摸鱼(fish)外观</span></div>
      <p class="hint">以下仅在摸鱼模式生效</p>

      <div class="row">
        <span class="rlabel">字体颜色</span>
        <input
          type="color"
          :value="inkColor"
          @input="emit('update:inkColor', $event.target.value)"
        />
      </div>

      <div class="row">
        <span class="rlabel">透明度</span>
        <input
          type="range" min="0.2" max="1" step="0.05"
          :value="opacity"
          @input="emit('update:opacity', +$event.target.value)"
        />
        <span class="val">{{ Math.round(opacity * 100) }}%</span>
      </div>

      <div class="row">
        <span class="rlabel">字体大小</span>
        <input
          type="range" min="12" max="36" step="1"
          :value="fishFontSize"
          @input="emit('update:fishFontSize', +$event.target.value)"
        />
        <span class="val">{{ fishFontSize }}px</span>
      </div>

      <div class="row">
        <span class="rlabel">字体粗细</span>
        <input
          type="range" min="100" max="900" step="100"
          :value="fishFontWeight"
          @input="emit('update:fishFontWeight', +$event.target.value)"
        />
        <span class="val">{{ fishFontWeight }}</span>
      </div>

      <div class="row">
        <span class="rlabel">线条粗细</span>
        <input
          type="range" min="0.5" max="4" step="0.5"
          :value="fishLineWidth"
          @input="emit('update:fishLineWidth', +$event.target.value)"
        />
        <span class="val">{{ fishLineWidth.toFixed(1) }}px</span>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.35);
  display: flex; align-items: center; justify-content: center;
}
.panel {
  width: 320px; max-width: calc(100vw - 32px);
  background: #fff; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  padding: 14px 16px 18px; cursor: default;
}
.phead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.phead span { font-size: 15px; font-weight: 600; color: #0f172a; }
.close { border: none; background: none; font-size: 22px; line-height: 1; color: #94a3b8; cursor: pointer; padding: 0 4px; }
.close:hover { color: #475569; }
.row { display: flex; align-items: center; gap: 10px; margin: 12px 0; }
.rlabel { width: 64px; flex: none; color: #475569; font-size: 13px; }
.seg { display: flex; gap: 6px; }
.seg button { padding: 5px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer; }
.seg button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.row input[type="range"] { flex: 1; }
.row input[type="color"] { width: 28px; height: 28px; padding: 0; border: 1px solid #cbd5e1; border-radius: 6px; background: none; cursor: pointer; }
.val { width: 44px; flex: none; text-align: right; color: #64748b; font-size: 12px; font-variant-numeric: tabular-nums; }
.divider { display: flex; align-items: center; margin: 16px 0 2px; color: #94a3b8; font-size: 12px; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }
.divider span { padding: 0 10px; }
.hint { margin: 0 0 4px; color: #94a3b8; font-size: 11px; }
</style>
