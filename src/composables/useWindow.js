// 封装 Tauri 窗口能力；在纯浏览器环境下全部降级为 no-op。
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
  async function setDecorations(on) {
    const w = await getWin(); if (w) await w.setDecorations(on)
  }
  async function setShadow(on) {
    const w = await getWin(); if (w) await w.setShadow(on)
  }
  async function hide() { const w = await getWin(); if (w) await w.hide() }
  async function show() { const w = await getWin(); if (w) { await w.show(); await w.setFocus() } }
  return { inTauri, setAlwaysOnTop, setDecorations, setShadow, hide, show }
}
