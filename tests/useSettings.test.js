import { describe, it, expect, beforeEach } from 'vitest'
import { loadSettings } from '../src/composables/useSettings.js'

const KEY = 'guiter-link.settings'

describe('loadSettings 合并默认值', () => {
  beforeEach(() => localStorage.clear())

  it('localStorage 为空时返回全部默认值', () => {
    const got = loadSettings({ fishFontSize: 19, fishLineWidth: 1, inkColor: '#000' })
    expect(got.fishFontSize).toBe(19)
    expect(got.fishLineWidth).toBe(1)
    expect(got.inkColor).toBe('#000')
  })

  it('已存的旧设置（不含新键）合并出新默认值，且不覆盖已存键', () => {
    localStorage.setItem(KEY, JSON.stringify({ inkColor: '#ff0000', opacity: 0.5 }))
    const got = loadSettings({
      inkColor: '#000', opacity: 1, fishFontSize: 19, fishLineWidth: 1,
    })
    // 新键由默认值补齐
    expect(got.fishFontSize).toBe(19)
    expect(got.fishLineWidth).toBe(1)
    // 已存键不被默认值覆盖
    expect(got.inkColor).toBe('#ff0000')
    expect(got.opacity).toBe(0.5)
  })
})
