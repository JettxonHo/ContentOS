# 50. Decisions

## DEC-086

### Status

Accepted

### Title

Packaging Agent 直接消费共同 Content Foundation，而不是依赖 Blog

### Decision

Packaging Agent 默认从以下内容生成 Xiaohongshu Artifact：

- Approved Research Result Version
- Confirmed Human Opinion Version，或明确的 Research-based Mode
- Xiaohongshu Generation Request
- Platform Profile
- Available Brand Rules

Blog Artifact 不作为 Packaging Agent 的默认上游事实来源。

### Reason

Blog 和 Xiaohongshu 是同一个 Content Package 的并列输出。

将 Blog 设为默认上游会让小红书变成长文缩写，并引入不必要的间接依赖。

### Impact

Blog 和 Xiaohongshu 分别记录自己的 Research 与 Human Opinion 依赖。

---

## DEC-087

### Status

Accepted

### Title

Packaging Agent 使用版本化输入契约

### Decision

Packaging Agent 的正式输入必须包含：

- Approved Research Result Version
- Confirmed Human Opinion Version，或 Research-based Mode
- Source Evidence Bundle
- Xiaohongshu Generation Request
- Platform Profile Version
- Available Brand Rules

### Reason

明确的版本化输入支持：

- 可重复生成
- 结果验证
- 依赖失效传播
- Agent 调试
- 版本比较
- 审计

### Impact

Xiaohongshu Artifact 必须记录所有上游依赖版本。

---

## DEC-088

### Status

Accepted

### Title

Packaging Agent 使用 Plan-first 两阶段生成

### Decision

Packaging Agent 先生成 Packaging Plan，再生成 Xiaohongshu Artifact。

Packaging Plan 定义：

- Narrative Pattern
- Page Purpose
- Research allocation
- Opinion allocation
- Attribution plan
- Content density
- Visual Brief

Packaging Plan 不成为最终发布内容。

### Reason

Plan-first 可以减少：

- 页面重复
- 叙事断裂
- 信息密度不均
- Human Opinion 放置错误
- Caption 重复
- 来源归属遗漏

### Impact

Packaging Runtime 需要支持：

```text
Plan Generation
→ Plan Validation
→ Artifact Generation
```

---

## DEC-089

### Status

Accepted

### Title

Xiaohongshu Artifact 分离平台标题、封面文案、页面内容、Caption 与 Hashtags

### Decision

Xiaohongshu Artifact 独立保存：

- Platform Title Candidates
- Selected Platform Title
- Cover Title
- Cover Subtitle
- Page-level Content
- Caption
- CTA
- Hashtags

这些字段不得合并为一个通用文案字段。

### Reason

这些字段服务于不同的展示位置、传播任务和长度约束。

### Impact

Workspace、Schema、Versioning、Validation 和 Export 必须支持这些字段独立编辑。

---

## DEC-090

### Status

Accepted

### Title

Carousel 采用 6～10 页的叙事链，每页承担一个主要信息目的

### Decision

MVP Xiaohongshu Carousel 使用 6～10 页，默认建议为 8 页。

每页必须拥有明确 `page_purpose` 和一个主要信息任务。

Packaging Agent 不得为了达到页数而重复内容，也不得在一页中堆积多个无关主题。

### Reason

清晰的页面职责有利于：

- 阅读节奏
- 内容编辑
- 视觉设计
- 模板选择
- Provenance
- Render 稳定性

### Impact

Narrative Validator 和 Density Validator 必须检查页数、重复、断裂和页面过载。

---

## DEC-091

### Status

Accepted

### Title

页面语义 Contract 与视觉组件分离

### Decision

Packaging Agent 输出：

- Page Purpose
- Content Payload
- Emphasis
- Content Density
- Research and Opinion references
- Content-side Visual Brief

Visual Agent 决定：

- Component
- Layout
- Visual hierarchy
- Asset requirement
- Theme usage

Render Engine 负责确定性像素输出。

### Reason

内容语义不应绑定单一视觉模板，Packaging Agent 也不应承担视觉设计职责。

### Impact

Xiaohongshu Page Contract 和 Design Specification 之间建立明确的 Agent 边界。

---

## DEC-092

### Status

Accepted

### Title

Caption 是独立内容表达，不重复整个 Carousel

### Decision

Caption 用于：

- 补充背景
- 总结核心观点
- 表达已确认的创作者判断
- 邀请讨论
- 提供 References
- 补充无法放入页面的信息

Caption 不得完整复制 Carousel 页面正文。

### Reason

Caption 和 Carousel 承担不同的阅读任务。

完整重复会降低信息价值并增加发布内容冗余。

### Impact

Packaging Validator 需要进行基础重复检测。

---

## DEC-093

### Status

Accepted

### Title

Creator-led 与 Research-based 小红书遵循不同第一人称约束

### Decision

Creator-led 内容可以使用具有 Confirmed Human Opinion Reference 的第一人称观点和经历。

Research-based 内容不得虚构：

- 第一人称立场
- 第一人称经历
- 团队经历
- 共同经验
- Creator-specific judgment

### Reason

平台化表达不能突破 Human Opinion 和 Originality Provenance 边界。

### Impact

Packaging Prompt、Xiaohongshu Artifact 和 Validators 必须读取 `content_mode`。

---

## DEC-094

### Status

Accepted

### Title

Platform Profile 作为版本化输入，而不是永久硬编码在 Prompt 中

### Decision

小红书内容约束通过版本化 Platform Profile 提供。

MVP 使用人工维护的静态 Platform Profile。

完整 Platform Intelligence 和实时趋势系统不进入首个 Vertical Slice。

### Reason

平台规范和创作习惯会变化。

将规则永久写死在 Prompt 中会降低：

- 可维护性
- 可审计性
- 可测试性
- 规则更新能力

### Impact

Packaging Agent Input 和 Xiaohongshu Artifact 必须记录：

```text
platform_profile_version
```

---

## DEC-095

### Status

Accepted

### Title

Packaging Agent 不预测或承诺流量结果

### Decision

Packaging Agent 可以提供：

- Title suggestions
- Cover suggestions
- Page narrative
- CTA recommendations
- Hashtag recommendations

但不得声称：

- 某标题必然成为爆款
- 某方案保证点击率
- 某标签保证流量
- 某表达代表实时趋势

没有实时数据支持时，Hashtags 仅根据主题、受众和内容类型推荐。

### Reason

内容包装建议与实际平台分发结果之间不存在可保证的因果关系。

### Impact

Agent 输出、产品文案和 UI 不得使用未经支持的流量承诺。

---

## DEC-096

### Status

Accepted

### Title

Xiaohongshu Artifact 通过内容审批后才能进入 Visual Agent

### Decision

Xiaohongshu 内容使用：

```text
Mutable Working Copy
+
Immutable Artifact Versions
```

Visual Agent 只消费具体的 Approved Xiaohongshu Artifact Version。

Visual Agent 不直接消费临时 Working Copy。

### Reason

视觉设计必须建立在稳定内容上。

未确认内容持续变化会导致：

- Design Specification 失效
- Asset 需求变化
- Rendered Output 失效
- Provenance 不一致
- 重复设计和渲染

### Impact

工作流保持：

```text
xhs_generated
→ xhs_review
→ xhs_approved
→ design_generated
```

---

## DEC-097

### Status

Accepted

### Title

Xiaohongshu Artifact 进入 Visual Agent 前必须通过确定性 Validation Gate

### Decision

Packaging 输出必须经过：

- Schema Validation
- Narrative Validation
- Research Validation
- Human Opinion Validation
- Title Validation
- Density Validation
- Citation Validation
- Dependency Validation

Blocking Error 必须解决。

Warning 可以携带可见提示进入内容审核。

### Reason

LLM 生成的页面组合不能直接被视为可设计、可渲染的正式内容对象。

### Impact

Packaging Agent 之外需要独立 Validators。

Chief Editor 根据验证结果决定：

- Continue
- Repair
- Retry
- Return to Research
- Return to Human Opinion
- Block workflow
