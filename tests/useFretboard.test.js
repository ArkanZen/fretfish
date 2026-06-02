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
