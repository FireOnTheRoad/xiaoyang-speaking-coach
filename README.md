# 言之有物 · 中英表达训练工作台

一个在本地运行的中英双语表达训练网页，也是一套可安装的 Agent Skill。功能逻辑参考随机主题 + 计时练习这一常见训练模式，但信息架构、题库组织、视觉系统和交互均由本项目独立实现。

- Skill 名称：`xiaoyang-speaking-coach`
- 中文产品名：言之有物
- 默认本地地址：`http://127.0.0.1:5173/`

## 最终用户：通过 Skill 本地部署

要求：Node.js 20+、npm，以及支持本地 Skill 的 Codex / Claude Code 环境。

1. 克隆本仓库。
2. 将 `skills/xiaoyang-speaking-coach` 复制到你的 Skill 目录：
   - Codex：`~/.codex/skills/xiaoyang-speaking-coach`
   - Claude Code：`~/.claude/skills/xiaoyang-speaking-coach`
3. 对 Agent 说：

```text
使用 $xiaoyang-speaking-coach 在本地启动言之有物
```

也可以不通过 Agent，直接启动：

```bash
cd skills/xiaoyang-speaking-coach
node scripts/start-local.mjs
```

启动脚本会自动检查 Node、安装依赖、构建应用，并通过 `127.0.0.1` 启动本地网页。录音、历史和 Obsidian 功能不需要模型即可使用；智能拆题与录音分析需要本机安装 Codex CLI 或 WorkBuddy CodeBuddy CLI。

## 开发运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

修改应用后重新生成 Skill 内置版本：

```bash
npm run package:skill
```

## 已实现

- 中文 / English 全局切换，题目、提示、导航与计时状态同步换语言
- 已合并参考站主题词，并统一扩写为完整双语题目、补齐作答提示、概念去重和分类归档
- 三种练习模式：即兴表达、研究陈述、结构化回答
- 即兴表达、研究陈述和结构化回答使用独立主题池
- 16 个主题场景，409 道完整内置题目
- 原站现有 10 类主题：日常、深度概念、个人理财、创业、初创、科技/AI、运动、营养、效率、历史、文学
- 新增：考研专业课、考公考编、工作汇报、求职面试、学术表达
- 主题搜索、收藏夹、自定义题目
- 自定义主题分组支持新建、重命名、删除和单题移动
- 深度概念新增 24 个判断、决策、博弈和系统思考主题
- 新增题目统一归入自定义主题组；默认组为“我的新增主题”
- 手动新增、Agent 自动拆解和 PDF 拆解都可以指定或新建自己的主题组
- 智能拆题状态持久化：切换页面或刷新后保留主题、领域、Agent 输出和解析结果
- 拆解领域支持自定义，可新增、选择和删除
- 拆解数量支持 6 / 10 / 12 / 自定义，自定义范围为 1–50
- 历史保存在内置分类里的自定义题目会自动迁移到“我的新增主题”
- 智能拆题：大主题和 PDF 都可通过本机 Agent 路由自动拆解，也保留复制提示词与回填结果的备用流程
- Agent 返回 Markdown 表格后，网页自动解析、预览并保存到主题库
- 大 PDF 使用二进制本地上传，不经过 Base64 膨胀；后台先提取跨页文本再交给 Agent
- 单个 PDF 本地上限提升到 150MB；扫描版无文本时自动回退为原 PDF
- 本地 Agent 路由仅监听 `127.0.0.1`，支持 Codex CLI 与 WorkBuddy CodeBuddy CLI
- WorkBuddy 若提示未登录，需要先在终端完成一次 CLI 登录；桌面端登录态不会自动共享给 CLI
- 调研准备、结构化准备与正式表达计时
- 节奏提示音、暂停、重来、表达阶段提示
- 本机成长记录、近 7 天练习图表
- 表达阶段自动录音，支持开启/关闭、手动结束和浏览器本地保存
- 录音优先避开 Oray、WeMeet 等虚拟音频设备，优先使用内置或真实麦克风
- 录音启用回声消除和降噪、关闭自动增益，录音期间关闭会串入录音的提示音
- 成长记录支持录音播放和下载，便于复盘或交给支持音频的 Agent
- 录音分析优先调用 WorkBuddy 本地 Agent 网关的 AudioTranscribe，再由 DeepSeek 评分
- WorkBuddy 不可用时自动回退到本地 faster-whisper + Codex
- Whisper 使用 small/int8 模型，音频不离开本机
- 成长记录支持录音回放、浏览器语音转写和 Agent 评分
- Agent 分析包含内容、结构、简洁度、论证和表达维度，并给出改进建议
- 综合评分固定按内容 30%、结构 20%、简洁度 15%、论证 20%、表达 15% 加权
- 成长记录支持搜索、录音/分析状态筛选、评分/时长排序和分批加载
- 每次训练会保存完整过程：准备/表达阶段、暂停、录音设备、阶段到达点和结束方式
- 成长记录支持将单次训练同步到 Obsidian：生成过程时间线、转写、录音附件和 Agent 分析笔记
- Obsidian 同步会自动维护“言之有物 · 训练总览”索引，可再次同步更新同一篇训练笔记
- 没有转写时不给虚假评分，相关维度显示为不可评
- 桌面端、平板和移动端响应式布局

## 目录

- `skills/xiaoyang-speaking-coach`：可分发的完整 Skill，包含应用快照、启动脚本与部署说明
- `scripts/package-skill.mjs`：将根目录应用同步进 Skill 的内置应用目录
- `src/data/topics.ts`：双语主题库
- `src/components/SpeechTimer.tsx`：计时与表达阶段状态机
- `src/components/TopicLibrary.tsx`：主题检索与收藏
- `src/components/ProgressView.tsx`：成长记录
- `src/App.tsx`：主应用状态与页面组合
- `src/styles.css`：原创视觉系统与响应式样式

## Agent 环境变量

- `CODEX_CLI_PATH`：自定义 Codex CLI 路径
- `WORKBUDDY_CLI_PATH`：自定义 WorkBuddy CodeBuddy 主模块路径
- `WORKBUDDY_GATEWAY_URL` / `WORKBUDDY_GATEWAY_PASSWORD`：覆盖 WorkBuddy 本地远程 Agent 网关
- `SAYFIELD_WORKBUDDY_WORKSPACE`：WorkBuddy Agent 可访问的临时录音目录
- `SAYFIELD_WHISPER_MODEL` / `SAYFIELD_WHISPER_CACHE`：本地 Whisper 备用转写配置
