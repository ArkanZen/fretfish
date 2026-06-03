# FretFish 🐟🎸

吉他指板记忆器 — a small, focused **guitar fretboard memory trainer**.

Built with **Vue 3 + Vite**, packaged as a cross-platform desktop app with **Tauri 2**. Its signature feature is **fish mode (摸鱼模式)**: a borderless, transparent, always-on-top overlay of just the fretboard that floats over your other windows, so you can drill notes while you work.

## Features

- **参考模式 (Reference)** — tap any position on the fretboard to see and hear the note.
- **练习模式 (Practice)** — two quiz directions:
  - 看位置答音名 (see a position, name the note)
  - 看音名点位置 (given a note, tap all its positions)
- **内容切换** — 音名 (note names) / 简谱 (solfège) / 指型 (CAGED-style shapes).
- **范围设置** — 全指板 / 1–5 品 / 仅自然音.
- **发音 (Sound)** — Web Audio synthesis with selectable timbres:
  - 古典 (classical / nylon), 民谣 (folk / steel string), 电吉他 (electric / overdrive).
  - FC/红白机风格的答对/答错音效。
- **摸鱼模式 (Fish mode, desktop only)** — transparent floating overlay you can drag anywhere, with a settings panel to tune:
  - 字体颜色 (ink color), 透明度 (opacity), 字体大小 (font size), 字体粗细 (font weight), 指板线条粗细 (line width).

## Tech stack

- Vue 3 (`<script setup>`), Vite
- Tauri 2 (Rust) for the desktop shell + window controls + global shortcut
- Web Audio API for note synthesis
- Vitest for unit tests

## Development

```bash
npm install

# Web (browser) dev — fish mode degrades gracefully (window controls are no-ops)
npm run dev

# Desktop app dev (Tauri) — full fish mode
npm run tdev

# Tests
npm test

# Build
npm run build      # web bundle -> dist/
npm run tbuild     # desktop app bundle (Tauri)
```

## Project layout

```
src/
  App.vue                     app shell, settings state + persistence
  components/
    Toolbar.vue               mode / content / sound toggles, ⚙️ + Fish buttons
    Fretboard.vue             the fretboard grid (normal + bare/fish rendering)
    SettingsPanel.vue         settings overlay (timbre + fish appearance)
    NoteInfoBar.vue           note detail bar (reference mode)
    practice/QuizPanel.vue    quiz flow
  composables/
    useAudio.js               Web Audio synthesis + timbres
    useFretboard.js           fretboard / note model
    useQuiz.js                quiz generation + scoring
    useSettings.js            localStorage persistence
    useWindow.js              Tauri window capabilities (no-op in browser)
  data/shapes.js              chord/scale shapes
src-tauri/                    Tauri (Rust) shell + capabilities
docs/                         design specs
tests/                        Vitest unit tests
```
