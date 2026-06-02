import { describe, it, expect } from 'vitest'
import { midiToFreq } from '../src/composables/useAudio.js'

describe('midiToFreq', () => {
  it('A4 (69) = 440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5)
  })
  it('C3 (48) ≈ 130.81Hz', () => {
    expect(midiToFreq(48)).toBeCloseTo(130.81, 1)
  })
  it('E2 (40) ≈ 82.41Hz', () => {
    expect(midiToFreq(40)).toBeCloseTo(82.41, 1)
  })
})
