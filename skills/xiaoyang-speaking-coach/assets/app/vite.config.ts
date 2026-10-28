import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const CODEX_CANDIDATES = [
  process.env.CODEX_CLI_PATH,
  '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex',
  'codex',
].filter(Boolean) as string[]

const PDFTOTEXT_CANDIDATES = [
  process.env.PDFTOTEXT_PATH,
  join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext'),
  'pdftotext',
].filter(Boolean) as string[]

const WORKBUDDY_CANDIDATES = [
  process.env.WORKBUDDY_CLI_PATH,
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs',
].filter(Boolean) as string[]

const resolveExecutable = (candidates: string[]) => {
  for (const candidate of candidates) {
    if (isAbsolute(candidate)) {
      if (existsSync(candidate)) return candidate
      continue
    }
    const result = spawnSync('which', [candidate], { encoding: 'utf8' })
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim()
  }
  return null
}

const codexPath = resolveExecutable(CODEX_CANDIDATES)
const workBuddyMain = resolveExecutable(WORKBUDDY_CANDIDATES)
const pdfToTextPath = resolveExecutable(PDFTOTEXT_CANDIDATES)

interface AgentRunResult {
  code: number | null
  stdout: string
  stderr: string
  timedOut: boolean
}

const runAgent = (
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = 180_000,
): Promise<AgentRunResult> => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  let timedOut = false
  const append = (current: string, chunk: Buffer) => {
    const next = current + chunk.toString('utf8')
    return next.length > 6_000_000 ? next.slice(-6_000_000) : next
  }
  child.stdout.on('data', (chunk: Buffer) => { stdout = append(stdout, chunk) })
  child.stderr.on('data', (chunk: Buffer) => { stderr = append(stderr, chunk) })
  child.on('error', (error) => {
    stderr += `\n${error.message}`
    resolve({ code: null, stdout, stderr, timedOut })
  })
  const timer = setTimeout(() => {
    timedOut = true
    child.kill('SIGTERM')
  }, timeoutMs)
  child.on('close', (code) => {
    clearTimeout(timer)
    resolve({ code, stdout, stderr, timedOut })
  })
})

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

const readBody = (request: IncomingMessage, limit = 32 * 1024 * 1024): Promise<string> => new Promise((resolve, reject) => {
  let body = ''
  request.on('data', (chunk: Buffer) => {
    body += chunk.toString('utf8')
    if (body.length > limit) {
      reject(new Error('Request body is too large'))
      request.destroy()
    }
  })
  request.on('end', () => resolve(body))
  request.on('error', reject)
})

const readBinaryBody = (request: IncomingMessage, limit = 150 * 1024 * 1024): Promise<Buffer> => new Promise((resolve, reject) => {
  const chunks: Buffer[] = []
  let total = 0
  let tooLarge = false
  request.on('data', (chunk: Buffer) => {
    total += chunk.byteLength
    if (total > limit) {
      tooLarge = true
      chunks.length = 0
      return
    }
    if (!tooLarge) chunks.push(chunk)
  })
  request.on('end', () => {
    if (tooLarge) reject(new Error('PDF exceeds the 150MB local limit'))
    else resolve(Buffer.concat(chunks))
  })
  request.on('error', reject)
})

interface PendingUpload {
  token: string
  name: string
  dir: string
  path: string
  createdAt: number
}

const pendingUploads = new Map<string, PendingUpload>()

const cleanupUploads = async () => {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const upload of Array.from(pendingUploads.values())) {
    if (upload.createdAt >= cutoff) continue
    pendingUploads.delete(upload.token)
    await rm(upload.dir, { recursive: true, force: true })
  }
}

const samplePdfText = (text: string, limit = 80_000) => {
  const clean = text.replace(/\n{3,}/g, '\n\n').trim()
  if (clean.length <= limit) return clean

  const headSize = Math.floor(limit * 0.38)
  const tailSize = Math.floor(limit * 0.12)
  const middleSize = limit - headSize - tailSize
  const segmentCount = 12
  const segmentSize = Math.floor(middleSize / segmentCount)
  const parts = [clean.slice(0, headSize)]
  for (let index = 1; index <= segmentCount; index += 1) {
    const start = Math.floor((clean.length - segmentSize) * (index / (segmentCount + 1)))
    parts.push(`\n\n[Sample ${index}/${segmentCount}]\n${clean.slice(start, start + segmentSize)}`)
  }
  parts.push(`\n\n[End of PDF sample]\n${clean.slice(-tailSize)}`)
  return parts.join('')
}

interface WorkBuddyGateway {
  port: string
  password: string
  pid: string
}

let cachedGateway: { value: WorkBuddyGateway | null; expiresAt: number } = { value: null, expiresAt: 0 }

const discoverWorkBuddyGateway = (): WorkBuddyGateway | null => {
  if (cachedGateway.value && Date.now() < cachedGateway.expiresAt) return cachedGateway.value
  const configuredUrl = process.env.WORKBUDDY_GATEWAY_URL
  const configuredPassword = process.env.WORKBUDDY_GATEWAY_PASSWORD
  if (configuredUrl && configuredPassword) {
    try {
      const port = new URL(configuredUrl).port
      const value = { port, password: configuredPassword, pid: 'env' }
      cachedGateway = { value, expiresAt: Date.now() + 60_000 }
      return value
    } catch {
      return null
    }
  }

  const processList = spawnSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).stdout || ''
  const candidates = processList.split(/\r?\n/).filter((line) => line.includes('codebuddy --serve') || line.includes('codebuddy-lite-wb.mjs --serve'))
  for (const line of candidates) {
    const pid = line.trim().split(/\s+/)[0]
    if (!pid) continue
    const environment = spawnSync('ps', ['eww', '-p', pid], { encoding: 'utf8' }).stdout || ''
    const password = environment.match(/CODEBUDDY_GATEWAY_PASSWORD=([^\s]+)/)?.[1]
    if (!password) continue
    const listeners = spawnSync('lsof', ['-nP', '-a', '-p', pid, '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' }).stdout || ''
    const port = listeners.match(/127\.0\.0\.1:(\d+)/)?.[1]
    if (!port) continue
    const value = { port, password, pid }
    cachedGateway = { value, expiresAt: Date.now() + 60_000 }
    return value
  }
  cachedGateway = { value: null, expiresAt: Date.now() + 15_000 }
  return null
}

const getWorkBuddyRecordingDir = () => process.env.SAYFIELD_WORKBUDDY_WORKSPACE
  || join(homedir(), 'WorkBuddy', '女娲蒸馏工作区', '.sayfield-recordings')

const runWorkBuddyGatewayAnalysis = async (audioPath: string, prompt: string): Promise<string> => {
  const gateway = discoverWorkBuddyGateway()
  if (!gateway) throw new Error('WORKBUDDY_GATEWAY_UNAVAILABLE')
  const runId = randomUUID()
  const headers = {
    Authorization: `Bearer ${gateway.password}`,
    'Content-Type': 'application/json',
  }
  const body = {
    id: `sayfield-${runId}`,
    type: 'message',
    payload: { text: prompt },
    timeoutMs: 420_000,
  }
  const submit = await fetch(`http://127.0.0.1:${gateway.port}/api/v1/runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  const submitted = await submit.json() as { data?: { runId?: string }; error?: { message?: string } }
  const actualRunId = submitted.data?.runId
  if (!submit.ok || !actualRunId) throw new Error(submitted.error?.message || 'WorkBuddy gateway rejected the run')

  const streamResponse = await fetch(`http://127.0.0.1:${gateway.port}/api/v1/runs/${actualRunId}/stream`, {
    headers: { Authorization: `Bearer ${gateway.password}` },
    signal: AbortSignal.timeout(420_000),
  })
  if (!streamResponse.ok || !streamResponse.body) throw new Error('WorkBuddy gateway stream unavailable')

  const reader = streamResponse.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName = ''
  let finalText = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventName = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const payloadText = line.slice(6)
        if (eventName === 'message') {
          try {
            const event = JSON.parse(payloadText) as { content?: { markdown?: string } }
            if (event.content?.markdown) finalText = event.content.markdown
          } catch {
            // Ignore non-JSON stream events.
          }
        } else if (eventName === 'done') {
          reader.cancel().catch(() => undefined)
          if (!finalText) throw new Error('WorkBuddy returned an empty result')
          return finalText
        }
      }
    }
  }
  if (!finalText) throw new Error('WorkBuddy returned no result')
  return finalText
}

const handleAnalyzeRecording = async (request: IncomingMessage, response: ServerResponse) => {
  let audioDir: string | null = null
  let audioPath: string | null = null
  try {
    const gateway = discoverWorkBuddyGateway()
    if (!gateway) {
      return json(response, 503, { ok: false, code: 'WORKBUDDY_GATEWAY_UNAVAILABLE', error: 'WorkBuddy local gateway is unavailable' })
    }
    const audio = await readBinaryBody(request, 150 * 1024 * 1024)
    if (!audio.byteLength) return json(response, 400, { ok: false, error: 'Empty audio file' })
    audioDir = join(getWorkBuddyRecordingDir(), randomUUID())
    await mkdir(audioDir, { recursive: true })
    audioPath = join(audioDir, 'recording.wav')
    await writeFile(audioPath, audio)

    const prompt = `请对下面这个本地音频文件调用 AudioTranscribe 工具完成转写，然后分析我的表达。

音频文件路径：${audioPath}

请只返回 JSON，不要返回 Markdown 代码块或额外解释。JSON 格式：
{
  "transcript": "完整转写文本",
  "score": 0到100的整数,
  "dimensions": {
    "content": 0到100,
    "structure": 0到100,
    "conciseness": 0到100,
    "evidence": 0到100,
    "delivery": 0到100
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

分析必须基于 AudioTranscribe 返回的真实转写，不要编造音频里没有的内容。`
    const text = await runWorkBuddyGatewayAnalysis(audioPath, prompt)
    return json(response, 200, { ok: true, provider: 'workbuddy', model: 'deepseek-v4.1-flash', text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WorkBuddy analysis failed'
    const unavailable = message === 'WORKBUDDY_GATEWAY_UNAVAILABLE'
    return json(response, unavailable ? 503 : 502, {
      ok: false,
      code: unavailable ? 'WORKBUDDY_GATEWAY_UNAVAILABLE' : 'WORKBUDDY_ANALYSIS_FAILED',
      error: message,
    })
  } finally {
    if (audioDir) await rm(audioDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

const extractCodexText = (stdout: string) => {
  const messages: string[] = []
  stdout.split(/\r?\n/).forEach((line) => {
    try {
      const event = JSON.parse(line)
      if (event?.type === 'item.completed' && event?.item?.type === 'agent_message' && typeof event.item.text === 'string') {
        messages.push(event.item.text)
      }
    } catch {
      // Ignore non-JSON log lines.
    }
  })
  return messages[messages.length - 1] ?? stdout.trim()
}

const extractWorkBuddyText = (stdout: string) => {
  const trimmed = stdout.trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed)
    const visit = (value: unknown): string[] => {
      if (typeof value === 'string') return [value]
      if (Array.isArray(value)) return value.flatMap(visit)
      if (value && typeof value === 'object') return Object.values(value).flatMap(visit)
      return []
    }
    const candidates = visit(parsed).filter((value) => value.includes('|') || value.length > 40)
    return candidates.sort((a, b) => b.length - a.length)[0] ?? trimmed
  } catch {
    return trimmed
  }
}

const getProviders = () => [
  {
    id: 'codex',
    label: 'Codex',
    available: Boolean(codexPath),
    note: codexPath ? '已安装，可直接自动拆解' : '未找到 Codex CLI',
  },
  {
    id: 'workbuddy',
    label: 'WorkBuddy',
    available: Boolean(workBuddyMain),
    note: workBuddyMain ? '已安装；首次使用可能需要在终端完成登录' : '未找到 WorkBuddy CLI',
  },
]

const getObsidianVaults = () => {
  const configPaths = [
    join(homedir(), 'Library', 'Application Support', 'obsidian', 'obsidian.json'),
    process.env.APPDATA ? join(process.env.APPDATA, 'obsidian', 'obsidian.json') : '',
    join(homedir(), '.config', 'obsidian', 'obsidian.json'),
  ].filter(Boolean)
  const seen = new Set<string>()
  const vaults: Array<{ id: string; path: string; open?: boolean }> = []

  for (const configPath of configPaths) {
    if (!existsSync(configPath)) continue
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8')) as { vaults?: Record<string, { path?: string; open?: boolean }> }
      for (const [id, vault] of Object.entries(config.vaults ?? {})) {
        if (!vault.path) continue
        const vaultPath = resolve(vault.path)
        if (seen.has(vaultPath) || !existsSync(join(vaultPath, '.obsidian'))) continue
        seen.add(vaultPath)
        vaults.push({ id, path: vaultPath, open: Boolean(vault.open) })
      }
    } catch {
      // Ignore a malformed or inaccessible Obsidian config and try the next platform path.
    }
  }
  return vaults
}

const handleObsidianVaults = async (_request: IncomingMessage, response: ServerResponse) => {
  return json(response, 200, { ok: true, vaults: getObsidianVaults() })
}

const sanitizePathPart = (value: string) => value
  .replace(/[\\/:*?"<>|#^\[\]]+/g, '-')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80)

const yamlValue = (value: string) => JSON.stringify(value.replace(/\r?\n/g, ' '))

const formatObsidianDuration = (value: unknown, language: 'zh' | 'en') => {
  const seconds = Math.max(0, Number(value) || 0)
  if (language === 'en') {
    if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`
    const minutes = Math.floor(seconds / 60)
    const rest = Math.round(seconds % 60)
    return `${minutes}m ${String(rest).padStart(2, '0')}s`
  }
  if (seconds < 60) return `${Math.round(seconds * 10) / 10} 秒`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes} 分 ${String(rest).padStart(2, '0')} 秒`
}

const buildObsidianNote = (session: Record<string, any>, attachmentPath?: string) => {
  const language: 'zh' | 'en' = session.language === 'en' ? 'en' : 'zh'
  const analysis = session.analysis ?? null
  const process = session.process ?? null
  const dimensions = analysis?.dimensions ?? {}
  const strengths = Array.isArray(analysis?.strengths) ? analysis.strengths : []
  const improvements = Array.isArray(analysis?.improvements) ? analysis.improvements : []
  const title = String(session.title || (language === 'en' ? 'Speaking practice' : '表达训练'))
  const completedAt = String(session.completedAt || new Date().toISOString())
  const date = new Date(completedAt)
  const modeLabels: Record<string, { zh: string; en: string }> = {
    quick: { zh: '即兴表达', en: 'Impromptu' },
    research: { zh: '研究陈述', en: 'Research brief' },
    structure: { zh: '结构化回答', en: 'Structured answer' },
  }
  const dimensionLabels: Record<string, { zh: string; en: string }> = {
    content: { zh: '内容', en: 'Content' },
    structure: { zh: '结构', en: 'Structure' },
    conciseness: { zh: '简洁度', en: 'Conciseness' },
    evidence: { zh: '论证', en: 'Evidence' },
    delivery: { zh: '表达', en: 'Delivery' },
  }
  const weights: Record<string, string> = { content: '30%', structure: '20%', conciseness: '15%', evidence: '20%', delivery: '15%' }
  const mode = modeLabels[String(session.mode)]?.[language] || String(session.mode || '')
  const score = typeof analysis?.score === 'number' ? analysis.score : '—'
  const texts = language === 'zh' ? {
    trainingInfo: '训练信息', date: '日期', category: '分类', mode: '模式', duration: '实际表达', device: '录音设备', score: '综合评分',
    prompt: '题目', process: '训练过程', processMissing: '本轮未保存过程数据。', finishedBy: '结束方式', plannedPrep: '计划准备', actualPrep: '准备用时',
    plannedSpeech: '计划表达', pauseCount: '暂停次数', pausedTime: '暂停时长', recording: '录音', recordingOn: '已启用', recordingOff: '未启用',
    manual: '手动结束', timer: '计时结束', timeline: '过程时间线', relativeTime: '相对时间', event: '事件',
    stage: '阶段', recordingStarted: '开始录音', transcript: '转写', analysis: '最终结果', analysisMissing: '尚未生成 Agent 分析。',
    dimensions: '维度评分', dimension: '维度', scoreLabel: '分数', weight: '权重', strengths: '做得好的地方', improvements: '优化建议', nextStep: '下一步练习',
    reflection: '我的复盘', reflectionHint: '在这里写下训练后的主观感受、需要重练的地方和下一次的目标。', index: '训练总览', tags: '标签',
    eventLabels: { session_started: '开始训练', prep_started: '开始查阅与梳理', prep_completed: '准备完成', speech_started: '开始表达', paused: '暂停', resumed: '继续', recording_started: '开始录音', speech_finished: '表达结束' },
  } : {
    trainingInfo: 'Session info', date: 'Date', category: 'Category', mode: 'Mode', duration: 'Speaking time', device: 'Recording device', score: 'Overall score',
    prompt: 'Prompt', process: 'Training process', processMissing: 'No process data was saved for this round.', finishedBy: 'Finished by', plannedPrep: 'Planned prep',
    actualPrep: 'Actual prep', plannedSpeech: 'Planned speaking', pauseCount: 'Pauses', pausedTime: 'Paused time', recording: 'Recording', recordingOn: 'Used', recordingOff: 'Not used',
    manual: 'Ended manually', timer: 'Timer ended', timeline: 'Process timeline', relativeTime: 'Relative time', event: 'Event', stage: 'Stage',
    recordingStarted: 'Recording started', transcript: 'Transcript', analysis: 'Final result', analysisMissing: 'No Agent analysis yet.',
    dimensions: 'Dimension scores', dimension: 'Dimension', scoreLabel: 'Score', weight: 'Weight', strengths: 'What worked', improvements: 'Improvements', nextStep: 'Next practice step',
    reflection: 'My reflection', reflectionHint: 'Write down how this round felt, what to retry, and the goal for next time.', index: 'Training index', tags: 'Tags',
    eventLabels: { session_started: 'Session started', prep_started: 'Preparation started', prep_completed: 'Preparation complete', speech_started: 'Speaking started', paused: 'Paused', resumed: 'Resumed', recording_started: 'Recording started', speech_finished: 'Speaking ended' },
  }
  const processEventLabel = (event: Record<string, any>) => {
    if (event.kind === 'stage_reached') {
      const stageNames = session.mode === 'structure'
        ? (language === 'zh' ? ['结论', '三点论据', '例子', '收束'] : ['Claim', 'Three points', 'Example', 'Close'])
        : session.mode === 'research'
          ? (language === 'zh' ? ['立场', '证据', '收口'] : ['Position', 'Evidence', 'Close'])
          : (language === 'zh' ? ['开场', '展开', '收束'] : ['Open', 'Develop', 'Close'])
      const stageIndex = Math.max(1, Number(event.stageIndex) || 1)
      return `${texts.stage} ${stageIndex}/${Number(event.stageCount) || stageNames.length}: ${stageNames[stageIndex - 1] || ''}`
    }
    return texts.eventLabels[String(event.kind) as keyof typeof texts.eventLabels] || String(event.kind || '')
  }
  const frontmatter = [
    '---',
    `title: ${yamlValue(title)}`,
    `date: ${date.toISOString()}`,
    `session_id: ${yamlValue(String(session.id || ''))}`,
    `category: ${yamlValue(String(session.categoryName || ''))}`,
    `mode: ${yamlValue(mode)}`,
    `duration_seconds: ${Number(session.seconds || 0)}`,
    `score: ${score}`,
    `language: ${language}`,
    `source: speech-practice-coach`,
    'tags:',
    '  - 言之有物',
    '  - 表达训练',
    '  - speaking-practice',
    '---',
  ].join('\n')

  const dimensionTable = Object.keys(dimensionLabels)
    .map((key) => `| ${dimensionLabels[key][language]} | ${dimensions[key] ?? '—'} | ${weights[key]} |`)
    .join('\n')
  const transcript = String(session.transcript || '').trim()
  const recording = attachmentPath ? `![[${attachmentPath}]]` : (session.recording ? (language === 'zh' ? '已录音，但本次同步未包含附件。' : 'Recorded; attachment was not included in this sync.') : (language === 'zh' ? '未录音。' : 'No recording.'))
  const device = session.recording?.deviceLabel || process?.recordingDevice
  const processFacts = process ? [
    `- ${texts.finishedBy}: ${process.finishReason === 'timer' ? texts.timer : texts.manual}`,
    session.mode !== 'quick' ? `- ${texts.plannedPrep}: ${formatObsidianDuration(process.plannedPrepSeconds, language)}` : '',
    `- ${texts.actualPrep}: ${formatObsidianDuration(process.actualPrepSeconds, language)}`,
    `- ${texts.plannedSpeech}: ${formatObsidianDuration(process.plannedSpeechSeconds, language)}`,
    `- ${texts.pauseCount}: ${Number(process.pauseCount) || 0}`,
    `- ${texts.pausedTime}: ${formatObsidianDuration(process.pausedSeconds, language)}`,
    `- ${texts.recording}: ${process.recordingUsed ? `${texts.recordingOn}${process.recordingDevice ? ` · ${process.recordingDevice}` : ''}` : texts.recordingOff}`,
  ].filter(Boolean).join('\n') : texts.processMissing
  const processEvents = Array.isArray(process?.events) ? process.events : []
  const processTimeline = processEvents.length
    ? [
        `| ${texts.relativeTime} | ${texts.event} |`,
        '|---|---|',
        ...processEvents.map((event: Record<string, any>) => `| +${formatObsidianDuration(event.elapsedSeconds, language)} | ${String(processEventLabel(event)).replace(/\|/g, '\\|')} |`),
      ].join('\n')
    : (language === 'zh' ? '暂无过程事件。' : 'No process events yet.')

  return `${frontmatter}

# ${title}

> [[${language === 'zh' ? '言之有物 · 训练总览' : 'Speaking Practice · Training index'}|${texts.index}]]

## ${texts.trainingInfo}

- ${texts.date}: ${date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { hour12: false })}
- ${texts.category}: ${session.categoryName || (language === 'zh' ? '未分类' : 'Uncategorized')}
- ${texts.mode}: ${mode}
- ${texts.duration}: ${formatObsidianDuration(session.seconds, language)}${device ? `\n- ${texts.device}: ${device}` : ''}
- ${texts.score}: ${score}

## ${texts.prompt}

${title}

## ${texts.process}

${processFacts}

### ${texts.timeline}

${processTimeline}

## ${texts.recording}

${recording}

## ${texts.transcript}

${transcript || (language === 'zh' ? '暂无转写文本。' : 'No transcript yet.')}

## ${texts.analysis}

${analysis?.summary || texts.analysisMissing}

### ${texts.dimensions}

| ${texts.dimension} | ${texts.scoreLabel} | ${texts.weight} |
|---|---:|---:|
${dimensionTable || '| — | — | — |'}

### ${texts.strengths}

${strengths.length ? strengths.map((item: string) => `- ${item}`).join('\n') : (language === 'zh' ? '- 暂无记录' : '- None yet')}

### ${texts.improvements}

${improvements.length ? improvements.map((item: string) => `- ${item}`).join('\n') : (language === 'zh' ? '- 暂无记录' : '- None yet')}

### ${texts.nextStep}

${analysis?.nextStep || (language === 'zh' ? '暂无建议' : 'No recommendation yet.')}

## ${texts.reflection}

> ${texts.reflectionHint}
`
}

const OBSIDIAN_INDEX_START = '<!-- SAYFIELD:TRAINING:INDEX:START -->'
const OBSIDIAN_INDEX_END = '<!-- SAYFIELD:TRAINING:INDEX:END -->'

const upsertObsidianIndex = async (
  indexPath: string,
  session: Record<string, any>,
  noteName: string,
) => {
  const language: 'zh' | 'en' = session.language === 'en' ? 'en' : 'zh'
  const date = new Date(String(session.completedAt || Date.now()))
  const modeLabels: Record<string, { zh: string; en: string }> = {
    quick: { zh: '即兴表达', en: 'Impromptu' },
    research: { zh: '研究陈述', en: 'Research brief' },
    structure: { zh: '结构化回答', en: 'Structured answer' },
  }
  const mode = modeLabels[String(session.mode)]?.[language] || String(session.mode || '')
  const score = typeof session.analysis?.score === 'number' ? session.analysis.score : '—'
  const safeTitle = String(session.title || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
  const noteTitle = noteName.replace(/\.md$/i, '')
  const entry = `- ${date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')} [[${noteTitle}|${safeTitle}]] · ${mode} · ${Math.round(Number(session.seconds || 0) * 10) / 10}s · ${score} <!-- sayfield-session:${String(session.id || '')} date:${date.toISOString()} -->`
  let existing = ''
  try { existing = await readFile(indexPath, 'utf8') } catch { /* Create a new index below. */ }
  const header = language === 'zh'
    ? '# 言之有物 · 训练总览\n\n按时间倒序整理每次训练。打开单篇笔记可以查看完整过程、转写、录音和 Agent 反馈。\n\n'
    : '# Speaking Practice · Training index\n\nSessions are sorted newest first. Open a note for the full process, transcript, recording, and Agent feedback.\n\n'
  const startIndex = existing.indexOf(OBSIDIAN_INDEX_START)
  const endIndex = existing.indexOf(OBSIDIAN_INDEX_END)
  const hasBlock = startIndex >= 0 && endIndex > startIndex
  const prefix = hasBlock
    ? existing.slice(0, startIndex)
    : `${existing || header}${existing ? '\n\n' : ''}`
  const suffix = hasBlock ? existing.slice(endIndex + OBSIDIAN_INDEX_END.length) : ''
  const blockContent = hasBlock
    ? existing.slice(startIndex + OBSIDIAN_INDEX_START.length, endIndex)
    : ''
  const lines = blockContent.split('\n').map((line) => line.trimEnd()).filter(Boolean)
  const marker = `sayfield-session:${String(session.id || '')}`
  const nextLines = lines.filter((line) => line && !line.includes(marker))
  nextLines.push(entry)
  nextLines.sort((a, b) => {
    const dateA = a.match(/date:([^\s]+)/)?.[1] || ''
    const dateB = b.match(/date:([^\s]+)/)?.[1] || ''
    return dateB.localeCompare(dateA)
  })
  const next = `${prefix}${OBSIDIAN_INDEX_START}\n${nextLines.join('\n')}\n${OBSIDIAN_INDEX_END}${suffix}\n`
  await writeFile(indexPath, next, 'utf8')
}

const handleObsidianSync = async (request: IncomingMessage, response: ServerResponse) => {
  try {
    const body = JSON.parse(await readBody(request, 96 * 1024 * 1024)) as {
      vaultPath?: string
      folder?: string
      includeAudio?: boolean
      session?: Record<string, any>
      audio?: { dataBase64?: string; mimeType?: string } | null
    }
    const vaultPath = body.vaultPath ? resolve(body.vaultPath) : ''
    if (!vaultPath || !existsSync(join(vaultPath, '.obsidian'))) {
      return json(response, 400, { ok: false, error: 'Invalid Obsidian vault path' })
    }
    if (!body.session?.id) return json(response, 400, { ok: false, error: 'Session data is required' })

    const folder = String(body.folder || '言之有物/训练记录')
      .split('/')
      .map((part) => sanitizePathPart(part))
      .filter((part) => part && part !== '.' && part !== '..')
      .join('/') || '言之有物/训练记录'
    const session = body.session
    const noteDir = join(vaultPath, folder)
    const attachmentDir = join(noteDir, 'attachments')
    await mkdir(noteDir, { recursive: true })
    if (body.includeAudio && body.audio?.dataBase64) await mkdir(attachmentDir, { recursive: true })

    const date = new Date(String(session.completedAt || Date.now()))
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
    const safeTitle = sanitizePathPart(String(session.title || '表达训练')) || '表达训练'
    const noteName = `${stamp}-${safeTitle}-${String(session.id).slice(-8)}.md`
    const notePath = join(noteDir, noteName)

    let attachmentRelative = ''
    if (body.includeAudio && body.audio?.dataBase64) {
      const buffer = Buffer.from(body.audio.dataBase64, 'base64')
      if (buffer.byteLength > 80 * 1024 * 1024) return json(response, 413, { ok: false, error: 'Recording exceeds 80MB' })
      const extension = body.audio.mimeType?.includes('wav') ? 'wav'
        : body.audio.mimeType?.includes('mp4') ? 'm4a'
          : body.audio.mimeType?.includes('ogg') ? 'ogg'
            : 'webm'
      const attachmentName = `${stamp}-${safeTitle}.${extension}`
      const attachmentPath = join(attachmentDir, attachmentName)
      await writeFile(attachmentPath, buffer)
      attachmentRelative = [folder, 'attachments', attachmentName].join('/')
    }

    const note = buildObsidianNote(session, attachmentRelative)
    await writeFile(notePath, note, 'utf8')
    const indexName = '言之有物 · 训练总览.md'
    const indexPath = join(noteDir, indexName)
    await upsertObsidianIndex(indexPath, session, noteName)
    return json(response, 200, {
      ok: true,
      notePath: [folder, noteName].join('/'),
      indexPath: [folder, indexName].join('/'),
      attachmentPath: attachmentRelative || undefined,
      vaultPath,
    })
  } catch (error) {
    return json(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Obsidian sync failed',
    })
  }
}

const handleProviders = async (_request: IncomingMessage, response: ServerResponse) => {
  json(response, 200, { ok: true, providers: getProviders() })
}

const handleUpload = async (request: IncomingMessage, response: ServerResponse) => {
  try {
    await cleanupUploads()
    const encodedName = String(request.headers['x-filename'] || 'document.pdf')
    const name = decodeURIComponent(encodedName)
    if (!/\.pdf$/i.test(name)) {
      return json(response, 415, { ok: false, error: 'Only PDF files are supported' })
    }
    const fileBuffer = await readBinaryBody(request)
    if (!fileBuffer.byteLength) return json(response, 400, { ok: false, error: 'Empty PDF file' })
    const dir = await mkdtemp(join(tmpdir(), 'sayfield-agent-'))
    const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const filePath = join(dir, safeName)
    await writeFile(filePath, fileBuffer)
    const token = randomUUID()
    pendingUploads.set(token, { token, name, dir, path: filePath, createdAt: Date.now() })
    return json(response, 200, { ok: true, token, name, size: fileBuffer.byteLength })
  } catch (error) {
    return json(response, 413, {
      ok: false,
      error: error instanceof Error ? error.message : 'PDF upload failed',
    })
  }
}

const handleTranscribe = async (request: IncomingMessage, response: ServerResponse, cwd: string) => {
  let tempDir: string | null = null
  try {
    const language = String(request.headers['x-language'] || '').toLowerCase()
    const contentType = String(request.headers['content-type'] || 'application/octet-stream')
    const extension = contentType.includes('wav') ? 'wav'
      : contentType.includes('mp4') || contentType.includes('m4a') ? 'm4a'
        : contentType.includes('ogg') ? 'ogg'
          : 'webm'
    const audio = await readBinaryBody(request)
    if (!audio.byteLength) return json(response, 400, { ok: false, error: 'Empty audio file' })
    tempDir = await mkdtemp(join(tmpdir(), 'sayfield-transcribe-'))
    const audioPath = join(tempDir, `recording.${extension}`)
    await writeFile(audioPath, audio)
    const scriptPath = join(cwd, 'scripts', 'transcribe.py')
    const result = await runAgent('python3', [scriptPath, audioPath, language === 'zh' ? 'zh' : language === 'en' ? 'en' : ''], cwd, 600_000)
    if (result.timedOut) return json(response, 504, { ok: false, code: 'TIMEOUT', error: 'Local transcription timed out' })
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean)
    const payload = lines.length ? JSON.parse(lines[lines.length - 1]) : null
    if (result.code !== 0 || !payload || payload.error || typeof payload.text !== 'string') {
      return json(response, 502, {
        ok: false,
        code: 'TRANSCRIPTION_FAILED',
        error: payload?.error || result.stderr.slice(-2000) || 'Local transcription failed',
      })
    }
    if (!payload.text.trim()) {
      return json(response, 422, {
        ok: false,
        code: 'NO_SPEECH',
        error: 'No speech was detected in the recording',
      })
    }
    return json(response, 200, { ok: true, ...payload })
  } catch (error) {
    return json(response, 500, {
      ok: false,
      code: 'TRANSCRIPTION_FAILED',
      error: error instanceof Error ? error.message : 'Local transcription failed',
    })
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true })
  }
}

const handleExtract = async (request: IncomingMessage, response: ServerResponse, cwd: string) => {
  let tempDir: string | null = null
  let uploadToken: string | null = null
  let pdfText = ''
  try {
    const body = JSON.parse(await readBody(request)) as {
      provider?: 'codex' | 'workbuddy'
      prompt?: string
      fileToken?: string
      file?: { name?: string; dataBase64?: string } | null
    }
    const provider = body.provider === 'workbuddy' ? 'workbuddy' : 'codex'
    let prompt = body.prompt?.trim() ?? ''
    if (!prompt) return json(response, 400, { ok: false, error: 'Prompt is required' })

    if (body.fileToken) {
      const upload = pendingUploads.get(body.fileToken)
      if (!upload) return json(response, 410, { ok: false, error: 'PDF upload expired. Please select the PDF again.' })
      uploadToken = upload.token
      tempDir = upload.dir

      if (pdfToTextPath) {
        const textPath = join(upload.dir, 'pdf-text.txt')
        const textResult = await runAgent(pdfToTextPath, ['-layout', '-enc', 'UTF-8', upload.path, textPath], cwd, 120_000)
        if (textResult.code === 0 && existsSync(textPath)) {
          const fullText = await readFile(textPath, 'utf8')
          pdfText = samplePdfText(fullText)
        }
      }

      prompt += `\n\nThe original PDF is available locally at: ${upload.path}`
      if (pdfText) {
        prompt += `\n\nThe following is a cross-page text sample extracted from the PDF. Use it as the primary source and read the original PDF only if more detail is necessary:\n\n${pdfText}`
      } else {
        prompt += '\nRead that PDF directly and use its full contents.'
      }
    } else if (body.file?.dataBase64) {
      const fileBuffer = Buffer.from(body.file.dataBase64, 'base64')
      if (fileBuffer.byteLength > 20 * 1024 * 1024) {
        return json(response, 413, { ok: false, error: 'PDF exceeds the 20MB legacy local limit' })
      }
      tempDir = await mkdtemp(join(tmpdir(), 'sayfield-agent-'))
      const safeName = (body.file.name || 'document.pdf').replace(/[^a-zA-Z0-9._-]+/g, '-')
      const filePath = join(tempDir, safeName)
      await writeFile(filePath, fileBuffer)
      prompt += `\n\nThe file is available locally at: ${filePath}\nRead that PDF directly and use its full contents.`
    }

    let result: AgentRunResult
    if (provider === 'workbuddy') {
      if (!workBuddyMain) return json(response, 503, { ok: false, code: 'NOT_INSTALLED', error: 'WorkBuddy CLI was not found' })
      const args = [
        workBuddyMain,
        '-p',
        '--output-format', 'json',
        '--permission-mode', 'dontAsk',
        '--tools', tempDir ? 'Read' : '',
      ]
      if (tempDir) args.push('--add-dir', tempDir)
      args.push(prompt)
      result = await runAgent(process.execPath, args, cwd, body.fileToken ? 600_000 : 240_000)
    } else {
      if (!codexPath) return json(response, 503, { ok: false, code: 'NOT_INSTALLED', error: 'Codex CLI was not found' })
      const args = [
        codexPath,
        'exec',
        '--json',
        '--skip-git-repo-check',
        '--ephemeral',
        '-s', 'read-only',
        '-C', cwd,
      ]
      if (tempDir) args.push('--add-dir', tempDir)
      args.push(prompt)
      result = await runAgent(codexPath, args, cwd, body.fileToken ? 600_000 : 240_000)
    }

    if (result.timedOut) {
      return json(response, 504, { ok: false, code: 'TIMEOUT', error: 'Agent request timed out' })
    }

    const combined = `${result.stderr}\n${result.stdout}`.trim()
    const authRequired = provider === 'workbuddy' && /authentication required|login command|not logged in/i.test(combined)
    if (authRequired) {
      return json(response, 401, {
        ok: false,
        code: 'AUTH_REQUIRED',
        error: 'WorkBuddy CLI needs a one-time login. Run the CLI login command in Terminal, then retry.',
      })
    }
    if (result.code !== 0) {
      return json(response, 502, {
        ok: false,
        code: 'AGENT_FAILED',
        error: combined.slice(-3000) || 'Agent process failed',
      })
    }

    const text = provider === 'workbuddy'
      ? extractWorkBuddyText(result.stdout)
      : extractCodexText(result.stdout)
    if (!text.trim()) {
      return json(response, 502, { ok: false, code: 'EMPTY_OUTPUT', error: result.stderr.slice(-2000) || 'Agent returned no text' })
    }

    return json(response, 200, {
      ok: true,
      provider,
      text,
      stderr: result.stderr ? result.stderr.slice(-1500) : undefined,
    })
  } catch (error) {
    return json(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown agent bridge error',
    })
  } finally {
    if (uploadToken) pendingUploads.delete(uploadToken)
    if (tempDir) await rm(tempDir, { recursive: true, force: true })
  }
}

const agentBridge = (): Plugin => {
  const install = (middlewares: { use: (handler: (request: IncomingMessage, response: ServerResponse, next: () => void) => void) => void }, cwd: string) => {
    middlewares.use((request, response, next) => {
      if (request.method === 'GET' && request.url === '/api/obsidian/vaults') {
        void handleObsidianVaults(request, response)
        return
      }
      if (request.method === 'POST' && request.url === '/api/obsidian/sync') {
        void handleObsidianSync(request, response)
        return
      }
      if (!request.url?.startsWith('/api/agent/')) return next()
      const address = request.socket.remoteAddress
      const isLoopback = address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
      if (!isLoopback) {
        json(response, 403, { ok: false, error: 'Local Agent bridge only accepts loopback requests' })
        return
      }
      if (request.method === 'GET' && request.url === '/api/agent/providers') {
        void handleProviders(request, response)
        return
      }
      if (request.method === 'POST' && request.url === '/api/agent/analyze-recording') {
        void handleAnalyzeRecording(request, response)
        return
      }
      if (request.method === 'POST' && request.url === '/api/agent/transcribe') {
        void handleTranscribe(request, response, cwd)
        return
      }
      if (request.method === 'POST' && request.url === '/api/agent/upload') {
        void handleUpload(request, response)
        return
      }
      if (request.method === 'POST' && request.url === '/api/agent/extract') {
        void handleExtract(request, response, cwd)
        return
      }
      json(response, 404, { ok: false, error: 'Not found' })
    })
  }

  return {
    name: 'sayfield-agent-bridge',
    configureServer(server) {
      install(server.middlewares, process.cwd())
    },
    configurePreviewServer(server) {
      install(server.middlewares, process.cwd())
    },
  }
}

export default defineConfig({
  plugins: [react(), agentBridge()],
})
