# 设置页面（Settings Panel）设计文档

日期：2026-06-03
状态：已确认设计，待实现

## 背景

吉他指板记忆器目前把所有控件平铺在 `Toolbar.vue` 上，fish（摸鱼）模式的外观控件（透明度滑块、字体颜色选择器）和音色选择也内联在工具条里。随着 fish 外观可调项增加（新增「字体大小」「线条粗细」），工具条会越来越挤。本方案引入一个统一的设置浮层，把音色与 fish 外观项收纳进去，并让设置入口在普通模式和 fish 模式下都能使用，便于「边调边看效果」。

## 目标

维护现有功能：
1. fish 下字体颜色（`inkColor`）
2. fish 透明度（`opacity`）
3. 音色设置（`timbre`）

新增功能：
4. fish 下字体大小（`fishFontSize`，仅改音符数字字号）
5. fish 下指板线条粗细（`fishLineWidth`，同时控制品格竖线与弦横线）

非目标（YAGNI）：
- 不做「恢复默认」按钮（如需后续再加）。
- 字体大小不缩放整块指板，只改音符数字；品位号、弦号、八度点、格子间距不变。
- 字体大小/线条粗细仅作用于 fish 模式，不影响普通模式。

## 整体结构

- 新增组件 `src/components/SettingsPanel.vue`：浮层弹窗，覆盖在指板之上，带半透明背景遮罩。关闭方式：点右上角 ×、点遮罩、按 Esc。
- `Toolbar.vue` 增加 `⚙️` 按钮，普通模式与 fish 模式都显示。
- 弹窗开关状态 `settingsOpen` 提升到 `App.vue` 统一管理；所有设置值仍是 `App.vue` 里的 ref，通过 `v-model` / props 传递。

### 组件关系

```
App.vue
 ├── Toolbar.vue        ── 触发 update:settingsOpen（⚙️ 按钮）
 ├── SettingsPanel.vue  ── v-model 各设置值 + v-model:open
 ├── Fretboard.vue      ── 接收 inkColor/fishFontSize/fishLineWidth（fish 模式经 CSS 变量生效）
 └── QuizPanel.vue ──┐
                     └── Fretboard.vue（同上）
```

## 控件归属调整

- 移入弹窗：音色（古典/民谣/电吉他）、字体颜色、透明度、字体大小、线条粗细。
- Toolbar 普通模式：模式 / 内容 / 显示升降音 / 🔊发音 / 范围 / 方向 / `⚙️` / Fish。（去掉原来的「音色」组、去掉原内联的透明度/颜色——它们移入弹窗。）
- Toolbar fish 模式：只剩 `⚙️` + `Fish`。

## 弹窗布局

```
┌─ 设置 ──────────────────[×]┐
│ 音色   [古典] [民谣] [电吉他]  │
│ ─────  摸鱼(fish)外观  ─────  │
│ 字体颜色   [■]               │
│ 透明度     [====●===]  80%    │
│ 字体大小   [===●====]  19px   │
│ 线条粗细   [==●=====]  1.0px  │
└────────────────────────────┘
```

「摸鱼外观」这几项只在 fish 模式生效，但普通模式也可预先调好（面板内加一行小灰字提示：「以下仅在摸鱼模式生效」）。

## 数据与持久化

`useSettings.js` 逻辑不变（通用 merge）。在 `App.vue` 的 defaults 中新增两项：

```js
fishFontSize: 19,    // 音符数字字号 (px)
fishLineWidth: 1,    // 指板线条粗细 (px)
```

并把这两项加入：
- `loadSettings(defaults)` 的默认对象；
- `watch([...])` 监听数组；
- `saveSettings({...})` 写入对象。

（与现有 `opacity`/`inkColor`/`timbre` 完全同一套路。）

控件范围：
- 字体大小：`type=range` min=12 max=36 step=1，默认 19（= 当前 fish 数字字号）。
- 线条粗细：`type=range` min=0.5 max=4 step=0.5，默认 1.0（= 当前 fish 线宽）。
- 透明度：沿用现有 min=0.2 max=1 step=0.05。
- 字体颜色：沿用现有 `type=color`。

## 接入 Fretboard（CSS 变量）

沿用现有 `--ink` 的方式。`App.vue` / `QuizPanel.vue` 把值传给 `Fretboard`，fish 模式下在 `.fb.bare` 容器上挂三个变量：

```js
:style="bare ? { '--ink': inkColor, '--fz': fontSize + 'px', '--lw': lineWidth + 'px' } : {}"
```

`Fretboard.vue` 样式改为用变量（均限定 `.fb.bare`，不影响普通模式）：

- 音符数字：`.fb.bare .dot { font-size: var(--fz, 19px); }`
- 品格分隔竖线：`.fb.bare .fb-cell { border-right-width: var(--lw, 1px); }`
  - 弦枕（`.fb-cell.nut`）继续用约 2× 宽度，保持现有视觉层级（可用 `calc(var(--lw, 1px) * 2)`）。
- 弦横线：`.fb.bare .fb-string { height: var(--lw, 1px); }`

新增对应 props：`Fretboard.vue` 与 `QuizPanel.vue` 增加 `fishFontSize`、`fishLineWidth`（带默认值 19 / 1），并在 `bare` 的 `:style` 中拼出 CSS 变量。

## fish 模式拖动兼容（关键）

fish 模式下整窗为 `data-tauri-drag-region="deep"`（见现有实现）。弹窗本身是 div，会被当作可拖动区，需排除：

- 弹窗根容器加 `data-tauri-drag-region="false"`，避免拖动面板空白处误移动窗口。（内部 button/input 会被 Tauri 自动当作 clickable 屏蔽拖动，但容器空白区需要这一条。）
- 遮罩层同样 `data-tauri-drag-region="false"`，点遮罩是关闭弹窗而非拖窗。

## 错误处理与边界

- 关闭：Esc 监听在弹窗打开时注册、关闭时移除（`onMounted`/`onBeforeUnmount` 或 `watch` open）。
- 数值越界：滑块本身已被 min/max 约束；`loadSettings` 读到旧 localStorage 中缺失的新键时由 defaults 补齐。
- 非 Tauri（纯浏览器）环境：`data-tauri-drag-region` 属性无副作用，弹窗正常工作。

## 测试

轻量为主，沿用现有 vitest 习惯：

- 给 `useSettings` 加用例：`loadSettings` 在已有 localStorage（不含新键）时，能正确合并出 `fishFontSize: 19`、`fishLineWidth: 1`，且已存的其他键不被覆盖。
- 组件交互不写重测试（与现有组件做法一致）。
- 实现后跑 `npx vite build` 与 `npx vitest run` 确认通过。

## 实现影响文件清单

- 新增：`src/components/SettingsPanel.vue`
- 修改：`src/App.vue`（新增 ref、defaults、watch、save；挂 `settingsOpen`；渲染 SettingsPanel；传新 props 给 Fretboard/QuizPanel）
- 修改：`src/components/Toolbar.vue`（加 ⚙️ 按钮；移除内联音色组、fish 内联透明度/颜色）
- 修改：`src/components/Fretboard.vue`（新增 props；`.fb.bare` 用 `--fz`/`--lw` 变量）
- 修改：`src/components/practice/QuizPanel.vue`（透传新 props 给 Fretboard）
- 修改：`tests/useAudio.test.js` 或新增 `tests/useSettings.test.js`（合并默认值用例）
