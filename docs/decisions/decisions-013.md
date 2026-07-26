# 44. Decisions

## DEC-076

### Status

Accepted

### Title

Writer Agent 只负责从已批准内容基础生成 Blog Draft

### Decision

Writer Agent 负责：

- Blog Plan
- 文章结构
- 内容组织
- Markdown Draft
- 标题和元数据建议
- Internal Provenance
- Research Gap 和 Warning 输出

Writer Agent 不负责：

- Source 抓取
- 外部搜索
- Research 修改
- Blog 审批
- Blog 发布
- 最终公开 URL

### Reason

Source、Research、Writing、Review 和 Publishing 具有不同的职责、权限与风险。

将这些职责合并到 Writer Agent 会破坏审核链路和内容可追溯性。

### Impact

Writer Agent 不能自行把 Approved Research 之外的外部事实加入正式 Draft。

发现内容缺口时必须返回 Research Gap。

---

## DEC-077

### Status

Accepted

### Title

Writer Agent 输入必须引用具体 Research 与 Human Opinion Version

### Decision

Writer Agent 的正式输入包含：

- Approved Research Result Version
- Confirmed Human Opinion Version，或明确 Research-based Mode
- Source Evidence Bundle
- Blog Generation Request
- Available Brand Rules

### Reason

版本化输入可以保证生成结果：

- 可重复
- 可追踪
- 可验证
- 可比较
- 可参与依赖失效传播

### Impact

Blog Artifact 必须保存具体的：

```text
research_result_version_id
human_opinion_version_id
```

以及对应 Generation Request。

---

## DEC-078

### Status

Accepted

### Title

Writer Agent 采用 Plan-first 两阶段生成

### Decision

Writer Agent 先生成 Blog Plan，再根据 Plan 生成 Markdown Draft。

Blog Plan 属于 Generation Metadata，不成为第二份 Canonical Blog Body。

Outline Review 是可选步骤，不作为每篇 Blog 的强制审批点。

### Reason

Plan-first 可以降低：

- 文章结构混乱
- 内容重复
- Research 遗漏
- Human Opinion 放置错误
- Provenance 丢失
- 引用规划失败

### Impact

Writer Agent Runtime 需要支持：

```text
Plan Generation
→ Plan Validation
→ Draft Generation
```

---

## DEC-079

### Status

Accepted

### Title

Blog 必须采用 Synthesis-first，而不是 Source 顺序改写

### Decision

Writer Agent 根据：

- 文章目的
- 目标读者
- Approved Research
- Confirmed Human Opinion
- Brand Rules

创建新的文章结构。

默认不得沿用 Primary Source 的章节顺序进行逐段同义改写。

### Reason

ContentOS 的核心价值是 Content Re-creation，而不是自动摘要、同义替换或洗稿。

### Impact

Blog Plan、Writer Prompt、Validator 和 Source-overlap 检查需要关注：

- 结构重组
- Source 独特措辞
- 长文本重合
- 逐段改写风险

---

## DEC-080

### Status

Accepted

### Title

所有具体事实必须可追溯到已审核 Research 与 Source Evidence

### Decision

Writer Agent 不得仅依靠模型记忆加入具体事实。

Blog 中的外部事实必须引用：

```text
Accepted Research Item
或
Corrected Research Item
```

并能够追溯至 Source Evidence。

`needs_verification` 内容只能以明确不确定的方式表达。

### Reason

模型知识未经本次 Source 与 Research 流程审核，不能作为当前 Content Package 的正式事实来源。

### Impact

Blog Provenance、Research Usage Validation 和 Source Evidence Reference 成为 Draft 生成的必要组成部分。

---

## DEC-081

### Status

Accepted

### Title

Creator-led 与 Research-based Blog 使用不同生成约束

### Decision

Creator-led Blog 可以使用：

- Confirmed Human Opinion
- Confirmed Personal Experience
- Confirmed first-person expression

Research-based Blog 不得包含未经确认的：

- 第一人称立场
- 第一人称经历
- 共同经验
- Creator-specific conclusion

### Reason

输出模式必须真实反映用户是否提供了可追溯的人类贡献。

### Impact

Writer Agent Prompt、Blog Artifact 和 Validators 必须读取：

```text
content_mode
```

---

## DEC-082

### Status

Accepted

### Title

内部 Provenance 与公开 Citation 分离

### Decision

ContentOS 内部保存：

- Blog Statement
- Research Item
- Source Evidence
- Confirmed Human Opinion

之间的依赖关系。

公开 Blog 只输出读者需要的 Attribution、Links 和 References，不公开内部对象 ID。

### Reason

内部审计和公开阅读具有不同目标。

内部需要精确依赖，公开内容需要清晰、自然和可理解的引用。

### Impact

Blog Artifact 使用 Provenance Sidecar。

Blog Export Mapper 负责将适当内容转换成公开引用格式。

---

## DEC-083

### Status

Accepted

### Title

MVP 使用正文 Attribution 加文末 References 的公开引用策略

### Decision

直接引用、具体数据、来源观点和重要争议性事实在正文中进行 Attribution。

文章末尾生成通用 Markdown References Section。

MVP 不依赖特定博客框架的脚注、MDX 或 Citation 组件。

### Reason

该方式兼顾：

- Markdown 可移植性
- 读者体验
- 来源透明度
- PersonalBlog 框架独立性

### Impact

Writer Agent 和 Blog Export Mapper 需要生成：

- 通用 Markdown Links
- Inline Attribution
- References Section

---

## DEC-084

### Status

Accepted

### Title

Direct Quote 必须来自精确 Evidence，并保留公开来源归属

### Decision

引号中的内容必须与 Approved Source Evidence 一致。

无法确认准确原文时，Writer Agent 必须使用意译和来源归属，不得生成近似直接引语。

过长 Direct Quote 触发人工审核 Warning。

### Reason

错误引用和伪造引用会严重损害：

- 内容可信度
- 用户品牌
- 来源关系
- 审核可靠性
- 潜在版权风险控制

### Impact

Quote Validator 必须检查：

- Source Evidence
- Quoted wording
- Public Attribution
- Quote length

---

## DEC-085

### Status

Accepted

### Title

Blog Draft 在进入 Editor 前必须通过确定性 Validation Gate

### Decision

Writer Agent 输出必须经过：

- Schema Validation
- Research Usage Validation
- Human Opinion Validation
- First-person Validation
- Citation Validation
- Dependency Validation
- Content Validation
- Source-overlap Warning

Blocking Error 必须先解决。

Warning 可以携带可见提示进入 Blog Editor。

### Reason

LLM 输出不能直接被视为可靠且符合领域规则的正式对象。

### Impact

Writer Agent 之外需要独立的确定性 Validators。

Chief Editor 根据验证结果执行：

- Continue
- Retry
- Repair
- Return to Research
- Ask for Human Opinion
- Block workflow
