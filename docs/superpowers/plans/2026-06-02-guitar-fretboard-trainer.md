# 吉他指板记忆器 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个 Vue3 + Tauri 的吉他指板记忆应用：可交互参考指板（音名/简谱/指型三图层）+ 练习测验 + 点击发音 + 桌面"摸鱼"透明悬浮窗。

**Architecture:** 纯前端逻辑放在 composables（`useFretboard`/`useAudio`/`useQuiz`/`useWindow`），UI 拆成 `Toolbar`/`Fretboard`/`NoteInfoBar`/`QuizPanel`/`ZenModeBar`。先做纯浏览器可运行的核心，最后用 Tauri 包桌面壳获得透明/置顶/老板键。窗口能力在非 Tauri 环境降级为 no-op。

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, Vitest + @vue/test-utils + jsdom, Web Audio API, Tauri 2 (Rust)。

参考设计文档：`docs/superpowers/specs/2026-06-02-guitar-fretboard-trainer-design.md`

---

## 文件结构

```
guiter-link/
├─ index.html
├─ package.json
├─ vite.config.js
├─ vitest.config.js
├─ src/
│  ├─ main.js                     # 挂载 Vue app
│  ├─ App.vue                     # 顶层状态：mode/content/开关/zen
│  ├─ components/
│  │  ├─ Toolbar.vue              # 模式/内容/开关/范围 切换
│  │  ├─ Fretboard.vue            # 指板渲染 + 点击
│  │  ├─ NoteInfoBar.vue          # 参考模式下方当前选中卡片
│  │  ├─ ZenModeBar.vue           # 摸鱼控制条
│  │  └─ practice/
│  │     └─ QuizPanel.vue         # 练习容器（含方向A/B）
│  ├─ composables/
│  │  ├─ useFretboard.js          # 指板数据模型 + 常量
│  │  ├─ useAudio.js              # 频率换算 + Web Audio 合成
│  │  ├─ useQuiz.js               # 出题/判分/连对/计时/成绩
│  │  ├─ useWindow.js             # Tauri 窗口能力封装（降级 no-op）
│  │  └─ useSettings.js           # localStorage 设置持久化
│  └─ data/
│     └─ shapes.js                # 五个指型（Sol/La/Si/Re/Mi）定义
├─ tests/
│  ├─ useFretboard.test.js
│  ├─ useAudio.test.js
│  ├─ useQuiz.test.js
│  ├─ shapes.test.js
│  └─ Fretboard.test.js
└─ src-tauri/                     # Task 11 才创建
   ├─ tauri.conf.json
   ├─ Cargo.toml
   └─ src/main.rs
```

---

## Task 0: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `index.html`, `src/main.js`, `src/App.vue`

- [ ] **Step 1: 初始化 npm 项目并装依赖**

Run:
```bash
cd /Users/ryan/aiworkspace/guiter-link
npm init -y
npm install vue
npm install -D vite @vitejs/plugin-vue vitest @vue/test-utils jsdom
```

- [ ] **Step 2: 写 `vite.config.js`**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Tauri 期望固定端口；浏览器开发也用它
  server: { port: 5173, strictPort: true },
  clearScreen: false,
})
```

- [ ] **Step 3: 写 `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true },
})
```

- [ ] **Step 4: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>吉他指板记忆器</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: 写 `src/main.js`**

```js
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

- [ ] **Step 6: 写占位 `src/App.vue`**

```vue
<script setup>
</script>

<template>
  <h1>吉他指板记忆器</h1>
</template>
```

- [ ] **Step 7: 在 `package.json` 的 `scripts` 中加入**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 8: 验证开发服务器与测试可启动**

Run: `npm run test`
Expected: `No test files found` 之类的提示（无报错退出）。

Run: `npm run dev` 然后浏览器打开 http://localhost:5173，看到「吉他指板记忆器」标题，Ctrl-C 结束。

- [ ] **Step 9: Commit**

```bash
cd /Users/ryan/aiworkspace/guiter-link && git init && printf "node_modules/\ndist/\n.superpowers/\nsrc-tauri/target/\n" > .gitignore
git add -A && git commit -m "chore: scaffold Vue3 + Vite + Vitest project"
```

---

## Task 1: `useFretboard` 指板数据模型

**Files:**
- Create: `src/composables/useFretboard.js`
- Test: `tests/useFretboard.test.js`

- [ ] **Step 1: 写失败测试**

`tests/useFretboard.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { noteAt, midiAt, buildFretboard } from '../src/composables/useFretboard.js'

describe('noteAt', () => {
  it('空弦音正确（1→6 弦）', () => {
    expect(noteAt(1, 0)).toBe('E')
    expect(noteAt(2, 0)).toBe('B')
    expect(noteAt(3, 0)).toBe('G')
    expect(noteAt(4, 0)).toBe('D')
    expect(noteAt(5, 0)).toBe('A')
    expect(noteAt(6, 0)).toBe('E')
  })
  it('按品推算音名', () => {
    expect(noteAt(5, 3)).toBe('C') // 5弦3品 = C
    expect(noteAt(1, 1)).toBe('F') // 1弦1品 = F
    expect(noteAt(3, 9)).toBe('E') // 3弦9品 = E
    expect(noteAt(6, 12)).toBe('E')
    expect(noteAt(5, 2)).toBe('B')
  })
})

describe('midiAt', () => {
  it('空弦 MIDI 正确', () => {
    expect(midiAt(1, 0)).toBe(64) // E4
    expect(midiAt(6, 0)).toBe(40) // E2
    expect(midiAt(5, 0)).toBe(45) // A2
  })
  it('5弦3品 = C3 = 48', () => {
    expect(midiAt(5, 3)).toBe(48)
  })
})

describe('buildFretboard', () => {
  it('默认 6 弦 × 13 列（0-12 品）= 78 个单元', () => {
    const cells = buildFretboard()
    expect(cells).toHaveLength(78)
  })
  it('单元含完整字段', () => {
    const cells = buildFretboard()
    const c = cells.find((x) => x.string === 5 && x.fret === 3)
    expect(c).toMatchObject({
      string: 5, fret: 3, note: 'C', isNatural: true,
      solfege: '1', midi: 48,
    })
  })
  it('升降音的 isNatural=false 且无简谱唱名', () => {
    const cells = buildFretboard()
    const c = cells.find((x) => x.string === 1 && x.fret === 2) // 1弦2品 = F#
    expect(c.note).toBe('F#')
    expect(c.isNatural).toBe(false)
    expect(c.solfege).toBe(null)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/useFretboard.test.js`
Expected: FAIL（模块/函数不存在）。

- [ ] **Step 3: 实现 `src/composables/useFretboard.js`**

```js
// 半音序
export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// 1→6 弦的空弦音名
export const OPEN_NOTES = ['E', 'B', 'G', 'D', 'A', 'E']
// 1→6 弦的空弦 MIDI（E4 B3 G3 D3 A2 E2）
export const OPEN_MIDI = [64, 59, 55, 50, 45, 40]
// C 大调自然音 → 简谱唱名
export const SOLFEGE_C = { C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7' }
export const MAX_FRET = 12

export function noteAt(string, fret) {
  const openIdx = CHROMATIC.indexOf(OPEN_NOTES[string - 1])
  return CHROMATIC[(openIdx + fret) % 12]
}

export function midiAt(string, fret) {
  return OPEN_MIDI[string - 1] + fret
}

export function buildFretboard(maxFret = MAX_FRET) {
  const cells = []
  for (let string = 1; string <= 6; string++) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = noteAt(string, fret)
      const isNatural = !note.includes('#')
      cells.push({
        string,
        fret,
        note,
        isNatural,
        solfege: isNatural ? SOLFEGE_C[note] : null,
        midi: midiAt(string, fret),
        isRoot: note === 'C', // C 调根音 = C
        shapes: [], // 由 Task 6 填充
      })
    }
  }
  return cells
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/useFretboard.test.js`
Expected: PASS（全部用例通过）。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useFretboard.js tests/useFretboard.test.js
git commit -m "feat: fretboard data model (note/midi/cell builder)"
```

---

## Task 2: `useAudio` 频率换算与发音

**Files:**
- Create: `src/composables/useAudio.js`
- Test: `tests/useAudio.test.js`

- [ ] **Step 1: 写失败测试（只测纯函数频率换算）**

`tests/useAudio.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { midiToFreq } from '../src/composables/useAudio.js'

describe('midiToFreq', () => {
  it('A4 (69) = 440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5)
  })
  it('C3 (48) ≈ 130.81Hz', () => {
    expect(midiToFreq(48)).toBeCloseTo(130.81, 1)
  })
  it('E2 (40) ≈ 82.41Hz', () => {
    expect(midiToFreq(40)).toBeCloseTo(82.41, 1)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/useAudio.test.js`
Expected: FAIL（`midiToFreq` 未定义）。

- [ ] **Step 3: 实现 `src/composables/useAudio.js`**

```js
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// 单例 AudioContext，首次用户交互后创建/恢复（满足自动播放策略）
let ctx = null
function getCtx() {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function useAudio() {
  function playMidi(midi, duration = 1.1) {
    const ac = getCtx()
    if (!ac) return // 降级：无音频环境静默
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(midi)
    // 简单 ADSR：快起音 + 指数衰减，模拟拨弦
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + duration)
  }
  return { playMidi }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/useAudio.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useAudio.js tests/useAudio.test.js
git commit -m "feat: audio composable (midi->freq + web audio synth)"
```

---

## Task 3: `Fretboard.vue` 渲染

**Files:**
- Create: `src/components/Fretboard.vue`
- Test: `tests/Fretboard.test.js`

- [ ] **Step 1: 写失败测试**

`tests/Fretboard.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Fretboard from '../src/components/Fretboard.vue'

describe('Fretboard.vue', () => {
  it('渲染 6 行弦标签', () => {
    const w = mount(Fretboard, { props: { content: 'note', showAccidentals: false } })
    expect(w.findAll('.fb-strlabel')).toHaveLength(6)
  })
  it('content=note 时显示音名文字', () => {
    const w = mount(Fretboard, { props: { content: 'note', showAccidentals: false } })
    expect(w.text()).toContain('C')
    expect(w.text()).toContain('E')
  })
  it('隐藏升降音时不渲染 # 音点', () => {
    const w = mount(Fretboard, { props: { content: 'note', showAccidentals: false } })
    expect(w.text()).not.toContain('#')
  })
  it('点击音点 emit select 事件并带 cell 数据', async () => {
    const w = mount(Fretboard, { props: { content: 'note', showAccidentals: false } })
    await w.find('.dot').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
    expect(w.emitted('select')[0][0]).toHaveProperty('string')
    expect(w.emitted('select')[0][0]).toHaveProperty('fret')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/Fretboard.test.js`
Expected: FAIL（组件不存在）。

- [ ] **Step 3: 实现 `src/components/Fretboard.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { buildFretboard, MAX_FRET } from '../composables/useFretboard.js'

const props = defineProps({
  content: { type: String, default: 'note' },      // 'note' | 'solfege' | 'shape'
  showAccidentals: { type: Boolean, default: false },
  selected: { type: Object, default: null },        // {string,fret} 当前高亮
  highlightFn: { type: Function, default: null },    // (cell)=>boolean 练习用额外高亮
})
const emit = defineEmits(['select'])

const allCells = computed(() => buildFretboard())
const frets = Array.from({ length: MAX_FRET + 1 }, (_, i) => i) // 0..12
const inlayFrets = [3, 5, 7, 9]
const dblInlayFrets = [12]

function rowCells(string) {
  return allCells.value.filter((c) => c.string === string)
}
function visible(cell) {
  return props.showAccidentals || cell.isNatural
}
function label(cell) {
  if (props.content === 'solfege') return cell.solfege ?? ''
  return cell.note
}
function isSelected(cell) {
  return props.selected && props.selected.string === cell.string && props.selected.fret === cell.fret
}
</script>

<template>
  <div class="fb">
    <div v-for="s in 6" :key="s" class="fb-row">
      <div class="fb-strlabel">{{ s }}弦</div>
      <div
        v-for="cell in rowCells(s)"
        :key="cell.fret"
        class="fb-cell"
        :class="{ nut: cell.fret === 0 }"
      >
        <div class="fb-string"></div>
        <div
          v-if="visible(cell) && label(cell) !== ''"
          class="dot"
          :class="{
            root: cell.isRoot,
            sel: isSelected(cell),
            hit: highlightFn && highlightFn(cell),
          }"
          @click="emit('select', cell)"
        >
          {{ label(cell) }}
        </div>
      </div>
    </div>

    <div class="fb-frets">
      <div class="fb-strlabel"></div>
      <div v-for="f in frets" :key="f" class="fb-fretno">
        <span v-if="f === 0">弦枕</span>
        <template v-else>{{ f }}<small>品</small></template>
        <span v-if="inlayFrets.includes(f)" class="inlay">•</span>
        <span v-if="dblInlayFrets.includes(f)" class="inlay">••</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fb { background: #3b2a1a; border-radius: 10px; padding: 10px 12px; overflow-x: auto; }
.fb-row, .fb-frets { display: grid; grid-template-columns: 44px 56px repeat(12, minmax(40px, 1fr)); }
.fb-strlabel { color: #e7d3b3; font-size: 12px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; height: 42px; }
.fb-cell { position: relative; height: 42px; border-right: 2px solid #8a7a5c; display: flex; align-items: center; justify-content: center; }
.fb-cell.nut { border-right: 7px solid #efe2c6; }
.fb-string { position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; background: #b9a47e; }
.dot { position: relative; z-index: 2; width: 30px; height: 30px; border-radius: 50%; background: #f8fafc; color: #0f172a; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.dot.root { background: #ef4444; color: #fff; }
.dot.sel { outline: 3px solid #facc15; }
.dot.hit { background: #22c55e; color: #fff; }
.fb-fretno { text-align: center; color: #f1e7cf; font-size: 13px; font-weight: 700; padding-top: 4px; }
.fb-fretno small { color: #a89b7c; font-weight: 400; }
.inlay { display: block; color: #d9c9a6; font-size: 10px; }
</style>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/Fretboard.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/Fretboard.vue tests/Fretboard.test.js
git commit -m "feat: Fretboard component with note layer + click select"
```

---

## Task 4: App 外壳 + Toolbar + 参考模式（NoteInfoBar）

**Files:**
- Create: `src/components/Toolbar.vue`, `src/components/NoteInfoBar.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 实现 `src/components/Toolbar.vue`**

```vue
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
```

- [ ] **Step 2: 实现 `src/components/NoteInfoBar.vue`**

```vue
<script setup>
const props = defineProps({ cell: { type: Object, default: null } })
const emit = defineEmits(['replay'])
</script>

<template>
  <div class="info-bar" v-if="cell">
    <div class="big">{{ cell.note }}</div>
    <div class="fields">
      <div class="f"><span>音名</span><b>{{ cell.note }}</b></div>
      <div class="f"><span>简谱(C调)</span><b>{{ cell.solfege ?? '—' }}</b></div>
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
```

- [ ] **Step 3: 改写 `src/App.vue` 接线参考模式**

```vue
<script setup>
import { ref } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Fretboard from './components/Fretboard.vue'
import NoteInfoBar from './components/NoteInfoBar.vue'
import { useAudio } from './composables/useAudio.js'

const mode = ref('reference')
const content = ref('note')
const showAccidentals = ref(false)
const soundOn = ref(true)
const selected = ref(null)

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
    />
    <template v-if="mode === 'reference'">
      <Fretboard :content="content" :showAccidentals="showAccidentals" :selected="selected" @select="onSelect" />
      <NoteInfoBar :cell="selected" @replay="replay" />
    </template>
  </main>
</template>

<style>
body { font-family: system-ui, -apple-system, "PingFang SC", sans-serif; margin: 0; background: #f1f5f9; }
.app { max-width: 1100px; margin: 0 auto; padding: 24px; }
h1 { font-size: 20px; }
</style>
```

- [ ] **Step 4: 手动验证**

Run: `npm run dev`，浏览器打开 http://localhost:5173：
- 切换 参考/练习、音名/简谱/指型、升降音、发音 按钮状态正确。
- 点击指板音点：下方卡片显示音名/简谱/位置/根音，且能听到声音（首次点击后）。
- 「再听一次」可重播。Ctrl-C 结束。

- [ ] **Step 5: Commit**

```bash
git add src/App.vue src/components/Toolbar.vue src/components/NoteInfoBar.vue
git commit -m "feat: app shell + toolbar + reference mode with info bar"
```

---

## Task 5: 简谱图层 + 升降音开关验证

**Files:**
- Modify: `tests/Fretboard.test.js`

> 简谱图层与升降音逻辑已在 Task 3 的 `Fretboard.vue` 实现（`content='solfege'` 显示 `cell.solfege`，`showAccidentals` 控制可见性）。本任务补测试锁定行为，避免回归。

- [ ] **Step 1: 追加失败测试到 `tests/Fretboard.test.js`**

在文件末尾追加（复用文件顶部已 import 的 `mount` 与 `Fretboard`）：
```js
describe('Fretboard 简谱与升降音', () => {
  it('content=solfege 显示数字唱名而非音名', () => {
    const w = mount(Fretboard, { props: { content: 'solfege', showAccidentals: false } })
    const text = w.text()
    expect(text).toContain('7') // B=7，弦标签只含 1-6，可区分确为唱名
    expect(text).not.toContain('C') // 不再显示音名字母
  })
  it('showAccidentals=true 时出现 # 音点', () => {
    const w = mount(Fretboard, { props: { content: 'note', showAccidentals: true } })
    expect(w.text()).toContain('#')
  })
})
```

- [ ] **Step 2: 运行测试**

Run: `npx vitest run tests/Fretboard.test.js`
Expected: PASS（若失败，检查 `Fretboard.vue` 的 `label()` 与 `visible()` 逻辑）。

- [ ] **Step 3: Commit**

```bash
git add tests/Fretboard.test.js
git commit -m "test: lock solfege layer and accidentals toggle behavior"
```

---

## Task 6: 指型数据 `shapes.js` + 指型图层

**Files:**
- Create: `src/data/shapes.js`
- Test: `tests/shapes.test.js`
- Modify: `src/composables/useFretboard.js`（填充 `cell.shapes`）、`src/components/Fretboard.vue`（指型上色）

- [ ] **Step 1: 写失败测试（结构正确性，而非死记每个品）**

`tests/shapes.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { SHAPES, shapesForCell } from '../src/data/shapes.js'
import { noteAt } from '../src/composables/useFretboard.js'

describe('SHAPES', () => {
  it('恰好五个把位，名称为 Sol/La/Si/Re/Mi', () => {
    expect(Object.keys(SHAPES).sort()).toEqual(['La', 'Mi', 'Re', 'Si', 'Sol'].sort())
  })
  it('每个把位都有 fret 窗口 [from,to]', () => {
    for (const s of Object.values(SHAPES)) {
      expect(s.from).toBeTypeOf('number')
      expect(s.to).toBeGreaterThanOrEqual(s.from)
    }
  })
})

describe('shapesForCell', () => {
  it('只把自然音（C大调音阶）归入把位', () => {
    // F#（1弦2品）不是 C 大调音，不应属于任何把位
    expect(shapesForCell(1, 2)).toEqual([])
  })
  it('窗口内的自然音会归入对应把位', () => {
    // Sol 把位窗口含 2-3 品，5弦3品=C 应至少属于一个把位
    const r = shapesForCell(5, 3)
    expect(Array.isArray(r)).toBe(true)
    expect(r.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/shapes.test.js`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/data/shapes.js`**

```js
import { noteAt } from '../composables/useFretboard.js'

// C 大调五个 CAGED 把位的「品位窗口」。
// 初始值依据参考图2（指板音阶指型把位图）读出，实现时请对照图2核对边界并微调。
// 一个自然音若落在某把位的 [from,to] 品位窗口内，即归入该把位（窗口可重叠）。
export const SHAPES = {
  Sol: { color: '#ef4444', from: 2, to: 3 },
  La:  { color: '#3b82f6', from: 4, to: 6 },
  Si:  { color: '#f59e0b', from: 7, to: 8 },
  Re:  { color: '#22c55e', from: 9, to: 10 },
  Mi:  { color: '#a855f7', from: 12, to: 13 },
}

const C_MAJOR = new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B'])

export function shapesForCell(string, fret) {
  const note = noteAt(string, fret)
  if (!C_MAJOR.has(note)) return []
  const result = []
  for (const [name, def] of Object.entries(SHAPES)) {
    if (fret >= def.from && fret <= def.to) result.push(name)
  }
  return result
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/shapes.test.js`
Expected: PASS。

- [ ] **Step 5: 在 `useFretboard.js` 填充 `cell.shapes`**

修改 `src/composables/useFretboard.js`：顶部加入 `import { shapesForCell } from '../data/shapes.js'`，并把 `buildFretboard` 里的 `shapes: []` 改为 `shapes: shapesForCell(string, fret)`。

- [ ] **Step 6: 在 `Fretboard.vue` 指型上色**

修改 `src/components/Fretboard.vue`：
- 顶部 `import { SHAPES } from '../data/shapes.js'`。
- 给音点的 `:style` 增加：当 `content === 'shape'` 且 `cell.shapes.length` 时，用第一个把位的颜色作背景：

在 `<script setup>` 内新增：
```js
function dotStyle(cell) {
  if (props.content === 'shape' && cell.shapes.length) {
    return { background: SHAPES[cell.shapes[0]].color, color: '#fff' }
  }
  return {}
}
```
模板里 `.dot` 上加 `:style="dotStyle(cell)"`。`content==='shape'` 时 `label(cell)` 仍显示简谱数字（便于看音阶级数）——把 `label()` 改为：
```js
function label(cell) {
  if (props.content === 'solfege' || props.content === 'shape') return cell.solfege ?? ''
  return cell.note
}
```

- [ ] **Step 7: 回归 + 手动验证**

Run: `npx vitest run`
Expected: 全部 PASS（含 Fretboard、shapes、useFretboard）。

Run: `npm run dev`，切到「指型」内容：五个把位的音点按颜色区分（Sol红/La蓝/Si橙/Re绿/Mi紫）。**对照参考图2核对各把位品位边界，如不符就调整 `SHAPES` 的 from/to。** Ctrl-C 结束。

- [ ] **Step 8: Commit**

```bash
git add src/data/shapes.js tests/shapes.test.js src/composables/useFretboard.js src/components/Fretboard.vue
git commit -m "feat: shape (CAGED position) data and colored shape layer"
```

---

## Task 7: `useQuiz` 出题与判分

**Files:**
- Create: `src/composables/useQuiz.js`
- Test: `tests/useQuiz.test.js`

- [ ] **Step 1: 写失败测试**

`tests/useQuiz.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { createQuiz, filterByRange } from '../src/composables/useQuiz.js'

describe('filterByRange', () => {
  it('low5 只保留 1-5 品（不含空弦）', () => {
    const cells = filterByRange('low5')
    expect(cells.every((c) => c.fret >= 1 && c.fret <= 5)).toBe(true)
  })
  it('naturalsOnly 只保留自然音', () => {
    const cells = filterByRange('naturalsOnly')
    expect(cells.every((c) => c.isNatural)).toBe(true)
  })
  it('all 返回全部 78 单元', () => {
    expect(filterByRange('all')).toHaveLength(78)
  })
})

describe('createQuiz 方向A：看位置答音名', () => {
  it('出题给出一个目标 cell 和 4 个不重复选项且含正确答案', () => {
    const q = createQuiz({ direction: 'A', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next()
    expect(question.target).toHaveProperty('string')
    expect(question.options).toHaveLength(4)
    expect(question.options).toContain(question.answer)
    expect(new Set(question.options).size).toBe(4)
  })
  it('答对增加 correct 与 streak，答错重置 streak', () => {
    const q = createQuiz({ direction: 'A', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next()
    expect(q.submitA(question.answer)).toBe(true)
    expect(q.stats.correct).toBe(1)
    expect(q.stats.streak).toBe(1)
    const q2 = q.next()
    const wrong = q2.options.find((o) => o !== q2.answer)
    expect(q.submitA(wrong)).toBe(false)
    expect(q.stats.wrong).toBe(1)
    expect(q.stats.streak).toBe(0)
  })
})

describe('createQuiz 方向B：看音名点位置', () => {
  it('给目标音，submitB 命中所有目标位置后算完成', () => {
    const q = createQuiz({ direction: 'B', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next() // {targetNote, positions:[{string,fret}...]}
    expect(question.positions.length).toBeGreaterThan(0)
    // 逐个点击正确位置
    let done = false
    for (const p of question.positions) done = q.submitB(p)
    expect(done).toBe(true)
    expect(q.stats.correct).toBe(1)
  })
  it('点错位置记一次错误且不算完成', () => {
    const q = createQuiz({ direction: 'B', content: 'note', range: 'naturalsOnly', total: 5 })
    q.next()
    const done = q.submitB({ string: 1, fret: 99 }) // 不存在的目标
    expect(done).toBe(false)
    expect(q.stats.wrong).toBe(1)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/useQuiz.test.js`
Expected: FAIL。

- [ ] **Step 3: 实现 `src/composables/useQuiz.js`**

```js
import { reactive } from 'vue'
import { buildFretboard } from './useFretboard.js'

export function filterByRange(range) {
  let cells = buildFretboard()
  if (range === 'low5') cells = cells.filter((c) => c.fret >= 1 && c.fret <= 5)
  else if (range === 'naturalsOnly') cells = cells.filter((c) => c.isNatural)
  return cells
}

function labelOf(cell, content) {
  if (content === 'solfege') return cell.solfege
  return cell.note
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createQuiz({ direction, content, range, total }) {
  const pool = filterByRange(range).filter((c) => labelOf(c, content) != null)
  const stats = reactive({ correct: 0, wrong: 0, streak: 0, index: 0, total })
  let current = null

  function next() {
    stats.index++
    if (direction === 'A') {
      const target = pick(pool)
      const answer = labelOf(target, content)
      const distractorLabels = shuffle([...new Set(pool.map((c) => labelOf(c, content)))]
        .filter((l) => l !== answer)).slice(0, 3)
      const options = shuffle([answer, ...distractorLabels])
      current = { type: 'A', target, answer, options }
    } else {
      const targetNote = pick(pool).note
      const positions = pool.filter((c) => c.note === targetNote)
        .map((c) => ({ string: c.string, fret: c.fret }))
      current = { type: 'B', targetNote, positions, found: new Set() }
    }
    return current
  }

  function submitA(choice) {
    const ok = choice === current.answer
    if (ok) { stats.correct++; stats.streak++ } else { stats.wrong++; stats.streak = 0 }
    return ok
  }

  function submitB(pos) {
    const match = current.positions.find((p) => p.string === pos.string && p.fret === pos.fret)
    if (!match) { stats.wrong++; stats.streak = 0; return false }
    current.found.add(`${pos.string}-${pos.fret}`)
    const done = current.found.size === current.positions.length
    if (done) { stats.correct++; stats.streak++ }
    return done
  }

  return { stats, next, submitA, submitB }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run tests/useQuiz.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useQuiz.js tests/useQuiz.test.js
git commit -m "feat: quiz engine (direction A/B, scoring, range filter)"
```

---

## Task 8: 练习模式 UI（方向 A + B）+ 计分 + 成绩持久化

**Files:**
- Create: `src/components/practice/QuizPanel.vue`, `src/composables/useSettings.js`
- Modify: `src/App.vue`、`src/components/Toolbar.vue`（加「范围」「方向」）

- [ ] **Step 1: 实现 `src/composables/useSettings.js`**

```js
const KEY = 'guiter-link.settings'
const SCORE_KEY = 'guiter-link.scores'

export function loadSettings(defaults) {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return { ...defaults } }
}
export function saveSettings(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)) } catch { /* 隐私模式忽略 */ }
}
export function saveScore(entry) {
  try {
    const list = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]')
    list.push({ ...entry, at: Date.now() })
    localStorage.setItem(SCORE_KEY, JSON.stringify(list.slice(-50)))
  } catch { /* ignore */ }
}
export function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]') } catch { return [] }
}
```

- [ ] **Step 2: 在 `Toolbar.vue` 增加「范围」「方向」（仅练习模式显示）**

在 `Toolbar.vue` 的 `defineProps` 加 `range: String, direction: String, mode: String`（mode 已有），`emit` 加 `update:range, update:direction`。在模板末尾追加（用 `v-if="mode==='practice'"`）：
```html
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
```

- [ ] **Step 3: 实现 `src/components/practice/QuizPanel.vue`**

```vue
<script setup>
import { ref, watch } from 'vue'
import Fretboard from '../Fretboard.vue'
import { createQuiz } from '../../composables/useQuiz.js'
import { saveScore } from '../../composables/useSettings.js'
import { useAudio } from '../../composables/useAudio.js'

const props = defineProps({
  content: String, direction: String, range: String, soundOn: Boolean,
})
const TOTAL = 20
const { playMidi } = useAudio()

const quiz = ref(null)
const question = ref(null)
const feedback = ref('') // '', 'ok', 'no'
const finished = ref(false)

function start() {
  quiz.value = createQuiz({ direction: props.direction, content: props.content, range: props.range, total: TOTAL })
  finished.value = false
  feedback.value = ''
  question.value = quiz.value.next()
}
watch(() => [props.direction, props.range, props.content], start, { immediate: true })

function advance() {
  feedback.value = ''
  if (quiz.value.stats.index >= TOTAL) {
    finished.value = true
    saveScore({ ...quiz.value.stats, direction: props.direction, content: props.content })
  } else {
    question.value = quiz.value.next()
  }
}

// 方向A
function answerA(opt) {
  const ok = quiz.value.submitA(opt)
  feedback.value = ok ? 'ok' : 'no'
  setTimeout(advance, 700)
}
// 方向B：点击指板
function onFretSelect(cell) {
  if (props.soundOn) playMidi(cell.midi)
  const done = quiz.value.submitB({ string: cell.string, fret: cell.fret })
  if (done) { feedback.value = 'ok'; setTimeout(advance, 700) }
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
  <div class="quiz">
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
      <p>正确 {{ quiz.stats.correct }} / 错误 {{ quiz.stats.wrong }}，最高连对见历史。</p>
      <button @click="start">再来一轮</button>
    </div>

    <template v-else>
      <!-- 方向A -->
      <template v-if="question.type === 'A'">
        <p class="hint">下面高亮位置是什么{{ content === 'solfege' ? '唱名' : '音' }}？</p>
        <Fretboard :content="'note'" :showAccidentals="true" :highlightFn="highlightA" />
        <div class="answers" :class="feedback">
          <button v-for="o in question.options" :key="o" @click="answerA(o)">{{ o }}</button>
        </div>
      </template>
      <!-- 方向B -->
      <template v-else>
        <p class="hint">在指板上点出所有的 <b>{{ question.targetNote }}</b></p>
        <Fretboard :content="'note'" :showAccidentals="true" :highlightFn="highlightB" @select="onFretSelect" />
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
.answers.ok button { background: #22c55e; color: #fff; }
.answers.no button { background: #fee2e2; }
.result { text-align: center; padding: 30px; background: #fff; border-radius: 12px; }
.result button { padding: 10px 20px; border: none; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; }
</style>
```

- [ ] **Step 4: 在 `App.vue` 接入练习模式**

`App.vue` 的 `<script setup>` 加 `range` 与 `direction` 状态：
```js
const range = ref('naturalsOnly')
const direction = ref('A')
```
给 `<Toolbar>` 加 `v-model:range="range" v-model:direction="direction"`（mode 已通过 Task 4 的 `v-model:mode` 传入，Toolbar 内 `v-if="mode==='practice'"` 直接读 mode prop）。
模板 `mode==='reference'` 块之后加：
```html
<QuizPanel
  v-else
  :content="content"
  :direction="direction"
  :range="range"
  :soundOn="soundOn"
/>
```
并 `import QuizPanel from './components/practice/QuizPanel.vue'`。

- [ ] **Step 5: 手动验证**

Run: `npm run dev`，切到「练习」：
- 方向 A：指板高亮一个位置，点下方选项，对错有颜色反馈，自动下一题，计分条更新。
- 方向 B：给出目标音，在指板点出所有该音的位置，找全进入下一题，点错计错。
- 切换「范围」「方向」「内容」会重开一轮。20 题后出结算并能「再来一轮」。
- 刷新页面后 `localStorage` 里 `guiter-link.scores` 有记录。Ctrl-C 结束。

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/QuizPanel.vue src/composables/useSettings.js src/App.vue src/components/Toolbar.vue
git commit -m "feat: practice mode (A/B), scoring bar, score persistence"
```

---

## Task 9: 设置持久化 + 响应式打磨

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 在 `App.vue` 接入设置持久化**

`<script setup>` 顶部：
```js
import { watch } from 'vue'
import { loadSettings, saveSettings } from './composables/useSettings.js'
const saved = loadSettings({ mode: 'reference', content: 'note', showAccidentals: false, soundOn: true, range: 'naturalsOnly', direction: 'A' })
```
把各 `ref(...)` 初值改为读 `saved.*`（如 `const mode = ref(saved.mode)`）。文件末尾加：
```js
watch([mode, content, showAccidentals, soundOn, range, direction], () => {
  saveSettings({
    mode: mode.value, content: content.value, showAccidentals: showAccidentals.value,
    soundOn: soundOn.value, range: range.value, direction: direction.value,
  })
})
```

- [ ] **Step 2: 响应式微调**

确认 `.app` 在窄屏可用：`Fretboard` 的 `.fb` 已 `overflow-x:auto`，工具栏 `flex-wrap:wrap` 已生效。无需额外改动则跳过。

- [ ] **Step 3: 手动验证**

Run: `npm run dev`，改几个设置后刷新页面，设置被记住。缩窄窗口，指板横向可滚动、工具栏换行不溢出。Ctrl-C 结束。

- [ ] **Step 4: 回归测试 + Commit**

Run: `npx vitest run`
Expected: 全部 PASS。
```bash
git add src/App.vue
git commit -m "feat: persist settings to localStorage; responsive checks"
```

---

## Task 10: 接入 Tauri 桌面壳 + `useWindow`

**Files:**
- Create: `src-tauri/`（由 CLI 生成）、`src/composables/useWindow.js`
- Modify: `package.json`

> 前置：本机需安装 Rust 工具链（`rustup`/`cargo`）及 Tauri 系统依赖。macOS 上通常需要 Xcode Command Line Tools。

- [ ] **Step 1: 安装并初始化 Tauri 2**

Run:
```bash
cd /Users/ryan/aiworkspace/guiter-link
npm install -D @tauri-apps/cli@^2
npm install @tauri-apps/api@^2
npx tauri init --app-name guiter-link --window-title "吉他指板记忆器" \
  --frontend-dist ../dist --dev-url http://localhost:5173 \
  --before-dev-command "npm run dev" --before-build-command "npm run build"
```
（如交互式提问，按上面对应值回答。）

- [ ] **Step 2: 在 `package.json` scripts 加 Tauri 命令**

```json
{
  "scripts": {
    "tauri": "tauri",
    "tdev": "tauri dev",
    "tbuild": "tauri build"
  }
}
```

- [ ] **Step 3: 实现 `src/composables/useWindow.js`（非 Tauri 降级 no-op）**

```js
// 仅在 Tauri 运行时调用真实窗口 API；浏览器里全部降级为 no-op。
const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function getWin() {
  if (!inTauri) return null
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow()
}

export function useWindow() {
  async function setAlwaysOnTop(on) {
    const w = await getWin(); if (w) await w.setAlwaysOnTop(on)
  }
  async function hide() { const w = await getWin(); if (w) await w.hide() }
  async function show() { const w = await getWin(); if (w) await w.show() }
  async function setDecorations(on) { const w = await getWin(); if (w) await w.setDecorations(on) }
  return { inTauri, setAlwaysOnTop, hide, show, setDecorations }
}
```

- [ ] **Step 4: 验证浏览器与桌面双跑通**

Run: `npm run dev`（浏览器）→ 一切如常，`useWindow().inTauri === false`，摸鱼相关后续按钮会降级。

Run: `npm run tdev`（需 Rust 环境）→ 弹出原生窗口，应用正常显示与交互。关闭窗口结束。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate Tauri 2 desktop shell + useWindow (no-op in browser)"
```

---

## Task 11: 摸鱼模式（透明悬浮窗 + ZenModeBar + 老板键）

**Files:**
- Create: `src/components/ZenModeBar.vue`
- Modify: `src/App.vue`、`src/components/Toolbar.vue`（加「摸鱼」开关）、`src-tauri/tauri.conf.json`、`src-tauri/src/main.rs`（或 `lib.rs`）、`src-tauri/Cargo.toml`

- [ ] **Step 1: 配置透明无边框窗口（`src-tauri/tauri.conf.json`）**

在 `app.windows[0]` 中加入（保留已有字段）：
```json
{
  "transparent": true,
  "decorations": false,
  "alwaysOnTop": false,
  "width": 900,
  "height": 360
}
```
macOS 透明需在窗口配置加 `"macOSPrivateApi": true`（位于 `app` 节点下：`"macOSPrivateApi": true`）。

- [ ] **Step 2: 注册全局快捷键插件（老板键）**

Run:
```bash
cd /Users/ryan/aiworkspace/guiter-link
npm install @tauri-apps/plugin-global-shortcut@^2
cd src-tauri && cargo add tauri-plugin-global-shortcut && cd ..
```
在 `src-tauri/src/main.rs`（或 `lib.rs` 的 `run()`）的 builder 链上加入插件并注册 `CmdOrCtrl+Shift+H` 切换显示：
```rust
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

// 在 tauri::Builder::default() 之后：
.plugin(
  tauri_plugin_global_shortcut::Builder::new()
    .with_shortcut("CmdOrCtrl+Shift+H").unwrap()
    .with_handler(|app, _shortcut, event| {
      if event.state == ShortcutState::Pressed {
        if let Some(win) = app.get_webview_window("main") {
          if win.is_visible().unwrap_or(false) { let _ = win.hide(); }
          else { let _ = win.show(); let _ = win.set_focus(); }
        }
      }
    })
    .build(),
)
```
（如 API 形态因版本不同，参照 `@tauri-apps/plugin-global-shortcut` v2 文档对应调整。）

- [ ] **Step 3: 在 `Toolbar.vue` 加「摸鱼」开关**

`defineProps` 加 `zen: Boolean`，`emit` 加 `update:zen`。在工具栏末尾加：
```html
<div class="group">
  <button :class="{ active: zen }" @click="emit('update:zen', !zen)">😎 摸鱼</button>
</div>
```

- [ ] **Step 4: 实现 `src/components/ZenModeBar.vue`**

```vue
<script setup>
import { ref, watch } from 'vue'
import { useWindow } from '../composables/useWindow.js'
const props = defineProps({ opacity: Number, scale: Number, onTop: Boolean })
const emit = defineEmits(['update:opacity', 'update:scale', 'update:onTop', 'exit'])
const { setAlwaysOnTop, hide } = useWindow()
watch(() => props.onTop, (v) => setAlwaysOnTop(v))
</script>

<template>
  <div class="zenbar" data-tauri-drag-region>
    <span class="drag" data-tauri-drag-region>⠿ 拖动</span>
    <label>透明 <input type="range" min="0.3" max="1" step="0.05" :value="opacity"
      @input="emit('update:opacity', +$event.target.value)" /></label>
    <label>缩放 <input type="range" min="0.6" max="1.6" step="0.1" :value="scale"
      @input="emit('update:scale', +$event.target.value)" /></label>
    <button :class="{ active: onTop }" @click="emit('update:onTop', !onTop)">置顶</button>
    <button @click="hide()">隐藏(⌘⇧H 呼出)</button>
    <button @click="emit('exit')">退出摸鱼</button>
  </div>
</template>

<style scoped>
.zenbar { display: flex; gap: 12px; align-items: center; background: rgba(15,23,42,.8); color: #fff; padding: 6px 12px; border-radius: 10px; font-size: 13px; }
.drag { cursor: move; opacity: .8; }
input[type=range] { vertical-align: middle; }
button { background: #334155; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; }
button.active { background: #0f766e; }
</style>
```

- [ ] **Step 5: 在 `App.vue` 接入摸鱼模式**

`<script setup>` 加：
```js
import ZenModeBar from './components/ZenModeBar.vue'
import { useWindow } from './composables/useWindow.js'
const { setDecorations, inTauri } = useWindow()
const zen = ref(false)
const opacity = ref(0.95)
const scale = ref(1)
const onTop = ref(false)
watch(zen, (v) => setDecorations(!v)) // 摸鱼时去边框
function exitZen() { zen.value = false }
```
模板根元素改为按 zen/opacity/scale 调整外观：
```html
<main class="app" :class="{ zen }" :style="zen ? { opacity, transform: `scale(${scale})`, transformOrigin: 'top left' } : {}">
  <ZenModeBar v-if="zen" v-model:opacity="opacity" v-model:scale="scale" v-model:onTop="onTop" @exit="exitZen" />
  <template v-else>
    <h1>吉他指板记忆器</h1>
  </template>
  <Toolbar ... v-model:zen="zen" :mode="mode" />
  ...
</main>
```
zen 模式下背景透明，加全局样式：
```css
.app.zen { background: transparent; }
body:has(.app.zen) { background: transparent; }
```
（`:has` 在现代浏览器/WebKit 可用；Tauri 用系统 WebView 支持。）

「摸鱼」开关在非 Tauri 浏览器环境置灰：在 `Toolbar.vue` 的摸鱼按钮加 `:disabled="!inTauriProp"`——把 `inTauri` 作为 prop 传入（`App.vue` 传 `:inTauri="inTauri"`，Toolbar 接收并用于 disabled）。

- [ ] **Step 6: 持久化窗口偏好**

在 `App.vue`：把 `opacity/scale/onTop/zen` 纳入 `loadSettings` 默认值与 `watch` 保存列表（参照 Task 9 的写法，把这些字段加进 `saveSettings` 对象与 `loadSettings` 默认对象）。

- [ ] **Step 7: 手动验证（Tauri 环境）**

Run: `npm run tdev`
- 点「😎 摸鱼」：窗口去边框、背景透明、出现 ZenModeBar。
- 拖「⠿ 拖动」可移动窗口；透明/缩放滑块实时生效；「置顶」后窗口浮在其他应用之上。
- 按 ⌘⇧H 隐藏窗口，再按一次呼出。
- 「退出摸鱼」恢复正常窗口。重启应用后偏好被记住。

Run: `npm run dev`（浏览器）：摸鱼按钮置灰不可点，其余功能正常。

- [ ] **Step 8: 回归测试 + Commit**

Run: `npx vitest run`
Expected: 全部 PASS。
```bash
git add -A
git commit -m "feat: zen (slack-off) mode — transparent floating window, controls, boss key"
```

---

## 完成标准

- `npx vitest run` 全绿（useFretboard / useAudio / useQuiz / shapes / Fretboard）。
- 浏览器版：参考模式三图层 + 点击发音 + 信息卡；练习模式方向 A/B + 计分 + 成绩持久化；设置记忆。
- Tauri 版：以上全部 + 摸鱼透明悬浮窗（透明度/缩放/置顶/拖动/老板键）。
- 指型图层已对照参考图2核对边界。
