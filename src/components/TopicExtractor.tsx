import { useEffect, useMemo, useState } from 'react'
import { Bot, Check, ClipboardPaste, Copy, FileText, Lightbulb, ListChecks, Loader2, Plus, Sparkles, UploadCloud, X } from 'lucide-react'
import GroupPicker from './GroupPicker'
import {
  buildAgentPrompt,
  extractionDomains,
  parseAgentOutput,
  type ExtractedTopic,
  type ExtractionDomain,
} from '../lib/topicExtraction'
import type { CustomGroup, Lang } from '../data/topics'

interface TopicExtractorProps {
  lang: Lang
  customGroups: CustomGroup[]
  onSave: (topics: ExtractedTopic[], groupName: string) => void
}

type AgentProvider = 'codex' | 'workbuddy'

interface ProviderInfo {
  id: AgentProvider
  label: string
  available: boolean
  note: string
}

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Persistence is best-effort.
    }
  }, [key, value])

  return [value, setValue] as const
}

const copy = {
  zh: {
    eyebrow: '智能拆题',
    title: '把拆解任务交给你的 Agent。',
    subtitle: '无论是大主题还是 PDF，都由你自己的 Agent 负责理解和拆解。这里只负责生成任务、复制提示词，并接收 Agent 返回的结果。',
    themeTab: '大主题交给 Agent',
    pdfTab: 'PDF 交给 Agent',
    themeLabel: '大主题',
    themePlaceholder: '例如：人工智能对未来工作的影响',
    pdfContextLabel: 'PDF 补充说明（可选）',
    pdfContextPlaceholder: '例如：这是我的一篇论文，请重点拆成答辩可能追问的问题',
    providerLabel: '自动调用的 Agent',
    providerHint: '网页通过本地 Agent 路由调用，不会把截图或待拆内容发送给第三方网页。',
    providerSetupTitle: 'Agent 功能还没有启用',
    providerSetupIntro: '网页主体可以正常使用；自动拆题和录音评分需要本机找到一个已登录的 Codex CLI 或 WorkBuddy CLI。仅打开 Codex / WorkBuddy 桌面端不等于已经配置好。',
    providerSetupCore: '当前可用：题库、计时、录音回放、成长记录和 Obsidian 同步。',
    providerSetupCodex: '方案 A：安装 Codex CLI 并完成 codex login，然后重新启动本地服务。',
    providerSetupWorkbuddy: '方案 B：安装并登录 WorkBuddy；如果 CLI 不在默认位置，设置 WORKBUDDY_CLI_PATH。',
    providerSetupPath: '已经装好但这里仍显示不可用时，设置 CODEX_CLI_PATH 或 WORKBUDDY_CLI_PATH 为 CLI 的绝对路径，再重新启动。',
    providerRetry: '重新检测',
    providerChecking: '正在检测本机 Agent…',
    domainLabel: '拆解领域',
    customCount: '自定义',
    customCountPlaceholder: '输入数量',
    customCountHint: '可输入 1–50 个',
    applyCount: '应用',
    customDomainLabel: '自定义领域',
    customDomainPlaceholder: '例如：考研复试、产品经理、纪录片策划',
    addDomain: '添加',
    removeDomain: '删除',
    fileReselect: '页面刷新后需要重新选择 PDF 文件，再点击自动拆解。',
    networkError: '本地 Agent 服务连接中断，或 PDF 上传失败。请直接重试一次。',
    uploadFailed: 'PDF 上传失败：',
    countLabel: '希望拆解数量',
    runAgent: '自动调用 Agent 拆解',
    agentRunning: 'Agent 正在拆解…',
    agentError: '自动调用失败。请确认 Codex CLI 或 WorkBuddy 已安装并登录，然后重启本地服务；也可以直接使用下方的手动提示词流程。',
    authRequired: 'WorkBuddy CLI 还未登录。请先在终端完成一次登录，然后重试。',
    choosePdf: '选择 PDF',
    selectedFile: '已选择',
    noFile: '尚未选择文件',
    privacy: '文件不会上传或解析，只用于提示词里的文件名和上下文。',
    agentPrompt: 'Agent 拆解提示词',
    copyPrompt: '复制提示词',
    copied: '已复制',
    agentSteps: ['复制提示词', '回到你的 Agent', '把 PDF 或大主题发送给 Agent', '把 Agent 输出的 Markdown 表格粘回这里'],
    returnTitle: '接收 Agent 输出',
    returnSubtitle: '让 Agent 按指定 Markdown 表格输出，然后粘贴到下面。',
    outputPlaceholder: '在这里粘贴 Agent 返回的 Markdown 表格……',
    parse: '解析并预览',
    parsed: '解析结果',
    parseEmpty: '没有识别到可用主题。请确认 Agent 返回了 Markdown 表格。',
    saveTo: '归入主题模块',
    groupPlaceholder: '例如：我的新增主题',
    groupHint: '默认保存到“我的新增主题”，也可以输入一个新模块名称。',
    save: '保存这些主题',
    themeRequired: '请先输入一个大主题。',
    pdfRequired: '请先选择 PDF 文件。',
  },
  en: {
    eyebrow: 'Topic extractor',
    title: 'Hand topic extraction to your own Agent.',
    subtitle: 'Whether it is a broad topic or a PDF, your Agent does the understanding and extraction. This page builds the task, copies the prompt, and receives the Agent output.',
    themeTab: 'Broad topic',
    pdfTab: 'PDF handoff',
    themeLabel: 'Broad topic',
    themePlaceholder: 'e.g. How AI will change the future of work',
    pdfContextLabel: 'PDF context (optional)',
    pdfContextPlaceholder: 'e.g. This is my thesis; focus on likely defense questions',
    providerLabel: 'Agent provider',
    providerHint: 'The page calls your local Agent bridge. Your source content is not sent to third-party web services.',
    providerSetupTitle: 'Agent features are not enabled yet',
    providerSetupIntro: 'The core web app works without an Agent. Automatic extraction and recording analysis require a signed-in Codex CLI or WorkBuddy CLI found by this local server.',
    providerSetupCore: 'Available now: topic library, timer, recording playback, progress history, and Obsidian sync.',
    providerSetupCodex: 'Option A: install and sign in to Codex CLI, then restart the local server.',
    providerSetupWorkbuddy: 'Option B: install and sign in to WorkBuddy; set WORKBUDDY_CLI_PATH if it is in a custom location.',
    providerSetupPath: 'If the CLI is installed but still not detected, set CODEX_CLI_PATH or WORKBUDDY_CLI_PATH to its absolute path and restart.',
    providerRetry: 'Check again',
    providerChecking: 'Checking local Agent…',
    domainLabel: 'Domain',
    customCount: 'Custom',
    customCountPlaceholder: 'Enter count',
    customCountHint: '1–50',
    applyCount: 'Apply',
    customDomainLabel: 'Custom domain',
    customDomainPlaceholder: 'e.g. graduate defense, product management, documentary planning',
    addDomain: 'Add',
    removeDomain: 'Remove',
    fileReselect: 'Reselect the PDF after a page refresh, then run Agent extraction again.',
    networkError: 'The local Agent bridge disconnected, or the PDF upload failed. Retry once.',
    uploadFailed: 'PDF upload failed: ',
    countLabel: 'Number of subtopics',
    runAgent: 'Run Agent extraction',
    agentRunning: 'Agent is extracting…',
    agentError: 'Automatic extraction failed. Confirm that Codex CLI or WorkBuddy is installed and signed in, then restart the local server. The manual prompt flow below still works.',
    authRequired: 'WorkBuddy CLI is not logged in yet. Complete its one-time login in Terminal, then retry.',
    choosePdf: 'Choose PDF',
    selectedFile: 'Selected',
    noFile: 'No file selected',
    privacy: 'The file is not uploaded or parsed. It is only used as context for the Agent prompt.',
    agentPrompt: 'Agent extraction prompt',
    copyPrompt: 'Copy prompt',
    copied: 'Copied',
    agentSteps: ['Copy the prompt', 'Return to your Agent', 'Send the PDF or broad topic to the Agent', 'Paste the Agent’s Markdown table back here'],
    returnTitle: 'Receive Agent output',
    returnSubtitle: 'Ask the Agent to use the requested Markdown table, then paste it below.',
    outputPlaceholder: 'Paste the Markdown table returned by your Agent…',
    parse: 'Parse preview',
    parsed: 'Parsed topics',
    parseEmpty: 'No usable topics found. Check that the Agent returned a Markdown table.',
    saveTo: 'Topic group',
    groupPlaceholder: 'e.g. My topics',
    groupHint: 'Defaults to “My topics”. Type a new name to create another group.',
    save: 'Save these topics',
    themeRequired: 'Enter a broad topic first.',
    pdfRequired: 'Choose a PDF file first.',
  },
} as const

export default function TopicExtractor({ lang, customGroups, onSave }: TopicExtractorProps) {
  const t = copy[lang]
  const [tab, setTab] = useLocalState<'theme' | 'pdf'>('sayfield-extractor-tab', 'theme')
  const [theme, setTheme] = useLocalState('sayfield-extractor-theme', '')
  const [domain, setDomain] = useLocalState<string>('sayfield-extractor-domain', 'general')
  const [customDomains, setCustomDomains] = useLocalState<string[]>('sayfield-extractor-custom-domains', [])
  const [customDomainDraft, setCustomDomainDraft] = useState('')
  const [customCountDraft, setCustomCountDraft] = useLocalState('sayfield-extractor-custom-count-draft', '')
  const [customCountActive, setCustomCountActive] = useLocalState('sayfield-extractor-custom-count-active', false)
  const [count, setCount] = useLocalState('sayfield-extractor-count', 10)
  const [fileName, setFileName] = useLocalState('sayfield-extractor-file-name', '')
  const [agentOutput, setAgentOutput] = useLocalState('sayfield-extractor-output', '')
  const [parsed, setParsed] = useLocalState<ExtractedTopic[]>('sayfield-extractor-parsed', [])
  const defaultGroupName = customGroups.find((group) => group.id === 'my-topics')?.name[lang] ?? customGroups[0]?.name[lang] ?? (lang === 'zh' ? '我的新增主题' : 'My topics')
  const [groupName, setGroupName] = useLocalState('sayfield-extractor-group', defaultGroupName)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [parseMessage, setParseMessage] = useState('')
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [provider, setProvider] = useLocalState<AgentProvider>('sayfield-extractor-provider', 'codex')
  const [fileBlob, setFileBlob] = useState<File | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoError, setAutoError] = useState('')
  const [providerLoading, setProviderLoading] = useState(true)

  const loadProviders = async () => {
    setProviderLoading(true)
    try {
      const response = await fetch('/api/agent/providers')
      const data = await response.json() as { providers?: ProviderInfo[] }
      const nextProviders = data.providers ?? []
      setProviders(nextProviders)
      const preferred = nextProviders.find((item) => item.id === 'codex' && item.available)
        ?? nextProviders.find((item) => item.available)
      if (preferred) setProvider(preferred.id)
    } catch {
      setProviders([])
    } finally {
      setProviderLoading(false)
    }
  }

  useEffect(() => {
    void loadProviders()
  }, [])

  const applyCustomCount = () => {
    const parsedCount = Number.parseInt(customCountDraft, 10)
    if (!Number.isFinite(parsedCount)) return
    const nextCount = Math.min(50, Math.max(1, parsedCount))
    setCount(nextCount)
    setCustomCountDraft(String(nextCount))
    setCustomCountActive(true)
  }

  const addCustomDomain = () => {
    const next = customDomainDraft.trim()
    if (!next) return
    setCustomDomains((current) => current.includes(next) ? current : [...current, next])
    setDomain(next)
    setCustomDomainDraft('')
  }

  const removeCustomDomain = (value: string) => {
    setCustomDomains((current) => current.filter((item) => item !== value))
    if (domain === value) setDomain('general')
  }

  const selectedProvider = providers.find((item) => item.id === provider)
  const providerReady = providers.some((item) => item.available)
  const agentPrompt = useMemo(() => buildAgentPrompt({
    mode: tab,
    theme,
    fileName,
    domain,
    count,
    lang,
  }), [count, domain, fileName, lang, tab, theme])

  const validate = () => {
    if (tab === 'theme' && !theme.trim()) {
      setError(t.themeRequired)
      return false
    }
    if (tab === 'pdf' && !fileName) {
      setError(t.pdfRequired)
      return false
    }
    setError('')
    return true
  }

  const copyPrompt = async () => {
    if (!validate()) return
    try {
      await navigator.clipboard.writeText(agentPrompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const parseOutput = (output = agentOutput) => {
    const topics = parseAgentOutput(output).slice(0, count)
    setParsed(topics)
    setParseMessage(topics.length ? '' : t.parseEmpty)
  }

  const runAgent = async () => {
    if (!validate()) return
    if (tab === 'pdf' && !fileBlob) {
      setAutoError(t.fileReselect)
      return
    }
    const activeProvider = selectedProvider?.available ? provider : providers.find((item) => item.available)?.id
    if (!activeProvider) {
      setAutoError(t.agentError)
      return
    }

    setAutoRunning(true)
    setAutoError('')
    try {
      let fileToken = ''
      if (tab === 'pdf' && fileBlob) {
        const uploadResponse = await fetch('/api/agent/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/pdf',
            'X-Filename': encodeURIComponent(fileBlob.name),
          },
          body: fileBlob,
        })
        const uploadData = await uploadResponse.json() as { ok?: boolean; token?: string; error?: string }
        if (!uploadResponse.ok || !uploadData.ok || !uploadData.token) {
          setAutoError(`${t.uploadFailed}${uploadData.error || t.networkError}`)
          return
        }
        fileToken = uploadData.token
      }

      const response = await fetch('/api/agent/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          prompt: agentPrompt,
          fileToken: fileToken || undefined,
        }),
      })
      const data = await response.json() as { ok?: boolean; text?: string; code?: string; error?: string }
      if (!response.ok || !data.ok || !data.text) {
        setAutoError(data.code === 'AUTH_REQUIRED' ? t.authRequired : `${t.agentError}${data.error ? ` ${data.error}` : ''}`)
        return
      }
      setAgentOutput(data.text)
      parseOutput(data.text)
    } catch (error) {
      setAutoError(`${t.networkError}${error instanceof Error ? ` ${error.message}` : ''}`)
    } finally {
      setAutoRunning(false)
    }
  }

  return (
    <section className="extractor-page">
      <header className="page-heading extractor-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <div className="extractor-tabs" role="tablist">
        <button className={tab === 'theme' ? 'is-active' : ''} onClick={() => setTab('theme')} role="tab" aria-selected={tab === 'theme'}>
          <Lightbulb size={17} />
          {t.themeTab}
        </button>
        <button className={tab === 'pdf' ? 'is-active' : ''} onClick={() => setTab('pdf')} role="tab" aria-selected={tab === 'pdf'}>
          <FileText size={17} />
          {t.pdfTab}
        </button>
      </div>

      <div className="extractor-layout">
        <aside className="extractor-controls">
          {tab === 'theme' ? (
            <label className="extractor-field">
              <span>{t.themeLabel}</span>
              <textarea
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                placeholder={t.themePlaceholder}
                rows={4}
              />
            </label>
          ) : (
            <>
              <div className="extractor-field">
                <span>{t.choosePdf}</span>
                <label className="pdf-file-input compact">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setFileName(file?.name ?? '')
                      setFileBlob(file)
                      setError('')
                    }}
                  />
                  <UploadCloud size={18} />
                  <span>{t.choosePdf}</span>
                  <b>{fileName ? `${t.selectedFile}: ${fileName}` : t.noFile}</b>
                </label>
                <p className="privacy-note">{t.privacy}</p>
              </div>
              <label className="extractor-field">
                <span>{t.pdfContextLabel}</span>
                <textarea
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                  placeholder={t.pdfContextPlaceholder}
                  rows={3}
                />
              </label>
            </>
          )}

          <div className="extractor-field provider-field">
            <span>{t.providerLabel}</span>
            <div className="provider-switch">
              {providers.length ? providers.map((item) => (
                <button
                  className={provider === item.id ? 'is-active' : ''}
                  onClick={() => setProvider(item.id)}
                  disabled={!item.available}
                  key={item.id}
                >
                  <Bot size={15} />
                  <span>
                    <b>{item.label}</b>
                    <small>{item.note}</small>
                  </span>
                </button>
              )) : (
                <div className="provider-empty">{t.providerHint}</div>
              )}
            </div>
            {providerLoading ? (
              <p className="provider-hint">{t.providerChecking}</p>
            ) : providerReady ? (
              <p className="provider-hint">{t.providerHint}</p>
            ) : (
              <div className="agent-setup-guide">
                <b>{t.providerSetupTitle}</b>
                <p>{t.providerSetupIntro}</p>
                <p className="agent-setup-core">{t.providerSetupCore}</p>
                <ol>
                  <li>{t.providerSetupCodex}</li>
                  <li>{t.providerSetupWorkbuddy}</li>
                </ol>
                <p>{t.providerSetupPath}</p>
                <button className="button button-ghost" onClick={() => void loadProviders()}>
                  {t.providerRetry}
                </button>
              </div>
            )}
          </div>

          <div className="extractor-field">
            <span>{t.domainLabel}</span>
            <div className="domain-grid">
              {extractionDomains.map((item) => (
                <button
                  className={domain === item.id ? 'is-active' : ''}
                  onClick={() => setDomain(item.id)}
                  key={item.id}
                >
                  <b>{item.label[lang]}</b>
                  <small>{item.description[lang]}</small>
                </button>
              ))}
            </div>
            <div className="custom-domain-builder">
              <input
                value={customDomainDraft}
                onChange={(event) => setCustomDomainDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addCustomDomain()
                  }
                }}
                placeholder={t.customDomainPlaceholder}
              />
              <button className="button button-ghost" onClick={addCustomDomain}>
                <Plus size={15} />
                {t.addDomain}
              </button>
            </div>
            {customDomains.length > 0 && (
              <div className="custom-domain-list">
                {customDomains.map((item) => (
                  <div className={`custom-domain-chip ${domain === item ? 'is-active' : ''}`} key={item}>
                    <button onClick={() => setDomain(item)}>{item}</button>
                    <button onClick={() => removeCustomDomain(item)} aria-label={`${t.removeDomain} ${item}`}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="extractor-field">
            <span>{t.countLabel}</span>
            <div className="count-switch">
              {[6, 10, 12].map((value) => (
                <button
                  className={!customCountActive && count === value ? 'is-active' : ''}
                  onClick={() => {
                    setCount(value)
                    setCustomCountActive(false)
                  }}
                  key={value}
                >
                  {value}
                </button>
              ))}
              <button
                className={customCountActive ? 'is-active' : ''}
                onClick={() => setCustomCountActive(true)}
              >
                {t.customCount}
              </button>
            </div>
            {customCountActive && (
              <div className="custom-count-row">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={customCountDraft}
                  onChange={(event) => setCustomCountDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyCustomCount()
                    }
                  }}
                  placeholder={t.customCountPlaceholder}
                />
                <button className="button button-ghost" onClick={applyCustomCount}>{t.applyCount}</button>
                <small>{t.customCountHint}</small>
              </div>
            )}
          </div>

          <button className="button button-accent large run-agent-button" onClick={runAgent} disabled={autoRunning || !providers.some((item) => item.available)}>
            {autoRunning ? <Loader2 className="is-spinning" size={18} /> : <Sparkles size={18} />}
            {autoRunning ? t.agentRunning : t.runAgent}
          </button>

          <ol className="agent-steps">
            {t.agentSteps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
          </ol>
          {error && <p className="form-error">{error}</p>}
          {autoError && <p className="form-error">{autoError}</p>}
        </aside>

        <div className="extractor-results">
          <div className="extractor-results-head">
            <div>
              <p className="eyebrow">Agent task</p>
              <h2>{t.agentPrompt}</h2>
            </div>
            <button className="button button-dark" onClick={copyPrompt}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? t.copied : t.copyPrompt}
            </button>
          </div>

          <pre className="agent-prompt-preview">{agentPrompt}</pre>

          <section className="agent-return-section">
            <div className="agent-return-head">
              <div>
                <p className="eyebrow">Agent output</p>
                <h2>{t.returnTitle}</h2>
                <p>{t.returnSubtitle}</p>
              </div>
              <button className="button button-ghost" onClick={() => parseOutput()}>
                <ClipboardPaste size={17} />
                {t.parse}
              </button>
            </div>
            <textarea
              className="agent-output-input"
              value={agentOutput}
              onChange={(event) => setAgentOutput(event.target.value)}
              placeholder={t.outputPlaceholder}
              rows={8}
            />
            {parseMessage && <p className="form-error">{parseMessage}</p>}

            {parsed.length > 0 && (
              <>
                <div className="agent-parsed-head">
                  <span><ListChecks size={17} />{t.parsed}</span>
                  <b>{parsed.length}</b>
                </div>
                <div className="extracted-list compact-list">
                  {parsed.map((item, index) => (
                    <article className="extracted-card" key={`${item.title.en}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{item.title[lang]}</h3>
                        <p>{item.hint[lang]}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="extractor-save">
                  <div className="field group-save-field">
                    <span>{t.saveTo}</span>
                    <GroupPicker
                      lang={lang}
                      groups={customGroups}
                      value={groupName}
                      onChange={setGroupName}
                      label={t.saveTo}
                      placeholder={t.groupPlaceholder}
                      createLabel={lang === 'zh' ? '新建分组' : 'New group'}
                    />
                    <small className="field-hint">{t.groupHint}</small>
                  </div>
                  <button className="button button-accent large" onClick={() => onSave(parsed, groupName)} disabled={!groupName.trim()}>
                    <Sparkles size={17} />
                    {t.save}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
