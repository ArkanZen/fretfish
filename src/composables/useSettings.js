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
