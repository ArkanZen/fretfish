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

// 音色：民谣（钢弦）/ 古典（尼龙弦）/ 电吉他（过载）
export const TIMBRES = [
  { id: 'classical', label: '古典' },
  { id: 'folk', label: '民谣' },
  { id: 'electric', label: '电吉他' },
]

// 软削波失真曲线（电吉他过载用）
function makeDistortion(ac, amount) {
  const ws = ac.createWaveShaper()
  const n = 256, curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x))
  }
  ws.curve = curve
  ws.oversample = '2x'
  return ws
}

// 短促白噪声（民谣拨片触弦的瞬态）
function makeNoiseBurst(ac, dur) {
  const len = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

export function useAudio() {
  // timbre: 'classical' | 'folk' | 'electric'
  function playMidi(midi, timbre = 'classical', duration) {
    const ac = getCtx()
    if (!ac) return // 降级：无音频环境静默
    const now = ac.currentTime
    const freq = midiToFreq(midi)
    const out = ac.createGain()
    out.connect(ac.destination)

    if (timbre === 'folk') {
      // 钢弦：锯齿波 + 亮度随衰减下降 + 拨片噪声瞬态，明亮干脆
      const dur = duration ?? 1.1
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7
      lp.frequency.setValueAtTime(6500, now)
      lp.frequency.exponentialRampToValueAtTime(2200, now + dur)
      const g = ac.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.006) // 干脆起音
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      o.connect(lp).connect(g).connect(out)
      o.start(now); o.stop(now + dur)
      // 拨片触弦：高通短噪声
      const nb = makeNoiseBurst(ac, 0.04)
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000
      const ng = ac.createGain()
      ng.gain.setValueAtTime(0.16, now)
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
      nb.connect(hp).connect(ng).connect(out)
      nb.start(now); nb.stop(now + 0.05)
    } else if (timbre === 'electric') {
      // 电吉他：锯齿波 → 过载失真 → 低通，延音较长
      const dur = duration ?? 1.7
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq
      const drive = ac.createGain(); drive.gain.value = 0.7
      const dist = makeDistortion(ac, 14)
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 1
      const g = ac.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.26, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.45) // 延音平台
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      o.connect(drive).connect(dist).connect(lp).connect(g).connect(out)
      o.start(now); o.stop(now + dur)
    } else {
      // 古典（尼龙弦，默认）：三角波 + 柔和二次谐波 + 低通，温暖
      const dur = duration ?? 1.3
      const o1 = ac.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq
      const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2
      const g2 = ac.createGain(); g2.gain.value = 0.12
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500
      const g = ac.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.33, now + 0.02) // 柔和起音
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      o1.connect(g); o2.connect(g2).connect(g)
      g.connect(lp).connect(out)
      o1.start(now); o2.start(now)
      o1.stop(now + dur); o2.stop(now + dur)
    }
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
