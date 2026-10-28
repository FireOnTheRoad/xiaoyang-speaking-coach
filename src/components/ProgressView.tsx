import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  Check,
  Download,
  FileText,
  Flame,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import type { Lang } from '../data/topics'
import type { PracticeProcess, PracticeProcessEvent } from './SpeechTimer'
import { processRecording } from '../lib/audioProcessing'
import { loadRecording, saveRecording } from '../lib/recordingStore'

export interface SessionAnalysis {
  score: number | null
  dimensions: {
    content: number | null
    structure: number | null
    conciseness: number | null
    evidence: number | null
    delivery: number | null
  }
  strengths: string[]
  improvements: string[]
  summary: string
  nextStep: string
  provider: string
  analyzedAt: string
}

export interface SessionRecordingMeta {
  mimeType: string
  size: number
  duration: number
  createdAt: string
  deviceLabel?: string
}

export interface SessionRecord {
  id: string
  topicId: string
  title: string
  categoryId: string
  categoryName: string
  mode: 'quick' | 'research' | 'structure'
  language?: Lang
  seconds: number
  completedAt: string
  process?: PracticeProcess
  recording?: SessionRecordingMeta
  transcript?: string
  analysis?: SessionAnalysis
  obsidian?: {
    syncedAt: string
    notePath: string
    indexPath?: string
    attachmentPath?: string
    vaultPath: string
  }
}

interface ProgressViewProps {
  lang: Lang
  sessions: SessionRecord[]
  onClear: () => void
  onUpdateSession: (sessionId: string, patch: Partial<SessionRecord>) => void
}

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* best effort */ }
  }, [key, value])
  return [value, setValue] as const
}

const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

const copy = {
  zh: {
    eyebrow: '成长记录',
    title: '让每一次开口，都留下可见的痕迹。',
    subtitle: '录音保存在本机浏览器中。你可以回放、查看转写、让 Agent 评分，并把完整训练过程同步到 Obsidian。',
    sessions: '完成练习',
    minutes: '表达分钟',
    streak: '连续练习',
    averageScore: '平均评分',
    days: '天',
    week: '近 7 天',
    recent: '训练历史',
    search: '搜索题目、分类或转写内容',
    all: '全部',
    recorded: '已录音',
    analyzed: '已分析',
    unanalyzed: '未分析',
    sortNewest: '最新优先',
    sortScore: '评分优先',
    sortDuration: '时长优先',
    showMore: '加载更多',
    noMatches: '没有符合当前条件的训练记录。',
    analysisRules: '评分与分析规则',
    rulesIntro: '分析基于本次录音的转写、题目、练习模式和实际时长，不使用与录音无关的猜测。',
    contentRule: '内容：主题相关性、信息量、观点完整度',
    structureRule: '结构：开场、层次、推进和收束',
    concisenessRule: '简洁度：重复、口头填充和冗余',
    evidenceRule: '论证：例子、数据、因果和可信度',
    deliveryRule: '表达：语速、停顿、流畅度和语气',
    weightRule: '综合分按内容 30%、结构 20%、简洁度 15%、论证 20%、表达 15% 加权。',
    analysisBasis: '分析依据',
    trainingProcess: '训练过程',
    processOnly: '本轮过程',
    processUnavailable: '这次训练没有保存过程数据。',
    actualPrep: '准备用时',
    actualSpeech: '实际表达',
    pauseCount: '暂停次数',
    pausedSeconds: '暂停时长',
    recordingUsed: '录音',
    recordingNotUsed: '未录音',
    finishManual: '手动结束',
    finishTimer: '计时结束',
    eventSessionStarted: '开始训练',
    eventPrepStarted: '开始查阅与梳理',
    eventPrepCompleted: '准备完成',
    eventSpeechStarted: '开始表达',
    eventStageReached: '到达阶段',
    eventPaused: '暂停',
    eventResumed: '继续',
    eventRecordingStarted: '开始录音',
    eventSpeechFinished: '表达结束',
    syncUpdate: '更新同步',
    obsidian: 'Obsidian',
    obsidianSettings: 'Obsidian 设置',
    obsidianIntro: '每次同步会生成一篇训练笔记（完整过程、转写、录音、评分与建议），并自动更新“言之有物 · 训练总览”。再次同步只更新同一篇，不会重复创建。',
    syncObsidian: '同步到 Obsidian',
    syncingObsidian: '同步中…',
    syncedObsidian: '已同步',
    syncAll: '同步全部训练记录',
    vault: 'Obsidian 资料库',
    vaultPlaceholder: '选择或输入 Vault 路径',
    noteFolder: '笔记目录',
    includeAudio: '同时保存录音附件',
    saveSettings: '保存设置',
    close: '关闭',
    syncError: '同步失败，请检查 Vault 路径。',
    syncSuccess: '已同步到 Obsidian',
    empty: '完成一轮计时练习后，这里会生成你的表达轨迹。',
    clear: '清空记录',
    quick: '即兴',
    research: '调研',
    structured: '结构化',
    play: '播放',
    pause: '暂停',
    download: '下载录音',
    noRecording: '本轮未录音',
    hasRecording: '已录音',
    hasTranscript: '有转写',
    analyze: 'Agent 分析',
    analyzing: '分析中…',
    analysis: '评分与建议',
    score: '综合评分',
    dimensions: '维度评分',
    strengths: '做得好的地方',
    improvements: '优化建议',
    nextStep: '下一步练习',
    noAnalysis: '还没有分析',
    analysisError: '分析失败。请确认 Codex CLI 或 WorkBuddy 已安装并登录，然后重启本地服务再试。',
    transcribing: '本地转写中…',
    workbuddyAnalyzing: 'WorkBuddy 分析中…',
    transcribingError: '录音转写失败。请确认本地 Whisper 可用，或让 WorkBuddy/Codex 完成音频分析。',
    noSpeech: '没有检测到可转写的人声。',
    recordingError: '录音无法加载。',
    content: '内容',
    structure: '结构',
    conciseness: '简洁度',
    evidence: '论证',
    delivery: '表达',
  },
  en: {
    eyebrow: 'Progress',
    title: 'Make every spoken attempt leave a visible trace.',
    subtitle: 'Recordings stay in this browser. Play them back, inspect the transcript, and ask your Agent for a score and coaching notes.',
    sessions: 'Finished rounds',
    minutes: 'Speaking minutes',
    streak: 'Practice streak',
    averageScore: 'Average score',
    days: 'days',
    week: 'Last 7 days',
    recent: 'Training history',
    search: 'Search title, category, or transcript',
    all: 'All',
    recorded: 'Recorded',
    analyzed: 'Analyzed',
    unanalyzed: 'Not analyzed',
    sortNewest: 'Newest',
    sortScore: 'Highest score',
    sortDuration: 'Longest',
    showMore: 'Load more',
    noMatches: 'No sessions match the current filters.',
    analysisRules: 'Scoring & analysis rules',
    rulesIntro: 'Analysis uses the recording transcript, prompt, practice mode, and actual duration. It does not invent details absent from the recording.',
    contentRule: 'Content: relevance, information density, completeness',
    structureRule: 'Structure: opening, progression, and closure',
    concisenessRule: 'Conciseness: repetition, filler, and redundancy',
    evidenceRule: 'Evidence: examples, data, causality, credibility',
    deliveryRule: 'Delivery: pace, pauses, fluency, and tone',
    weightRule: 'Overall score: 30% content, 20% structure, 15% conciseness, 20% evidence, 15% delivery.',
    analysisBasis: 'Analysis basis',
    trainingProcess: 'Training process',
    processOnly: 'Round process',
    processUnavailable: 'No process data was saved for this round.',
    actualPrep: 'Preparation',
    actualSpeech: 'Speaking',
    pauseCount: 'Pauses',
    pausedSeconds: 'Paused time',
    recordingUsed: 'Recording',
    recordingNotUsed: 'No recording',
    finishManual: 'Ended manually',
    finishTimer: 'Timer ended',
    eventSessionStarted: 'Session started',
    eventPrepStarted: 'Preparation started',
    eventPrepCompleted: 'Preparation complete',
    eventSpeechStarted: 'Speaking started',
    eventStageReached: 'Stage reached',
    eventPaused: 'Paused',
    eventResumed: 'Resumed',
    eventRecordingStarted: 'Recording started',
    eventSpeechFinished: 'Speaking ended',
    syncUpdate: 'Update sync',
    obsidian: 'Obsidian',
    obsidianSettings: 'Obsidian settings',
    obsidianIntro: 'Each sync creates one training note with the full process, transcript, recording, score, and coaching. It also updates the training index. Re-syncing updates the same note instead of creating duplicates.',
    syncObsidian: 'Sync to Obsidian',
    syncingObsidian: 'Syncing…',
    syncedObsidian: 'Synced',
    syncAll: 'Sync all sessions',
    vault: 'Obsidian vault',
    vaultPlaceholder: 'Choose or enter a vault path',
    noteFolder: 'Note folder',
    includeAudio: 'Save recording attachment',
    saveSettings: 'Save settings',
    close: 'Close',
    syncError: 'Sync failed. Check the Obsidian vault path.',
    syncSuccess: 'Synced to Obsidian',
    empty: 'Complete a timed round and your speaking trail will appear here.',
    clear: 'Clear history',
    quick: 'Impromptu',
    research: 'Research',
    structured: 'Structured',
    play: 'Play',
    pause: 'Pause',
    download: 'Download',
    noRecording: 'No recording',
    hasRecording: 'Recorded',
    hasTranscript: 'Transcript',
    analyze: 'Analyze',
    analyzing: 'Analyzing…',
    analysis: 'Score & coaching',
    score: 'Overall score',
    dimensions: 'Dimension scores',
    strengths: 'What worked',
    improvements: 'Improvements',
    nextStep: 'Next practice step',
    noAnalysis: 'No analysis yet',
    analysisError: 'Analysis failed. Confirm that Codex CLI or WorkBuddy is installed and signed in, then restart the local service.',
    transcribing: 'Transcribing locally…',
    workbuddyAnalyzing: 'WorkBuddy analyzing…',
    transcribingError: 'Transcription failed. Check local Whisper, or use WorkBuddy/Codex for audio analysis.',
    noSpeech: 'No speech was detected in the recording.',
    recordingError: 'Recording could not be loaded.',
    content: 'Content',
    structure: 'Structure',
    conciseness: 'Conciseness',
    evidence: 'Evidence',
    delivery: 'Delivery',
  },
} as const

const clampScore = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

const formatProcessDuration = (seconds: number) => {
  const safe = Math.max(0, Number(seconds) || 0)
  if (safe < 60) return `${Math.round(safe * 10) / 10}s`
  const minutes = Math.floor(safe / 60)
  const rest = Math.round(safe % 60)
  return `${minutes}m ${String(rest).padStart(2, '0')}s`
}

const processEventLabel = (event: PracticeProcessEvent, lang: Lang, t: typeof copy.zh | typeof copy.en) => {
  if (event.kind === 'stage_reached' && event.stageIndex && event.stageCount) {
    return `${t.eventStageReached} ${event.stageIndex}/${event.stageCount}`
  }
  const labels = {
    session_started: t.eventSessionStarted,
    prep_started: t.eventPrepStarted,
    prep_completed: t.eventPrepCompleted,
    speech_started: t.eventSpeechStarted,
    stage_reached: t.eventStageReached,
    paused: t.eventPaused,
    resumed: t.eventResumed,
    recording_started: t.eventRecordingStarted,
    speech_finished: t.eventSpeechFinished,
  }
  return labels[event.kind]
}

const parseAnalysis = (text: string, provider: string): SessionAnalysis | null => {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>
    const source = (parsed.dimensions ?? {}) as Record<string, unknown>
    const dimensions = {
      content: clampScore(source.content),
      structure: clampScore(source.structure),
      conciseness: clampScore(source.conciseness),
      evidence: clampScore(source.evidence),
      delivery: clampScore(source.delivery),
    }
    const weightedValues = [dimensions.content, dimensions.structure, dimensions.conciseness, dimensions.evidence, dimensions.delivery]
    const weightedScore = weightedValues.every((value): value is number => typeof value === 'number')
      ? Math.round(
          dimensions.content! * 0.3
          + dimensions.structure! * 0.2
          + dimensions.conciseness! * 0.15
          + dimensions.evidence! * 0.2
          + dimensions.delivery! * 0.15,
        )
      : clampScore(parsed.score)
    return {
      score: weightedScore,
      dimensions,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 4) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String).slice(0, 5) : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      nextStep: typeof parsed.nextStep === 'string' ? parsed.nextStep : '',
      provider,
      analyzedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export default function ProgressView({ lang, sessions, onClear, onUpdateSession }: ProgressViewProps) {
  const t = copy[lang]
  const [playingId, setPlayingId] = useState('')
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [recordingErrors, setRecordingErrors] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState('')
  const [analyzingId, setAnalyzingId] = useState('')
  const [analysisStage, setAnalysisStage] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'recorded' | 'analyzed' | 'unanalyzed'>('all')
  const [historySort, setHistorySort] = useState<'newest' | 'score' | 'duration'>('newest')
  const [visibleCount, setVisibleCount] = useState(20)
  const [obsidianSettings, setObsidianSettings] = useStoredState('sayfield-obsidian-settings', { vaultPath: '', folder: '言之有物/训练记录', includeAudio: true })
  const [obsidianVaults, setObsidianVaults] = useState<Array<{ id: string; path: string; open?: boolean }>>([])
  const [obsidianModalOpen, setObsidianModalOpen] = useState(false)
  const [syncingId, setSyncingId] = useState('')
  const [bulkSyncing, setBulkSyncing] = useState(false)
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({})
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})
  const migrationAttemptedRef = useRef(new Set<string>())

  const totalSeconds = sessions.reduce((sum, session) => sum + session.seconds, 0)
  const uniqueDays = new Set(sessions.map((session) => new Date(session.completedAt).toDateString()))
  const scoredSessions = sessions.filter((session) => typeof session.analysis?.score === 'number')
  const averageScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((sum, session) => sum + (session.analysis?.score ?? 0), 0) / scoredSessions.length)
    : null

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    let result = sessions.filter((session) => {
      if (historyFilter === 'recorded' && !session.recording) return false
      if (historyFilter === 'analyzed' && !session.analysis) return false
      if (historyFilter === 'unanalyzed' && session.analysis) return false
      if (!normalized) return true
      return [session.title, session.categoryName, session.transcript]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
    result = [...result]
    if (historySort === 'score') {
      result.sort((a, b) => (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1))
    } else if (historySort === 'duration') {
      result.sort((a, b) => b.seconds - a.seconds)
    } else {
      result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    }
    return result
  }, [historyFilter, historySort, query, sessions])
  const visibleSessions = filteredSessions.slice(0, visibleCount)

  const lastSevenDays = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - offset))
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const count = sessions.filter((session) => {
      const completed = new Date(session.completedAt)
      return completed >= date && completed < next
    }).length
    return { date, count }
  }), [sessions])
  const maxCount = Math.max(1, ...lastSevenDays.map((day) => day.count))

  useEffect(() => {
    setVisibleCount(20)
  }, [historyFilter, historySort, query])

  useEffect(() => {
    fetch('/api/obsidian/vaults')
      .then((response) => response.json())
      .then((data: { vaults?: Array<{ id: string; path: string; open?: boolean }> }) => {
        const vaults = data.vaults ?? []
        setObsidianVaults(vaults)
        setObsidianSettings((current) => current.vaultPath || !vaults[0] ? current : { ...current, vaultPath: vaults[0].path })
      })
      .catch(() => setObsidianVaults([]))
  }, [setObsidianSettings])

  useEffect(() => () => {
    Object.values(audioUrls).forEach((url) => URL.revokeObjectURL(url))
  }, [audioUrls])

  useEffect(() => {
    sessions.forEach((session) => {
      const meta = session.recording
      if (!meta || meta.mimeType === 'audio/wav' || migrationAttemptedRef.current.has(session.id)) return
      migrationAttemptedRef.current.add(session.id)
      void (async () => {
        const original = await loadRecording(session.id)
        if (!original) return
        const processed = await processRecording(original)
        if (processed.mimeType !== 'audio/wav') return
        const saved = await saveRecording(session.id, processed.blob)
        if (!saved) return
        onUpdateSession(session.id, {
          recording: {
            ...meta,
            mimeType: processed.mimeType,
            size: processed.blob.size,
            duration: processed.duration || meta.duration,
          },
        })
      })()
    })
  }, [onUpdateSession, sessions])

  const playSession = async (sessionId: string) => {
    if (playingId === sessionId) {
      setPlayingId('')
      return
    }
    if (!audioUrls[sessionId]) {
      const blob = await loadRecording(sessionId)
      if (!blob) {
        setRecordingErrors((current) => ({ ...current, [sessionId]: t.recordingError }))
        return
      }
      const url = URL.createObjectURL(blob)
      setAudioUrls((current) => ({ ...current, [sessionId]: url }))
    }
    setPlayingId(sessionId)
  }

  const downloadSession = async (session: SessionRecord) => {
    const blob = await loadRecording(session.id)
    if (!blob) {
      setRecordingErrors((current) => ({ ...current, [session.id]: t.recordingError }))
      return
    }
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const extension = blob.type.includes('wav') ? 'wav' : blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    anchor.href = url
    anchor.download = `${session.title.replace(/[\/:*?"<>|]+/g, '-')}.${extension}`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const analyzeWithWorkBuddy = async (session: SessionRecord) => {
    const blob = await loadRecording(session.id)
    if (!blob) return false
    setAnalysisStage((current) => ({ ...current, [session.id]: t.workbuddyAnalyzing }))
    const response = await fetch('/api/agent/analyze-recording', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/wav',
        'X-Language': lang === 'zh' ? 'zh' : 'en',
      },
      body: blob,
    })
    if (!response.ok) return false
    const data = await response.json() as { ok?: boolean; text?: string; error?: string }
    if (!data.ok || !data.text) return false

    const match = data.text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const payload = JSON.parse(match[0]) as { transcript?: unknown }
        if (typeof payload.transcript === 'string' && payload.transcript.trim()) {
          onUpdateSession(session.id, { transcript: payload.transcript.trim() })
        }
      } catch {
        // parseAnalysis below will surface a proper failure.
      }
    }
    const analysis = parseAnalysis(data.text, 'workbuddy')
    if (!analysis) return false
    onUpdateSession(session.id, { analysis })
    setExpandedId(session.id)
    return true
  }

  const transcribeSession = async (session: SessionRecord) => {
    const blob = await loadRecording(session.id)
    if (!blob) throw new Error(t.recordingError)
    const response = await fetch('/api/agent/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/wav',
        'X-Language': lang === 'zh' ? 'zh' : 'en',
      },
      body: blob,
    })
    const data = await response.json() as { ok?: boolean; text?: string; code?: string; error?: string }
    if (!response.ok || !data.ok) {
      throw new Error(data.code === 'NO_SPEECH' ? t.noSpeech : (data.error || t.transcribingError))
    }
    if (!data.text?.trim()) throw new Error(t.noSpeech)
    onUpdateSession(session.id, { transcript: data.text })
    return data.text
  }

  const syncSessionToObsidian = async (session: SessionRecord) => {
    if (!obsidianSettings.vaultPath) {
      setObsidianModalOpen(true)
      return false
    }
    setSyncingId(session.id)
    setSyncErrors((current) => ({ ...current, [session.id]: '' }))
    try {
      const recordingBlob = session.recording ? await loadRecording(session.id) : null
      const audioBase64 = recordingBlob ? await blobToBase64(recordingBlob) : undefined
      const response = await fetch('/api/obsidian/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultPath: obsidianSettings.vaultPath,
          folder: obsidianSettings.folder,
          includeAudio: obsidianSettings.includeAudio,
          session,
          audio: recordingBlob && audioBase64 ? { dataBase64: audioBase64, mimeType: recordingBlob.type } : null,
        }),
      })
      const data = await response.json() as { ok?: boolean; notePath?: string; indexPath?: string; attachmentPath?: string; vaultPath?: string; error?: string }
      if (!response.ok || !data.ok || !data.notePath) {
        setSyncErrors((current) => ({ ...current, [session.id]: data.error || t.syncError }))
        return false
      }
      onUpdateSession(session.id, {
        obsidian: {
          syncedAt: new Date().toISOString(),
          notePath: data.notePath,
          indexPath: data.indexPath,
          attachmentPath: data.attachmentPath,
          vaultPath: data.vaultPath || obsidianSettings.vaultPath,
        },
      })
      return true
    } catch (error) {
      setSyncErrors((current) => ({ ...current, [session.id]: error instanceof Error ? error.message : t.syncError }))
      return false
    } finally {
      setSyncingId('')
    }
  }

  const syncAllSessions = async () => {
    const pending = sessions
    if (!pending.length) return
    if (!obsidianSettings.vaultPath) {
      setObsidianModalOpen(true)
      return
    }
    setBulkSyncing(true)
    for (const session of pending) {
      await syncSessionToObsidian(session)
    }
    setBulkSyncing(false)
  }

  const analyzeSession = async (session: SessionRecord) => {
    setAnalyzingId(session.id)
    setAnalysisErrors((current) => ({ ...current, [session.id]: '' }))
    const modeLabel = t[session.mode]
    let transcript = session.transcript?.trim() || ''
    if (!transcript && session.recording) {
      try {
        const completed = await analyzeWithWorkBuddy(session)
        if (completed) {
          setAnalyzingId('')
          setAnalysisStage((current) => ({ ...current, [session.id]: '' }))
          return
        }
      } catch {
        // Fall through to local Whisper + Codex.
      }

      setAnalysisStage((current) => ({ ...current, [session.id]: t.transcribing }))
      try {
        transcript = await transcribeSession(session)
      } catch (error) {
        setAnalysisErrors((current) => ({
          ...current,
          [session.id]: `${t.transcribingError}${error instanceof Error ? ` ${error.message}` : ''}`,
        }))
        setAnalyzingId('')
        setAnalysisStage((current) => ({ ...current, [session.id]: '' }))
        return
      }
    }
    setAnalysisStage((current) => ({ ...current, [session.id]: t.analyzing }))
    const transcriptSection = transcript
      ? `转写文本：\n${transcript}`
      : '转写文本不可用。不要编造内容，也不要给出虚假的内容分数。所有评分字段必须返回 null，只提供基于时长和训练完成度的谨慎建议，并明确说明需要转写才能评分。'
    const prompt = `你是一名严格但具体的表达教练。请分析下面这次口述训练。

题目：${session.title}
练习模式：${modeLabel}
表达时长：${session.seconds} 秒
${transcriptSection}

请只返回 JSON，不要返回 Markdown 或解释。JSON 格式：
{
  "score": 0到100的整数；没有转写时为 null,
  "dimensions": {
    "content": 0到100；没有转写时为 null,
    "structure": 0到100；没有转写时为 null,
    "conciseness": 0到100；没有转写时为 null,
    "evidence": 0到100；没有转写时为 null,
    "delivery": 0到100；没有转写时为 null
  },
  "strengths": ["2到4条具体优点"],
  "improvements": ["3到5条可执行建议"],
  "summary": "两到三句话总结",
  "nextStep": "下一次练习最重要的一个动作"
}

评分标准：
- 内容 30%：主题相关性、信息量、观点完整度。
- 结构 20%：开场、层次、推进和收束。
- 简洁度 15%：重复、口头填充和冗余。
- 论证 20%：例子、数据、因果和可信度。
- 表达 15%：语速、停顿、流畅度和语气。
建议必须具体、可执行，不要只说“多练习”。`

    try {
      const response = await fetch('/api/agent/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'codex', prompt }),
      })
      const data = await response.json() as { ok?: boolean; text?: string; error?: string }
      if (!response.ok || !data.ok || !data.text) {
        setAnalysisErrors((current) => ({ ...current, [session.id]: data.error || t.analysisError }))
        return
      }
      const analysis = parseAnalysis(data.text, 'codex')
      if (!analysis) {
        setAnalysisErrors((current) => ({ ...current, [session.id]: t.analysisError }))
        return
      }
      onUpdateSession(session.id, { analysis })
      setExpandedId(session.id)
    } catch {
      setAnalysisErrors((current) => ({ ...current, [session.id]: t.analysisError }))
    } finally {
      setAnalyzingId('')
      setAnalysisStage((current) => ({ ...current, [session.id]: '' }))
    }
  }

  return (
    <section className="progress-page">
      <header className="page-heading progress-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="progress-heading-actions">
          <button className="button button-ghost" onClick={() => setObsidianModalOpen(true)}>
            <Settings2 size={17} />
            {t.obsidianSettings}
          </button>
          {sessions.length > 0 && (
            <button className="button button-ghost" onClick={() => void syncAllSessions()} disabled={bulkSyncing}>
              <UploadCloud size={17} />
              {bulkSyncing ? t.syncingObsidian : t.syncAll}
            </button>
          )}
          {sessions.length > 0 && (
            <button className="button button-ghost" onClick={onClear}>
              <RotateCcw size={17} />
              {t.clear}
            </button>
          )}
        </div>
      </header>

      <div className="stats-grid">
        <article><BarChart3 size={20} /><span>{t.sessions}</span><strong>{sessions.length}</strong></article>
        <article><Clock3 size={20} /><span>{t.minutes}</span><strong>{Math.round(totalSeconds / 60)}</strong></article>
        <article><Flame size={20} /><span>{t.streak}</span><strong>{uniqueDays.size}<small>{t.days}</small></strong></article>
        <article><Sparkles size={20} /><span>{t.averageScore}</span><strong>{averageScore ?? '—'}</strong></article>
      </div>

      <div className="progress-insights">
        <article className="week-card">
          <div className="section-title-row">
            <div><CalendarDays size={19} /><h2>{t.week}</h2></div>
            <span>{sessions.length} {t.sessions}</span>
          </div>
          <div className="week-chart">
            {lastSevenDays.map((day) => (
              <div className="week-column" key={day.date.toISOString()}>
                <div className="week-bar-track"><div className="week-bar" style={{ height: `${Math.max(6, (day.count / maxCount) * 100)}%` }} /></div>
                <b>{day.date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' })}</b>
                <span>{day.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="analysis-rules-card">
          <div className="section-title-row">
            <div><SlidersHorizontal size={19} /><h2>{t.analysisRules}</h2></div>
          </div>
          <p className="rules-intro">{t.rulesIntro}</p>
          <ul className="rules-list">
            <li><b>30%</b><span>{t.contentRule}</span></li>
            <li><b>20%</b><span>{t.structureRule}</span></li>
            <li><b>15%</b><span>{t.concisenessRule}</span></li>
            <li><b>20%</b><span>{t.evidenceRule}</span></li>
            <li><b>15%</b><span>{t.deliveryRule}</span></li>
          </ul>
          <p className="rules-weight">{t.weightRule}</p>
        </article>
      </div>

      <article className="history-card">
        <div className="section-title-row">
          <h2>{t.recent}</h2>
          <span>{filteredSessions.length} / {sessions.length}</span>
        </div>

        <div className="history-toolbar">
          <label className="history-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
          </label>
          <div className="history-filters">
            {(['all', 'recorded', 'analyzed', 'unanalyzed'] as const).map((filter) => (
              <button
                className={historyFilter === filter ? 'is-active' : ''}
                onClick={() => setHistoryFilter(filter)}
                key={filter}
              >
                {t[filter]}
              </button>
            ))}
          </div>
          <label className="history-sort">
            <select value={historySort} onChange={(event) => setHistorySort(event.target.value as typeof historySort)}>
              <option value="newest">{t.sortNewest}</option>
              <option value="score">{t.sortScore}</option>
              <option value="duration">{t.sortDuration}</option>
            </select>
          </label>
        </div>

        {visibleSessions.length ? (
          <>
            <div className="session-list history-list">
              {visibleSessions.map((session) => (
                <div className="session-record-item" key={session.id}>
                  <div className="session-row">
                    <span className={`mode-dot mode-${session.mode}`} />
                    <div className="session-main">
                      <b>{session.title}</b>
                      <small>{session.categoryName} · {t[session.mode]} · {Math.round(session.seconds / 60 * 10) / 10}m · {new Date(session.completedAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
                      <div className="session-flags">
                        {session.recording && <span title={session.recording.deviceLabel}><Mic size={12} />{t.hasRecording}{session.recording.deviceLabel ? ` · ${session.recording.deviceLabel}` : ''}</span>}
                        {session.transcript && <span><FileText size={12} />{t.hasTranscript}</span>}
                        {typeof session.analysis?.score === 'number' && <span className="score-flag"><Sparkles size={12} />{session.analysis.score}</span>}
                        {session.process && <span className="process-flag"><Clock3 size={12} />{t.processOnly}</span>}
                        {session.obsidian && <span className="obsidian-flag" title={session.obsidian.notePath}><Check size={12} />{t.syncedObsidian}</span>}
                      </div>
                      <div className="session-actions">
                        <button onClick={() => void playSession(session.id)} disabled={!session.recording}>
                          <Play size={14} />{playingId === session.id ? t.pause : t.play}
                        </button>
                        <button onClick={() => void downloadSession(session)} disabled={!session.recording}>
                          <Download size={14} />{t.download}
                        </button>
                        <button onClick={() => void analyzeSession(session)} disabled={analyzingId === session.id}>
                          {analyzingId === session.id ? <Loader2 className="is-spinning" size={14} /> : <Sparkles size={14} />}
                          {analyzingId === session.id ? (analysisStage[session.id] || t.analyzing) : t.analyze}
                        </button>
                        <button onClick={() => void syncSessionToObsidian(session)} disabled={syncingId === session.id}>
                          {syncingId === session.id ? <Loader2 className="is-spinning" size={14} /> : session.obsidian ? <Check size={14} /> : <UploadCloud size={14} />}
                          {syncingId === session.id ? t.syncingObsidian : session.obsidian ? t.syncUpdate : t.syncObsidian}
                        </button>
                        {(session.analysis || session.process) && (
                          <button onClick={() => setExpandedId((current) => current === session.id ? '' : session.id)}>
                            <ChevronDown size={14} />{session.analysis ? t.analysis : t.processOnly}
                          </button>
                        )}
                      </div>
                      {recordingErrors[session.id] && <p className="session-message error">{recordingErrors[session.id]}</p>}
                      {analysisErrors[session.id] && <p className="session-message error">{analysisErrors[session.id]}</p>}
                      {syncErrors[session.id] && <p className="session-message error">{syncErrors[session.id]}</p>}
                      {playingId === session.id && audioUrls[session.id] && (
                        <audio className="session-audio" src={audioUrls[session.id]} controls autoPlay onEnded={() => setPlayingId('')} />
                      )}
                    </div>
                  </div>

                  {expandedId === session.id && (session.analysis || session.process) && (
                    <div className={`analysis-panel ${session.analysis ? '' : 'process-only'}`}>
                      {session.analysis && (
                        <div className="analysis-score">
                          <span>{t.score}</span>
                          <strong>{session.analysis.score ?? '—'}</strong>
                        </div>
                      )}
                      <div className="analysis-content">
                        {session.process && (
                          <div className="process-panel">
                            <div className="process-heading">
                              <div><Clock3 size={15} /><h3>{t.trainingProcess}</h3></div>
                              <span>{session.process.finishReason === 'timer' ? t.finishTimer : t.finishManual}</span>
                            </div>
                            <div className="process-facts">
                              <div><span>{t.actualPrep}</span><b>{formatProcessDuration(session.process.actualPrepSeconds)}</b></div>
                              <div><span>{t.actualSpeech}</span><b>{formatProcessDuration(session.process.actualSpeechSeconds)}</b></div>
                              <div><span>{t.pauseCount}</span><b>{session.process.pauseCount}</b></div>
                              <div><span>{t.pausedSeconds}</span><b>{formatProcessDuration(session.process.pausedSeconds)}</b></div>
                              <div><span>{t.recordingUsed}</span><b title={session.process.recordingDevice}>{session.process.recordingUsed ? (session.process.recordingDevice || t.hasRecording) : t.recordingNotUsed}</b></div>
                            </div>
                            {session.process.events.length ? (
                              <ol className="process-timeline">
                                {session.process.events.map((event, index) => (
                                  <li key={`${event.kind}-${event.at}-${index}`}>
                                    <time>+{formatProcessDuration(event.elapsedSeconds)}</time>
                                    <span>{processEventLabel(event, lang, t)}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : <p className="process-empty">{t.processUnavailable}</p>}
                          </div>
                        )}
                        {session.analysis && (
                          <>
                            <p className="analysis-summary">{session.analysis.summary}</p>
                            {session.transcript && (
                              <details className="transcript-details">
                                <summary>{t.hasTranscript}</summary>
                                <p>{session.transcript}</p>
                              </details>
                            )}
                            <div className="dimension-grid">
                              {Object.entries(session.analysis.dimensions).map(([key, value]) => (
                                <div key={key}><span>{t[key as keyof typeof t]}</span><b>{value ?? '—'}</b><i style={{ width: `${value ?? 0}%` }} /></div>
                              ))}
                            </div>
                            <div className="analysis-columns">
                              <div><h3>{t.strengths}</h3><ul>{(session.analysis.strengths.length ? session.analysis.strengths : [t.noAnalysis]).map((item) => <li key={item}>{item}</li>)}</ul></div>
                              <div><h3>{t.improvements}</h3><ul>{(session.analysis.improvements.length ? session.analysis.improvements : [t.noAnalysis]).map((item) => <li key={item}>{item}</li>)}</ul></div>
                            </div>
                            {session.analysis.nextStep && <p className="next-step"><Sparkles size={14} />{session.analysis.nextStep}</p>}
                            <p className="analysis-basis"><b>{t.analysisBasis}:</b> {t.weightRule}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {visibleCount < filteredSessions.length && (
              <button className="button button-ghost history-more" onClick={() => setVisibleCount((current) => current + 20)}>
                {t.showMore}
              </button>
            )}
          </>
        ) : (
          <div className="empty-state compact"><BarChart3 size={24} /><p>{query || historyFilter !== 'all' ? t.noMatches : t.empty}</p></div>
        )}
      </article>

      {obsidianModalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setObsidianModalOpen(false)}>
          <div className="custom-modal obsidian-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <header>
              <div>
                <p className="eyebrow">{t.obsidian}</p>
                <h2>{t.obsidianSettings}</h2>
              </div>
              <button className="icon-button" onClick={() => setObsidianModalOpen(false)} aria-label={t.close}><X size={19} /></button>
            </header>
            <p className="obsidian-intro">{t.obsidianIntro}</p>
            <label className="field">
              <span>{t.vault}</span>
              <select
                value={obsidianSettings.vaultPath}
                onChange={(event) => setObsidianSettings((current) => ({ ...current, vaultPath: event.target.value }))}
              >
                <option value="">{t.vaultPlaceholder}</option>
                {obsidianVaults.map((vault) => <option key={vault.id} value={vault.path}>{vault.path}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t.noteFolder}</span>
              <input
                value={obsidianSettings.folder}
                onChange={(event) => setObsidianSettings((current) => ({ ...current, folder: event.target.value }))}
                placeholder="言之有物/训练记录"
              />
            </label>
            <label className="settings-row obsidian-audio-toggle">
              <span>{t.includeAudio}</span>
              <input
                type="checkbox"
                checked={obsidianSettings.includeAudio}
                onChange={(event) => setObsidianSettings((current) => ({ ...current, includeAudio: event.target.checked }))}
              />
            </label>
            <footer>
              <button className="button button-ghost" onClick={() => setObsidianModalOpen(false)}>{t.close}</button>
              <button className="button button-dark" onClick={() => setObsidianModalOpen(false)}>{t.saveSettings}</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  )
}
