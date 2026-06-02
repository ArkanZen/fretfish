<script setup>
import { computed } from 'vue'
import { buildFretboard, MAX_FRET } from '../composables/useFretboard.js'
import { SHAPES } from '../data/shapes.js'

const props = defineProps({
  content: { type: String, default: 'note' },      // 'note' | 'solfege' | 'shape'
  showAccidentals: { type: Boolean, default: false },
  selected: { type: Object, default: null },        // {string,fret} 当前高亮
  highlightFn: { type: Function, default: null },    // (cell)=>boolean 练习用额外高亮
  hideLabels: { type: Boolean, default: false },     // hide note text (practice mode)
  bare: { type: Boolean, default: false },           // 摸鱼模式：透明背景只留线条
  inkColor: { type: String, default: '#1f2937' },    // 摸鱼模式字体/线条颜色（可自定义）
})
const emit = defineEmits(['select'])

const allCells = computed(() => buildFretboard())
const frets = Array.from({ length: MAX_FRET + 1 }, (_, i) => i) // 0..16
const inlayFrets = [3, 5, 7, 9, 15]
const dblInlayFrets = [12]

function rowCells(string) {
  return allCells.value.filter((c) => c.string === string)
}
function visible(cell) {
  return props.showAccidentals || cell.isNatural
}
function dotStyle(cell) {
  if (props.content === 'shape' && cell.shapes.length) {
    const c = SHAPES[cell.shapes[0]].color
    // 摸鱼模式只用颜色染数字，不要圆圈底色
    return props.bare ? { color: c } : { background: c, color: '#fff' }
  }
  return {}
}
function label(cell) {
  if (props.content === 'solfege' || props.content === 'shape') return cell.solfege ?? ''
  return cell.note
}
function isSelected(cell) {
  return props.selected && props.selected.string === cell.string && props.selected.fret === cell.fret
}
function showDot(cell) {
  return visible(cell) && (props.hideLabels || label(cell) !== '')
}
// 简谱八度点：仅在简谱/指型内容、且有唱名时显示
function showOctave(cell) {
  return !props.hideLabels && (props.content === 'solfege' || props.content === 'shape') && cell.solfege != null
}
function dots(n) {
  return '·'.repeat(Math.abs(n))
}
</script>

<template>
  <div class="fb" :class="{ bare }" :style="bare ? { '--ink': inkColor } : {}">
    <div v-for="s in 6" :key="s" class="fb-row">
      <div class="fb-strlabel">{{ bare ? s : s + '弦' }}</div>
      <div
        v-for="cell in rowCells(s)"
        :key="cell.fret"
        class="fb-cell"
        :class="{ nut: cell.fret === 0 }"
      >
        <div class="fb-string"></div>
        <div
          v-if="showDot(cell)"
          class="dot"
          :class="{
            root: cell.isRoot,
            sel: isSelected(cell),
            hit: highlightFn && highlightFn(cell),
          }"
          :style="dotStyle(cell)"
          @click="emit('select', cell)"
        >
          <template v-if="!hideLabels">
            <span v-if="showOctave(cell) && cell.octave > 0" class="oct above">{{ dots(cell.octave) }}</span>
            <span class="digit">{{ label(cell) }}</span>
            <span v-if="showOctave(cell) && cell.octave < 0" class="oct below">{{ dots(cell.octave) }}</span>
          </template>
        </div>
      </div>
    </div>

    <div class="fb-frets">
      <div class="fb-strlabel-spacer"></div>
      <div v-for="f in frets" :key="f" class="fb-fretno">
        <template v-if="bare">{{ f }}</template>
        <template v-else>
          <span v-if="f === 0">弦枕</span>
          <template v-else>{{ f }}<small>品</small></template>
        </template>
        <span v-if="inlayFrets.includes(f)" class="inlay">•</span>
        <span v-if="dblInlayFrets.includes(f)" class="inlay">••</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fb { background: #3b2a1a; border-radius: 10px; padding: 10px 12px; overflow-x: auto; }
.fb.bare { background: transparent; }
.fb-row, .fb-frets { display: grid; grid-template-columns: 44px 56px repeat(16, minmax(38px, 1fr)); }
.fb-strlabel { color: #e7d3b3; font-size: 12px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; height: 42px; }
.fb-cell { position: relative; height: 42px; border-right: 2px solid #8a7a5c; display: flex; align-items: center; justify-content: center; }
.fb-cell.nut { border-right: 7px solid #efe2c6; }
.fb-string { position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; background: #b9a47e; }
/* 弦枕（空弦/0品）格子里不画弦线，避免弦线在弦枕左侧突出 */
.fb-cell.nut .fb-string { display: none; }
.dot { position: relative; z-index: 2; width: 30px; height: 30px; border-radius: 50%; background: #f8fafc; color: #0f172a; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.dot.root { background: #ef4444; color: #fff; }
.dot.sel { outline: 3px solid #facc15; }
.dot.hit { background: #22c55e; color: #fff; }
.fb-fretno { text-align: center; color: #f1e7cf; font-size: 13px; font-weight: 700; padding-top: 4px; }
.fb-fretno small { color: #a89b7c; font-weight: 300; }
.inlay { display: block; color: #d9c9a6; font-size: 10px; }
.fb-strlabel-spacer { width: 44px; }
.oct { position: absolute; left: 0; right: 0; text-align: center; font-size: 9px; line-height: 1; letter-spacing: 1px; pointer-events: none; }
.oct.above { top: 1px; }
.oct.below { bottom: 1px; }
.digit { line-height: 1; }

/* 摸鱼模式：细线条、纯数字、无圆圈底色，颜色随 --ink 自定义 */
.fb.bare .fb-cell { border-right: 1px solid color-mix(in srgb, var(--ink) 38%, transparent); }
.fb.bare .fb-cell.nut { border-right-width: 2px; }
.fb.bare .fb-string { height: 1px; background: color-mix(in srgb, var(--ink) 38%, transparent); }
.fb.bare .dot { background: transparent; box-shadow: none; border-radius: 0; width: auto; min-height: 30px; height: auto; color: var(--ink); font-size: 19px; font-weight: 300; }
.fb.bare .dot.root { color: #ef4444; }
.fb.bare .dot.sel { outline: none; }
.fb.bare .fb-strlabel { color: var(--ink); font-weight: 300; }
.fb.bare .fb-fretno { color: var(--ink); font-weight: 300; }
.fb.bare .fb-fretno small { color: var(--ink); }
.fb.bare .inlay { color: color-mix(in srgb, var(--ink) 55%, transparent); }
.fb.bare .oct { font-size: 10px; }
.fb.bare .oct.above { top: -5px; }
.fb.bare .oct.below { bottom: -5px; }
/* 透明窗口上抗锯齿：走灰度渲染 + 更干净的细字体 + 超细字重 */
.fb.bare { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-family: 'Helvetica Neue', Arial, system-ui, sans-serif; }
.fb.bare .dot, .fb.bare .fb-strlabel, .fb.bare .fb-fretno { font-weight: 100; }
</style>
