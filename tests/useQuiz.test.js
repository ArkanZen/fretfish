import { describe, it, expect } from 'vitest'
import { createQuiz, filterByRange } from '../src/composables/useQuiz.js'

describe('filterByRange', () => {
  it('low5 只保留 1-5 品（不含空弦）', () => {
    const cells = filterByRange('low5')
    expect(cells.every((c) => c.fret >= 1 && c.fret <= 5)).toBe(true)
  })
  it('naturalsOnly 只保留自然音', () => {
    const cells = filterByRange('naturalsOnly')
    expect(cells.every((c) => c.isNatural)).toBe(true)
  })
  it('all 返回全部 78 单元', () => {
    expect(filterByRange('all')).toHaveLength(78)
  })
})

describe('createQuiz 方向A：看位置答音名', () => {
  it('出题给出一个目标 cell 和 4 个不重复选项且含正确答案', () => {
    const q = createQuiz({ direction: 'A', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next()
    expect(question.target).toHaveProperty('string')
    expect(question.options).toHaveLength(4)
    expect(question.options).toContain(question.answer)
    expect(new Set(question.options).size).toBe(4)
  })
  it('答对增加 correct 与 streak，答错重置 streak', () => {
    const q = createQuiz({ direction: 'A', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next()
    expect(q.submitA(question.answer)).toBe(true)
    expect(q.stats.correct).toBe(1)
    expect(q.stats.streak).toBe(1)
    const q2 = q.next()
    const wrong = q2.options.find((o) => o !== q2.answer)
    expect(q.submitA(wrong)).toBe(false)
    expect(q.stats.wrong).toBe(1)
    expect(q.stats.streak).toBe(0)
  })
})

describe('createQuiz 方向B：看音名点位置', () => {
  it('给目标音，submitB 命中所有目标位置后算完成', () => {
    const q = createQuiz({ direction: 'B', content: 'note', range: 'naturalsOnly', total: 5 })
    const question = q.next() // {targetNote, positions:[{string,fret}...]}
    expect(question.positions.length).toBeGreaterThan(0)
    let done = false
    for (const p of question.positions) done = q.submitB(p)
    expect(done).toBe(true)
    expect(q.stats.correct).toBe(1)
  })
  it('点错位置记一次错误且不算完成', () => {
    const q = createQuiz({ direction: 'B', content: 'note', range: 'naturalsOnly', total: 5 })
    q.next()
    const done = q.submitB({ string: 1, fret: 99 }) // 不存在的目标
    expect(done).toBe(false)
    expect(q.stats.wrong).toBe(1)
  })
})
