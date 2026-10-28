import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, MicOff, Pause, Play, RotateCcw, Square, Volume2, VolumeX, X } from 'lucide-react'
import type { Lang, Topic } from '../data/topics'

export type PracticeMode = 'quick' | 'research' | 'structure'
type TimerPhase = 'prep' | 'ready' | 'speech' | 'done'

export interface RecordedAttempt {
  blob: Blob
  mimeType: string
  duration: number
  transcript?: string
  deviceLabel?: string
}

export type PracticeProcessEventKind =
  | 'session_started'
  | 'prep_started'
  | 'prep_completed'
  | 'speech_started'
  | 'stage_reached'
  | 'paused'
  | 'resumed'
  | 'recording_started'
  | 'speech_finished'

export interface PracticeProcessEvent {
  kind: PracticeProcessEventKind
  at: string
  elapsedSeconds: number
  stageIndex?: number
  stageCount?: number
  remainingSeconds?: number
}

export interface PracticeProcess {
  startedAt: string
  completedAt: string
  plannedPrepSeconds: number
  actualPrepSeconds: number
  plannedSpeechSeconds: number
  actualSpeechSeconds: number
  pauseCount: number
  pausedSeconds: number
  recordingEnabled: boolean
  recordingUsed: boolean
  recordingDevice?: string
  finishReason: 'manual' | 'timer'
  events: PracticeProcessEvent[]
}

interface SpeechTimerProps {
  mode: PracticeMode
  topic: Topic
  lang: Lang
  speechSeconds: number
  prepSeconds: number
  soundOn: boolean
  onClose: () => void
  onComplete: (spokenSeconds: number, process?: PracticeProcess) => string
  onRecordingComplete?: (sessionId: string, recording: RecordedAttempt) => void
}

const text = {
  zh: {
    prep: '准备阶段',
    ready: '准备完成',
    speech: '表达计时',
    done: '本轮完成',
    research: '查阅与梳理',
    structurePrep: '搭建表达骨架',
    pause: '暂停',
    resume: '继续',
    startSpeech: '开始表达',
    again: '再来一次',
    close: '关闭',
    remaining: '剩余时间',
    quickStages: ['开场', '展开', '收束'],
    deepStages: ['立场', '证据', '收口'],
    structureStages: ['结论', '三点论据', '例子', '收束'],
    prepHint: '先找角度，不要急着写完整稿。',
    speechHint: '看进度段，不必追求每句话都完美。',
    finishHint: '已记录本次练习。说出一个可改进点，再开始下一轮。',
    recordingOn: '录音中',
    recordingOff: '开启录音',
    recordingRequesting: '正在请求麦克风…',
    recordingError: '麦克风不可用，本次只记录计时。',
    finishSpeech: '结束表达',
    transcriptReady: '已获取转写',
  },
  en: {
    prep: 'Preparation',
    ready: 'Ready to speak',
    speech: 'Speech timer',
    done: 'Round complete',
    research: 'Research & organize',
    structurePrep: 'Build your outline',
    pause: 'Pause',
    resume: 'Resume',
    startSpeech: 'Start speaking',
    again: 'Try again',
    close: 'Close',
    remaining: 'Time remaining',
    quickStages: ['Open', 'Develop', 'Close'],
    deepStages: ['Position', 'Evidence', 'Close'],
    structureStages: ['Claim', 'Three points', 'Example', 'Close'],
    prepHint: 'Find an angle first. Do not write a full script.',
    speechHint: 'Follow the segments, not every sentence.',
    finishHint: 'Recorded. Name one improvement before the next round.',
    recordingOn: 'Recording',
    recordingOff: 'Enable recording',
    recordingRequesting: 'Requesting microphone…',
    recordingError: 'Microphone unavailable. This round will only record timing.',
    finishSpeech: 'Finish speech',
    transcriptReady: 'Transcript captured',
  },
} as const

const formatTime = (value: number) => {
  const whole = Math.max(0, Math.ceil(value))
  const minutes = Math.floor(whole / 60)
  const seconds = whole % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const makeCue = (kind: 'start' | 'finish' | 'tick') => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const now = context.currentTime
    const notes = kind === 'finish' ? [523.25, 659.25, 783.99] : kind === 'start' ? [440, 554.37] : [660]
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.08)
      gain.gain.exponentialRampToValueAtTime(kind === 'tick' ? 0.08 : 0.14, now + index * 0.08 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + (kind === 'finish' ? 0.32 : 0.16))
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now + index * 0.08)
      oscillator.stop(now + index * 0.08 + 0.35)
    })
    window.setTimeout(() => void context.close(), 900)
  } catch {
    // Audio cues are optional and can be blocked by browser policy.
  }
}

export default function SpeechTimer({
  mode,
  topic,
  lang,
  speechSeconds,
  prepSeconds,
  soundOn,
  onClose,
  onComplete,
  onRecordingComplete,
}: SpeechTimerProps) {
  const t = text[lang]
  const initialPhase: TimerPhase = mode === 'quick' ? 'speech' : 'prep'
  const [phase, setPhase] = useState<TimerPhase>(initialPhase)
  const [remaining, setRemaining] = useState(mode === 'quick' ? speechSeconds : prepSeconds)
  const [running, setRunning] = useState(true)
  const completionRef = useRef(false)
  const lastTickRef = useRef<number | null>(null)
  const [recordingEnabled, setRecordingEnabled] = useState(true)
  const [recordingState, setRecordingState] = useState<'idle' | 'requesting' | 'recording' | 'error'>('idle')
  const [recordingError, setRecordingError] = useState('')
  const [recordingDevice, setRecordingDevice] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef(0)
  const sessionIdRef = useRef<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const recordingStartLockRef = useRef(false)
  const transcriptRef = useRef('')
  const processStartedAtRef = useRef(Date.now())
  const processEventsRef = useRef<PracticeProcessEvent[]>([])
  const recordedStagesRef = useRef(new Set<number>())
  const runningRef = useRef(true)
  const pauseStartedAtRef = useRef<number | null>(null)
  const pauseCountRef = useRef(0)
  const pausedMillisecondsRef = useRef(0)
  const recordingStartedRef = useRef(false)
  const recordingEventRef = useRef(false)

  const prepLabel = mode === 'research' ? t.research : t.structurePrep
  const stages = useMemo(() => {
    if (mode === 'structure') return [...t.structureStages]
    if (mode === 'research') return [...t.deepStages]
    return [...t.quickStages]
  }, [mode, t])

  const activeDuration = phase === 'prep' ? prepSeconds : speechSeconds
  const progress = phase === 'ready' ? 1 : phase === 'done' ? 1 : 1 - remaining / Math.max(1, activeDuration)
  const stageThresholds = stages.map((_, index) => (index + 1) / stages.length)
  const hitCount = phase === 'done' ? stages.length : phase === 'speech' ? stageThresholds.filter((threshold) => progress >= threshold - 0.01).length : 0

  const appendProcessEvent = (
    kind: PracticeProcessEventKind,
    extra: Pick<PracticeProcessEvent, 'stageIndex' | 'stageCount' | 'remainingSeconds'> = {},
  ) => {
    const now = Date.now()
    processEventsRef.current.push({
      kind,
      at: new Date(now).toISOString(),
      elapsedSeconds: Math.max(0, Math.round((now - processStartedAtRef.current) / 100) / 10),
      ...extra,
    })
  }

  const setRunningState = (next: boolean) => {
    if (runningRef.current === next) return
    const now = Date.now()
    if (next) {
      if (pauseStartedAtRef.current !== null) {
        pausedMillisecondsRef.current += now - pauseStartedAtRef.current
        pauseStartedAtRef.current = null
      }
      appendProcessEvent('resumed')
    } else {
      pauseStartedAtRef.current = now
      pauseCountRef.current += 1
      appendProcessEvent('paused')
    }
    runningRef.current = next
    setRunning(next)
  }

  const resetProcess = (nextPhase: TimerPhase) => {
    processStartedAtRef.current = Date.now()
    processEventsRef.current = []
    recordedStagesRef.current = new Set()
    runningRef.current = true
    pauseStartedAtRef.current = null
    pauseCountRef.current = 0
    pausedMillisecondsRef.current = 0
    recordingStartedRef.current = false
    recordingEventRef.current = false
    appendProcessEvent(nextPhase === 'prep' ? 'prep_started' : 'speech_started')
  }

  useEffect(() => {
    appendProcessEvent(initialPhase === 'prep' ? 'prep_started' : 'speech_started')
    return () => {
      if (pauseStartedAtRef.current !== null) {
        pausedMillisecondsRef.current += Date.now() - pauseStartedAtRef.current
        pauseStartedAtRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (recordingState !== 'recording' || recordingEventRef.current) return
    recordingEventRef.current = true
    recordingStartedRef.current = true
    appendProcessEvent('recording_started')
  }, [recordingState])

  useEffect(() => {
    if (phase !== 'speech') return
    stageThresholds.forEach((threshold, index) => {
      if (progress + 0.01 < threshold || recordedStagesRef.current.has(index)) return
      recordedStagesRef.current.add(index)
      appendProcessEvent('stage_reached', { stageIndex: index + 1, stageCount: stages.length })
    })
  }, [phase, progress, stageThresholds, stages.length])

  const stopRecording = (save: boolean) => {
    recordingStartLockRef.current = false
    const recorder = mediaRecorderRef.current
    const stream = mediaStreamRef.current
    const recognition = recognitionRef.current

    if (recognition) {
      try { recognition.stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const duration = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
        const sessionId = sessionIdRef.current
        if (save && sessionId && blob.size > 0) {
          onRecordingComplete?.(sessionId, {
            blob,
            mimeType,
            duration,
            transcript: transcriptRef.current.trim() || undefined,
            deviceLabel: recordingDevice || undefined,
          })
        }
        audioChunksRef.current = []
        mediaRecorderRef.current = null
        stream?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        void audioContextRef.current?.close()
        audioContextRef.current = null
        setRecordingState('idle')
      }
      recorder.stop()
      return
    }

    stream?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    void audioContextRef.current?.close()
    audioContextRef.current = null
    setRecordingState('idle')
  }

  const startRecording = async () => {
    if (recordingStartLockRef.current || !recordingEnabled || recordingState === 'requesting' || recordingState === 'recording') return
    recordingStartLockRef.current = true
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingState('error')
      setRecordingError(t.recordingError)
      setRecordingEnabled(false)
      return
    }

    setRecordingState('requesting')
    setRecordingError('')
    try {
      const baseAudioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1,
      }
      let stream = await navigator.mediaDevices.getUserMedia({ audio: baseAudioConstraints })

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const inputs = devices.filter((device) => device.kind === 'audioinput' && device.deviceId)
        const currentDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId
        const isVirtual = (label: string) => /virtual|oray|wemeet|blackhole|soundflower|loopback|aggregate|虚拟|向日葵|腾讯会议/i.test(label)
        const nonVirtual = inputs.filter((device) => !isVirtual(device.label))
        const preferred = nonVirtual.find((device) => /macbook|built-in|internal|内建|内置|麦克风|microphone/i.test(device.label))
          ?? nonVirtual[0]
        if (preferred && preferred.deviceId !== currentDeviceId) {
          stream.getTracks().forEach((track) => track.stop())
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { ...baseAudioConstraints, deviceId: { exact: preferred.deviceId } },
          })
        }
        const activeLabel = stream.getAudioTracks()[0]?.label || preferred?.label || ''
        setRecordingDevice(activeLabel)
        if (/oray|wemeet|virtual|虚拟|向日葵|腾讯会议/i.test(activeLabel)) {
          setRecordingError('检测到虚拟音频设备，回声风险较高，建议改用 MacBook 麦克风并佩戴耳机。')
        } else {
          setRecordingError('')
        }
      } catch {
        setRecordingDevice(stream.getAudioTracks()[0]?.label || '')
      }

      if (!recordingEnabled) {
        stream.getTracks().forEach((track) => track.stop())
        setRecordingState('idle')
        return
      }
      let recordingStream = stream
      try {
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 24
        compressor.ratio.value = 4
        compressor.attack.value = 0.003
        compressor.release.value = 0.25
        const destination = audioContext.createMediaStreamDestination()
        source.connect(compressor)
        compressor.connect(destination)
        recordingStream = destination.stream
        audioContextRef.current = audioContext
      } catch {
        audioContextRef.current = null
      }

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate))
      const recorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128000,
      }
      const recorder = new MediaRecorder(recordingStream, recorderOptions)
      audioChunksRef.current = []
      transcriptRef.current = ''
      recordingStartedAtRef.current = Date.now()
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      setRecordingState('recording')

      const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (Recognition) {
        const recognition = new Recognition()
        recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: any) => {
          let text = ''
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            text += event.results[index][0]?.transcript ?? ''
          }
          if (text.trim()) transcriptRef.current = `${transcriptRef.current} ${text.trim()}`.trim()
        }
        recognition.onerror = () => { /* Transcription is optional. */ }
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch {
      setRecordingState('error')
      setRecordingError(t.recordingError)
      setRecordingEnabled(false)
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      void audioContextRef.current?.close()
      audioContextRef.current = null
    } finally {
      recordingStartLockRef.current = false
    }
  }

  const finishSpeech = (finishReason: 'manual' | 'timer' = 'manual') => {
    if (phase !== 'speech' || completionRef.current) return
    completionRef.current = true
    const spokenSeconds = Math.max(1, Math.round(speechSeconds - remaining))
    const recordingWasActive = recordingState === 'recording'
    const now = Date.now()
    if (pauseStartedAtRef.current !== null) {
      pausedMillisecondsRef.current += now - pauseStartedAtRef.current
      pauseStartedAtRef.current = null
    }
    appendProcessEvent('speech_finished', { remainingSeconds: Math.max(0, Math.round(remaining)) })
    runningRef.current = false
    setRunning(false)
    setPhase('done')
    const process: PracticeProcess = {
      startedAt: new Date(processStartedAtRef.current).toISOString(),
      completedAt: new Date(now).toISOString(),
      plannedPrepSeconds: mode === 'quick' ? 0 : prepSeconds,
      actualPrepSeconds: mode === 'quick' ? 0 : prepSeconds,
      plannedSpeechSeconds: speechSeconds,
      actualSpeechSeconds: spokenSeconds,
      pauseCount: pauseCountRef.current,
      pausedSeconds: Math.round(pausedMillisecondsRef.current / 100) / 10,
      recordingEnabled,
      recordingUsed: recordingStartedRef.current,
      recordingDevice: recordingDevice || undefined,
      finishReason,
      events: [...processEventsRef.current],
    }
    sessionIdRef.current = onComplete(spokenSeconds, process)
    stopRecording(true)
    if (soundOn && !recordingWasActive) makeCue('finish')
  }

  const handleClose = () => {
    stopRecording(false)
    onClose()
  }

  useEffect(() => {
    if (!running || phase === 'ready' || phase === 'done') return
    const interval = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 0.25))
    }, 250)
    return () => window.clearInterval(interval)
  }, [phase, running])

  useEffect(() => {
    if (remaining > 0 || phase === 'ready' || phase === 'done') return
    if (phase === 'prep') {
      runningRef.current = false
      setRunning(false)
      appendProcessEvent('prep_completed')
      setPhase('ready')
      if (soundOn) makeCue('finish')
      return
    }
    if (phase === 'speech') finishSpeech('timer')
  }, [finishSpeech, phase, remaining])

  useEffect(() => {
    if (phase === 'speech' && running && recordingEnabled && recordingState === 'idle') {
      void startRecording()
    }
  }, [phase, recordingEnabled, recordingState, running])

  useEffect(() => {
    if (!soundOn || !running || phase !== 'speech' || recordingState === 'recording') return
    const whole = Math.ceil(remaining)
    if (whole > 0 && whole % 10 === 0 && lastTickRef.current !== whole) {
      lastTickRef.current = whole
      makeCue('tick')
    }
  }, [phase, recordingState, remaining, running, soundOn])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
      if (event.code === 'Space' && phase !== 'ready' && phase !== 'done') {
        event.preventDefault()
        setRunningState(!runningRef.current)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [phase])

  const startSpeech = () => {
    completionRef.current = false
    lastTickRef.current = null
    sessionIdRef.current = null
    transcriptRef.current = ''
    resetProcess('speech')
    setRemaining(speechSeconds)
    setPhase('speech')
    setRunning(true)
    if (soundOn) makeCue('start')
  }

  const retry = () => {
    stopRecording(false)
    completionRef.current = false
    lastTickRef.current = null
    sessionIdRef.current = null
    transcriptRef.current = ''
    resetProcess(initialPhase)
    setPhase(initialPhase)
    setRemaining(initialPhase === 'speech' ? speechSeconds : prepSeconds)
    setRunning(true)
    if (soundOn) makeCue('start')
  }

  const statusLabel = phase === 'prep' ? prepLabel : phase === 'ready' ? t.ready : phase === 'speech' ? t.speech : t.done

  return (
    <div className="timer-screen" role="dialog" aria-modal="true" aria-label={statusLabel}>
      <div className="timer-shell">
        <header className="timer-header">
          <div>
            <p className="eyebrow">{statusLabel}</p>
            <h2>{topic.title[lang]}</h2>
          </div>
          <button className="icon-button light" onClick={handleClose} aria-label={t.close}>
            <X size={20} />
          </button>
        </header>

        <div className="timer-main">
          <div className="timer-count-block">
            <p>{t.remaining}</p>
            <strong>{formatTime(remaining)}</strong>
            <span>{phase === 'prep' ? t.prepHint : phase === 'done' ? t.finishHint : t.speechHint}</span>
            <div className={`timer-recording-status is-${recordingState}`}>
              {recordingState === 'recording' ? <Mic size={14} /> : <MicOff size={14} />}
              <b>
                {recordingState === 'recording'
                  ? t.recordingOn
                  : recordingState === 'requesting'
                    ? t.recordingRequesting
                    : recordingEnabled ? t.recordingOff : t.recordingError}
              </b>
              {recordingState === 'recording' && transcriptRef.current && <small>{t.transcriptReady}</small>}
              {recordingState === 'recording' && !transcriptRef.current && recordingDevice && <small>{recordingDevice}</small>}
            </div>
            {phase === 'speech' && <p className="recording-tip">{lang === 'zh' ? '为了减少回声，建议佩戴耳机，麦克风离嘴 10–20 cm。' : 'For cleaner audio, wear headphones and keep the mic 10–20 cm away.'}</p>}
          </div>

          <div className="timer-progress" aria-hidden="true">
            {stages.map((stage, index) => (
              <div className={`timer-segment ${index < hitCount ? 'is-hit' : ''}`} key={stage}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{stage}</b>
              </div>
            ))}
          </div>

          <div className="stage-track" aria-hidden="true">
            <div className="stage-track-fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
          </div>
        </div>

        <footer className="timer-actions">
          <button className="button button-ghost light" onClick={handleClose}>
            {t.close}
          </button>
          {phase === 'ready' && (
            <button className="button button-accent large" onClick={startSpeech}>
              <Play size={18} fill="currentColor" />
              {t.startSpeech}
            </button>
          )}
          {(phase === 'prep' || phase === 'speech') && (
            <button className="button button-accent large" onClick={() => setRunningState(!runningRef.current)}>
              {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {running ? t.pause : t.resume}
            </button>
          )}
          {phase === 'speech' && (
            <button className="button end-speech-button large" onClick={() => finishSpeech('manual')}>
              <Square size={16} fill="currentColor" />
              {t.finishSpeech}
            </button>
          )}
          {phase === 'done' && (
            <button className="button button-accent large" onClick={retry}>
              <RotateCcw size={18} />
              {t.again}
            </button>
          )}
          <button
            className={`recording-toggle ${recordingState === 'recording' ? 'is-recording' : ''}`}
            onClick={() => {
              const next = !recordingEnabled
              setRecordingEnabled(next)
              if (!next) stopRecording(false)
            }}
            disabled={phase === 'done'}
          >
            {recordingState === 'recording' ? <Mic size={16} /> : <MicOff size={16} />}
            {recordingState === 'recording'
              ? t.recordingOn
              : recordingState === 'requesting'
                ? t.recordingRequesting
                : t.recordingOff}
          </button>
          {soundOn ? <Volume2 className="timer-sound-icon" size={18} /> : <VolumeX className="timer-sound-icon" size={18} />}
        </footer>
      </div>
    </div>
  )
}
