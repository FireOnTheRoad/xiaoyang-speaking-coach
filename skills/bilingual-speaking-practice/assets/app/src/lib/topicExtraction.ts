import type { Lang, LocalizedText } from '../data/topics'

export type ExtractionDomain = 'general' | 'academic' | 'business' | 'public' | 'work' | 'tech'

export interface ExtractionDomainOption {
  id: ExtractionDomain
  label: LocalizedText
  description: LocalizedText
}

export interface ExtractedTopic {
  title: LocalizedText
  hint: LocalizedText
}

export interface AgentPromptOptions {
  mode: 'theme' | 'pdf'
  theme: string
  fileName: string
  domain: string
  count: number
  lang: Lang
}

export const extractionDomains: ExtractionDomainOption[] = [
  {
    id: 'general',
    label: { zh: '通用表达', en: 'General' },
    description: { zh: '适合日常、观点和社会话题。', en: 'For everyday, opinion, and social topics.' },
  },
  {
    id: 'academic',
    label: { zh: '学术研究', en: 'Academic' },
    description: { zh: '适合论文、课程和专业表达。', en: 'For papers, courses, and academic speaking.' },
  },
  {
    id: 'business',
    label: { zh: '商业分析', en: 'Business' },
    description: { zh: '适合创业、产品和市场分析。', en: 'For startups, products, and market analysis.' },
  },
  {
    id: 'public',
    label: { zh: '公共政策', en: 'Public policy' },
    description: { zh: '适合考公、治理和政策讨论。', en: 'For civil service, governance, and policy.' },
  },
  {
    id: 'work',
    label: { zh: '工作汇报', en: 'Work report' },
    description: { zh: '适合项目、复盘和向上汇报。', en: 'For projects, reviews, and upward reporting.' },
  },
  {
    id: 'tech',
    label: { zh: '科技与 AI', en: 'Tech & AI' },
    description: { zh: '适合解释技术机制、风险和产品选择。', en: 'For mechanisms, risks, and product choices.' },
  },
]

const getDomainLabel = (domain: string, lang: Lang) =>
  extractionDomains.find((item) => item.id === domain)?.label[lang] ?? domain

export const buildAgentPrompt = ({
  mode,
  theme,
  fileName,
  domain,
  count,
  lang,
}: AgentPromptOptions) => {
  const cleanTheme = theme.trim()
  const domainLabel = getDomainLabel(domain, lang)

  if (lang === 'zh') {
    const source = mode === 'pdf'
      ? `我随后会提供一份 PDF${fileName ? `（文件名：${fileName}）` : ''}。请先阅读并理解文件内容。`
      : `请围绕这个大主题展开：${cleanTheme || '（待补充）'}。`
    const context = mode === 'pdf' && cleanTheme ? `\n补充背景：${cleanTheme}` : ''

    return `你是我的表达训练题库编辑。${source}${context}

拆解领域：${domainLabel}
请至少输出 ${count} 个可以用于口述训练的小主题。

拆解要求：
1. 不要只给关键词，每个主题都必须是完整、可回答的问题。
2. 每个主题包含：中文题目、English prompt、一句表达抓手。
3. 标注适合“即兴表达 / 研究陈述 / 结构化回答”中的哪一种。
4. 优先覆盖核心概念、背景原因、关键证据、现实案例、主要争议、反方观点、影响、解决方案和未来趋势。
5. 去掉重复主题、过宽泛标题和无法独立回答的问题。
6. 每个主题尽量只聚焦一个判断或一个角度。
7. 最后严格输出为 Markdown 表格，列为：
| 中文题目 | English prompt | 表达抓手 | 适合模式 |
不要添加表格之外的解释。`
  }

  const source = mode === 'pdf'
    ? `I will provide a PDF${fileName ? ` (filename: ${fileName})` : ''}. Read and understand it first.`
    : `Work from this broad topic: ${cleanTheme || '(to be provided)'}.`
  const context = mode === 'pdf' && cleanTheme ? `\nAdditional context: ${cleanTheme}` : ''

  return `You are the editor of my speaking-practice topic library. ${source}${context}

Domain: ${domainLabel}
Return at least ${count} subtopics that can be used for spoken practice.

Requirements:
1. Do not return bare keywords. Every topic must be a complete, answerable prompt.
2. For each topic include: Chinese title, English prompt, and one speaking cue.
3. Label whether it suits Impromptu, Research brief, or Structured answer.
4. Cover core concepts, background, evidence, real cases, main debates, counterarguments, impact, solutions, and future trends where relevant.
5. Remove duplicates, overly broad titles, and prompts that cannot stand alone.
6. Keep each topic focused on one judgment or one angle.
7. Output only a Markdown table with these columns:
| 中文题目 | English prompt | 表达抓手 | 适合模式 |
Do not add any explanation outside the table.`
}

const hasCjk = (value: string) => /[\u3400-\u9fff]/.test(value)
const hasLatin = (value: string) => /[A-Za-z]/.test(value)
const cleanCell = (value: string) => value
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/^["“”']+|["“”']+$/g, '')
  .trim()
const isSeparatorRow = (cells: string[]) => cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, '')))
const isHeaderRow = (cells: string[]) => {
  const joined = cells.join(' ').toLowerCase()
  return (joined.includes('中文') || joined.includes('chinese')) && (joined.includes('english') || joined.includes('prompt'))
}
const isModeCell = (value: string) => /^(即兴表达|研究陈述|结构化回答|impromptu|research brief|structured answer)/i.test(value.trim())

const rowToTopic = (cells: string[]): ExtractedTopic | null => {
  const clean = cells.map(cleanCell).filter(Boolean)
  if (!clean.length || isSeparatorRow(clean) || isHeaderRow(clean)) return null

  const zh = clean.find((cell) => hasCjk(cell)) ?? clean[0]
  const en = clean.find((cell) => hasLatin(cell) && !hasCjk(cell)) ?? zh
  const hint = [...clean]
    .reverse()
    .find((cell) => cell !== zh && cell !== en && !isModeCell(cell) && cell.length >= 6)
    ?? (hasCjk(zh) ? '先给结论，再给理由和一个具体场景。' : 'Lead with a conclusion, then add reasons and one concrete scene.')

  if (!zh && !en) return null
  return {
    title: { zh: zh || en, en: en || zh },
    hint: {
      zh: hasCjk(hint) ? hint : '先给结论，再给理由和一个具体场景。',
      en: hasLatin(hint) && !hasCjk(hint) ? hint : 'Lead with a conclusion, then add reasons and one concrete scene.',
    },
  }
}

export const parseAgentOutput = (text: string): ExtractedTopic[] => {
  const topics: ExtractedTopic[] = []
  const lines = text.split(/\r?\n/)

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) return

    if (line.includes('|')) {
      const cells = line.replace(/^\||\|$/g, '').split('|')
      const topic = rowToTopic(cells)
      if (topic) topics.push(topic)
      return
    }

    const bullet = line.match(/^(?:[-*+]|\d+[.)、])\s*(.+)$/)
    if (!bullet) return
    const body = bullet[1].trim()
    const cells = body.includes('｜') ? body.split('｜') : body.includes('\t') ? body.split('\t') : [body]
    const topic = rowToTopic(cells)
    if (topic) topics.push(topic)
  })

  return topics.filter((topic, index) => {
    const key = `${topic.title.zh}::${topic.title.en}`.toLowerCase()
    return topics.findIndex((item) => `${item.title.zh}::${item.title.en}`.toLowerCase() === key) === index
  })
}
