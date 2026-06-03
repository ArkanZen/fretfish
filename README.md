# FretFish 🐟🎸

吉他指板记忆器 —— 一个小而专注的**吉他指板音位记忆/练习工具**。

基于 **Vue 3 + Vite** 开发，用 **Tauri 2** 打包成跨平台桌面应用。最大的特色是 **摸鱼模式（fish mode）**：把指板做成一个无边框、半透明、始终置顶的悬浮窗，浮在其它窗口之上，让你一边干活一边练指板。

## 功能

- **参考模式** —— 点击指板上任意位置，查看并听到对应的音。
- **练习模式** —— 两种答题方向：
  - 看位置答音名（高亮一个位置，说出它是什么音）
  - 看音名点位置（给出音名，在指板上点出它所有的位置）
- **内容切换** —— 音名 / 简谱 / 指型（CAGED 风格）。
- **范围设置** —— 全指板 / 1–5 品 / 仅自然音。
- **发音** —— Web Audio 合成，音色可选：
  - 古典（尼龙弦）、民谣（钢弦）、电吉他（过载）。
  - 答对 / 答错带 FC（红白机）风格音效。
- **摸鱼模式（仅桌面应用）** —— 可随意拖动的半透明悬浮指板，配套设置面板可调：
  - 字体颜色、透明度、字体大小、字体粗细、指板线条粗细。

## 技术栈

- Vue 3（`<script setup>`）、Vite
- Tauri 2（Rust）：桌面外壳 + 窗口控制 + 全局快捷键
- Web Audio API：音符合成
- Vitest：单元测试

## 下载安装

到 [Releases](https://github.com/ArkanZen/fretfish/releases) 下载对应平台的安装包：

| 平台 | 安装包 |
|---|---|
| macOS（Apple Silicon） | `FretFish_x.y.z_aarch64.dmg` |
| macOS（Intel） | `FretFish_x.y.z_x64.dmg` |
| Windows | `FretFish_x.y.z_x64-setup.exe`（推荐）或 `_x64_en-US.msi` |
| Linux | `_amd64.deb` / `.x86_64.rpm` / `_amd64.AppImage` |

> macOS 首次打开若提示「无法验证开发者」，在「系统设置 → 隐私与安全性」里点「仍要打开」即可（应用未做签名公证）。

## 本地开发

```bash
npm install

# 网页（浏览器）开发 —— 摸鱼模式会优雅降级（窗口控制变为空操作）
npm run dev

# 桌面应用开发（Tauri）—— 完整摸鱼模式
npm run tdev

# 测试
npm test

# 构建
npm run build      # 网页产物 -> dist/
npm run tbuild     # 桌面安装包（Tauri）
```

## 发布

推送 `v*` 标签即可触发 GitHub Actions（`.github/workflows/release.yml`），
自动在 macOS / Windows / Linux 上构建安装包并上传到 Releases：

```bash
# 先把版本号在 package.json 和 src-tauri/tauri.conf.json 中对齐，然后：
git tag -a v1.0.0 -m "FretFish v1.0.0"
git push origin v1.0.0
```

产物默认以**草稿 Release** 形式生成，确认无误后在 Releases 页点 **Publish** 发布。

## 目录结构

```
src/
  App.vue                     应用外壳、设置状态与持久化
  components/
    Toolbar.vue               模式 / 内容 / 发音开关、⚙️ 与 Fish 按钮
    Fretboard.vue             指板网格（普通模式 + 摸鱼/bare 渲染）
    SettingsPanel.vue         设置浮层（音色 + 摸鱼外观）
    NoteInfoBar.vue           音符详情栏（参考模式）
    practice/QuizPanel.vue    练习答题流程
  composables/
    useAudio.js               Web Audio 合成与音色
    useFretboard.js           指板 / 音符模型
    useQuiz.js                出题与计分
    useSettings.js            localStorage 持久化
    useWindow.js              Tauri 窗口能力（浏览器中为空操作）
  data/shapes.js              和弦 / 音阶指型
src-tauri/                    Tauri（Rust）外壳与能力配置
docs/                         设计文档
tests/                        Vitest 单元测试
```

## 许可证

[MIT](LICENSE) © ArkanZen
