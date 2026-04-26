# 信息分诊台 MVP 实现计划

## 1. 产品目标

做一个最小可用的 **个人信息流过滤器**。

用户可以把来自 AI 新闻、小红书、公众号、推特/X、网页文章等来源的内容提交到系统，系统自动判断：

- 是否值得读
- 应该精读、略读、存档、追踪还是跳过
- 内容是否有信息增量
- 是否可能是重复包装
- 是否有一手来源
- 是否与用户关注主题相关
- 每天生成一份“今日信息分诊报告”

MVP 的核心不是做全平台自动抓取，而是先验证：

> 用户是否愿意把内容交给系统，并接受系统给出的阅读决策。

---

## 2. MVP 范围

### 必须实现

#### A. 内容提交

支持三种输入方式：

1. 粘贴链接
2. 粘贴正文文本
3. 批量粘贴多条内容

MVP 不做平台自动抓取，也不做通用网页正文抓取。提交时 `url` 与 `rawText` 至少二选一；如果只有 URL、没有正文或摘要，则内容可以保存并出现在内容库，但不能触发 LLM 分析，也不进入每日报告候选池。页面需将分析按钮置灰，并提示“请补充正文或摘要后分析”。

每条内容需要保存：

- 标题
- 来源平台
- 原始 URL
- 原文内容 / 摘要
- 提交时间
- 用户备注，可选

---

#### B. AI 内容分析

每条内容提交后，系统调用 LLM 进行分析，输出结构化结果：

- 推荐动作：精读 / 略读 / 存档 / 追踪 / 跳过
- 阅读价值评分：0-100
- 信息增量评分：0-100
- 来源可信度评分：0-100
- 个人相关性评分：0-100
- 重复度评分：0-100
- 营销 / 包装嫌疑评分：0-100
- 情绪噪音评分：0-100
- 是否有一手来源
- 是否疑似多次包装
- 核心摘要
- 核心主张
- 推荐理由
- 跳过理由
- 建议阅读方式
- 相关主题标签

---

#### C. 用户关注主题

用户可以配置自己的关注主题，例如：

- AI 产品机会
- 信息流过滤
- 小红书消费趋势
- 个人效率工具
- 海外 AI 创业项目
- 中文内容生态
- 新型知识管理产品

系统分析内容时，需要判断内容与这些主题的相关性。

---

#### D. 内容列表

用户可以查看所有提交过的内容，并按以下条件筛选：

- 推荐动作
- 来源平台
- 阅读价值评分
- 主题标签
- 是否已读
- 是否已跳过
- 是否追踪中
- 日期

---

#### E. 每日信息分诊报告

每天根据 `Asia/Shanghai` 自然日提交并完成分析的内容，生成一份报告：

- 今日必须读：最多 3 条
- 今日略读：最多 7 条
- 建议跳过：若干条，默认折叠
- 值得追踪的主题：最多 5 个
- 今日异常信号：最多 3 个
- 今日总结：一段自然语言说明

---

#### F. 用户反馈

每条分析结果下提供反馈按钮：

- 判断准确
- 这个其实很重要
- 以后少给我这种
- 这个来源质量高
- 这个来源质量低
- 继续追踪这个主题
- 拉黑这个来源

反馈不会训练模型；其中一部分反馈只记录，另一部分会同步更新来源质量、来源拉黑状态或主题偏好，具体规则见 18.7。

---

## 3. 暂不实现

MVP 阶段不要做：

- 小红书自动抓取
- 微信公众号自动抓取
- 推特/X 自动抓取
- 完整浏览器插件
- 移动端 App
- 多用户协作
- 社交功能
- 复杂推荐算法
- 付费系统
- AI 生成检测器
- 自动长期记忆训练

这些可以放到第二阶段。

---

## 4. 推荐技术栈

### 前端

建议：

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

页面结构简单，适合快速实现。

---

### 后端

建议：

- Next.js API Routes 或 FastAPI
- PostgreSQL
- Prisma ORM
- OpenAI API / Anthropic API / 其他 LLM API

如果想快速做 MVP，推荐：

> Next.js 全栈 + PostgreSQL + Prisma

---

### 数据库

推荐：

- Supabase PostgreSQL

优点：

- 部署快
- 自带认证
- 可视化表结构
- 后续方便扩展

---

### 部署

推荐：

- Vercel 部署前端和 API
- Supabase 托管数据库

---

## 5. 核心数据模型

### User

```ts
User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}
```

---

### UserPreference

```ts
UserPreference {
  id: string
  userId: string
  readingGoal?: string
  preferredLanguage: string
  maxDailyMustRead: number
  maxDailySkim: number
  createdAt: Date
  updatedAt: Date
}
```

---

### Topic

```ts
Topic {
  id: string
  userId: string
  name: string
  description?: string
  priority: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

### Source

```ts
Source {
  id: string
  userId: string
  name: string
  platform: SourcePlatform
  url?: string
  qualityScore: number // 默认 50，范围 0-100
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}
```

```ts
enum SourcePlatform {
  AI_NEWS
  X
  XIAOHONGSHU
  WECHAT
  WEBSITE
  NEWSLETTER
  RSS
  MANUAL
  OTHER
}
```

---

### ContentItem

```ts
ContentItem {
  id: string
  userId: string
  sourceId?: string

  title: string
  url?: string
  rawText?: string
  extractedText?: string
  summary?: string

  platform: SourcePlatform
  author?: string
  publishedAt?: Date
  submittedAt: Date

  status: ContentStatus
  readStatus: ReadStatus

  createdAt: Date
  updatedAt: Date
}
```

```ts
enum ContentStatus {
  PENDING_ANALYSIS
  ANALYZED
  ANALYSIS_FAILED
  ARCHIVED
}
```

```ts
enum ReadStatus {
  UNREAD
  READ
  SKIPPED
  SAVED
}
```

---

### ContentAnalysis

```ts
ContentAnalysis {
  id: string
  contentItemId: string
  userId: string

  recommendedAction: RecommendedAction

  readingValueScore: number
  informationGainScore: number
  sourceCredibilityScore: number
  personalRelevanceScore: number
  duplicationScore: number
  marketingSuspicionScore: number
  emotionalNoiseScore: number

  hasPrimarySource: boolean
  suspectedAiPackaging: boolean
  suspectedMultiLayerRepackaging: boolean

  coreSummary: string
  coreClaims: string[]
  recommendationReasons: string[]
  skipReasons: string[]
  suggestedReadingMethod: string

  topicTags: string[]
  sourceTypeTags: string[]
  valueTags: string[]

  analyzedAt: Date
  modelName: string
  version: number
  requestId: string
  isCurrent: boolean
  supersededAt?: Date
  rawModelOutput?: Json
}
```

```ts
enum RecommendedAction {
  DEEP_READ
  SKIM
  ARCHIVE
  TRACK
  SKIP
}
```

---

### ContentFeedback

```ts
ContentFeedback {
  id: string
  userId: string
  contentItemId: string

  feedbackType: FeedbackType
  note?: string

  createdAt: Date
}
```

```ts
enum FeedbackType {
  ACCURATE
  ACTUALLY_IMPORTANT
  SHOW_LESS_LIKE_THIS
  SOURCE_HIGH_QUALITY
  SOURCE_LOW_QUALITY
  TRACK_THIS_TOPIC
  BLOCK_THIS_SOURCE
}
```

---

### DailyReport

```ts
DailyReport {
  id: string
  userId: string
  date: Date

  mustReadItemIds: string[]
  skimItemIds: string[]
  skippedItemIds: string[]
  trackedTopics: string[]
  anomalySignals: Json[]

  summary: string
  generatedAt: Date

  @@unique([userId, date])
}
```

Prisma 实现时需补充关系、级联策略和常用索引。MVP 至少包含：

- `ContentItem(userId, submittedAt)`
- `ContentAnalysis(contentItemId, isCurrent)`
- `Topic(userId, isActive)`

---

## 6. 页面设计

### 页面 1：首页 / 今日分诊台

路径：

```txt
/
```

模块：

1. 今日必须读
2. 今日略读
3. 值得追踪的主题
4. 今日异常信号
5. 建议跳过，默认折叠
6. 新增内容按钮

每个内容卡片展示：

- 标题
- 来源平台
- 推荐动作
- 阅读价值分
- 3 条推荐理由
- 预计阅读方式
- 原文链接
- 反馈按钮

---

### 页面 2：提交内容

路径：

```txt
/submit
```

支持：

#### 单条提交

字段：

- 标题，可选
- URL，可选
- 平台
- 正文文本
- 备注，可选

#### 批量提交

用户可以粘贴类似这样的内容：

```txt
1. 标题
链接
正文摘要

2. 标题
链接
正文摘要
```

系统需要尝试拆分成多条 ContentItem。

---

### 页面 3：内容库

路径：

```txt
/library
```

功能：

- 搜索
- 按平台筛选
- 按推荐动作筛选
- 按主题筛选
- 按日期筛选
- 按阅读价值排序
- 按提交时间排序

---

### 页面 4：内容详情

路径：

```txt
/content/[id]
```

展示：

- 原始内容
- AI 分析结果
- 评分雷达
- 核心摘要
- 核心主张
- 推荐理由
- 跳过理由
- 主题标签
- 用户反馈
- 重新分析按钮

---

### 页面 5：关注主题设置

路径：

```txt
/topics
```

功能：

- 新增主题
- 编辑主题
- 删除主题
- 设置主题优先级
- 启用 / 停用主题

---

### 页面 6：来源管理

路径：

```txt
/sources
```

功能：

- 查看来源列表
- 设置来源质量
- 拉黑来源
- 恢复来源
- 查看来源历史表现

---

## 7. API 设计

所有 API 默认需要 Supabase Auth session。Route Handlers 必须从 session 获取当前 `userId`，所有查询和写入都按该 `userId` 过滤；缺少 session 返回 `401`，访问其他用户资源返回 `404`。

### 创建内容

```http
POST /api/content
```

请求：

```json
{
  "title": "string",
  "url": "string",
  "rawText": "string",
  "platform": "X | XIAOHONGSHU | WECHAT | AI_NEWS | WEBSITE | OTHER",
  "author": "string"
}
```

校验规则：

- `url` 与 `rawText` 至少二选一
- MVP 不抓取网页正文；URL-only 内容只保存，不自动分析
- URL-only 内容不进入 LLM 分析和每日报告候选池

返回：

```json
{
  "contentItemId": "string",
  "status": "PENDING_ANALYSIS"
}
```

---

### 批量创建内容

```http
POST /api/content/batch
```

请求：

```json
{
  "items": [
    {
      "title": "string",
      "url": "string",
      "rawText": "string",
      "platform": "WEBSITE"
    }
  ]
}
```

---

### 分析内容

```http
POST /api/content/:id/analyze
```

行为：

1. 读取 ContentItem
2. 读取用户关注 Topic
3. 读取最近相关内容，用于判断重复度
4. 调用 LLM
5. 解析 JSON
6. 保存新的当前 ContentAnalysis
7. 更新 ContentItem.status 为 ANALYZED

如果 ContentItem 只有 URL、没有 `rawText` 或 `summary`，接口返回校验错误，不调用 LLM。

---

### 获取内容列表

```http
GET /api/content
```

支持参数：

```txt
platform
recommendedAction
topic
readStatus
fromDate
toDate
sortBy
page
pageSize
```

---

### 获取内容详情

```http
GET /api/content/:id
```

---

### 提交反馈

```http
POST /api/content/:id/feedback
```

请求：

```json
{
  "feedbackType": "ACCURATE",
  "note": "string"
}
```

---

### 获取每日报告

```http
GET /api/reports/daily?date=2026-04-26
```

---

### 生成每日报告

```http
POST /api/reports/daily/generate?date=2026-04-26
```

行为：

1. 获取 `date` 对应的 `Asia/Shanghai` 自然日内所有已分析内容
2. 按推荐动作和评分排序
3. 生成今日报告
4. 按 `userId + date` upsert DailyReport，重复生成同一天报告时覆盖原报告

---

### 用户主题 API

```http
GET /api/topics
POST /api/topics
PATCH /api/topics/:id
DELETE /api/topics/:id
```

---

## 8. AI 分析 Prompt

### 单条内容分析 Prompt

系统需要让模型只输出 JSON。

```txt
你是一个个人信息流分诊助手。你的任务不是判断一篇内容是否绝对正确，而是判断它对当前用户是否值得阅读。

请根据以下维度分析内容：

1. 信息增量：是否提供新事实、新数据、新案例、新观点。
2. 来源可信度：是否有一手来源、官方信息、原始数据、真实体验。
3. 个人相关性：是否与用户关注主题相关。
4. 重复度：是否像是常见观点的重复包装。
5. 营销嫌疑：是否像软广、种草、PR、矩阵号内容。
6. 情绪噪音：是否主要靠情绪、立场、夸张标题驱动。
7. 阅读建议：精读、略读、存档、追踪或跳过。

用户关注主题：
{{topics}}

用户阅读目标：
{{readingGoal}}

内容信息：
标题：{{title}}
平台：{{platform}}
作者：{{author}}
链接：{{url}}
正文：
{{rawText}}

请严格输出以下 JSON，不要输出 Markdown，不要输出额外解释：

{
  "recommendedAction": "DEEP_READ | SKIM | ARCHIVE | TRACK | SKIP",
  "readingValueScore": 0,
  "informationGainScore": 0,
  "sourceCredibilityScore": 0,
  "personalRelevanceScore": 0,
  "duplicationScore": 0,
  "marketingSuspicionScore": 0,
  "emotionalNoiseScore": 0,
  "hasPrimarySource": false,
  "suspectedAiPackaging": false,
  "suspectedMultiLayerRepackaging": false,
  "coreSummary": "",
  "coreClaims": [],
  "recommendationReasons": [],
  "skipReasons": [],
  "suggestedReadingMethod": "",
  "topicTags": [],
  "sourceTypeTags": [],
  "valueTags": []
}
```

---

### 每日报告生成 Prompt

```txt
你是一个个人信息分诊助手。请根据用户今天提交并分析过的内容，生成一份每日信息分诊报告。

目标：
1. 只挑出真正值得用户注意的内容。
2. 不要制造新的信息流。
3. 明确告诉用户哪些要精读，哪些略读，哪些跳过。
4. 找出跨来源重复出现的主题或异常信号。
5. 判断哪些主题值得继续追踪。

用户关注主题：
{{topics}}

用户阅读目标：
{{readingGoal}}

今日内容分析列表：
{{contentAnalyses}}

请严格输出以下 JSON：

{
  "mustReadItemIds": [],
  "skimItemIds": [],
  "skippedItemIds": [],
  "trackedTopics": [],
  "anomalySignals": [
    {
      "title": "",
      "description": "",
      "relatedItemIds": [],
      "reason": ""
    }
  ],
  "summary": ""
}
```

---

## 9. 推荐动作规则

LLM 可以判断，但后端最好有一层规则兜底。

### 精读 DEEP_READ

满足大部分条件：

- 阅读价值分 >= 80
- 信息增量 >= 70
- 个人相关性 >= 70
- 重复度 < 50
- 营销嫌疑 < 60

---

### 略读 SKIM

适合：

- 阅读价值 50-79
- 有一定信息，但不值得完整阅读
- 内容较长但核心观点简单
- 与用户主题相关，但信息增量一般

---

### 存档 ARCHIVE

适合：

- 当前不重要
- 未来可能有参考价值
- 工具、案例、数据、教程类内容

---

### 追踪 TRACK

适合：

- 单条内容质量未必最高
- 但主题可能正在升温
- 多平台反复出现
- 与用户长期研究方向相关

---

### 跳过 SKIP

适合：

- 阅读价值 < 50
- 高重复
- 高营销嫌疑
- 情绪噪音高
- 没有新信息
- 与用户关注主题无关

---

## 10. 重复度判断 MVP 方案

第一版不需要复杂向量数据库，但建议实现一个简单版本。

### 简单方案

对每条内容保存：

- coreSummary
- coreClaims
- topicTags

分析新内容时，取最近 50 条已分析内容，把它们的标题、摘要、核心主张传给 LLM，让它判断是否重复。

Prompt 中加入：

```txt
最近用户已读或已提交内容：
{{recentItems}}

请判断当前内容是否与这些内容高度重复。如果重复，请提高 duplicationScore，并在 skipReasons 中说明重复对象或重复主题。
```

---

### 第二阶段再升级

后续可以加入：

- embeddings
- pgvector
- 主题聚类
- 观点指纹
- 跨平台相似内容检测

---

## 11. 异常信号判断 MVP 方案

每日报告中做简单规则即可：

如果最近 24-72 小时内，多个来源出现相同或相近 topicTags，则生成异常信号。

例如：

```txt
topicTag = "AI 面试陪练"
sourceCount >= 2
contentCount >= 3
```

则生成：

```json
{
  "title": "AI 面试陪练相关内容正在升温",
  "description": "该主题在小红书、推特和 AI 新闻源中同时出现。",
  "relatedItemIds": ["id1", "id2", "id3"],
  "reason": "跨平台重复出现，可能代表早期趋势。"
}
```

---

## 12. UI 文案规范

不要使用：

- “垃圾内容”
- “低级内容”
- “假内容”
- “AI 写的所以没价值”

推荐使用：

- “信息增量低”
- “建议跳过”
- “建议略读”
- “缺少一手来源”
- “与近期内容重复”
- “可能是营销包装”
- “对你当前目标相关性较低”

产品语气要像一个冷静的研究助理。

---

## 13. 开发顺序

### 第 1 步：项目初始化

任务：

- 创建 Next.js 项目
- 配置 TypeScript
- 配置 Tailwind CSS
- 配置 shadcn/ui
- 配置 Prisma
- 连接 Supabase PostgreSQL
- 创建基础 layout

验收标准：

- 项目可本地启动
- 数据库连接成功
- Prisma migrate 成功

---

### 第 2 步：数据库模型

任务：

- 创建 User
- 创建 UserPreference
- 创建 Topic
- 创建 Source
- 创建 ContentItem
- 创建 ContentAnalysis
- 创建 ContentFeedback
- 创建 DailyReport

验收标准：

- Prisma schema 完成
- 数据库表创建成功
- 本地 seed 数据可插入

---

### 第 3 步：内容提交功能

任务：

- 实现 `/submit`
- 支持单条提交
- 支持批量提交
- 提交后写入 ContentItem
- 状态为 PENDING_ANALYSIS

验收标准：

- 用户可以提交链接或正文
- 内容出现在内容库
- 数据库有记录

---

### 第 4 步：主题设置功能

任务：

- 实现 `/topics`
- 支持新增、编辑、删除、启用、停用主题
- 支持设置优先级

验收标准：

- 用户可以维护自己的关注主题
- 内容分析时可以读取这些主题

---

### 第 5 步：AI 分析接口

任务：

- 实现 `/api/content/:id/analyze`
- 构造 prompt
- 调用 LLM
- 校验 JSON
- 保存 ContentAnalysis
- 更新 ContentItem 状态

验收标准：

- 每条内容可以被分析
- 分析结果结构化保存
- 失败时状态变为 ANALYSIS_FAILED
- 可重新分析

---

### 第 6 步：内容库

任务：

- 实现 `/library`
- 展示内容列表
- 支持筛选和排序
- 显示推荐动作和阅读价值评分

验收标准：

- 可以看到所有内容
- 可以按动作、平台、主题筛选
- 可以进入详情页

---

### 第 7 步：内容详情页

任务：

- 实现 `/content/[id]`
- 展示原文
- 展示分析结果
- 展示分数
- 展示推荐理由和跳过理由
- 支持反馈按钮
- 支持重新分析

验收标准：

- 用户能理解为什么系统建议精读、略读或跳过
- 用户能提交反馈

---

### 第 8 步：首页 / 今日分诊台

任务：

- 实现 `/`
- 展示今日必须读
- 展示今日略读
- 展示追踪主题
- 展示异常信号
- 折叠展示跳过内容

验收标准：

- 首页能替代传统信息流
- 用户一眼知道今天应该读什么

---

### 第 9 步：每日报告生成

任务：

- 实现 `/api/reports/daily/generate`
- 读取当天内容分析
- 按规则和 LLM 生成报告
- 保存 DailyReport
- 首页展示报告

验收标准：

- 可以生成当天报告
- 报告中包含 mustRead、skim、skip、trackedTopics、anomalySignals

---

### 第 10 步：来源管理

任务：

- 实现 `/sources`
- 展示来源质量
- 支持拉黑来源
- 支持标记来源质量高 / 低

验收标准：

- 用户可以管理来源
- 被拉黑来源的内容默认降权或跳过

---

## 14. 第一版验收标准

MVP 完成后，应该可以做到：

1. 用户可以提交来自不同平台的内容。
2. 系统可以自动分析每条内容。
3. 系统可以给出明确阅读建议。
4. 用户可以看到今日必须读和略读内容。
5. 系统可以解释为什么某条内容值得读或应该跳过。
6. 用户可以维护关注主题。
7. 用户可以反馈系统判断是否准确。
8. 系统可以生成每日信息分诊报告。

---

## 15. 后续版本方向

### V1.1：浏览器插件

功能：

- 抓取当前网页标题、URL、正文
- 一键发送到系统
- 页面侧边栏显示阅读建议

---

### V1.2：手机分享入口

功能：

- 从小红书、微信、X、Safari 分享到产品
- 自动创建 ContentItem
- 自动分析

---

### V1.3：向量重复检测

功能：

- 使用 embedding
- pgvector 存储内容向量
- 找相似内容
- 识别观点重复

---

### V1.4：跨平台趋势雷达

功能：

- 自动聚类 topic
- 识别多平台升温主题
- 展示趋势变化

---

### V1.5：个人研究问题

功能：

- 用户添加长期研究问题
- 系统每天把内容映射到研究问题
- 输出“今日对这个问题的新证据”

---

## 16. 给 CodaX / Codex 的首个开发指令

可以直接这样交给它：

```txt
请基于以下需求实现一个 Next.js + TypeScript + Tailwind + Prisma + PostgreSQL 的 MVP 应用，产品名叫“信息分诊台”。

它的核心功能是：用户提交来自 AI 新闻、小红书、公众号、推特/X、网页文章等来源的内容，系统调用 LLM 对内容进行分析，判断该内容应该精读、略读、存档、追踪还是跳过，并生成每日信息分诊报告。

请优先完成以下模块：

1. 项目初始化
2. Prisma 数据模型
3. 内容提交页面
4. 主题设置页面
5. 内容分析 API
6. 内容库页面
7. 内容详情页
8. 今日分诊台首页
9. 每日报告生成 API

请严格按照上面的数据模型、API 设计、页面设计和 Prompt 规范实现。
```

---

## 17. 推荐开发策略

第一版就按这个顺序做，不要一开始陷入平台抓取。

先让用户主动提交内容，验证：

> 系统给出的阅读决策是否真的帮用户省时间。

一旦验证有效，再扩展浏览器插件、手机分享入口、向量重复检测和跨平台趋势雷达。

---

## 18. 缺口补齐（开工前冻结）

本节用于补齐当前 MVP 从“产品蓝图”到“工程可执行”之间的关键缺口。

### 18.1 技术路线冻结

为避免实现过程中分叉，MVP 统一采用以下路线：

- 前后端：Next.js（App Router + Route Handlers）
- 语言：TypeScript
- 数据层：Prisma + PostgreSQL（Supabase）
- LLM：Anthropic API（首选），保留后续多模型扩展点
- 部署：Vercel + Supabase

冻结原则：

1. MVP 阶段不引入 FastAPI 并行后端
2. MVP 阶段不拆分微服务
3. 仅在“阻塞上线”的情况下调整技术路线

---

### 18.2 测试基线（MVP 必做）

MVP 不追求一次到位的全量自动化，但必须保证主链路稳定。

#### 测试框架

- 单元/集成测试：Vitest
- API 集成：Vitest + 测试数据库
- 端到端：Playwright

#### 必测清单

1. 提交链路
   - 单条提交成功
   - 批量提交可部分成功并返回失败项
   - URL-only 内容可提交，但不可分析且不进入日报
2. 分析链路
   - 正常 JSON 输出可入库
   - 非法 JSON 输出触发失败状态
   - 重新分析会让旧分析失效，新分析成为 current
3. 查询链路
   - 内容列表筛选（动作/平台/主题/日期）正确
   - 内容详情展示字段完整
4. 日报链路
   - 可生成 mustRead/skim/skip/trackedTopics/anomalySignals
   - 同一用户同一天重复生成只保留一份报告
5. 反馈与来源
   - 反馈入库成功
   - 拉黑来源后 `Source.isBlocked=true`，新内容默认降权或倾向跳过
6. 认证与隔离
   - 未登录 API 返回 `401`
   - 跨用户资源不可访问

#### 测试通过门槛

- 所有 API 集成测试通过
- 1 条完整 E2E 黄金路径通过：提交 -> 分析 -> 列表 -> 详情 -> 反馈 -> 日报
- 关键规则函数覆盖率 >= 90%（推荐动作兜底、重复度判定、异常信号聚合）

---

### 18.3 LLM 可靠性与幂等策略

为避免线上出现“分析结果不可用”或“重复分析写脏数据”，MVP 增加以下约束：

#### 输出契约

- 模型必须返回严格 JSON（已在 Prompt 约束）
- 后端使用 schema 校验，校验失败直接标记 `ANALYSIS_FAILED`
- 不接受 Markdown 包裹 JSON

#### 超时与重试

- 单次分析超时：30 秒
- 自动重试：最多 2 次（仅网络超时/5xx）
- 非法 JSON 不自动重试，直接失败并记录原始输出

#### 幂等与并发

- `POST /api/content/:id/analyze` 需支持幂等键（contentId + requestId）
- 同一 contentId 并发分析时，仅允许一个进行中任务
- 重复请求返回已有结果或进行中状态，不重复写入多份分析

#### 状态机约束

`PENDING_ANALYSIS -> ANALYZED | ANALYSIS_FAILED`

- 只有分析任务可以改写上述状态
- “重新分析”必须显式触发新任务，并记录 `analyzedAt`、`modelName`、`requestId` 与 `version`
- 重新分析时旧分析设为 `isCurrent=false` 并写入 `supersededAt`，新分析 `version + 1` 且 `isCurrent=true`

---

### 18.4 可观测性最小集

MVP 至少记录以下日志字段，便于问题追踪：

- `contentItemId`
- `userId`
- `requestId`
- `modelName`
- `latencyMs`
- `tokenUsage`（若 API 提供）
- `status`（success/failed/timeout/invalid_json）
- `errorType`

每日报告生成同样记录生成耗时和失败原因。

---

### 18.5 开工准入清单（DoR）

只有满足以下条件，才进入编码阶段：

1. 技术路线已冻结（18.1）
2. 数据库连接方式与环境变量命名已确定
3. 测试框架与必测清单已确认（18.2）
4. LLM 失败策略与幂等策略已确认（18.3）
5. 首批里程碑范围已锁定为第 1-3 步（项目初始化、模型、提交链路）
6. MVP 决策默认值已冻结（18.7）

---

### 18.6 里程碑验收增强（补充到第 1-3 步）

- 第 1 步完成标准新增：本地测试命令可执行（即使是空测试）
- 第 2 步完成标准新增：迁移可重复执行且无漂移
- 第 3 步完成标准新增：提交 API 与页面具备基础输入校验与错误提示

---

### 18.7 MVP 决策默认值

本节冻结实现默认值。若其他章节出现宽泛表述，以本节为准。

#### 认证与 `userId`

- MVP 直接使用 Supabase Auth，不做匿名固定用户模式。
- 所有 Route Handlers 从 Supabase session 获取当前用户。
- 所有查询和写入必须按 `userId` 过滤。
- 找不到 session 返回 `401`；资源存在但不属于当前用户时返回 `404`。
- seed 数据创建一个测试用户，仅用于本地开发和测试。

#### URL-only 提交

- MVP 不做平台自动抓取，也不做通用网页正文抓取。
- 提交校验规则：`url` 与 `rawText` 至少二选一。
- 如果只有 URL，没有正文：保存 ContentItem，状态为 `PENDING_ANALYSIS`，但分析按钮置灰并提示“请补充正文或摘要后分析”。
- URL-only 内容可出现在内容库，但不进入 LLM 分析和日报候选池。

#### 每日报告窗口

- 日报统一使用 `Asia/Shanghai` 自然日，不使用“最近 24 小时”作为主窗口。
- `date=YYYY-MM-DD` 表示上海时区当天 `00:00:00` 到 `23:59:59.999`。
- `DailyReport` 按 `userId + date` 唯一。
- 重复生成同一天报告时覆盖同一条 DailyReport，不创建多份。

#### 重新分析与审计

- 系统保留一个当前有效分析，同时支持历史追踪。
- `ContentAnalysis` 使用 `version`、`requestId`、`isCurrent`、`supersededAt` 记录分析版本。
- 重新分析时，旧分析设为 `isCurrent=false` 并写入 `supersededAt`；新分析 `version + 1` 且 `isCurrent=true`。
- 内容详情默认展示当前分析，历史分析暂不做 UI，只保留数据。

#### 反馈副作用

- 反馈不会训练模型，但部分反馈会同步更新 MVP 规则数据。
- 仅记录、不产生副作用：`ACCURATE`、`ACTUALLY_IMPORTANT`、`SHOW_LESS_LIKE_THIS`。
- `SOURCE_HIGH_QUALITY` 提高 `Source.qualityScore`，`SOURCE_LOW_QUALITY` 降低 `Source.qualityScore`，分数保持在 `0-100`。
- `BLOCK_THIS_SOURCE` 设置 `Source.isBlocked=true`。
- `TRACK_THIS_TOPIC`：如果对应主题不存在，创建一个 active Topic；如果存在则保持启用。
- 被拉黑来源的新内容仍可提交，但分析兜底规则会提高跳过倾向。
