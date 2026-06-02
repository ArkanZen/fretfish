import { shapesForCell } from '../data/shapes.js'

// 半音序
export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
// 1→6 弦的空弦音名
export const OPEN_NOTES = ['E', 'B', 'G', 'D', 'A', 'E']
// 1→6 弦的空弦 MIDI（E4 B3 G3 D3 A2 E2）
export const OPEN_MIDI = [64, 59, 55, 50, 45, 40]
// C 大调自然音 → 简谱唱名
export const SOLFEGE_C = { C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7' }
export const MAX_FRET = 16

export function noteAt(string, fret) {
  const openIdx = CHROMATIC.indexOf(OPEN_NOTES[string - 1])
  return CHROMATIC[(openIdx + fret) % 12]
}

export function midiAt(string, fret) {
  return OPEN_MIDI[string - 1] + fret
}

// 简谱八度标记：以 C3–B3（MIDI 48–59）为中音基准（0=无点），
// 使 1弦空弦 E4 记为高音、6弦空弦 E2 记为低音，贴合吉他常用记法。
// 正数=高音（数字上方加点），负数=低音（数字下方加点），绝对值=点数。
export function octaveOf(midi) {
  return Math.floor((midi - 48) / 12)
}

export function buildFretboard(maxFret = MAX_FRET) {
  const cells = []
  for (let string = 1; string <= 6; string++) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = noteAt(string, fret)
      const isNatural = !note.includes('#')
      const midi = midiAt(string, fret)
      cells.push({
        string,
        fret,
        note,
        isNatural,
        solfege: isNatural ? SOLFEGE_C[note] : null,
        octave: octaveOf(midi), // 八度标记：>0 高音 / <0 低音 / 0 中音
        midi,
        isRoot: note === 'C', // C 调根音 = C
        shapes: shapesForCell(string, fret),
      })
    }
  }
  return cells
}
