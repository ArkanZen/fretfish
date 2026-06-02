import { shapesForCell } from '../data/shapes.js'

// 半音序
export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// 1→6 弦的空弦音名
export const OPEN_NOTES = ['E', 'B', 'G', 'D', 'A', 'E']
// 1→6 弦的空弦 MIDI（E4 B3 G3 D3 A2 E2）
export const OPEN_MIDI = [64, 59, 55, 50, 45, 40]
// C 大调自然音 → 简谱唱名
export const SOLFEGE_C = { C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7' }
export const MAX_FRET = 12

export function noteAt(string, fret) {
  const openIdx = CHROMATIC.indexOf(OPEN_NOTES[string - 1])
  return CHROMATIC[(openIdx + fret) % 12]
}

export function midiAt(string, fret) {
  return OPEN_MIDI[string - 1] + fret
}

export function buildFretboard(maxFret = MAX_FRET) {
  const cells = []
  for (let string = 1; string <= 6; string++) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = noteAt(string, fret)
      const isNatural = !note.includes('#')
      cells.push({
        string,
        fret,
        note,
        isNatural,
        solfege: isNatural ? SOLFEGE_C[note] : null,
        midi: midiAt(string, fret),
        isRoot: note === 'C', // C 调根音 = C
        shapes: shapesForCell(string, fret),
      })
    }
  }
  return cells
}
