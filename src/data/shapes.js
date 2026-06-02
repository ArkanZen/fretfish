import { noteAt } from '../composables/useFretboard.js'

// C 大调五个 CAGED 把位的「品位窗口」。
// 初始值依据参考图2（指板音阶指型把位图）读出，后续需人工对照图2核对边界并微调。
// 一个自然音若落在某把位的 [from,to] 品位窗口内，即归入该把位（窗口可重叠）。
export const SHAPES = {
  Sol: { color: '#ef4444', from: 2, to: 3 },
  La:  { color: '#3b82f6', from: 4, to: 6 },
  Si:  { color: '#f59e0b', from: 7, to: 8 },
  Re:  { color: '#22c55e', from: 9, to: 10 },
  Mi:  { color: '#a855f7', from: 12, to: 13 },
}

const C_MAJOR = new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B'])

export function shapesForCell(string, fret) {
  const note = noteAt(string, fret)
  if (!C_MAJOR.has(note)) return []
  const result = []
  for (const [name, def] of Object.entries(SHAPES)) {
    if (fret >= def.from && fret <= def.to) result.push(name)
  }
  return result
}
