type AudioContextConstructor = typeof AudioContext

let sharedContext: AudioContext | null = null

const getContext = (): AudioContext | null => {
  try {
    const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
    if (!Constructor) return null
    if (!sharedContext || sharedContext.state === 'closed') {
      sharedContext = new Constructor()
    }
    if (sharedContext.state === 'suspended') {
      void sharedContext.resume()
    }
    return sharedContext
  } catch {
    return null
  }
}

const createNoise = (context: AudioContext, duration: number) => {
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * duration)), context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) {
    const envelope = 1 - index / channel.length
    channel[index] = (Math.random() * 2 - 1) * envelope
  }
  return buffer
}

export const playTopicShuffle = () => {
  const context = getContext()
  if (!context) return
  const now = context.currentTime

  const oscillator = context.createOscillator()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(150, now)
  oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.42)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1100, now)
  filter.frequency.exponentialRampToValueAtTime(2600, now + 0.42)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46)
  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.48)

  const source = context.createBufferSource()
  const noiseFilter = context.createBiquadFilter()
  const noiseGain = context.createGain()
  source.buffer = createNoise(context, 0.3)
  noiseFilter.type = 'highpass'
  noiseFilter.frequency.value = 1500
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.024, now + 0.02)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
  source.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(context.destination)
  source.start(now)
  source.stop(now + 0.32)
}

export const playTopicTick = (progress: number) => {
  const context = getContext()
  if (!context) return
  const now = context.currentTime
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = createNoise(context, 0.035)
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(2100 + Math.random() * 800, now)
  filter.Q.value = 1.1
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.028 + progress * 0.018, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start(now)
  source.stop(now + 0.045)
}

export const playTopicLand = () => {
  const context = getContext()
  if (!context) return
  const now = context.currentTime
  const master = context.createGain()
  master.gain.value = 0.34
  master.connect(context.destination)

  const source = context.createBufferSource()
  const noiseFilter = context.createBiquadFilter()
  const noiseGain = context.createGain()
  source.buffer = createNoise(context, 0.11)
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.setValueAtTime(2200, now)
  noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.1)
  noiseGain.gain.setValueAtTime(0.13, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)
  source.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(master)
  source.start(now)
  source.stop(now + 0.12)

  const notes = [
    { frequency: 392, start: 0 },
    { frequency: 523.25, start: 0.055 },
    { frequency: 659.25, start: 0.11 },
  ]
  notes.forEach(({ frequency, start }) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.34)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(now + start)
    oscillator.stop(now + start + 0.36)
  })
}
