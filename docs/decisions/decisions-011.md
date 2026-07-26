# 35. Decisions

## DEC-059

### Status

Accepted

### Title

Source 分为 Reference、Raw Snapshot、Extracted Content 与 Normalized Source Version

### Decision

ContentOS 将 Source Pipeline 分为：

```text
Source Reference
→ Raw Snapshot
→ Extracted Content
→ Normalized Source Version
```

不同对象分别保存来源身份、原始证据、机器提取结果和用户确认后的研究输入。

### Reason

URL、原始网页、机器提取正文和用户修正正文具有不同的用途与可信状态。

将它们合并成一个可变对象会破坏：

- 来源追踪
- 提取诊断
- 用户修正记录
- 版本依赖
- Research 可重复性

### Impact

Source 数据模型和 Workspace 需要明确展示不同 Source 层级。

Research Agent 不直接消费 Source Reference 或未经确认的 Raw Snapshot。

---

## DEC-060

### Status

Accepted

### Title

Raw Snapshot 不可变，重新抓取创建新 Snapshot

### Decision

Raw Snapshot 创建后不得被覆盖或编辑。

重新抓取同一 Source 时创建新的 Snapshot Version。

### Reason

网页内容可能发生变化。

覆盖旧 Snapshot 会导致系统无法确认历史 Research 和 Artifact 当时使用了什么原始材料。

### Impact

Source Storage 需要支持多个 Snapshot，并由后续 Extraction 明确引用具体 Snapshot。

---

## DEC-061

### Status

Accepted

### Title

MVP 支持 URL、Pasted Text、Markdown 和 TXT Source

### Decision

首个 ContentOS MVP 支持：

- Public URL
- Pasted Text
- `.md`
- `.txt`

PDF、OCR、音频和视频暂不进入首个 Vertical Slice。

### Reason

这四类输入可以覆盖主要内容研究场景，同时保持 Source Pipeline 的可控复杂度。

PDF 会额外引入页码、表格、多栏布局、图片和 OCR 等问题。

### Impact

MVP 需要实现 URL Capture、Text Input 和基础文件读取。

PDF 应作为后续独立 Source Adapter 设计。

---

## DEC-062

### Status

Accepted

### Title

Content Package 支持一个 Primary Source 和最多五个 Supporting Sources

### Decision

一个 Content Package 包含：

```text
1 Primary Source
+
0–5 Supporting Sources
```

Primary Source 定义主要内容中心，Supporting Sources 提供补充、验证或不同观点。

### Reason

只支持单 Source 无法充分验证 Research Agent 和跨来源内容重构的价值。

无限 Source 又会增加上下文、引用、成本和交互复杂度。

### Impact

Source Workspace、Research Input 和 Evidence References 需要支持多 Source 及 Source Role。

Supporting Source 数量限制可在后续根据真实使用需求调整。

---

## DEC-063

### Status

Accepted

### Title

Research Agent 只消费已批准的 Normalized Source Version

### Decision

Research Agent 的正式输入必须是具体的：

```text
approved Normalized Source Version
```

Research Agent 不负责网页抓取，也不直接使用未经确认的原始 HTML。

### Reason

抓取与分析是不同职责。

让 Research Agent 直接处理不稳定或未经审核的材料会降低结果可重复性和可追溯性。

### Impact

Source 必须先通过 Capture、Extraction、Normalization 和 Approval，才能进入 Research 阶段。

Research Input 需要记录每个 Source 的具体 Version ID。

---

## DEC-064

### Status

Accepted

### Title

Research Result 使用结构化输出并保留 Source Evidence

### Decision

Research Result 至少包含：

- Source Summaries
- Key Claims
- Supported Facts
- Unsupported or Uncertain Claims
- Tensions
- Important Terms
- Content Opportunities
- Questions for Human Opinion
- Source Evidence References

Evidence Reference 使用：

```text
Source Version
+
Heading Path or Paragraph Index
+
Evidence Snippet
```

### Reason

普通摘要无法支持：

- 事实与观点分离
- 来源核查
- 多 Source 冲突
- 下游写作约束
- Human Opinion 引导
- Claim 级追踪

### Impact

Research Agent 必须输出符合 Schema 的结构化结果。

Research Review UI 需要支持查看 Claim 与对应证据。

---

## DEC-065

### Status

Accepted

### Title

Source 变化后依赖的 Research Result 标记为 Stale

### Decision

当 Research Result 依赖的 Source Version发生变化，或者 Source 被添加、删除或替换时，已有 Research Result 标记为：

```text
stale
```

旧 Research Result 不被删除，但不能继续被视为当前研究结果。

### Reason

研究结论只对其实际使用的 Source 集合和版本有效。

如果上游材料变化而研究状态保持不变，用户可能基于过时分析继续生成内容。

### Impact

系统需要保存 Source Dependency，并实现确定性的 Stale Detection。

用户需要重新生成并批准新的 Research Result Version。

---

## DEC-066

### Status

Accepted

### Title

网页抓取失败必须提供人工降级路径

### Decision

URL Capture 失败时，用户可以：

- Retry
- Paste Text
- Upload Markdown
- Upload TXT
- Preserve URL for later
- Remove Source

一个 Source 抓取失败不得永久阻断整个 Content Package。

### Reason

公开网页可能因登录、验证码、JavaScript、反爬、地区限制或页面结构而无法自动获取。

用户仍然需要一种可控方式继续内容生产。

### Impact

Source Workspace 必须显示明确失败原因和下一步操作。

自动绕过访问限制不属于 MVP。
