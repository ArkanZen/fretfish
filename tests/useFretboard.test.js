import { describe, it, expect } from 'vitest'
import { noteAt, midiAt, buildFretboard, octaveOf, MAX_FRET } from '../src/composables/useFretboard.js'

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

describe('octaveOf', () => {
  it('中央八度 C4–B4（60–71）为 0（无点）', () => {
    expect(octaveOf(60)).toBe(0) // C4
    expect(octaveOf(71)).toBe(0) // B4
    expect(octaveOf(64)).toBe(0) // E4 = 1弦空弦
  })
  it('高八度为正，低八度为负', () => {
    expect(octaveOf(72)).toBe(1)  // C5 高一个八度
    expect(octaveOf(48)).toBe(-1) // C3 低一个八度（5弦3品）
    expect(octaveOf(40)).toBe(-2) // E2 = 6弦空弦，低两个八度
  })
})

describe('buildFretboard', () => {
  it('MAX_FRET=16，默认 6 弦 × 17 列（0-16 品）= 102 个单元', () => {
    expect(MAX_FRET).toBe(16)
    const cells = buildFretboard()
    expect(cells).toHaveLength(102)
  })
  it('包含到 16 品', () => {
    const cells = buildFretboard()
    expect(cells.some((c) => c.fret === 16)).toBe(true)
  })
  it('单元含完整字段（含 octave）', () => {
    const cells = buildFretboard()
    const c = cells.find((x) => x.string === 5 && x.fret === 3)
    expect(c).toMatchObject({
      string: 5, fret: 3, note: 'C', isNatural: true,
      solfege: '1', midi: 48, octave: -1, // C3 低音
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
