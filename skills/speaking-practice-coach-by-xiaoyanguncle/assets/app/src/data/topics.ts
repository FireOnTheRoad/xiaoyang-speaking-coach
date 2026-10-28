import { referenceTopics } from './referenceTopics'

export type Lang = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export interface Topic {
  id: string
  categoryId: string
  title: LocalizedText
  hint: LocalizedText
  keywords?: string[]
}

export interface TopicCategory {
  id: string
  name: LocalizedText
  description: LocalizedText
  mark: string
  accent: string
  topics: Topic[]
}

export interface CustomGroup {
  id: string
  name: LocalizedText
  createdAt: string
}

type Pair = [zh: string, en: string, zhHint?: string, enHint?: string]

const makeCategory = (
  id: string,
  zhName: string,
  enName: string,
  zhDescription: string,
  enDescription: string,
  mark: string,
  accent: string,
  pairs: Pair[],
): TopicCategory => ({
  id,
  name: { zh: zhName, en: enName },
  description: { zh: zhDescription, en: enDescription },
  mark,
  accent,
  topics: pairs.map(([zh, en, zhHint, enHint], index) => ({
    id: `${id}-${index + 1}`,
    categoryId: id,
    title: { zh, en },
    hint: {
      zh: zhHint ?? '先给判断，再解释理由；最后用一个具体场景收口。',
      en: enHint ?? 'Give a clear judgment, explain why, then close with one concrete scene.',
    },
  })),
})

const baseCategories: TopicCategory[] = [
  makeCategory(
    'general',
    '日常表达',
    'Everyday ideas',
    '把熟悉的小事说清楚，也把模糊的感受讲具体。',
    'Make ordinary experiences clear and abstract feelings concrete.',
    'GT',
    '#ff5a36',
    [
      ['最近一次改变我想法的经历', 'A moment that changed my mind', '重点说明“原来怎么想、后来为何改变”。', 'Explain what you believed before and what changed it.'],
      ['一件我一直舍不得扔的东西', 'Something I still cannot throw away', '用一个物件讲到一段关系或一种习惯。', 'Use one object to reveal a relationship or habit.'],
      ['我如何度过没有手机的一小时', 'How I spend an hour without my phone', '讲一个真实片段，不要泛泛而谈。', 'Tell one real scene rather than generalizing.'],
      ['最容易被误解的一个习惯', 'A habit people often misunderstand', '先承认外界误解，再给内部视角。', 'Acknowledge the misunderstanding, then offer an inside view.'],
      ['排队时我在观察什么', 'What I notice while waiting in line', '从细节中提炼一个社会观察。', 'Turn small details into a social observation.'],
      ['一次没有准备的临时发言', 'A speech I had to give unprepared', '讲当时最慌的一刻和救场的方法。', 'Describe the most anxious moment and how you recovered.'],
      ['为什么我开始早起，又为什么停下', 'Why I started waking early, and why I stopped', '不要只讲结果，讲反复和代价。', 'Focus on the tradeoff and the relapse, not just the result.'],
      ['我住过最舒服的空间', 'The most comfortable space I have lived in', '从光线、声音、气味讲到状态。', 'Move from light, sound, and smell to how you felt.'],
      ['一次帮倒忙的经历', 'A time my help made things worse', '承认动机与结果之间的落差。', 'Show the gap between your intention and the outcome.'],
      ['如果能重过普通的一天', 'An ordinary day I would relive', '解释平凡为什么值得被保留。', 'Explain why an ordinary moment deserves to remain.'],
      ['我如何判断一个人是否可靠', 'How I decide whether someone is reliable', '把直觉拆成可观察的行为。', 'Turn intuition into observable behaviors.'],
      ['最近让我停止刷手机的一句话', 'A sentence that made me put my phone down', '先复述这句话，再说它击中了什么需求、焦虑或重复习惯。', 'Repeat the sentence, then explain which need, anxiety, or habit it interrupted.'],
    ],
  ),
  makeCategory(
    'deep',
    '深度概念',
    'Deep concepts',
    '用通俗语言解释概念，并把它拉回现实决策。',
    'Explain a concept plainly and connect it to a real decision.',
    'DC',
    '#2f6bff',
    [
      ['本杰明·富兰克林效应', 'The Ben Franklin effect', '为什么帮过你的人，可能更喜欢你？', 'Why might someone who helped you like you more?'],
      ['透明度错觉如何影响我们的表达？', 'How does the illusion of transparency affect communication?', '先解释为什么人总觉得自己被看穿，再结合演讲、谈判或社交场景说明影响。', 'Explain why we feel seen through, then connect it to speaking, negotiation, or social situations.'],
      ['情感预测偏差', 'Affective forecasting bias', '我们如何系统性高估未来的情绪强度？', 'How do we systematically overestimate future feelings?'],
      ['聚焦错觉为什么会放大单个因素？', 'Why does the focusing illusion magnify one factor?', '用一个生活决策说明注意力集中后，某个条件为什么会被过度放大。', 'Use a real decision to show how attention makes one condition seem overwhelmingly important.'],
      ['历史终结错觉', 'The end-of-history illusion', '我们为什么总觉得今天的自己不会再变？', 'Why do we assume today’s self is the final version?'],
      ['讽刺过程理论', 'Ironic process theory', '越提醒自己不要想，为什么越会想到？', 'Why does trying not to think of something make it return?'],
      ['情绪标注为什么能降低情绪的控制力？', 'Why does affect labeling reduce emotional control?', '先说情绪标注的机制，再给一个在工作或关系中的具体使用场景。', 'Explain the mechanism, then give a concrete use case at work or in a relationship.'],
      ['没有沟通时，人们为什么会找到同一个“谢林点”？', 'Why do people converge on a Schelling point without communicating?', '先解释共同预期，再用约会地点、集合点或市场协调的例子说明。', 'Explain shared expectations, then use a meeting place, gathering point, or market coordination example.'],
      ['重复博弈与“以牙还牙”', 'Tit-for-tat and repeated games', '为什么“先友善、再回应”常能胜出？', 'Why can “nice, retaliatory, forgiving” outperform?'],
      ['沉没成本谬误', 'The sunk-cost fallacy', '已经投入很多，为什么不代表应该继续？', 'Why does past investment not justify continuing?'],
      ['林迪效应为什么让“活得久”成为一种优势？', 'Why does the Lindy effect make longevity an advantage?', '说清它适用于哪些事物，以及为什么不能把它直接套到所有新事物上。', 'Clarify what it applies to and why it should not be applied blindly to every new thing.'],
      ['辛普森悖论为什么会造成整体与分组相反？', 'Why can Simpson’s paradox reverse the result between groups and the total?', '举一个用户、医疗或成绩数据例子，说明混杂变量如何改变结论。', 'Use a user, medical, or score example to show how a confounding variable changes the conclusion.'],
      ['确认偏误如何影响我们的判断？', 'How does confirmation bias affect judgment?', '先解释人为什么会寻找支持自己的证据，再给一个工作或生活中的例子。', 'Explain why people seek supporting evidence, then give a work or life example.'],
      ['幸存者偏差会让我们漏掉什么？', 'What does survivorship bias make us miss?', '用一个成功案例说明失败样本为什么同样重要。', 'Use a success story to explain why failed cases matter just as much.'],
      ['可得性启发为什么让容易想起的事显得更常见？', 'Why does the availability heuristic make vivid events feel more common?', '从媒体曝光、记忆强度和个人经验三个角度解释。', 'Explain it through media exposure, memory strength, and personal experience.'],
      ['锚定效应如何影响谈判和定价？', 'How does anchoring affect negotiation and pricing?', '说明第一个数字如何成为参照点，再给一个可操作的反制方法。', 'Explain how the first number becomes a reference point, then offer a practical countermeasure.'],
      ['损失厌恶为什么会让人做出非理性选择？', 'Why does loss aversion lead to irrational choices?', '比较同额收益与损失的心理强度，再举一个投资或职业选择例子。', 'Compare equal gains and losses, then use an investment or career example.'],
      ['框架效应如何改变同一个事实的吸引力？', 'How does framing change the appeal of the same fact?', '用收益框架和损失框架描述同一个方案，比较选择差异。', 'Describe the same option through gain and loss frames, then compare the choices.'],
      ['基本比率谬误为什么会让人误判概率？', 'Why does the base rate fallacy distort probability judgments?', '用一个检测、招聘或投资例子说明总体概率为什么不能忽略。', 'Use a test, hiring, or investing example to show why the base rate cannot be ignored.'],
      ['均值回归为什么能让极端表现自然回落？', 'Why does regression to the mean pull extreme performance back?', '区分真实能力变化和随机波动，再给一个业绩或考试例子。', 'Separate real skill change from random variation, then use performance or exam results as an example.'],
      ['道德风险为什么会在风险被转移后出现？', 'Why does moral hazard appear when risk is transferred?', '用保险、金融或组织管理例子说明责任和风险为何分离。', 'Use insurance, finance, or organizational management to explain the split between risk and responsibility.'],
      ['委托代理问题为什么会造成目标错位？', 'Why does the principal-agent problem create misaligned goals?', '先定义委托人与代理人，再说明信息不对称如何影响激励。', 'Define principal and agent, then explain how information asymmetry affects incentives.'],
      ['公地悲剧为什么会让理性的个体毁掉共同资源？', 'Why can rational individuals destroy a shared resource?', '用环境、平台或团队资源说明个体收益与集体成本的冲突。', 'Use an environmental, platform, or team resource to show individual benefit versus collective cost.'],
      ['知识诅咒为什么会让人讲不清简单问题？', 'Why does the curse of knowledge make simple explanations difficult?', '站在新手视角重讲一个熟悉概念，并指出最容易省略的背景。', 'Re-explain a familiar concept from a beginner’s view and identify the context experts tend to omit.'],
      ['路径依赖如何让过去的选择锁住未来？', 'How does path dependence lock in past choices?', '解释早期选择、转换成本和网络效应如何共同形成锁定。', 'Explain how early choices, switching costs, and network effects create lock-in.'],
      ['二阶效应为什么会让好决策产生坏结果？', 'Why can second-order effects turn a good decision into a bad outcome?', '先讲直接效果，再追踪后续行为、激励和系统反应。', 'Explain the direct effect, then trace later behavior, incentives, and system response.'],
      ['眼镜蛇效应如何让激励反向制造问题？', 'How can the cobra effect make an incentive create more of the problem?', '用一个奖励指标被利用的例子，说明指标与目标为何分离。', 'Use a rewarded metric that gets gamed to show how the metric separates from the goal.'],
      ['斯特赖桑德效应为什么会让压制变成传播？', 'Why can the Streisand effect turn suppression into publicity?', '解释关注度、稀缺感和好奇心如何形成反向放大。', 'Explain how attention, scarcity, and curiosity create reverse amplification.'],
      ['马太效应为什么会让优势不断累积？', 'Why does the Matthew effect make advantages accumulate?', '从资源、机会、声誉和反馈循环解释强者为何更容易继续变强。', 'Explain how resources, opportunity, reputation, and feedback loops help advantages compound.'],
      ['坎贝尔定律为什么提醒我们不能迷信指标？', 'Why does Campbell’s law warn against blindly trusting metrics?', '说明指标一旦成为目标，人们会如何优化指标而不是真实目标。', 'Explain how people optimize the metric rather than the real goal once it becomes a target.'],
      ['黑天鹅事件为什么难以预测却影响巨大？', 'Why are black swan events hard to predict but hugely consequential?', '从罕见性、叙事偏差、尾部风险和准备成本展开。', 'Discuss rarity, narrative bias, tail risk, and the cost of preparation.'],
      ['反脆弱为什么不同于坚韧？', 'How is antifragility different from resilience?', '区分承受冲击、恢复原状和从波动中获益三种状态。', 'Distinguish surviving a shock, returning to baseline, and benefiting from volatility.'],
      ['帕累托原则如何帮助我们分配注意力？', 'How can the Pareto principle guide attention allocation?', '找出一个领域中关键的少数，并说明如何验证它。', 'Identify the vital few in one domain and explain how to validate them.'],
      ['第一性原理如何帮助跳出类比思维？', 'How does first-principles thinking break away from analogy?', '把问题拆到不可再分的事实，再重新推导解决方案。', 'Break the problem into irreducible facts, then reason back up to a solution.'],
      ['能力圈如何帮助我们判断“不懂”？', 'How does the circle of competence help us recognize what we do not know?', '先界定真正熟悉的领域，再说明何时应该求助或放弃判断。', 'Define what you genuinely understand, then explain when to ask for help or decline to decide.'],
      ['逆向思维为什么会提高决策质量？', 'Why does inversion improve decision quality?', '先问“怎样确保失败”，再把失败条件转成行动清单。', 'Ask how to guarantee failure, then turn those conditions into an action checklist.'],
    ],
  ),
  makeCategory(
    'finance',
    '个人理财',
    'Personal finance',
    '把财务决策讲成可执行的原则，而不是口号。',
    'Turn financial choices into practical principles, not slogans.',
    'PF',
    '#16a36a',
    [
      ['应急金到底要准备多少', 'How large should an emergency fund be', '从收入稳定性、家庭责任和支出弹性倒推。', 'Work backward from income stability, obligations, and flexibility.'],
      ['复利最容易被忽略的部分', 'The most overlooked part of compounding', '时间、费率、现金流，哪一个更关键？', 'Which matters most: time, fees, or contributions?'],
      ['消费升级是怎样悄悄发生的', 'How lifestyle creep quietly happens', '找出一次具体的标准漂移。', 'Identify one specific standard that drifted upward.'],
      ['高息债务和投资该如何排序', 'High-interest debt versus investing', '比较确定收益与风险收益，不给万能答案。', 'Compare certain returns with risky returns; avoid a universal answer.'],
      ['收入上涨后先改变什么', 'What to change first after a raise', '给出一个可执行的分配顺序。', 'Offer an actionable allocation order.'],
      ['为什么“闲钱”也需要被定义', 'Why “idle cash” needs a definition', '解释什么叫真正闲置，再说明备用金、流动性目标和投资期限为什么不同。', 'Define what is truly idle, then explain how emergency reserves, liquidity goals, and time horizons differ.'],
      ['风险承受能力不是风险偏好', 'Risk capacity is not risk appetite', '先说两者的区别，再用一个具体投资或职业选择说明冲突时该听谁。', 'Distinguish the two, then use an investment or career decision to explain which should win in conflict.'],
      ['怎样评估一笔大额消费', 'How to evaluate a major purchase', '考虑替代方案、机会成本和后悔成本。', 'Consider alternatives, opportunity cost, and regret.'],
      ['现金流比净值更重要的时刻', 'When cash flow matters more than net worth', '用具体情境说明流动性价值。', 'Use a concrete scenario to show the value of liquidity.'],
      ['订阅制如何掏空预算', 'How subscriptions erode a budget', '从心理账户和小额遗忘解释。', 'Explain through mental accounting and small forgotten charges.'],
      ['给家人做财务规划的难点', 'The hard part of planning finances with family', '兼顾信任、边界和信息透明。', 'Balance trust, boundaries, and transparency.'],
      ['延迟满足并非越久越好', 'Delayed gratification has a limit', '什么时候等待会产生反效果？', 'When does waiting become counterproductive?'],
    ],
  ),
  makeCategory(
    'entrepreneurship',
    '创业思维',
    'Entrepreneurship',
    '讨论真实取舍、资源约束与长期信任。',
    'Discuss real tradeoffs, scarce resources, and long-term trust.',
    'EN',
    '#ff9d2e',
    [
      ['为什么“现金是氧气”', 'Why cash is oxygen', '盈利与生存不是同一个问题。', 'Profitability and survival are not the same problem.'],
      ['第一位客户为什么最重要', 'Why the first customer matters most', '讲验证、反馈和承诺，不只讲收入。', 'Focus on validation, feedback, and commitment, not just revenue.'],
      ['什么情况下应该拒绝机会', 'When to say no to an opportunity', '从战略聚焦和隐藏成本解释。', 'Explain through focus and hidden costs.'],
      ['产品与市场的契合不是感觉', 'Product-market fit is not a feeling', '给出可观察信号和不成立信号。', 'Give observable signals and disconfirming evidence.'],
      ['早期团队里的信任资本', 'Trust capital in an early team', '冲突时信任如何降低协作成本？', 'How does trust lower coordination cost during conflict?'],
      ['采用直营还是分销', 'Direct sales or distribution partners', '比较控制力、速度和单位经济。', 'Compare control, speed, and unit economics.'],
      ['快速试错不等于频繁转向', 'Fail fast is not endless pivoting', '区分学习速度与方向漂移。', 'Separate learning speed from direction drift.'],
      ['先做窄市场还是大市场', 'Beachhead first or broad market first', '解释聚焦如何带来可复制的优势。', 'Explain how focus creates a repeatable advantage.'],
      ['创始人何时该亲自做销售', 'When founders should sell themselves', '早期销售是在收集什么信息？', 'What information is early selling designed to collect?'],
      ['“公开构建”的边界', 'The boundary of building in public', '透明和商业机密之间怎么平衡？', 'How do you balance transparency and confidential advantage?'],
      ['增长前必须检查什么', 'What to inspect before scaling', '留存、毛利和交付能力缺一不可。', 'Check retention, margin, and delivery capacity.'],
      ['一个人创业的隐性上限', 'The hidden ceiling of solo founding', '时间、能力与情绪支持的约束。', 'Time, skill, and emotional support all become constraints.'],
    ],
  ),
  makeCategory(
    'startups',
    '初创公司',
    'Startups',
    '理解融资、增长与组织阶段的关键判断。',
    'Understand the key calls behind funding, growth, and organization stages.',
    'ST',
    '#9264ff',
    [
      ['最小可行产品真正验证什么', 'What an MVP really validates', '验证风险最高的假设，不是做一个缩水版。', 'Validate the riskiest assumption, not a smaller finished product.'],
      ['现金流跑道如何计算', 'How to calculate runway', '净消耗速度会变化，不能只看静态余额。', 'Net burn changes; a static balance is not enough.'],
      ['种子轮的叙事结构', 'The narrative structure of a seed round', '问题、洞察、证据、团队与时机。', 'Problem, insight, evidence, team, and timing.'],
      ['增长黑客的伦理边界', 'The ethical boundary of growth hacking', '短期转化与长期信任如何取舍？', 'How do you trade short-term conversion against long-term trust?'],
      ['用户流失背后的真实原因', 'What churn is really telling you', '区分产品问题、错配客户和自然流失。', 'Separate product problems, wrong-fit customers, and natural churn.'],
      ['网络效应何时开始成立', 'When network effects actually begin', '说明用户增长何时改善产品价值，并指出只有规模、没有价值增长的假网络效应。', 'Explain when growth improves product value, and identify fake network effects where scale alone changes nothing.'],
      ['产品债和组织债的关系', 'Product debt and organization debt', '短期方便如何变成长期摩擦？', 'How does short-term convenience become long-term friction?'],
      ['应该招通才还是专才', 'Generalist or specialist hiring', '根据当前瓶颈而不是职位偏见判断。', 'Hire for the current bottleneck, not a title preference.'],
      ['过早扩张的典型信号', 'Signals of scaling too early', '从交付、支持和决策速度找证据。', 'Look at delivery, support, and decision speed.'],
      ['创始人市场契合度', 'Founder-market fit', '为什么“懂市场”比“很聪明”更关键？', 'Why does market understanding beat raw intelligence?'],
      ['融资不是成功本身', 'Fundraising is not success', '资金只是资源，不是验证。', 'Capital is a resource, not proof.'],
      ['如何讲一个不夸张的愿景', 'How to tell a bold but honest vision', '远景要具体，承诺要可检验。', 'Make the future concrete and the promise testable.'],
    ],
  ),
  makeCategory(
    'tech-ai',
    '科技与 AI',
    'Tech & AI',
    '解释技术机制、伦理风险与人的决策。',
    'Explain technical mechanisms, ethical risks, and human decisions.',
    'AI',
    '#00a6c8',
    [
      ['大模型的“幻觉”为何会发生', 'Why model hallucinations happen', '从概率生成与训练目标解释。', 'Explain through probabilistic generation and training objectives.'],
      ['提示词工程是技巧还是界面', 'Is prompt engineering a skill or an interface', '讨论它为何可能被产品化。', 'Discuss why it may be absorbed into product design.'],
      ['上下文窗口的工程约束', 'The engineering limits of a context window', '容量大不等于注意力都有效。', 'More capacity does not guarantee better attention.'],
      ['开源模型改变了什么', 'What open models change', '从成本、定制、安全生态三方面说。', 'Discuss cost, customization, and the security ecosystem.'],
      ['自动化偏见为什么会让人过度相信系统？', 'Why does automation bias make people overtrust systems?', '解释认知捷径与责任转移，再给一个导航、医疗或 AI 工具的例子。', 'Explain cognitive shortcuts and responsibility transfer, then use navigation, medicine, or AI as an example.'],
      ['合成数据的收益与污染风险', 'The benefits and contamination risk of synthetic data', '模型自我循环会失去什么？', 'What is lost when models learn from their own output?'],
      ['模型漂移如何被监测', 'How model drift should be monitored', '数据、行为和结果的指标都要看。', 'Monitor data, behavior, and outcome metrics.'],
      ['延迟也是产品体验', 'Latency is product experience', '速度如何改变用户信任与使用方式？', 'How does speed alter trust and behavior?'],
      ['本地模型与云端模型的选择', 'Local versus cloud models', '隐私、成本、能力和维护如何权衡？', 'Weigh privacy, cost, capability, and maintenance.'],
      ['AI Agent 最难的一步', 'The hardest step for an AI agent', '从“会回答”到“能可靠行动”的差距。', 'The gap between answering and acting reliably.'],
      ['技术债为什么总被拖延', 'Why technical debt gets postponed', '它通常以“以后更快”为交换条件。', 'It is often traded for short-term speed.'],
      ['数据护城河还有效吗', 'Are data moats still effective', '数据量、独占性和反馈闭环哪个更重要？', 'Which matters more: volume, exclusivity, or feedback loops?'],
    ],
  ),
  makeCategory(
    'fitness',
    '运动训练',
    'Fitness',
    '讲清训练逻辑、恢复和长期坚持。',
    'Explain training logic, recovery, and long-term consistency.',
    'FT',
    '#d83232',
    [
      ['如何正确理解渐进超负荷？', 'How should we understand progressive overload?', '说明重量、次数、组数、动作质量和恢复如何共同构成负荷 progression。', 'Explain how weight, reps, sets, movement quality, and recovery together create progressive overload.'],
      ['休息日为什么也属于训练计划？', 'Why are rest days part of the training plan?', '从肌肉修复、神经系统疲劳和长期坚持说明休息如何提高训练效果。', 'Explain how recovery affects muscle repair, nervous-system fatigue, and long-term consistency.'],
      ['动作质量为什么高于面子', 'Why form beats ego', '一次错误的最大重量可能换来数周停训。', 'One ego lift can cost weeks of training.'],
      ['平台期应该先改什么', 'What to change first at a plateau', '先检查睡眠、饮食和执行一致性。', 'First inspect sleep, nutrition, and consistency.'],
      ['心肺基础和力量训练如何组合', 'Combining cardio base and strength work', '目标不同，顺序和剂量都会改变。', 'Goals determine order and dosage.'],
      ['肌肉记忆是真实存在的吗', 'Is muscle memory real', '从神经协调和肌核记忆解释。', 'Explain through neural coordination and myonuclear memory.'],
      ['酸痛不等于训练有效', 'Soreness does not equal progress', '把主观感受和可量化进步分开。', 'Separate subjective sensation from measurable progress.'],
      ['初学者最值得投资的动作', 'The best movements for beginners', '深蹲、推、拉、髋铰链与负重行走。', 'Squat, push, pull, hinge, and loaded carry.'],
      ['长期运动员如何安排减量周', 'How athletes plan a deload week', '降低疲劳，同时保留动作模式。', 'Reduce fatigue while preserving movement patterns.'],
      ['功能性力量到底指什么', 'What functional strength actually means', '是否能迁移到真实生活任务。', 'Whether strength transfers to real-life tasks.'],
      ['睡眠为什么是训练的一部分', 'Why sleep is training', '恢复不足会让训练变成消耗。', 'Without recovery, training becomes depletion.'],
      ['怎样建立训练责任感', 'How to build training accountability', '环境设计通常比意志力有效。', 'Environment design usually beats willpower.'],
    ],
  ),
  makeCategory(
    'nutrition',
    '营养饮食',
    'Nutrition',
    '区分证据、趋势与个体差异。',
    'Separate evidence, trends, and individual differences.',
    'NT',
    '#54a42d',
    [
      ['蛋白质需求如何估算', 'How to estimate protein needs', '训练目标、体重和年龄都会影响。', 'Training goal, body weight, and age all matter.'],
      ['液体摄入不能只看八杯水', 'Hydration is more than eight glasses', '出汗、气候和饮食都在影响需求。', 'Sweat, climate, and food all affect needs.'],
      ['备餐真正节省的是什么', 'What meal prep really saves', '省下的是决策次数，不一定只是时间。', 'It saves decisions, not only time.'],
      ['饥饿和渴望如何区分', 'Distinguishing hunger from craving', '从时间、强度和满足感找线索。', 'Use timing, intensity, and satisfaction as clues.'],
      ['膳食纤维为什么影响饱腹感', 'How fiber affects satiety', '体积、速度与肠道反馈共同作用。', 'Volume, digestion speed, and gut feedback interact.'],
      ['血糖峰值不只是一条曲线', 'A blood-sugar spike is not the whole story', '食物组合、活动和个体反应都很重要。', 'Food pairing, activity, and individual response matter.'],
      ['超加工食品的关键问题', 'The key problem with ultra-processed food', '不只是热量，还包括结构和进食速度。', 'It is not only calories; texture and eating speed matter too.'],
      ['情绪性进食如何被触发', 'What triggers emotional eating', '先识别情绪，再谈替代策略。', 'Name the emotion before choosing a replacement strategy.'],
      ['怎样建立可持续的热量缺口？', 'How do you create a sustainable calorie deficit?', '说明缺口过大如何影响饥饿、训练和坚持，并给出从小幅调整开始的方案。', 'Explain how an aggressive deficit affects hunger, training, and adherence, then start with a smaller adjustment.'],
      [' supplements 适合谁', 'Who actually needs supplements', '优先找缺口，再考虑补充。', 'Identify a real gap before adding a supplement.'],
      ['家庭饮食如何减少摩擦', 'How to reduce friction in family meals', '统一底线，保留个人选择。', 'Set shared defaults while preserving individual choice.'],
      ['外食时最实用的选择原则是什么？', 'What is the most practical rule for eating out?', '用一顿真实外卖或聚餐说明如何先定蛋白质、蔬菜和主食结构，再调整份量。', 'Use a real takeout meal or dinner to show how to choose protein, vegetables, and carbs before adjusting portions.'],
    ],
  ),
  makeCategory(
    'productivity',
    '效率方法',
    'Productivity',
    '少讲工具，多讲注意力、节奏与协作。',
    'Talk less about tools and more about attention, rhythm, and collaboration.',
    'PD',
    '#e2a400',
    [
      ['深度工作为什么难以维持', 'Why deep work is hard to sustain', '注意力切换会留下恢复成本。', 'Context switching leaves attention residue.'],
      ['时间盒适合什么任务', 'What tasks suit timeboxing', '适合边界模糊但能被切分的任务。', 'Best for fuzzy work that can be bounded.'],
      ['收件箱清零是否值得', 'Is inbox zero worth it', '它解决的是焦虑还是流程？', 'Does it solve anxiety or the underlying workflow?'],
      ['帕金森定律在个人工作中', 'Parkinson’s law in personal work', '任务会膨胀到占满给定时间。', 'Work expands to fill the time assigned.'],
      ['两分钟法则的误用', 'How the two-minute rule gets misused', '它能清小事，也可能打断深度状态。', 'It clears small tasks but can also break focus.'],
      ['批处理为什么提高效率', 'Why batching improves efficiency', '减少切换，统一认知模式。', 'It reduces switching and stabilizes context.'],
      ['能量管理比时间管理更关键', 'Energy management beats time management', '同一小时在不同状态下价值不同。', 'The same hour is worth different amounts in different states.'],
      ['开放循环如何消耗注意力', 'How open loops consume attention', '未完成任务会持续占用认知资源。', 'Unfinished tasks keep occupying cognitive resources.'],
      ['会议税该怎么计算', 'How to calculate the meeting tax', '参与人数乘以时长，再加上切换成本。', 'Multiply attendance and duration, then add switching cost.'],
      ['关闭一天的正确方式', 'How to shut down the workday well', '记录未完成项，给大脑一个停靠点。', 'Record open loops and give the mind a stopping point.'],
      ['第二大脑为何常常失败', 'Why second brains often fail', '收集不等于理解，归档不等于调用。', 'Capture is not understanding; storage is not retrieval.'],
      ['拖延往往不是懒', 'Procrastination is often not laziness', '它常来自模糊、恐惧或冲突目标。', 'It often comes from ambiguity, fear, or competing goals.'],
    ],
  ),
  makeCategory(
    'history',
    '历史现场',
    'History',
    '不只背事件，还要解释因果与代价。',
    'Do not just recall events; explain causes and costs.',
    'HS',
    '#7a5a3a',
    [
      ['柏林墙倒塌的多重原因', 'The multiple causes behind the fall of the Berlin Wall', '经济、政治、媒体和偶发事件共同作用。', 'Economics, politics, media, and contingency interacted.'],
      ['印刷术如何改变知识权力', 'How printing changed intellectual power', '复制成本下降会重组谁有解释权。', 'Cheaper copies rearrange who can interpret knowledge.'],
      ['大宪章真的保护了普通人吗', 'Did Magna Carta really protect ordinary people', '区分象征意义与当时受益者。', 'Separate symbolism from who benefited at the time.'],
      ['工业革命为何首先发生在英国', 'Why the Industrial Revolution began in Britain', '制度、能源、资本与市场并非单因。', 'Institutions, energy, capital, and markets all mattered.'],
      ['航海时代如何重塑世界贸易？', 'How did the age of sail reshape world trade?', '从航线、港口城市、商品流动和权力转移说明变化，不只讲地理发现。', 'Explain routes, port cities, commodity flows, and power shifts rather than only geographical discovery.'],
      ['拿破仑战争如何影响现代国家', 'How the Napoleonic Wars shaped modern states', '战争动员与行政改革相互推动。', 'Mobilization and administrative reform reinforced each other.'],
      ['明治维新的选择与代价', 'The choices and costs of the Meiji Restoration', '快速现代化如何改变社会结构？', 'How did rapid modernization alter social structure?'],
      ['冷战中的代理人战争', 'Proxy war during the Cold War', '超级大国竞争如何外包风险？', 'How did superpowers externalize risk?'],
      ['妇女选举权的长期争取', 'The long fight for women’s suffrage', '制度改变往往来自组织、叙事和持续压力。', 'Institutional change comes from organizing, narrative, and persistent pressure.'],
      ['阿波罗计划为何能成功', 'Why the Apollo program succeeded', '国家目标、组织能力和工程管理缺一不可。', 'National purpose, organizations, and engineering management all mattered.'],
      ['丝绸之路不只是贸易路线', 'The Silk Road was more than trade', '技术、宗教和疾病也沿路传播。', 'Technology, religion, and disease traveled too.'],
      ['互联网早期的开放理想', 'The early open ideals of the internet', '开放协议如何同时带来创新与治理难题？', 'How did open protocols enable both innovation and governance problems?'],
    ],
  ),
  makeCategory(
    'literature',
    '文学与叙事',
    'Literature & story',
    '用人物、冲突和选择来解释作品。',
    'Explain works through character, conflict, and choice.',
    'LT',
    '#c53c74',
    [
      ['《1984》里的语言如何控制思想', 'How language controls thought in 1984', '词汇减少如何限制可表达的思考？', 'How does shrinking vocabulary limit what can be thought?'],
      ['《百年孤独》里的时间循环', 'Cyclical time in One Hundred Years of Solitude', '重复既是命运，也是历史记忆。', 'Repetition is both fate and historical memory.'],
      ['《傲慢与偏见》中的第一印象', 'First impressions in Pride and Prejudice', '偏见如何被经验一点点击穿？', 'How does experience gradually puncture prejudice?'],
      ['《了不起的盖茨比》的绿光', 'The green light in The Great Gatsby', '欲望为什么总停在可望不可即的位置？', 'Why does desire remain just out of reach?'],
      ['《罪与罚》中的自我辩护', 'Self-justification in Crime and Punishment', '人如何用理论掩盖自己的欲望？', 'How do theories conceal personal desire?'],
      ['《局外人》为什么让人不安', 'Why The Stranger feels unsettling', '情感规范被打破时，读者在害怕什么？', 'What do readers fear when emotional norms break?'],
      ['《弗兰肯斯坦》中的创造责任', 'The responsibility of creation in Frankenstein', '造物者对造物承担什么义务？', 'What duties does a creator owe the created?'],
      ['《堂吉诃德》的荒诞与理想', 'Absurdity and idealism in Don Quixote', '笑话与敬意为何能同时存在？', 'How can mockery and admiration coexist?'],
      ['《杀死一只知更鸟》的旁观者', 'The bystander in To Kill a Mockingbird', '看见不公却不行动意味着什么？', 'What does it mean to see injustice and do nothing?'],
      ['《麦田里的守望者》的防御', 'Defensiveness in The Catcher in the Rye', '讽刺如何保护一个受伤的叙述者？', 'How does sarcasm protect a wounded narrator?'],
      ['《美丽新世界》的舒适控制', 'Comfort as control in Brave New World', '当痛苦被消除，自由还剩下什么？', 'What remains of freedom when pain is removed?'],
      ['《奥德赛》中的归乡为什么不只是回到地点？', 'Why is homecoming in The Odyssey more than returning to a place?', '从身份、关系和途中改变切入，说明回家的真正代价。', 'Use identity, relationships, and change along the journey to explain the real cost of homecoming.'],
    ],
  ),
  makeCategory(
    'graduate-exam',
    '考研专业课',
    'Graduate entrance',
    '面向复试与专业课口述，练观点、逻辑和术语准确度。',
    'Practice oral explanations of major subjects for graduate entrance interviews.',
    'GE',
    '#4d63ff',
    [
      ['哈希冲突有哪些工程取舍', 'Engineering tradeoffs in hash collisions', '分离链接、开放寻址与负载因子。', 'Chaining, open addressing, and load factor.'],
      ['进程和线程的本质区别', 'Processes versus threads', '从地址空间、切换成本和通信解释。', 'Address space, switching cost, and communication.'],
      ['TCP 拥塞控制的四个阶段', 'The four phases of TCP congestion control', '慢启动、拥塞避免、快重传、快恢复。', 'Slow start, congestion avoidance, fast retransmit, and fast recovery.'],
      ['操作系统为什么要使用虚拟内存？', 'Why do operating systems use virtual memory?', '分别说明进程隔离、地址空间抽象、内存超额分配和缺页处理。', 'Explain process isolation, address-space abstraction, overcommitment, and page faults.'],
      ['数据库索引为什么可能拖慢写入', 'Why database indexes can slow writes', '读放大与写放大要一起考虑。', 'Consider read and write amplification together.'],
      ['管理学中的权变理论在说什么？', 'What does contingency theory say in management?', '先用一句定义，再结合环境、组织规模和任务不确定性说明管理方式为何不同。', 'Define it briefly, then explain how environment, organizational size, and task uncertainty change the right management approach.'],
      ['边际效用递减的现实应用', 'Applying diminishing marginal utility', '从定价、福利到时间分配。', 'From pricing and welfare to time allocation.'],
      ['比例原则如何约束公权力', 'How proportionality limits public power', '目的正当、手段必要、利益均衡。', 'Legitimate aim, necessity, and balancing.'],
      ['建构主义学习理论', 'Constructivist learning theory', '知识不是被直接灌入，而是主动建构。', 'Knowledge is constructed, not simply transferred.'],
      ['认知负荷理论中的三种负荷如何处理？', 'How do the three loads in cognitive load theory work?', '分别解释内在、外在和相关负荷，并用课程设计或产品界面举例。', 'Explain intrinsic, extraneous, and germane load, then use course design or a product interface as an example.'],
      ['议程设置理论解释了什​​么', 'What agenda-setting theory explains', '媒体影响的是“想什么”还是“怎么想”？', 'Does media shape what we think about or how we think?'],
      ['资本资产定价模型的假设争议', 'Criticisms of CAPM assumptions', '市场有效性、风险因子和现实摩擦。', 'Market efficiency, risk factors, and real-world friction.'],
      ['权责发生制为什么更接近经营实质', 'Why accrual accounting reflects operations better', '收入费用确认与现金流的时间差。', 'Timing differences between recognition and cash flow.'],
      ['循证医学的证据等级', 'Evidence levels in evidence-based medicine', '随机试验、系统综述与真实世界证据。', 'Trials, systematic reviews, and real-world evidence.'],
      ['PID 控制中三个参数的作用', 'The role of PID parameters', '比例、积分、微分的直觉解释。', 'An intuitive explanation of proportional, integral, and derivative terms.'],
      ['材料力学中的应力集中', 'Stress concentration in mechanics', '几何突变如何放大局部风险？', 'How do geometric changes amplify local risk?'],
    ],
  ),
  makeCategory(
    'civil-service',
    '考公考编',
    'Civil service',
    '覆盖结构化面试、公共治理与政策分析常见题型。',
    'Practice structured interviews, public administration, and policy analysis.',
    'CS',
    '#e64646',
    [
      ['基层治理如何兼顾力度与温度', 'How grassroots governance balances firmness and warmth', '先定目标，再谈规则与沟通。', 'Define the goal, then discuss rules and communication.'],
      ['乡村振兴如何避免同质化项目', 'How rural revitalization avoids copycat projects', '从资源禀赋、市场验证和长期运营切入。', 'Start with local assets, market validation, and operations.'],
      ['政务服务如何真正便民', 'How public services become genuinely convenient', '流程、数据和人员培训要同步改变。', 'Process, data, and staff training must change together.'],
      ['突发事件舆情如何回应', 'How to respond to a public emergency', '速度、事实、责任和后续改进缺一不可。', 'Speed, facts, accountability, and follow-through.'],
      ['如何治理形式主义负担', 'How to reduce formalism and administrative burden', '从考核指标和权责匹配找根因。', 'Look at incentives and aligned authority.'],
      ['老旧小区改造的协商难题', 'Negotiating old-neighborhood renovation', '识别利益相关方，再设计分层方案。', 'Map stakeholders, then design differentiated options.'],
      ['如何推动数字政府建设', 'How to advance digital government', '便利与隐私、包容性要同时评估。', 'Evaluate convenience alongside privacy and inclusion.'],
      ['公共政策如何在效率和公平间平衡', 'Balancing efficiency and fairness in policy', '说明指标选择会改变受益者。', 'Explain how metric choice changes who benefits.'],
      ['年轻干部如何面对群众质疑', 'How young officials respond to public skepticism', '先接住情绪，再给事实和行动。', 'Acknowledge emotion, then provide facts and action.'],
      ['城市更新中如何保护历史记忆', 'Protecting memory in urban renewal', '保留什么、改善什么、由谁决定？', 'What is preserved, improved, and who decides?'],
      ['应急管理中的信息报送原则', 'Information reporting in emergency management', '及时、准确、分级、闭环。', 'Timely, accurate, tiered, and closed-loop.'],
      ['如何理解公共服务中的“最后一公里”', 'Understanding the last mile of public services', '问题常出在基层执行和资源衔接。', 'Problems often emerge in local execution and resource handoff.'],
      ['调研工作如何避免只看样板', 'How research avoids seeing only showcase sites', '抽样、匿名反馈与交叉验证。', 'Sampling, anonymous feedback, and cross-validation.'],
      ['如何提升跨部门协同效率', 'How to improve cross-department collaboration', '共同目标、权责边界和共享数据。', 'Shared goals, clear ownership, and shared data.'],
      ['面对网络谣言应如何处置', 'How to handle online rumors', '核查、回应、追责与科普同步进行。', 'Verification, response, accountability, and public education.'],
      ['公共预算如何回应群众需求', 'How public budgets respond to community needs', '从优先级、透明度和绩效评价解释。', 'Explain through prioritization, transparency, and evaluation.'],
    ],
  ),
  makeCategory(
    'work-reports',
    '工作汇报',
    'Work reports',
    '用结论、证据、风险和下一步，快速说清工作价值。',
    'Use conclusion, evidence, risk, and next step to communicate value quickly.',
    'WR',
    '#f05a8a',
    [
      ['用一分钟汇报本周进展', 'Report this week’s progress in one minute', '三个进展、一个阻塞、一个请求。', 'Three progress points, one blocker, one request.'],
      ['项目延期的汇报方式', 'How to report a delayed project', '先说明影响，再解释原因和补救方案。', 'Lead with impact, then cause and recovery plan.'],
      ['季度 OKR 复盘', 'Quarterly OKR review', '目标结果、关键动作、偏差和下一阶段。', 'Outcome, key actions, variance, and next stage.'],
      ['跨部门协作卡住了怎么汇报', 'Reporting a cross-team collaboration block', '分清事实、依赖和需要谁拍板。', 'Separate facts, dependencies, and the decision owner.'],
      ['申请追加预算', 'Requesting additional budget', '说明新增投入与可验证回报。', 'Connect additional spending to verifiable return.'],
      ['向老板解释指标下滑', 'Explaining a metric decline to leadership', '先给范围，再给假设和验证计划。', 'Give scope, hypotheses, and a validation plan.'],
      ['新项目立项汇报', 'Pitching a new project', '问题、机会、方案、成本和验收标准。', 'Problem, opportunity, option, cost, and acceptance criteria.'],
      ['事故复盘如何避免甩锅', 'How a postmortem avoids blame', '关注系统原因和可行动的改进项。', 'Focus on system causes and actionable changes.'],
      ['用户反馈如何转成产品需求', 'Turning user feedback into product requirements', '区分个案、模式和优先级。', 'Separate anecdotes, patterns, and priorities.'],
      ['年度总结如何避免流水账', 'How an annual review avoids a laundry list', '用目标—结果—学习—计划组织。', 'Organize as goal, result, learning, and plan.'],
      ['向上管理中的坏消息', 'Delivering bad news upward', '越早越具体，越有替代方案。', 'Earlier, more specific, and with options.'],
      ['晋升答辩如何证明影响力', 'Proving impact in a promotion review', '区分完成任务和改变结果。', 'Distinguish task completion from outcome change.'],
      ['资源不足时如何排优先级', 'Prioritizing when resources are insufficient', '用影响、紧迫性和可逆性排序。', 'Rank by impact, urgency, and reversibility.'],
      ['如何汇报一次失败实验？', 'How do you report a failed experiment?', '先给结论，再说明假设、证据、失败原因和下一次应该复用或停止的决策。', 'Lead with the conclusion, then cover hypothesis, evidence, failure cause, and what should be reused or stopped next time.'],
      ['让高管在十分钟内做决定', 'Helping executives decide in ten minutes', '提前给选项、建议和风险。', 'Provide options, recommendation, and risk upfront.'],
      ['如何做一场高质量复盘会', 'Running a high-quality retrospective', '先统一事实，再讨论机制。', 'Align on facts before discussing mechanisms.'],
    ],
  ),
  makeCategory(
    'job-interview',
    '求职面试',
    'Job interviews',
    '用 STAR 结构讲经历，但不止停在故事。',
    'Tell experiences with STAR, but go beyond the story.',
    'JI',
    '#7653d6',
    [
      ['一分钟自我介绍', 'One-minute self-introduction', '定位、证据、匹配度，最后落到岗位。', 'Positioning, evidence, fit, then the role.'],
      ['为什么离开上一份工作', 'Why you left your last job', '保持事实和成长逻辑，少抱怨。', 'Stay factual and growth-oriented; avoid blame.'],
      ['讲一次失败经历', 'Describe a failure', '选择真实失败，说明认知更新。', 'Choose a real failure and explain what changed.'],
      ['如何处理团队冲突', 'How you handled team conflict', '说清目标冲突、沟通方式和结果。', 'Clarify the goal conflict, communication, and outcome.'],
      ['最有成就感的项目', 'Your most rewarding project', '不只讲结果，也要讲你的关键贡献。', 'Explain the result and your decisive contribution.'],
      ['如何面对模糊需求', 'How you handle ambiguous requirements', '先澄清目标、约束和成功标准。', 'Clarify goal, constraints, and success criteria.'],
      ['为什么选择我们公司', 'Why this company', '把公司特点和自己的长期方向连起来。', 'Connect company specifics to your long-term direction.'],
      ['你的缺点是什么', 'What is your weakness', '给真实弱点和正在使用的改进机制。', 'Name a real weakness and the system you use to improve.'],
      ['如何解释职业空窗期', 'Explaining a career gap', '简洁、诚实，强调期间的选择和收获。', 'Be concise, honest, and clear about your choices.'],
      ['你和岗位的匹配点', 'Your fit for the role', '用岗位需求逐项对应证据。', 'Map role requirements to concrete evidence.'],
      ['同时拿到多个机会如何选择', 'Choosing among multiple offers', '从成长、平台、回报和生活方式比较。', 'Compare growth, platform, compensation, and lifestyle.'],
      ['怎样回答期望薪资', 'How to answer salary expectations', '给区间、依据和可协商空间。', 'Give a range, rationale, and room to negotiate.'],
      ['讲一次你主动改变流程', 'A time you proactively changed a process', '说明问题、行动、阻力和结果。', 'Explain problem, action, resistance, and result.'],
      ['你如何快速学习新领域', 'How you learn a new field quickly', '给出具体方法和验证节点。', 'Give a concrete method and validation milestones.'],
      ['如果入职前三个月', 'Your first 90 days', '理解业务、建立关系、交付小胜。', 'Learn the business, build relationships, and deliver a small win.'],
      ['如何向面试官提问', 'Questions to ask the interviewer', '围绕成功标准、团队现状和决策方式。', 'Ask about success criteria, team reality, and decision-making.'],
    ],
  ),
  makeCategory(
    'academic',
    '学术表达',
    'Academic speaking',
    '面向组会、开题、答辩和跨学科解释。',
    'For group meetings, proposals, defenses, and cross-disciplinary explanation.',
    'AC',
    '#168b8b',
    [
      ['用三分钟介绍你的研究', 'Explain your research in three minutes', '问题、方法、发现、意义。', 'Question, method, finding, and significance.'],
      ['开题答辩如何说明研究价值', 'Defending the value of a research proposal', '理论缺口、现实问题和可行性。', 'Theoretical gap, practical problem, and feasibility.'],
      ['文献综述如何避免罗列', 'How a literature review avoids listing', '按争论和证据组织，而不是按作者。', 'Organize around debates and evidence, not authors.'],
      ['解释一个复杂方法给外行听', 'Explain a complex method to a non-expert', '先给类比，再给限制，避免术语堆叠。', 'Start with an analogy, then limits; avoid jargon.'],
      ['研究结果不显著怎么办', 'What to do when results are not significant', '区分方法问题、效应弱小和真实无关系。', 'Separate method issues, small effects, and true nulls.'],
      ['如何回应审稿人质疑', 'Responding to reviewer criticism', '先复述理解，再逐条回应证据。', 'Restate the concern, then answer with evidence.'],
      ['论文贡献如何不被夸大', 'How to state contribution without overclaiming', '说清边界、条件和适用范围。', 'Clarify boundaries, conditions, and scope.'],
      ['组会汇报如何提高讨论质量', 'How to improve discussion in a group meeting', '提前给出争议点和需要决策的事项。', 'Surface disagreements and decisions in advance.'],
      ['如何设计一个可检验的假设', 'Designing a testable hypothesis', '变量、机制、方向和可观测结果。', 'Variables, mechanism, direction, and observable outcome.'],
      ['跨学科研究如何建立共同语言', 'Building shared language in interdisciplinary work', '先对齐概念定义和评价标准。', 'Align definitions and evaluation criteria first.'],
      ['研究伦理与数据隐私', 'Research ethics and data privacy', '知情同意、最小必要和数据治理。', 'Informed consent, data minimization, and governance.'],
      ['如何讲清楚研究的局限', 'Explaining research limitations', '局限不是道歉，是结果边界。', 'Limitations are boundaries, not apologies.'],
      ['海报展示如何吸引停留', 'How a poster attracts attention', '一个结论、一个图、一个可追问的问题。', 'One finding, one figure, and one question worth asking.'],
      ['答辩时遇到不会的问题', 'When you do not know an answer in a defense', '承认边界，给出验证路径。', 'Acknowledge the boundary and propose how to test it.'],
      ['如何安排一场学术演讲', 'Structuring an academic talk', '问题—方法—证据—限制—结论。', 'Question, method, evidence, limitations, and conclusion.'],
      ['如何把论文讲成故事但不失真', 'Tell a research story without distorting it', '张力来自问题，不来自夸张。', 'Make the tension come from the question, not exaggeration.'],
    ],
  ),
]

interface ReferenceFormat {
  title: LocalizedText
  hint: LocalizedText
}

const referenceFormats: Record<string, ReferenceFormat> = {
  general: {
    title: {
      zh: '用一分钟讲“{term}”',
      en: 'Talk for one minute: {term}',
    },
    hint: {
      zh: '从与“{term}”有关的一个具体场景开始，再讲一个细节和它带来的思考。',
      en: 'Start with a concrete scene involving “{term}”, then add one detail and what it made you think.',
    },
  },
  deep: {
    title: {
      zh: '用通俗语言解释“{term}”',
      en: 'Explain “{term}” in plain language',
    },
    hint: {
      zh: '先给“{term}”下定义，再给现实例子、适用边界和一个反例。',
      en: 'Define “{term}”, then add a real-world example, a boundary, and a counterexample.',
    },
  },
  finance: {
    title: {
      zh: '“{term}”对个人财务意味着什么？',
      en: 'What does “{term}” mean for personal finance?',
    },
    hint: {
      zh: '先给判断，再用一个数字场景说明“{term}”的收益、风险和取舍。',
      en: 'Take a position, then use a numerical scenario to explain the return, risk, and tradeoff of “{term}”.',
    },
  },
  entrepreneurship: {
    title: {
      zh: '创业者如何理解“{term}”？',
      en: 'How should founders think about “{term}”?',
    },
    hint: {
      zh: '从真实创业决策切入，说明“{term}”的价值、代价和失效条件。',
      en: 'Start from a real startup decision and explain the value, cost, and failure conditions of “{term}”.',
    },
  },
  startups: {
    title: {
      zh: '“{term}”会怎样影响一家初创公司？',
      en: 'What does “{term}” mean for a startup?',
    },
    hint: {
      zh: '从增长、现金、用户或组织角度展开“{term}”，避免只背定义。',
      en: 'Frame “{term}” through growth, cash, users, or organization instead of reciting a definition.',
    },
  },
  'tech-ai': {
    title: {
      zh: '“{term}”如何影响技术、产品和人的选择？',
      en: 'How does “{term}” affect technology, product, and human choice?',
    },
    hint: {
      zh: '先解释“{term}”的机制，再谈使用价值、潜在风险与治理边界。',
      en: 'Explain the mechanism of “{term}”, then discuss value, risk, and governance boundaries.',
    },
  },
  fitness: {
    title: {
      zh: '训练中如何正确理解“{term}”？',
      en: 'How should we understand “{term}” in training?',
    },
    hint: {
      zh: '说明“{term}”的训练作用、正确剂量、恢复方式和常见误区。',
      en: 'Explain the training role, correct dosage, recovery, and common mistakes of “{term}”.',
    },
  },
  nutrition: {
    title: {
      zh: '“{term}”在真实饮食中意味着什么？',
      en: 'What does “{term}” mean in real-world nutrition?',
    },
    hint: {
      zh: '区分“{term}”的基础原理、现实影响和个体差异，不要给万能结论。',
      en: 'Separate mechanism, practical impact, and individual differences around “{term}”; avoid universal claims.',
    },
  },
  productivity: {
    title: {
      zh: '“{term}”如何影响效率和注意力？',
      en: 'How does “{term}” affect productivity and attention?',
    },
    hint: {
      zh: '说明“{term}”的作用机制、适用条件和一个可执行的改善动作。',
      en: 'Explain the mechanism and conditions behind “{term}”, then give one practical change.',
    },
  },
  history: {
    title: {
      zh: '“{term}”：发生了什么，改变了什么？',
      en: '“{term}”: what happened, and what changed?',
    },
    hint: {
      zh: '交代“{term}”的时代背景、关键转折和长期影响，不要只背年份。',
      en: 'Set the context, identify the turning point, and explain the long-term effect of “{term}”; do not just recite dates.',
    },
  },
  literature: {
    title: {
      zh: '从“{term}”出发，它真正讨论了什么？',
      en: 'Starting from “{term}”, what is really being explored?',
    },
    hint: {
      zh: '从人物、冲突、选择或意象切入“{term}”，避免只复述情节。',
      en: 'Use character, conflict, choice, or imagery to discuss “{term}”; do not only summarize plot.',
    },
  },
}

const referenceAlternates: Record<string, ReferenceFormat> = {
  general: {
    title: { zh: '从“{term}”说起：一个细节和它背后的观察', en: 'Starting from “{term}”: one detail and the observation behind it' },
    hint: { zh: '先描述一个具体细节，再解释它为什么能代表更大的日常经验。', en: 'Describe one concrete detail, then explain the larger everyday experience it represents.' },
  },
  deep: {
    title: { zh: '用一个现实例子解释“{term}”', en: 'Explain “{term}” through a real example' },
    hint: { zh: '用一个现实例子说明“{term}”，再补上它什么时候不适用。', en: 'Use a real example to explain “{term}”, then add when it does not apply.' },
  },
  finance: {
    title: { zh: '“{term}”会怎样改变一个普通人的财务决策？', en: 'How would “{term}” change an ordinary person’s financial decision?' },
    hint: { zh: '从一笔真实收入、支出或投资决策切入，说明“{term}”改变了什么。', en: 'Start from real income, spending, or investing, then show what “{term}” changes.' },
  },
  entrepreneurship: {
    title: { zh: '围绕“{term}”，创业者最容易做错什么？', en: 'What do founders most often get wrong about “{term}”?' },
    hint: { zh: '先指出最常见误判，再说明正确判断需要看什么证据。', en: 'Name the common misjudgment, then explain what evidence the right decision needs.' },
  },
  startups: {
    title: { zh: '“{term}”在早期公司里什么时候最重要？', en: 'When does “{term}” matter most in an early-stage company?' },
    hint: { zh: '结合一个初创阶段问题，说明“{term}”何时关键、何时只是噪音。', en: 'Use an early-stage problem to explain when “{term}” is critical and when it is noise.' },
  },
  'tech-ai': {
    title: { zh: '用一个非技术例子解释“{term}”', en: 'Explain “{term}” with a non-technical example' },
    hint: { zh: '先给一个日常类比，再说明“{term}”带来的技术收益和潜在风险。', en: 'Start with an everyday analogy, then explain the technical benefit and risk of “{term}”.' },
  },
  fitness: {
    title: { zh: '“{term}”练得越多越好吗？', en: 'Is more “{term}” always better?' },
    hint: { zh: '围绕“{term}”说明剂量、恢复和个体差异，不要给一刀切答案。', en: 'Use dosage, recovery, and individual differences to answer whether more “{term}” is better.' },
  },
  nutrition: {
    title: { zh: '围绕“{term}”，最常见的误区是什么？', en: 'What is the most common misunderstanding about “{term}”?' },
    hint: { zh: '先指出一个常见误区，再用机制、证据和现实场景纠正它。', en: 'Name a common misunderstanding, then correct it with mechanism, evidence, and a real scenario.' },
  },
  productivity: {
    title: { zh: '“{term}”适合所有人吗？', en: 'Does “{term}” work for everyone?' },
    hint: { zh: '说明“{term}”适合什么工作方式，以及它可能带来哪些副作用。', en: 'Explain what work style suits “{term}” and what side effects it may create.' },
  },
  history: {
    title: { zh: '如果没有“{term}”，后来可能会怎样？', en: 'What might have happened without “{term}”?' },
    hint: { zh: '先交代“{term}”的作用，再用因果链说明它可能改变的历史走向。', en: 'Explain the role of “{term}”, then trace how it may have changed what followed.' },
  },
  literature: {
    title: { zh: '“{term}”最容易被误读的地方是什么？', en: 'What is most often misread about “{term}”?' },
    hint: { zh: '先指出常见误读，再用人物、冲突、意象或时代背景重新解释。', en: 'Name the common misreading, then reinterpret it through character, conflict, imagery, or context.' },
  },
}

const fillReferenceTemplate = (template: string, term: string) => template.replace('{term}', term)

const buildReferenceTopic = (categoryId: string, zh: string, en: string, index: number): Topic => {
  const fallback = {
    title: { zh: '围绕“{term}”展开一段表达', en: 'Speak about “{term}”' },
    hint: { zh: '先给判断，再给理由，最后用一个具体场景收口。', en: 'Give a judgment, explain why, then close with one concrete scene.' },
  }
  const primary = referenceFormats[categoryId] ?? fallback
  const alternate = referenceAlternates[categoryId]
  const format = index % 2 === 1 && alternate ? alternate : primary

  return {
    id: `ref-${categoryId}-${index + 1}`,
    categoryId,
    title: {
      zh: fillReferenceTemplate(format.title.zh, zh),
      en: fillReferenceTemplate(format.title.en, en),
    },
    hint: {
      zh: fillReferenceTemplate(format.hint.zh, zh),
      en: fillReferenceTemplate(format.hint.en, en),
    },
    keywords: [zh, en],
  }
}

const normalizeTopicTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export const categories: TopicCategory[] = baseCategories.map((category) => {
  const topicsWithKeywords = category.topics.map((topic) => ({
    ...topic,
    keywords: [...(topic.keywords ?? [])],
  }))
  const references: Topic[] = []

  ;(referenceTopics[category.id] ?? []).forEach(([en, zh], index) => {
    const referenceTitle = normalizeTopicTitle(en)
    const existingIndex = topicsWithKeywords.findIndex((topic) => {
      const title = normalizeTopicTitle(topic.title.en)
      return title === referenceTitle || title.includes(referenceTitle) || referenceTitle.includes(title)
    })

    if (existingIndex >= 0) {
      const topic = topicsWithKeywords[existingIndex]
      topic.keywords = [...new Set([...topic.keywords, zh, en])]
      return
    }

    references.push(buildReferenceTopic(category.id, zh, en, index))
  })

  return {
    ...category,
    topics: [...references, ...topicsWithKeywords],
  }
})

export const getCategory = (id: string) => categories.find((category) => category.id === id) ?? categories[0]

export const allTopics = categories.flatMap((category) => category.topics)
