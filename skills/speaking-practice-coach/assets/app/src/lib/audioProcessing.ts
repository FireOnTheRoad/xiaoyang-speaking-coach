export interface ProcessedRecording {
  blob: Blob
  mimeType: string
  duration: number
}

const encodeMonoWav = (buffer: AudioBuffer, targetPeak = 0.89) => {
  const channel = buffer.getChannelData(0)
  let peak = 0
  for (let index = 0; index < channel.length; index += 1) {
    peak = Math.max(peak, Math.abs(channel[index]))
  }
  const gain = peak > 0 ? targetPeak / peak : 1
  const sampleRate = buffer.sampleRate
  const bytesPerSample = 2
  const dataSize = channel.length * bytesPerSample
  const wav = new ArrayBuffer(44 + dataSize)
  const view = new DataView(wav)

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let index = 0; index < channel.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, channel[index] * gain))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([wav], { type: 'audio/wav' })
}

export const processRecording = async (source: Blob): Promise<ProcessedRecording> => {
  try {
    const data = await source.arrayBuffer()
    const decodeContext = new AudioContext()
    const decoded = await decodeContext.decodeAudioData(data.slice(0))
    await decodeContext.close()

    const sampleRate = 16000
    const frameCount = Math.max(1, Math.ceil(decoded.duration * sampleRate))
    const offline = new OfflineAudioContext(1, frameCount, sampleRate)
    const input = offline.createBufferSource()
    const compressor = offline.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 24
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    input.buffer = decoded
    input.connect(compressor)
    compressor.connect(offline.destination)
    input.start()

    const rendered = await offline.startRendering()
    const blob = encodeMonoWav(rendered)
    return { blob, mimeType: 'audio/wav', duration: rendered.duration }
  } catch {
    return {
      blob: source,
      mimeType: source.type || 'audio/webm',
      duration: 0,
    }
  }
}
