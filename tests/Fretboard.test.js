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
