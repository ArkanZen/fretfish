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
    expect(shapesForCell(1, 2)).toEqual([]) // 1弦2品=F#，非C大调音
  })
  it('窗口内的自然音会归入对应把位', () => {
    const r = shapesForCell(5, 3) // 5弦3品=C，Sol窗口含2-3品
    expect(Array.isArray(r)).toBe(true)
    expect(r.length).toBeGreaterThan(0)
  })
})
