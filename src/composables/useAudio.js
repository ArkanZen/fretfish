export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// 单例 AudioContext，首次用户交互后创建/恢复（满足自动播放策略）
let ctx = null
function getCtx() {
  if (typeof window === 'undefined' || !window.AudioContext) return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function useAudio() {
  function playMidi(midi, duration = 1.1) {
    const ac = getCtx()
    if (!ac) return // 降级：无音频环境静默
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(midi)
    // 简单 ADSR：快起音 + 指数衰减，模拟拨弦
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + duration)
  }
  // FC/红白机风格音效：方波音序
  function playSeq(notes) {
    const ac = getCtx()
    if (!ac) return
    let t = ac.currentTime
    for (const n of notes) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = n.type || 'square'
      osc.frequency.value = n.freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(n.vol ?? 0.18, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur)
      osc.connect(gain).connect(ac.destination)
      osc.start(t)
      osc.stop(t + n.dur)
      t += n.dur
    }
  }
  // 答对：经典「金币」式上行两音
  function playCorrect() {
    playSeq([{ freq: 988, dur: 0.09 }, { freq: 1319, dur: 0.16 }])
  }
  // 答错：低沉下行「错误」蜂鸣
  function playWrong() {
    playSeq([{ freq: 196, dur: 0.12 }, { freq: 147, dur: 0.22 }])
  }

  return { playMidi, playCorrect, playWrong }
}
