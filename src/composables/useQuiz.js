import { reactive } from 'vue'
import { buildFretboard } from './useFretboard.js'

export function filterByRange(range) {
  let cells = buildFretboard()
  if (range === 'low5') cells = cells.filter((c) => c.fret >= 1 && c.fret <= 5)
  else if (range === 'naturalsOnly') cells = cells.filter((c) => c.isNatural)
  return cells
}

function labelOf(cell, content) {
  if (content === 'solfege') return cell.solfege
  return cell.note
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createQuiz({ direction, content, range, total }) {
  const pool = filterByRange(range).filter((c) => labelOf(c, content) != null)
  const stats = reactive({ correct: 0, wrong: 0, streak: 0, index: 0, total })
  let current = null

  function next() {
    stats.index++
    if (direction === 'A') {
      const target = pick(pool)
      const answer = labelOf(target, content)
      const distractorLabels = shuffle([...new Set(pool.map((c) => labelOf(c, content)))]
        .filter((l) => l !== answer)).slice(0, 3)
      const options = shuffle([answer, ...distractorLabels])
      current = { type: 'A', target, answer, options }
    } else {
      const targetNote = pick(pool).note
      const positions = pool.filter((c) => c.note === targetNote)
        .map((c) => ({ string: c.string, fret: c.fret }))
      current = { type: 'B', targetNote, positions, found: new Set() }
    }
    return current
  }

  function submitA(choice) {
    const ok = choice === current.answer
    if (ok) { stats.correct++; stats.streak++ } else { stats.wrong++; stats.streak = 0 }
    return ok
  }

  function submitB(pos) {
    const match = current.positions.find((p) => p.string === pos.string && p.fret === pos.fret)
    if (!match) { stats.wrong++; stats.streak = 0; return false }
    current.found.add(`${pos.string}-${pos.fret}`)
    const done = current.found.size === current.positions.length
    if (done) { stats.correct++; stats.streak++ }
    return done
  }

  return { stats, next, submitA, submitB }
}
