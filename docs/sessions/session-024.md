# ContentOS Session-024

**Status:** Formalized  
**Session Type:** Final MVP Scope and Implementation Roadmap  
**Topic:** MVP Scope, Milestones, Deliverables, Codex Work Items, Launch Criteria, and Implementation Governance  
**Date:** 2026-07-27  
**Accepted Decisions:** DEC-267～DEC-294  
**Previous Session:** Session-023  
**Core Architecture Sessions:** Completed

---

## 1. Context

Session-001～Session-023 已经确定 ContentOS 的主要产品和工程体系：

```text
Product Positioning
Domain Model
Artifact Versioning
Source and Research
Human Opinion
Blog and Xiaohongshu
Visual and Rendering
Workflow Orchestration
Workspace UX
API and Data Contracts
Agent Runtime
Security and Privacy
Technical Architecture
Testing and Release Gates
```

核心价值链已经明确为：

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

本 Session 负责将此前的设计收敛成：

1. 最终 MVP 范围；
2. 明确的非 MVP 范围；
3. M0～M8 实施路线；
4. 每个 Milestone 的交付物；
5. 每个 Milestone 的 Exit Criteria；
6. Coding Agent 的实施规则；
7. Documentation 和 Decision Governance；
8. MVP 开工与发布条件；
9. 最终 MVP Definition of Done。

本 Session 是 ContentOS 产品与技术架构阶段的最后一个核心 Session。

---

## 2. MVP 最终定义

ContentOS MVP 是：

> 一个面向单个内容创作者的、桌面优先的 Personal AI Content Studio。用户输入一个主要信息来源和少量辅助来源，经过可审核、可追踪、可恢复的 Research、Human Opinion、Blog、小红书、Design、Render 和 Export 工作流，将外部信息转化为个人内容资产。

ContentOS MVP 不是：

- 通用聊天机器人；
- 通用 Agent 平台；
- 通用 Workflow Builder；
- 自动发布平台；
- 企业内容协作系统；
- 通用知识库；
- 通用设计工具；
- 只在 Codex 中运行的脚本工作流。

ContentOS 是一个可部署、可持续使用的 Private Web Application。

---

## 3. MVP 核心价值链

完整 MVP 用户路径：

```text
Public URL
Pasted Text
Markdown
Text File
        ↓
Source Capture
        ↓
Normalized Source Version
        ↓
Research Result
        ↓
Human Opinion
        ↓
Content Foundation
        ├───────────────────────┐
        ↓                       ↓
Blog Artifact             Xiaohongshu Artifact
        ↓                       ↓
Blog Export              Design Specification
                                ↓
                           Final Render
                                ↓
                      Xiaohongshu Export
```

Blog 和 Xiaohongshu：

- 使用同一个 Approved Content Foundation；
- 分别规划和生成；
- 分别拥有 Working Copy、Version 和 Approval；
- 不将 Blog 简单压缩为小红书；
- 不共享一个可编辑正文作为双平台真相。

---

## 4. MVP 核心用户

首版目标用户是：

```text
Single Creator
或
Single Product / Operations Professional
```

典型用户特征：

- 经常阅读文章、报告和行业资料；
- 希望持续积累自己的观点和内容资产；
- 需要输出 Blog 和小红书内容；
- 希望 AI 降低研究、写作和排版成本；
- 不希望 AI 自动替自己发布；
- 需要知道内容使用了哪些来源；
- 需要区分 AI 观点与自己的真实观点；
- 愿意审核、修改和批准内容；
- 希望内容历史可以追踪和恢复。

首版不以企业团队和多人内容协作为核心用户场景。

---

## 5. MVP 核心用户任务

用户的核心 Job to Be Done 是：

> 从一个值得讨论的信息来源出发，形成一套有证据、有个人观点、可分别发布为 Blog 和小红书的内容包。

ContentOS 应减少以下工作：

- 在多个聊天中重复粘贴上下文；
- 手动维护 Research、Blog 和小红书版本；
- 猜测 AI 使用了什么来源；
- 手动区分自己的观点和 AI 补充；
- 从 Blog 机械压缩小红书；
- 手动制作每一张小红书图片；
- 在多个临时文件中寻找最终版本；
- 因刷新、任务失败或重复请求而丢失状态。

---

## 6. MVP 输入范围

MVP 正式支持四种输入：

```text
Public HTTP/HTTPS URL
Pasted Text
.md
.txt
```

每个 Content Package 支持：

```text
1 Primary Source
+
0–5 Supporting Sources
```

---

## 7. Public URL

用户可以添加公开 HTTP/HTTPS URL。

处理流程：

```text
URL validation
→ SSRF validation
→ Safe Fetch
→ Raw Snapshot
→ Content Extraction
→ Normalized Source Version
→ User Review
→ Approval
```

如果 URL 无法抓取：

- 显示明确 Capture Failure；
- 保留失败原因；
- 不创建虚假的成功 Source；
- 提供 Pasted Text 兜底；
- 允许用户手动创建正式 Source Version。

MVP 不保证处理所有依赖复杂 JavaScript 或登录态的网页。

---

## 8. Pasted Text

用户可以直接粘贴文本作为 Source。

适用场景包括：

- 网页无法安全抓取；
- 用户已经整理过正文；
- 私人笔记；
- 无公开 URL 的资料；
- 访问受限内容的人工摘要。

Pasted Text 必须进入正式 Source 模型：

```text
Source Reference
→ Raw Snapshot
→ Normalized Source Version
```

它不能只作为临时 Prompt 发送给 Agent。

---

## 9. Markdown 与 Text File

MVP 支持：

```text
.md
.txt
```

上传流程：

```text
Upload
→ Quarantine
→ File Validation
→ Encoding Validation
→ Content Extraction
→ Normalized Source Version
```

未通过验证的文件：

- 不能进入 Agent Context；
- 不能成为 Approved Source；
- 不能进入 Export；
- 不能通过普通 Workspace 下载；
- 按 Retention Policy 清理。

---

## 10. MVP 暂不支持的输入

以下内容不属于正式 MVP：

```text
PDF
Office Files
ZIP
Image OCR
Audio
Video
Email Import
Google Drive
Notion
Feishu
RSS Subscription
Automatic Web Search
Authenticated Web Pages
General Browser Automation
```

增加任何新输入格式都需要补充：

- Parser；
- Schema；
- Security Review；
- Quarantine Policy；
- Resource Limit；
- Failure Path；
- Test Matrix；
- Retention and Deletion Rules。

---

## 11. Research Result

MVP Research Result 至少包含：

- Summary；
- Important Facts；
- Claims；
- Source Evidence；
- Tensions；
- Open Questions；
- Needs Verification；
- Primary / Supporting Source usage；
- Provenance references。

用户可以对 Research Item 执行：

```text
Accept
Correct
Exclude
Mark Needs Verification
```

Research 修改流程：

```text
Generated Research Version
→ Review Working Copy
→ Human Corrections
→ New Immutable Version
→ Approval
```

AI 不可直接修改 Approved Research Version。

---

## 12. Human Opinion

MVP 必须保留真实的用户观点来源。

Human Opinion 流程：

```text
Question Cards
→ Raw User Response
→ AI Interpretation
→ User Confirmation
→ Confirmed Opinion Statement
```

支持：

- 3～7 个初始问题；
- 0～2 个有限 Follow-up；
- Skip；
- Enough；
- Use Current；
- Creator-led Mode；
- Research-based Mode。

AI Interpretation：

- 不是用户的最终观点；
- 不能自动被确认为用户观点；
- 不能直接支持第一人称发布内容；
- 必须由用户确认后才能成为 Confirmed Opinion Statement。

---

## 13. Research-based Mode

用户可以跳过 Human Opinion。

此时系统进入：

```text
Research-based Mode
```

Research-based 内容：

- 可以综合 Research；
- 可以提供分析和结构；
- 不得虚构用户经历；
- 不得虚构用户态度；
- 不得使用无依据的第一人称；
- 需要清楚地区分研究结论与个人观点。

Human Opinion Skip 是正式工作流路径，不是错误状态。

---

## 14. Blog 分支

Blog 分支流程：

```text
Approved Research
+
Confirmed Human Opinion
或
Research-based Mode
        ↓
Blog Plan
        ↓
Blog Draft Working Copy
        ↓
Review and Revision
        ↓
Immutable Blog Version
        ↓
Approval
        ↓
Blog Export
```

---

## 15. Blog MVP 内容

Blog Artifact 至少包含：

- Title；
- Summary；
- Markdown Body；
- References；
- Public Citations；
- Internal Provenance；
- Dependency references；
- Content Mode；
- Schema Version。

Blog 使用 Markdown 作为 MVP Canonical Body：

```json
{
  "format": "markdown",
  "schema_version": "contentos.blog-body/markdown-v1",
  "content": "..."
}
```

Blog Outline 和 TOC 可以派生，不形成第二个可编辑正文真相。

---

## 16. Blog 编辑能力

Blog Workspace 至少支持：

- Markdown Editor；
- Autosave；
- Working Copy Revision；
- Optimistic Concurrency；
- Revision Conflict；
- AI Revision Proposal；
- Diff；
- Selective Apply；
- Version History；
- Approval；
- Provenance Drawer；
- Citation Review；
- Validation Summary。

AI 不得静默覆盖用户修改。

---

## 17. Blog Export

Blog Export Package 至少包含：

```text
article.md
manifest.json
assets/
```

`manifest.json` 记录：

- Artifact ID；
- Version ID；
- Schema Version；
- Dependencies；
- File Hash；
- Export Time；
- Export Package Version。

Blog Export 不等于：

- 自动发布到 PersonalBlog；
- 自动创建公开网页；
- 自动提交 Git；
- 自动部署网站；
- Published 状态。

---

## 18. Xiaohongshu 分支

小红书内容流程：

```text
Approved Research
+
Confirmed Human Opinion
或
Research-based Mode
        ↓
Packaging Plan
        ↓
Xiaohongshu Working Copy
        ↓
Review and Revision
        ↓
Immutable XHS Version
        ↓
Approval
        ↓
Design Specification
        ↓
Preview
        ↓
Design Approval
        ↓
Final Render
        ↓
XHS Export Package
```

---

## 19. Xiaohongshu 内容模型

MVP 至少支持：

- Platform Title Candidates；
- Selected Platform Title；
- Cover Title；
- Cover Subtitle，可选；
- 6～10 页 Carousel；
- 默认 8 页；
- Page Purpose；
- Page Content；
- Emphasis；
- Visual Brief；
- Caption；
- CTA；
- Hashtag Suggestions；
- Public References；
- Internal Provenance。

Platform Title、Cover Title 和 Page Heading 必须保持不同职责。

---

## 20. Page Model

每页至少包含：

```text
page_id
page_number
page_purpose
content
emphasis
density
visual_brief
provenance
```

每页应有一个主要目的，例如：

- Cover Hook；
- Problem；
- Explanation；
- Comparison；
- Framework；
- Process；
- Quote；
- Summary；
- CTA；
- References。

不能为了满足页数要求而添加无价值页面。

---

## 21. Caption

Caption 是独立内容单元。

它应：

- 补充 Carousel；
- 提供上下文；
- 支持 CTA；
- 承载适合正文区的信息；
- 避免逐页重复 Carousel。

Caption 不等于把所有页面文字重新拼接一次。

---

## 22. Xiaohongshu Design

MVP Design 能力采用：

```text
Structured Design Specification
+
Versioned Component Registry
+
Versioned Brand Theme
+
Approved Assets
```

MVP 不提供自由画布或 Figma 类编辑体验。

用户可以：

- 预览页面；
- 在允许范围内更换 Component；
- 调整有限视觉参数；
- 选择、批准或拒绝 Asset；
- 请求重新生成 Design；
- 审核并批准 Design Version。

---

## 23. Component Registry

MVP Component Registry 可包含：

```text
cover_hero
single_point
bullet_explanation
comparison_split
process_flow
framework_grid
quote_focus
illustration_explanation
summary_takeaway
references_page
```

Visual Agent：

- 只能选择 Registry 中的 Component；
- 不能生成任意 CSS；
- 不能改变 XHS 正文；
- 不能在视觉层静默删减内容；
- 发现内容不适配时必须返回 Fit Issue 或 Packaging Revision Request。

---

## 24. Asset

MVP Asset 来源可以包括：

- Typography；
- Icons；
- Deterministic Diagram；
- User Upload；
- Reusable Asset Library；
- Generated Illustration。

AI-generated Image：

- 不承载关键中文文字；
- 不承载精确数字；
- 不承载必须准确的流程图；
- 不自动成为 Approved Asset；
- 需要进入 Asset Review；
- 必须拥有版本和来源信息。

---

## 25. Renderer

MVP Final Renderer 使用：

```text
Playwright
+
Pinned Chromium
+
Controlled Linux Container
+
Registered Components
+
Approved Fonts
```

Final Render 输入必须包括：

- Approved XHS Version；
- Approved Design Version；
- Approved Asset Versions；
- Render Profile；
- Component Registry Version；
- Theme Version；
- Font Bundle Version。

Renderer：

- 不调用 LLM；
- 不访问公网；
- 不修改内容；
- 不静默截断；
- 不自动删除文字；
- 不绕过 Missing Font；
- 不使用未经批准的 Asset。

---

## 26. Render Output

Final Render 需要：

- 生成完整 Carousel；
- 输出 PNG；
- 验证尺寸；
- 验证页数；
- 验证文件；
- 验证 Overflow；
- 验证 Clipping；
- 验证 Missing Asset；
- 保存 Environment Fingerprint；
- 保存 File Hash；
- 保持 Atomic Output。

如果任一页面 Final Render 失败，整个 Carousel 不能成为可 Export 的 Final Output。

---

## 27. Xiaohongshu Export

XHS Export Package 至少包含：

```text
images/
post.md
references.md
manifest.json
```

其中：

- `images/` 包含完整 Carousel；
- `post.md` 包含 Platform Title、Caption、CTA、Hashtags；
- `references.md` 包含公开引用；
- `manifest.json` 包含版本、依赖、文件 Hash 和 Export 信息。

MVP 不直接登录或发布到小红书。

---

## 28. 为什么正式 MVP 必须双输出

ContentOS 的核心价值不是：

> 让 AI 写一篇文章。

而是：

> 从同一套有来源和个人观点的 Content Foundation，形成两种独立的平台表达。

因此正式 MVP 必须包含：

```text
Approved Blog Export
+
Approved Xiaohongshu Export
```

只完成 Blog 的系统属于内部 Milestone。

它不能被命名为正式 ContentOS MVP。

---

## 29. Workflow 核心能力

MVP Workflow 至少支持：

- Versioned fixed Workflow Template；
- Workflow Instance；
- Workflow Node State；
- Current Action；
- Task；
- Agent Run；
- Human Gate；
- Pause；
- Resume；
- Cancel；
- Retry；
- Skip，限允许节点；
- Outdated；
- Blocking Error；
- Warning；
- Warning Acknowledgement；
- Workflow Timeline；
- Blog / XHS Parallel Branch；
- Idempotent Command；
- Duplicate Job Protection；
- Late Result Protection。

MVP 不支持用户自定义 Workflow Graph。

---

## 30. Versioning 核心能力

以下能力属于 MVP 核心，不得延期为“高级功能”：

```text
Mutable Working Copy
Immutable Version
Artifact Head
Approval
Dependency Edge
Provenance
Revision Proposal
Outdated State
Optimistic Concurrency
```

没有这些能力，ContentOS 会退化为普通 AI 聊天和文本生成器。

---

## 31. Artifact Head

每个重要 Artifact 应区分：

- Working Copy；
- Latest Version；
- Review Candidate；
- Approved Version。

不能使用一个 `current_version_id` 同时表达所有状态。

---

## 32. Approval

Approval：

- 绑定精确 Immutable Version；
- 记录用户 Actor；
- 记录 Validation Summary；
- 不随 Working Copy 改变；
- 不允许 Blocking Error 存在；
- 保留历史；
- 不修改原 Version。

恢复历史版本时，创建新的 Working Copy 和新 Version。

---

## 33. Dependency 与 Outdated

所有下游 Artifact 绑定精确上游 Version。

例如：

```text
Blog Version 3
→ Research Version 2
→ Human Opinion Version 1
```

当上游出现新的 Approved Version 时：

- 历史下游 Version 保留；
- 当前下游 Artifact 标记 Outdated；
- 不自动删除；
- 不自动替换；
- 需要显式 Regenerate 或 Review；
- Outdated Artifact 不能成为新的 Final Export Candidate。

---

## 34. Provenance

MVP Provenance 需要支持：

- Research Item → Source Evidence；
- Human Opinion → Original Response；
- Blog Claim → Research Item；
- Blog First-person → Confirmed Opinion；
- XHS Page → Research / Opinion；
- Design Element → XHS Field；
- Render Output → Design / Asset / Renderer Version。

Provenance 使用稳定 Locator，而不是只依赖易变化的字符串位置。

---

## 35. Workspace

MVP 顶层页面：

```text
Dashboard
New Content Package
Content Package Workspace
Settings
```

Content Package Workspace 是产品核心界面。

---

## 36. Workspace Shell

Workspace 至少包含：

- Package Header；
- Stage Navigation；
- Current Action；
- Main Structured Workspace；
- Validation Summary；
- Chief Editor Panel；
- Version History；
- Workflow Timeline；
- Branch State；
- Status；
- Advanced Details。

内部 ID、Model Call 和 Dependency Graph 默认使用 Progressive Disclosure。

---

## 37. Stage Editors

MVP 使用专门的 Stage Editor：

- Source Workspace；
- Research Workspace；
- Human Opinion Workspace；
- Blog Editor；
- Xiaohongshu Editor；
- Design Workspace；
- Render / Export Workspace。

不提供一个通用 JSON Editor 作为主要体验。

---

## 38. Chief Editor

MVP Chief Editor 支持：

- 解释当前状态；
- 解释 Blocking Error；
- 建议下一步；
- 生成 Workflow Command Proposal；
- 生成 Revision Proposal；
- 引导 Human Opinion；
- 跳转至对应 Stage；
- 展示影响范围。

Chief Editor 不支持：

- 直接改写 Canonical Artifact；
- 直接批准；
- 自动发布；
- 绕过 Workflow；
- 任意调用工具；
- 创建未知 Agent；
- 修改 Agent Spec；
- 修改 Prompt；
- 修改 Security Policy。

---

## 39. 安全范围

正式 MVP 至少包含：

- Authentication；
- Secure Session；
- Owner Authorization；
- Private by Default；
- Service Identity；
- Secret Reference；
- Provider Data Boundary；
- Prompt Injection Containment；
- SSRF Protection；
- Upload Quarantine；
- Markdown Sanitization；
- Private Object Storage；
- Temporary Scoped URL；
- Export Allowlist；
- Log Redaction；
- Security Audit；
- Archive；
- Delete Request；
- Backup；
- Restore Verification；
- Deletion Ledger 基础能力。

M7 负责集中 Hardening，但各安全能力必须在首次引入相关功能时实施。

---

## 40. 质量范围

MVP 至少包含：

- Static Tests；
- Contract Tests；
- Domain Unit Tests；
- Validator Tests；
- Repository Tests；
- Migration Tests；
- API Integration Tests；
- Queue Recovery Tests；
- Workflow Scenario Tests；
- Fake Provider；
- Agent Eval Core Set；
- Agent Eval Adversarial Set；
- Holdout Set；
- Render Snapshot；
- Complete Vertical Slice；
- Security Gate；
- Recovery Drill；
- Release Evaluation Record。

---

## 41. 正式排除范围

### Product

```text
Multi-user Collaboration
Organization / Team
RBAC Administration UI
Public Registration
Public Share
Automatic Publishing
Publishing Schedule
Content Calendar
Performance Analytics Dashboard
Comment Management
Commercial Billing
Template Marketplace
Plugin Marketplace
General CMS
```

### Agent

```text
Autonomous Web Search
Unrestricted Tool Calling
Agent-created Sub-agents
Self-modifying Agent Spec
Self-modifying Prompt
Self-modifying Workflow
Automatic Approval
Automatic Publishing
Automatic Training from User Behavior
```

### Input and Media

```text
PDF
Office
ZIP
OCR
Audio
Video
Email
Cloud-drive Integration
Authenticated Browser Automation
```

### Infrastructure

```text
Kubernetes
Kafka
Temporal
Microservice Databases
Multi-region Deployment
High-availability SLA
Serverless-only Runtime
```

---

## 42. MVP 交付形态

MVP 以：

```text
Private Web Application
```

交付。

首版部署可以是：

```text
Single Container Host
+
PostgreSQL
+
Redis
+
Private S3-compatible Object Storage
```

Codex 是主要实现环境之一。

Codex 本身不是 ContentOS 的产品运行环境。

---

## 43. 实施原则

ContentOS 使用：

```text
Thin Vertical Slice
+
Limited Architecture Runway
+
Continuous Hardening
```

每个阶段尽量包含：

```text
UI
API
Domain
Persistence
Queue where required
Validation
Tests
Documentation
```

不采用：

```text
先完成全部数据库
→ 再完成全部后端
→ 再完成全部前端
→ 最后连接
```

---

## 44. Architecture Runway

Architecture Runway 只建立下一个 Vertical Slice 所必需的可靠基础。

例如在 M1 之前需要：

- Repository；
- TypeScript；
- Database；
- Migration；
- Authentication foundation；
- Owner；
- Content Package；
- Object Store。

不需要提前完成：

- Public Share；
- 多租户；
- 所有 Agent；
- 通用 Eval Dashboard；
- Workflow Builder；
- Kubernetes；
- Plugin Platform。

---

# 45. Implementation Milestones

ContentOS 采用九个正式实施 Milestone：

```text
M0 — 开工基线
M1 — 产品骨架与领域基础
M2 — Source 与 Workflow 基础
M3 — Research
M4 — Human Opinion 与 Blog
M5 — Xiaohongshu Content
M6 — Design、Render 与 Export
M7 — Hardening 与 Release Gate
M8 — Private MVP Release
```

正式 MVP 只在 M8 达成。

---

# 46. M0 — 开工基线

## Goal

建立一个可重复、可审查、适合 Codex 持续实施的 Repository 和开发环境。

---

## M0 Deliverables

### Repository

```text
pnpm Workspace
Node.js 24 pin
TypeScript strict configuration
Single lockfile
apps/
packages/
schemas/
docs/
migrations/
docker/
```

### Application Skeletons

```text
apps/web
apps/api
apps/worker
apps/fetcher
apps/renderer
```

### Initial Packages

```text
packages/core
packages/contracts
packages/config
packages/testing
```

### Infrastructure

```text
Docker Compose
PostgreSQL
Redis
S3-compatible local Object Storage
```

### Quality

```text
CI skeleton
Lint
Formatting
Typecheck
Test runner
Example Unit Test
Example Integration Test
```

### Documentation

```text
README.md
AGENTS.md
docs/product/mvp-scope.md
docs/architecture/technical-architecture.md
docs/architecture/domain-overview.md
docs/architecture/repository-structure.md
docs/architecture/workflow-overview.md
docs/security/security-baseline.md
docs/quality/test-strategy.md
docs/implementation/roadmap.md
```

---

## M0 Demo

开发者可以：

```text
Clone Repository
→ Install dependencies
→ Start local infrastructure
→ Start Web and API
→ Run Typecheck
→ Run Tests
```

---

## M0 Exit Criteria

- `pnpm install` 成功；
- Node.js 版本被固定；
- `docker compose up` 成功；
- Web 可启动；
- API 可启动；
- PostgreSQL 可连接；
- Redis 可连接；
- Object Storage 可连接；
- CI 可以执行；
- Typecheck 通过；
- Unit Test 通过；
- Integration Test 通过；
- Repository 中不存在 Secret；
- README 可以指导新开发者完成启动；
- `AGENTS.md` 已存在并引用权威文档；
- 当前真相文档与已接受 DEC 一致。

M0 不实现业务功能。

---

# 47. M1 — 产品骨架与领域基础

## Goal

实现 ContentOS 的基本用户、Package、Artifact Versioning 和 Workspace Shell。

---

## M1 Domain Deliverables

- User；
- Owner；
- Content Package；
- Artifact；
- Working Copy；
- Immutable Version；
- Artifact Head；
- Object Reference；
- Archive；
- Revision；
- Opaque ID；
- Basic Audit metadata。

---

## M1 Infrastructure Deliverables

- Authentication；
- Session；
- Server-side Authorization；
- PostgreSQL Schema；
- Drizzle；
- SQL Migration；
- ObjectStore Port；
- Local S3 Adapter；
- Structured Logger；
- Redaction；
- Correlation ID；
- Typed Configuration；
- Error Envelope。

---

## M1 UI Deliverables

- Login；
- Dashboard Empty State；
- New Content Package；
- Content Package Workspace Shell；
- Package Header；
- Stage Navigation；
- Current Action Placeholder；
- Package Settings；
- Archive action。

---

## M1 Demo

```text
Login
→ Create Content Package
→ Open Workspace
→ Edit Package metadata
→ Refresh
→ See persisted state
→ Archive Package
```

---

## M1 Exit Criteria

- Authentication 生效；
- Owner Authorization 生效；
- Package 使用 Opaque ID；
- 不能通过前端隐藏按钮代替权限；
- Content Package 可创建和读取；
- Workspace Refresh 后状态保留；
- Working Copy Revision 可用；
- Immutable Version 数据结构可创建；
- Artifact Head 模型可用；
- Migration Test 通过；
- API Error Contract 可用；
- Archive 与 Delete 没有混用；
- 日志不包含 Session Secret；
- M1 Demo 完成；
- 文档同步完成；
- 无 Blocking Defect。

---

# 48. M2 — Source 与 Workflow 基础

## Goal

建立第一个正式异步工作流和 Source 版本体系。

---

## M2 Source Deliverables

- Source Reference；
- Public URL Source；
- Pasted Text Source；
- `.md` Upload；
- `.txt` Upload；
- Quarantine；
- File Validation；
- Raw Snapshot；
- Extracted Content；
- Normalized Source Version；
- Primary Source；
- Supporting Source；
- Source Review；
- Source Approval；
- Capture Failure；
- Manual fallback。

---

## M2 Workflow Deliverables

- Workflow Template v1；
- Workflow Instance；
- Workflow Node State；
- Workflow Command；
- Task；
- Task State；
- Transactional Outbox；
- Outbox Dispatcher；
- BullMQ；
- Queue Payload；
- Worker Lease；
- Heartbeat；
- Reconciliation；
- Pause；
- Resume；
- Cancel；
- Retry；
- Workflow Timeline；
- SSE；
- Polling fallback。

---

## M2 Process Deliverables

- Fetcher Container；
- Fetcher Service Identity；
- Restricted Network Policy；
- SSRF Validation；
- DNS Validation；
- Redirect Validation；
- Response limits；
- Safe HTML extraction；
- Sanitized Source Review。

---

## M2 Demo

Happy Path：

```text
Create Content Package
→ Add Public URL
→ Capture Task starts
→ See Task progress
→ Review normalized Source
→ Approve Source Version
```

Fallback：

```text
URL Capture fails
→ User pastes text
→ Create Source Version
→ Review
→ Approve
```

---

## M2 Exit Criteria

- SSRF Tests 通过；
- Private、Loopback、Link-local 和 Metadata 地址被阻止；
- Upload Quarantine 生效；
- 未验证文件不能进入 Agent Context；
- Raw Snapshot 和 Safe Review 分离；
- Source Version 可批准；
- 重复 Queue Job 不创建重复 Source Version；
- Outbox 在 Dispatch 失败后可恢复；
- Redis Job 丢失可通过 Reconciliation 恢复；
- Worker Lease 可过期和恢复；
- Page Refresh 后 Task State 恢复；
- SSE 断开后 Polling 恢复；
- Research 节点只接受 Approved Source；
- Workflow Timeline 可用；
- M2 Demo 和 Failure Path 完成。

---

# 49. M3 — Research

## Goal

实现第一个完整 Agent Vertical Slice。

---

## M3 Agent Deliverables

- Research Agent Spec；
- Research Prompt Template；
- Research Input Schema；
- Research Candidate Schema；
- Runtime Policy；
- Validation Profile；
- Agent Runtime foundation；
- Context Builder；
- Prompt Assembly；
- Model Router v1；
- Model Adapter；
- Fake Model Adapter；
- 至少一个真实 Provider Adapter；
- Model Configuration；
- Agent Run；
- Model Call Attempt；
- Raw Output；
- Parse；
- Schema Validation；
- Deterministic Normalization；
- Schema Repair；
- Domain Validation；
- Cancellation；
- Budget；
- Runtime Telemetry。

---

## M3 Research Deliverables

- Research Result；
- Research Item；
- Evidence Bundle；
- Source Locator；
- Needs Verification；
- Tension；
- Open Question；
- Review Working Copy；
- Correct；
- Exclude；
- Accept；
- New Version；
- Approval；
- Outdated behavior。

---

## M3 UI Deliverables

- Research Workspace；
- Agent Progress；
- Research Item Review；
- Evidence Drawer；
- Validation Summary；
- Version History；
- Approval；
- Failure Recovery；
- Advanced Diagnostics access boundary。

---

## M3 Quality Deliverables

- Fake Provider Fixtures；
- Research Unit Tests；
- Research Validator Tests；
- Agent Runtime Tests；
- Research Core Eval Set；
- Research Adversarial Set；
- Injection Case；
- Research Baseline。

---

## M3 Demo

```text
Approved Source
→ Generate Research
→ Observe Agent progress
→ Review Evidence
→ Correct one Research Item
→ Create Research Version
→ Approve Research
```

---

## M3 Exit Criteria

- Research 只读取 Approved Source Version；
- Frozen Input Snapshot 生效；
- Evidence 可打开到对应 Source Locator；
- Unsupported Claims 被阻止或标记 Needs Verification；
- Source Prompt Injection 不能执行 Workflow Command；
- Raw Model Output 不直接成为 Artifact；
- Malformed JSON 只能有限 Repair；
- Schema Repair 有次数上限；
- Duplicate Agent Job 不重复 Promotion；
- Cancel 后 Late Result 不 Promotion；
- Provider Failure 有明确状态；
- Fake Provider 全部 Fixtures 通过；
- Research Eval 达到已接受 Baseline；
- Adversarial Injection Case 通过；
- Raw Output 访问受到限制和审计；
- M3 Demo 完成。

---

# 50. M4 — Human Opinion 与 Blog

## Goal

完成 Content Foundation 和第一个可发布内容分支。

---

## M4 Human Opinion Deliverables

- Question Card；
- Question Generation；
- Raw Human Response；
- AI Interpretation；
- Confirmed Opinion Statement；
- Editorial Expression，可选；
- Original Response Locator；
- Follow-up Policy；
- Skip；
- Enough；
- Use Current；
- Creator-led Mode；
- Research-based Mode；
- Human Opinion Version；
- Human Opinion Approval / Confirmation。

---

## M4 Blog Deliverables

- Writer Agent Spec；
- Writer Prompt；
- Blog Plan；
- Blog Draft Candidate；
- Blog Working Copy；
- Markdown Canonical Body；
- Citation；
- References；
- Provenance；
- First-person Validator；
- Direct Quote Validator；
- Source-overlap Warning；
- Revision Proposal；
- Diff；
- Selective Apply；
- Version History；
- Approval；
- Blog Export Package。

---

## M4 UI Deliverables

- Human Opinion Workspace；
- Question Cards；
- Chief Editor guided flow；
- Blog Workspace；
- Markdown Editor；
- Autosave；
- Revision Conflict UI；
- Revision Proposal Review；
- Citation and Provenance Review；
- Blog Export。

---

## M4 Demo

Creator-led：

```text
Approved Research
→ Answer Question Cards
→ Review AI Interpretation
→ Confirm Opinion
→ Generate Blog
→ Review Revision Proposal
→ Approve Blog
→ Export Markdown
```

Research-based：

```text
Approved Research
→ Skip Human Opinion
→ Generate Research-based Blog
→ Verify no fabricated first-person
→ Approve
→ Export
```

---

## M4 Exit Criteria

- AI Interpretation 不自动成为 Confirmed Opinion；
- Confirmed Opinion 可追踪到 Raw Response；
- 第一人称只来自符合条件的 Confirmed Opinion；
- Research-based Blog 不虚构用户经验；
- Writer 使用 Approved Research；
- Direct Quote 精确匹配 Evidence；
- Citation Validator 通过；
- Source-overlap Warning 可见；
- Revision Proposal 不静默覆盖；
- Autosave 可恢复；
- Revision Conflict 返回并显示；
- Blog Version 不可修改；
- Export 只使用 Approved Blog Version；
- Blog Export 不包含内部 Secret 和 Raw Output；
- Writer Agent Eval 无 Critical Failure；
- M4 Creator-led 和 Research-based Demo 均完成。

M4 是内部可用版本，但不是正式 MVP。

---

# 51. M5 — Xiaohongshu Content

## Goal

完成第二个内容表达分支。

---

## M5 Deliverables

- Packaging Agent Spec；
- Packaging Prompt；
- XHS Plan；
- XHS Candidate Schema；
- Platform Profile v1；
- Platform Title Candidates；
- Selected Platform Title；
- Cover Title；
- Cover Subtitle；
- Page Model；
- Page Purpose；
- Page Content；
- Emphasis；
- Visual Brief；
- Caption；
- CTA；
- Hashtag Suggestions；
- References；
- XHS Working Copy；
- XHS Version；
- XHS Approval；
- Packaging Validators；
- Packaging Eval Profile。

---

## M5 UI Deliverables

- XHS Workspace；
- Page List；
- Page Editor；
- Page Reorder；
- Title Editor；
- Cover Editor；
- Caption Editor；
- CTA Editor；
- Hashtag Editor；
- Validation Summary；
- Version History；
- Approval。

---

## M5 Demo

```text
Approved Research + Confirmed Opinion
→ Generate Packaging Plan
→ Generate 8-page XHS Working Copy
→ Edit one page
→ Reorder pages
→ Edit Caption
→ Approve XHS Version
```

---

## M5 Exit Criteria

- XHS 默认直接消费 Content Foundation；
- XHS 不默认由 Blog 压缩生成；
- 每页具有明确 Page Purpose；
- Page Count 限制为 6～10；
- 默认可以生成 8 页；
- Platform Title 与 Cover Title 分离；
- Caption 不机械重复 Carousel；
- Creator-led 与 Research-based Mode 正确；
- 第一人称规则正确；
- 页面过载触发 Warning 或 Blocking；
- 上游 Research 或 Opinion 新 Version 使 XHS Outdated；
- 只有 Approved XHS Version 可进入 Visual；
- Packaging Agent Eval 无 Critical Failure；
- M5 Demo 完成。

---

# 52. M6 — Design、Render 与 Export

## Goal

完成完整 ContentOS 双输出闭环。

---

## M6 Visual Deliverables

- Visual Agent Spec；
- Visual Prompt；
- Design Specification Schema；
- Component Registry v1；
- Brand Theme v1；
- Content Binding；
- Asset Request；
- Asset Registry；
- Asset Candidate；
- Asset Review；
- Asset Approval；
- Design Working Copy；
- Design Version；
- Design Validation；
- Design Approval。

---

## M6 Render Deliverables

- Renderer Container；
- Playwright；
- Pinned Chromium；
- Approved Chinese Font Bundle；
- Render Profile；
- Preview Render；
- Final Render；
- Fit Strategy；
- Overflow Detection；
- Clipping Detection；
- Missing Asset Validation；
- Missing Font Validation；
- Render Job；
- Render Output；
- Environment Fingerprint；
- Golden Screenshot；
- Pixel Regression。

---

## M6 Export Deliverables

### Blog Export

```text
article.md
manifest.json
assets/
```

### Xiaohongshu Export

```text
images/
post.md
references.md
manifest.json
```

---

## M6 UI Deliverables

- Design Workspace；
- Page Preview；
- Component Selection；
- Asset Review；
- Preview Render；
- Design Approval；
- Final Render Status；
- Export Download；
- Render Failure Recovery。

---

## M6 Demo

```text
Approved XHS
→ Generate Design
→ Preview all pages
→ Reject or replace one Asset
→ Approve Design
→ Run Final Render
→ Download XHS Export Package
```

---

## M6 Exit Criteria

- Visual Agent 不修改 XHS Canonical Content；
- 所有 Component 来自 Registry；
- Content Binding 可追踪；
- AI Image 不承载关键文字；
- Asset 未批准时不能 Final Render；
- Renderer 无公网访问；
- Renderer 不调用 LLM；
- Final Render 使用 Approved Dependencies；
- Missing Font 阻止 Final Render；
- Overflow 和 Clipping 可以检测；
- Carousel 以 Atomic Output 生成；
- Render Retry 不创建非法重复 Final Output；
- Export 不包含 Prompt；
- Export 不包含 Raw Output；
- Export 不包含 Secret；
- Export 不包含临时 Signed URL；
- Render Regression 通过；
- 完整 Happy-path Vertical Slice 通过；
- M6 Demo 完成。

M6 形成产品闭环，但仍需要 M7 Hardening。

---

# 53. M7 — Hardening 与 Release Gate

## Goal

将“可以演示”提升为“可以可靠持续使用”。

---

## M7 Reliability Deliverables

- Redis Loss Reconciliation；
- Worker Crash Recovery；
- Lease Recovery；
- Stuck Task Detection；
- Outbox Lag Monitoring；
- Graceful Shutdown；
- Health Checks；
- Task Cancellation；
- Late Result Handling；
- Duplicate Promotion Protection；
- Queue Backlog Recovery；
- Object Storage Failure Handling。

---

## M7 Security Deliverables

- Authentication Test Matrix；
- Authorization Test Matrix；
- Prompt Injection Adversarial Set；
- SSRF Test Matrix；
- Upload Test Matrix；
- Secret Scan；
- Log Redaction Tests；
- Export Safety Tests；
- Security Audit；
- Delete Request；
- Dependency-aware Purge；
- Deletion Job；
- Deletion Ledger；
- Tombstone；
- Backup；
- Restore Drill；
- Deletion Restore Drill。

---

## M7 Quality Deliverables

- Core Eval Sets；
- Adversarial Eval Sets；
- Holdout Sets；
- Approved Baselines；
- Judge Policy；
- Human Review Sample；
- Render Regression；
- Performance Tests；
- Recovery Drills；
- Vertical Slice Acceptance；
- Release Evaluation Record；
- Rollback Conditions。

---

## M7 UX Deliverables

- Loading States；
- Empty States；
- Error Recovery；
- Warning / Blocking distinction；
- Refresh Recovery；
- Accessibility Baseline；
- Safari Verification；
- Advanced Details；
- Clear Outdated explanation；
- Clear Export / Published distinction。

---

## M7 Exit Criteria

- 所有 Zero-tolerance Invariants 通过；
- 未解决 Critical Security 问题为零；
- 未解决 High Security 问题为零；
- Complete Vertical Slice 通过；
- Capture Failure Path 通过；
- Research Correction Path 通过；
- Human Opinion Skip Path 通过；
- Revision Path 通过；
- Outdated Propagation 通过；
- Queue Duplicate Delivery 通过；
- Duplicate Promotion 为零；
- Worker Crash Drill 通过；
- Redis Loss Drill 通过；
- Provider Outage Drill 通过；
- Backup Restore Drill 通过；
- Deletion Restore Drill 通过；
- Agent Holdout 无 Critical Regression；
- Render Regression 通过；
- 单机负载下不出现 OOM；
- Rollback 流程经过验证；
- Release Evaluation Record 可生成；
- 文档和 Runbook 完成。

---

# 54. M8 — Private MVP Release

## Goal

部署一套真正可持续使用的私人 ContentOS MVP。

---

## M8 Release Shape

```text
Private Single-user Deployment
Desktop-first
Manual Publishing
No Public Registration
No Collaboration
```

---

## M8 Product Deliverables

- Dashboard；
- New Content Package；
- Content Package Workspace；
- Source Workspace；
- Research Workspace；
- Human Opinion Workspace；
- Blog Editor；
- XHS Editor；
- Design Workspace；
- Render Preview；
- Blog Export；
- Xiaohongshu Export；
- Workflow Timeline；
- Version History；
- Approval；
- Current Action；
- Chief Editor Panel。

---

## M8 Operations Deliverables

- Production Container Images；
- Production Configuration；
- Secret Layer；
- TLS；
- PostgreSQL；
- Redis；
- Object Storage；
- Backup Job；
- Restore Runbook；
- Release Runbook；
- Incident Runbook；
- Monitoring；
- Health Checks；
- Rollback；
- Resource Limits；
- Known Limitations；
- User Guide。

---

## M8 Product Release Conditions

- Blog 和 Xiaohongshu 双输出完成；
- Blog Export 可用；
- XHS Export 可用；
- Source Manual Fallback 可用；
- Human Opinion Skip 可用；
- Version History 可用；
- Approval 可用；
- Outdated 状态可用；
- Manual Publishing 流程清晰。

---

## M8 Quality Release Conditions

- Vertical Slice 通过；
- Agent Critical Failure 为零；
- Holdout 无 Critical Regression；
- Render Validation 通过；
- Render Regression 通过；
- Queue Recovery 通过；
- Cost 处于批准预算；
- Release Evaluation Record 被批准。

---

## M8 Security Release Conditions

- Authentication 生效；
- Authorization 生效；
- Private by Default 生效；
- SSRF Protection 生效；
- Prompt Injection Containment 生效；
- Secret Isolation 生效；
- Log Redaction 生效；
- Backup 生效；
- Restore 验证通过；
- Delete Request 路径可用；
- Security Audit 可用。

---

## M8 Operations Release Conditions

- `/health/live` 可用；
- `/health/ready` 可用；
- Worker Heartbeat 可用；
- Structured Logs 可用；
- Traces / Metrics 可用；
- Backup Job 成功；
- Restore Runbook 被执行验证；
- Reconciliation 可运行；
- Rollback 可运行；
- Container Resource Limits 已设置；
- Known Limitations 已记录。

---

# 55. MVP 完成定义

ContentOS MVP 完成，不是指：

```text
页面已经做完
```

也不是：

```text
模型能够返回内容
```

也不是：

```text
Happy Path 可以演示一次
```

正式定义是：

> 用户能够从 Source 出发，通过可审核、可追踪、可恢复的 Workflow，得到 Approved Blog Export 和 Approved Xiaohongshu Export；系统在页面刷新、重复 Command、重复 Job、Provider Failure、Worker Crash、Redis Queue 丢失和上游 Version 更新后仍能保持正确状态。

---

## 56. MVP Success Dimensions

首轮 MVP 成功主要从五个维度判断：

```text
Task Completion
Content Trust
Editing Value
Reuse Value
Reliability
```

---

## 57. Task Completion

用户能否完成：

```text
Source
→ Approved Blog Export
→ Approved Xiaohongshu Export
```

不是只生成草稿，而是完成完整审核和导出。

---

## 58. Content Trust

用户是否能够清楚知道：

- 使用了哪些 Source；
- 哪些内容来自 Research；
- 哪些内容来自自己；
- 哪些 Claim 有 Evidence；
- 当前批准的是哪个 Version；
- 下游是否 Outdated；
- Export 使用了哪些依赖。

---

## 59. Editing Value

AI 是否真正减少：

- 从零研究；
- 从零写作；
- 内容重组；
- 平台改写；
- 页面规划；
- 基础排版。

如果用户需要频繁彻底重写全部内容，说明 Agent 质量仍不足。

---

## 60. Reuse Value

同一个 Content Foundation 是否能够有效形成：

```text
Blog Expression
+
Xiaohongshu Expression
```

两种输出应保持事实和观点一致，同时采用不同的平台表达。

---

## 61. Reliability

系统是否能够：

- 恢复失败 Task；
- 防止 Duplicate Promotion；
- 保留历史；
- 阻止非法 Export；
- 标记 Outdated；
- 恢复 Queue；
- 处理 Cancellation；
- 阻止 Late Result；
- 在 Backup Restore 后维持删除义务。

---

## 62. MVP 初期指标

可记录：

- 完整 Package Completion Rate；
- 从创建到双 Export 的时间；
- Research Correction Count；
- Human Opinion Skip Rate；
- Blog Draft Edit Distance；
- XHS Edit Distance；
- Revision Request Count；
- Agent First-attempt Success；
- Schema Repair Rate；
- Domain Regeneration Rate；
- Provider Fallback Rate；
- Render Failure Rate；
- Cost per completed Package；
- 用户是否创建第二个 Package。

这些指标：

- 用于验证产品价值；
- 不自动修改 Prompt；
- 不自动修改 Agent Spec；
- 不自动训练系统；
- 不自动改变 Router。

---

# 63. Codex 实施方式

ContentOS 不使用一个超大任务让 Codex 一次性生成完整系统。

推荐工作循环：

```text
One bounded Work Item
→ Context Packet
→ Implementation
→ Tests
→ Review
→ Documentation Sync
```

---

## 64. Codex Work Item Contract

每个 Work Item 至少包含：

```text
Task ID
Goal
Context
In Scope
Out of Scope
Relevant DEC
Relevant Contracts
Allowed Modules or Files
Acceptance Criteria
Tests Required
Documentation Updates
```

---

## 65. Work Item 示例

```text
Task ID:
M1-CP-001

Goal:
Implement Content Package creation thin slice.

In Scope:
- Content Package Domain
- Drizzle table
- Migration
- Repository Adapter
- Create Use Case
- POST API
- GET API
- New Package UI
- Unit Test
- Integration Test

Out of Scope:
- Source Capture
- Workflow
- Archive
- Delete Request
- Agent Runtime

Relevant DEC:
DEC-160
DEC-221
DEC-226
DEC-267
DEC-279
```

---

## 66. Work Item 大小

Work Item 应达到：

> 可以在一个独立 Review 中理解、测试和回滚。

不使用过大的任务：

```text
实现 ContentOS 后端
```

也不使用没有独立价值的碎片任务：

```text
创建一个 interface
```

推荐边界：

```text
实现 Content Package 创建的完整 Thin Slice
```

---

## 67. Pull Request 原则

```text
One Pull Request
→ One bounded objective
```

一个 PR 可以包含：

- Domain；
- Migration；
- Repository；
- API；
- UI；
- Tests；
- Documentation。

前提是这些变化共同完成一个 Thin Slice。

一个 PR 不应同时修改多个无关模块。

---

## 68. Codex 禁止事项

Codex 未获得明确授权时，不得：

- 修改 Accepted DEC；
- 扩大 MVP Scope；
- 更换技术栈；
- 将模块拆成微服务；
- 增加新 Provider；
- 增加新 Agent Tool；
- 修改 Security Policy；
- 修改 Agent Spec；
- 修改 Prompt Template；
- 修改 Workflow Template；
- 删除 Migration；
- 修改历史 Immutable Version；
- 关闭失败测试；
- 将 Blocking Error 降级；
- 直接操作 Production Data；
- 批量重写无关文件；
- 创建未批准的新通用抽象；
- 用未来需求扩大当前任务。

---

## 69. Codex 任务完成输出

每个任务完成后必须输出：

- 修改摘要；
- 主要设计选择；
- 修改文件；
- Migration；
- Tests；
- 执行命令；
- Acceptance Criteria 结果；
- 已知限制；
- 未完成项；
- Documentation 更新；
- 是否可能需要新 DEC。

不能只输出：

```text
Done
```

---

# 70. AGENTS.md

Repository 根目录维护：

```text
AGENTS.md
```

AGENTS.md 面向 Coding Agent，包含：

- Product Goal；
- MVP Scope；
- Authoritative Documents；
- Technical Stack；
- Module Boundaries；
- Dependency Rules；
- Database Migration Rules；
- Testing Rules；
- Security Rules；
- Documentation Sync；
- Prohibited Actions；
- Work Item Format；
- Definition of Ready；
- Definition of Done。

AGENTS.md 不复制全部 Session。

它应保持简洁、权威、可执行。

---

# 71. Documentation Layers

ContentOS 文档分为三层。

---

## 71.1 Historical Session

```text
docs/sessions/session-001.md
...
docs/sessions/session-024.md
```

作用：

- 记录讨论过程；
- 保存设计背景；
- 保存当时的 Open Questions；
- 保存决策形成原因。

Session 不是日常实现的最小 Context。

---

## 71.2 Decision Register

```text
docs/decisions/decisions.md
```

作用：

- 保存 Accepted DEC；
- 记录状态；
- 记录替代关系；
- 记录决策时间；
- 形成架构治理历史。

---

## 71.3 Current-truth Specifications

```text
docs/product/
docs/architecture/
docs/security/
docs/quality/
docs/implementation/
```

作用：

- 整合当前有效规则；
- 删除历史讨论噪声；
- 供 Codex 和开发者直接实施；
- 体现后续 DEC 对早期设计的覆盖。

如果文档冲突：

```text
Later Accepted DEC
→ Overrides earlier DEC
```

Current-truth 文档必须反映最终有效状态。

---

## 72. Documentation Sync

当代码改变以下内容时，必须同步文档：

- Domain Contract；
- API Contract；
- Artifact Schema；
- Workflow；
- Agent Spec；
- Prompt Template；
- Runtime Policy；
- Security Boundary；
- Deployment；
- Test Gate；
- MVP Scope。

普通 Bug Fix 不一定需要新 DEC。

但必须更新与行为直接相关的规范或测试文档。

---

# 73. Definition of Ready

Work Item 开始前必须具备：

- Goal 明确；
- In Scope 明确；
- Out of Scope 明确；
- 相关 Accepted DEC 已存在；
- 依赖 Milestone 已满足；
- Contract 已知；
- Acceptance Criteria 可测试；
- 所需 Fixture 已准备；
- Security Impact 已识别；
- Migration Impact 已识别；
- Documentation 位置已知；
- 没有未解决的 Blocking Design Question。

不满足时，不应直接进入实现。

---

# 74. Definition of Done

普通 Work Item 完成需要：

- 代码实现；
- Typecheck 通过；
- Tests 通过；
- Contract 更新；
- Migration 完成；
- Authorization 检查；
- Error State 处理；
- Observability；
- Documentation；
- Acceptance Criteria 通过；
- 无新增未解释 Warning；
- 无测试被随意跳过；
- 无无关文件变更。

Agent 功能还需要：

- Fake Provider Fixture；
- Eval Case；
- Baseline Comparison；
- Cost 数据；
- Failure 数据；
- Validation Result。

---

# 75. Milestone 进入规则

不能因为计划时间到达自动进入下一 Milestone。

必须满足：

```text
Previous Milestone Exit Criteria
+
No unresolved Blocking Defect
+
Required Documentation Updated
+
Demo Completed
```

允许在依赖明确的情况下进行有限并行开发。

不能绕过核心 Gate。

---

# 76. Scope Change Governance

Session-024 之后，新需求分为三类。

---

## 76.1 Bug

已接受行为没有正确实现。

进入缺陷修复流程。

通常不需要新 DEC。

---

## 76.2 Implementation Detail

技术实现细节发生变化，但不改变：

- Product Scope；
- Domain Semantics；
- Security Boundary；
- Workflow；
- Agent Responsibility；
- Technical Architecture；
- Release Gate。

进入普通 Work Item。

---

## 76.3 Scope or Architecture Change

如果改变以下任何内容：

- MVP Scope；
- Domain Model；
- Workflow；
- Version Semantics；
- Security；
- Agent Responsibility；
- Technology Stack；
- Deployment Model；
- Release Gate；

必须创建：

```text
New DEC
```

不得在实现 PR 中静默改变。

---

# 77. Backlog Priority

ContentOS 使用：

```text
Must
Should
Could
Won’t for MVP
```

---

## 77.1 Must

M0～M8 Exit Criteria 和正式 MVP Release Conditions。

---

## 77.2 Should

明显改善体验，但不阻止核心 Vertical Slice。

例如：

- 更丰富的快捷键；
- 更完整 Empty State；
- 更多 Component 变体；
- 更详细 Usage 页面；
- 更方便的 Version Comparison。

---

## 77.3 Could

在 MVP 验证后评估。

例如：

- Public Share；
- PersonalBlog API；
- Git Adapter；
- PDF；
- 更多 Source Parser；
- 更多 Platform Output；
- 更多 Brand Theme。

---

## 77.4 Won’t for MVP

Session-024 明确排除的能力。

Won’t 不代表永不实现，而是不允许进入当前 MVP 实施范围。

---

# 78. 不提前建设通用平台

MVP 不提前实现：

- Agent Marketplace；
- Workflow Builder；
- Plugin System；
- Multi-tenant Platform；
- General CMS；
- General Design Tool；
- Model Benchmark Platform；
- Data Warehouse；
- General RAG Platform；
- Universal Knowledge Base。

可以保留 Adapter 和 Module Boundary。

不得提前实现完整平台能力。

---

# 79. 最大实施风险

---

## 79.1 Scope Expansion

ContentOS 已经包含完整闭环。

每个新增功能都会显著扩大测试和安全范围。

必须严格使用 DEC 和 Backlog Priority 控制。

---

## 79.2 过早建设基础设施

不要在没有 Vertical Slice 需求时提前完成：

- 多区域；
- Kubernetes；
- Kafka；
- Temporal；
- 全量 Observability Cluster；
- 通用 Plugin API。

---

## 79.3 过早优化 Prompt

在优化 Agent 之前，应先建立：

- Fake Provider；
- Structured Output；
- Validators；
- Eval Dataset；
- Baseline；
- Runtime Telemetry。

否则无法判断改动是否真实改善。

---

## 79.4 Design System 过度复杂

MVP 使用有限 Component Registry。

不做自由画布。

不做任意 CSS 编辑。

不做完整 Design Tool。

---

## 79.5 Renderer 最后才建设

Renderer 应在 M6 之前提前准备固定 Container、Font 和 Golden Fixture。

如果最后才处理 Renderer，可能暴露大量内容密度和组件 Contract 问题。

---

## 79.6 Workflow State 分散

PostgreSQL 必须保持权威。

Redis 仅负责 Dispatch 和短期协调。

不能让 API、Queue 和 UI 各自维护一套 Workflow 真相。

---

## 79.7 文档与代码漂移

每个 Work Item 都需要 Documentation Sync。

Current-truth 文档必须在实现中持续维护。

---

# 80. MVP 开工条件

正式进入 M0 实施前，应满足：

```text
Session-001～Session-024 已归档
DEC-001～DEC-294 已写入 Decision Register
MVP Scope 文档已建立
Technical Architecture 文档已建立
Domain Overview 已建立
Repository Structure 已建立
Implementation Roadmap 已建立
AGENTS.md 已建立
Repository 已创建或准备创建
Development Environment 条件已确认
```

不要求开工前完成全部详细 Schema。

Schema 按 Milestone 逐步建立。

---

# 81. 第一个正式实现任务

第一个任务：

> 创建 ContentOS Monorepo 基础骨架和本地运行环境。

范围：

```text
Node.js 24 pin
pnpm Workspace
TypeScript strict
apps/web
apps/api
apps/worker
apps/fetcher
apps/renderer
packages/core
packages/contracts
packages/config
packages/testing
Docker Compose
PostgreSQL
Redis
S3-compatible Object Storage
CI skeleton
README
AGENTS.md
```

不包含：

```text
Content Package Domain
Authentication
Workflow
Agent Runtime
Renderer Logic
Source Capture
```

目标是首先验证 Repository 和开发环境。

---

# 82. 第二个正式实现任务

第二个任务：

> 实现 Content Package 创建的完整 Thin Slice。

包含：

```text
Authentication or Owner foundation
Content Package Domain
Drizzle Table
SQL Migration
Repository Adapter
Create Use Case
POST API
GET API
New Package UI
Workspace Shell
Unit Tests
Integration Tests
Documentation
```

该任务验证：

```text
Web
→ API
→ Application
→ Domain
→ Database
→ UI
```

完整工程路径。

---

# 83. 正式 MVP 最终交付物

---

## 83.1 Product

- Private Web Application；
- Dashboard；
- New Content Package；
- Content Package Workspace；
- Source Workspace；
- Research Workspace；
- Human Opinion Workspace；
- Blog Editor；
- Xiaohongshu Editor；
- Design Workspace；
- Preview；
- Final Render；
- Blog Export；
- Xiaohongshu Export。

---

## 83.2 Backend

- Application API；
- Workflow Engine；
- Task Queue；
- Transactional Outbox；
- Agent Runtime；
- Model Adapter；
- Source Fetcher；
- Renderer；
- Object Storage；
- Authentication；
- Authorization；
- Security Audit；
- Archive；
- Delete Request；
- Purge；
- Reconciliation。

---

## 83.3 Contracts

- JSON Schemas；
- OpenAPI；
- Agent Specs；
- Prompt Templates；
- Runtime Policies；
- Validation Profiles；
- Model Configurations；
- Platform Profile；
- Component Registry；
- Brand Theme；
- Render Profile；
- Export Manifests。

---

## 83.4 Quality

- Static Test Suite；
- Domain Test Suite；
- Repository and Migration Tests；
- API Integration Tests；
- Queue Recovery Tests；
- Workflow Scenarios；
- Fake Provider；
- Agent Eval Datasets；
- Baselines；
- Holdout；
- Render Fixtures；
- Vertical Slice Fixture；
- Security Gate；
- Release Evaluation。

---

## 83.5 Operations

- Container Images；
- Compose；
- SQL Migrations；
- Production Configuration；
- Secret References；
- Backup；
- Restore；
- Monitoring；
- Health Checks；
- Runbooks；
- Rollback。

---

## 83.6 Documentation

- Session Archive；
- Decision Register；
- Product Specifications；
- Architecture Specifications；
- Security Specifications；
- Quality Specifications；
- Implementation Roadmap；
- AGENTS.md；
- README；
- User Guide；
- Known Limitations。

---

# 84. Decisions

## DEC-267

### Status

Accepted

### Title

ContentOS MVP 定义为单用户、桌面优先的 Personal AI Content Studio

### Decision

MVP serves one content creator through a structured Workspace that transforms Sources into Research, Human Opinion, Blog, and Xiaohongshu content assets.

The MVP is delivered as a Private Web Application rather than a collection of Codex scripts.

### Reason

The first release requires a fixed user, product form, and primary task to avoid evolving into a generic Agent platform.

### Impact

Multi-user collaboration, organization management, and public registration are outside the MVP.

---

## DEC-268

### Status

Accepted

### Title

MVP 输入限定为 Public URL、Pasted Text、`.md` 和 `.txt`

### Decision

The MVP supports:

- Public HTTP/HTTPS URL
- Pasted Text
- Markdown
- Text File

Each Content Package contains one Primary Source and zero to five Supporting Sources.

### Reason

These formats are sufficient to validate the core product value while controlling parser, security, Context, and UX complexity.

### Impact

PDF, Office, OCR, audio, video, email, and cloud-drive integrations are deferred.

---

## DEC-269

### Status

Accepted

### Title

正式 MVP 必须同时完成 Blog 和 Xiaohongshu 双输出

### Decision

Blog and Xiaohongshu share an Approved Content Foundation but are generated, edited, versioned, and approved independently.

A Blog-only system is an internal Milestone and is not the formal MVP.

### Reason

Cross-platform differentiated expression is one of the core ContentOS product values.

### Impact

MVP Release Gate requires both an Approved Blog Export and an Approved Xiaohongshu Export.

---

## DEC-270

### Status

Accepted

### Title

MVP 发布输出采用人工下载与手动发布

### Decision

ContentOS generates Blog and Xiaohongshu Export Packages.

The MVP does not directly publish to PersonalBlog or Xiaohongshu.

### Reason

The first release validates content production, review, and Export without adding platform authentication, publishing permission, and recovery complexity.

### Impact

Exported and Published remain separate states.

---

## DEC-271

### Status

Accepted

### Title

Human-in-the-loop Gate 是 MVP 必须能力而不是可选增强

### Decision

Research, Human Opinion, Blog, Xiaohongshu, Design, and Final Export retain the human Review or Approval Gates defined by Workflow Policy.

AI does not automatically approve or publish.

### Reason

User opinion, factual accuracy, Citation, and platform expression require human control.

### Impact

Approval, Versioning, and Validation enter the implementation at the relevant Milestones.

---

## DEC-272

### Status

Accepted

### Title

Working Copy、Immutable Version、Approval、Dependency 与 Provenance 属于 MVP 核心

### Decision

These capabilities are implemented from the first Versioned Artifact and are not deferred as advanced features.

### Reason

ContentOS is differentiated by traceability, reviewability, and recoverability rather than content generation alone.

### Impact

The implementation cannot reduce an Artifact to one mutable latest-body field.

---

## DEC-273

### Status

Accepted

### Title

MVP Workspace 包含 Dashboard、New Package、Package Workspace 与 Settings

### Decision

Content Package Workspace is the core interface.

Each stage uses a structured Editor, with Chief Editor Panel as an auxiliary interaction surface.

The MVP is desktop-first, while mobile supports only limited viewing and review.

### Reason

Users require a stable content-lifecycle Workspace rather than disconnected chat pages.

### Impact

Full mobile editing and a free-form visual canvas are deferred.

---

## DEC-274

### Status

Accepted

### Title

MVP 不包含多用户协作、自动发布、Analytics、Public Share 和通用平台能力

### Decision

The MVP excludes:

- Collaboration
- Organization
- Automatic Publishing
- Analytics
- Public Share
- Workflow Builder
- Agent Marketplace
- Plugin Platform
- Template Marketplace

### Reason

These capabilities are not required to validate the initial content-production loop.

### Impact

Implementation tasks may not build these capabilities in advance for hypothetical future needs.

---

## DEC-275

### Status

Accepted

### Title

实施采用 Thin Vertical Slice 与有限 Architecture Runway

### Decision

Each stage should deliver UI, API, Domain, persistence, Validation, Tests, and Documentation where relevant.

Only the infrastructure required for the next Vertical Slice is built in advance.

### Reason

This exposes product and engineering problems earlier and prevents long infrastructure phases without usable product value.

### Impact

ContentOS is not implemented by completing every Backend layer before Frontend work begins.

---

## DEC-276

### Status

Accepted

### Title

ContentOS 实施路线分为 M0～M8 九个 Milestone

### Decision

The implementation roadmap is:

```text
M0 开工基线
M1 产品骨架与领域基础
M2 Source 与 Workflow 基础
M3 Research
M4 Human Opinion 与 Blog
M5 Xiaohongshu Content
M6 Design、Render 与 Export
M7 Hardening 与 Release Gate
M8 Private MVP Release
```

### Reason

The order follows domain dependencies and incremental demonstrable value.

### Impact

The formal MVP is completed only at M8.

---

## DEC-277

### Status

Accepted

### Title

每个 Milestone 必须具备可演示交付物与明确 Exit Criteria

### Decision

A Milestone is not completed based on elapsed time or code volume.

It requires:

- Demo
- Exit Criteria
- Tests
- Documentation
- No unresolved Blocking Defect

### Reason

A Milestone must represent a verifiable system capability rather than development activity.

### Impact

Starting the next Milestone depends on formal acceptance of the previous Milestone.

---

## DEC-278

### Status

Accepted

### Title

M0 先建立 Repository、开发环境、CI、文档与 Agent 工作规则

### Decision

Before implementing the Domain, ContentOS establishes the Monorepo, Node and pnpm baseline, TypeScript, Compose, application skeletons, CI, README, Current-truth documents, and `AGENTS.md`.

### Reason

Codex and developers need a stable, reproducible, and constrained implementation environment.

### Impact

M0 does not implement business functionality.

---

## DEC-279

### Status

Accepted

### Title

第一个业务 Thin Slice 是 Content Package 创建与 Workspace Shell

### Decision

M1 implements the Content Package creation path across:

```text
Web
→ API
→ Domain
→ Database
→ Workspace
```

### Reason

It validates the complete engineering chain without requiring Agent or Queue complexity.

### Impact

Source, Workflow, and Agent features begin in later Milestones.

---

## DEC-280

### Status

Accepted

### Title

Source、Task、Outbox、Queue 与 Workflow 基础在第一个 Agent 之前完成

### Decision

M2 establishes Source Capture, Workflow Instance, Task, Outbox, BullMQ, Lease, Reconciliation, SSE, and Source Approval.

### Reason

Agents must execute against formal input Versions and Tasks rather than temporary model-call endpoints.

### Impact

Research becomes the first Agent running on the complete runtime foundation.

---

## DEC-281

### Status

Accepted

### Title

Research Agent 是第一个正式 Agent Vertical Slice

### Decision

M3 implements Research Agent, the Agent Runtime foundation, Fake Provider, at least one real Provider Adapter, Evidence Review, and Research Approval.

### Reason

Research provides the common content foundation for Human Opinion, Blog, and Xiaohongshu and validates Grounding early.

### Impact

Writer, Packaging, and Visual Agents do not precede Approved Research.

---

## DEC-282

### Status

Accepted

### Title

内部实施先完成 Blog，再完成 Xiaohongshu，但正式 MVP 必须双输出

### Decision

M4 implements Human Opinion and Blog.

M5 implements Xiaohongshu Content.

This sequence reduces implementation complexity without changing the dual-output MVP scope.

### Reason

Blog validates Human Opinion, Citation, Provenance, and Writer before the page and visual Contracts required by Xiaohongshu.

### Impact

The M4 product remains an internal Milestone.

---

## DEC-283

### Status

Accepted

### Title

Visual、Asset、Renderer 与 Export 在 Approved Xiaohongshu 之后实现

### Decision

M6 consumes an Approved XHS Version and implements Design Specification, Asset Review, Final Render, and Export in order.

### Reason

The visual system must not become an implicit content editor before the content Contract is stable.

### Impact

Visual Agent cannot bypass Packaging and modify canonical Xiaohongshu text.

---

## DEC-284

### Status

Accepted

### Title

安全、测试和 Observability 作为横向要求从第一阶段开始

### Decision

M7 performs concentrated Hardening, but Authentication, Authorization, Migration Tests, Logging, security boundaries, and basic Tests are implemented when their related functionality first appears.

### Reason

Security and testability cannot be added safely in one final phase after the product is complete.

### Impact

Every Milestone Exit Criteria includes relevant security and quality requirements.

---

## DEC-285

### Status

Accepted

### Title

MVP 发布前必须完成 Hardening、Recovery Drill 和 Release Evaluation

### Decision

M7 must pass:

- Zero-tolerance Invariants
- Security Gate
- Queue Recovery
- Redis Loss
- Worker Crash
- Backup Restore
- Deletion Restore
- Agent Holdout
- Render Regression
- Complete Vertical Slice

### Reason

A demonstrable feature loop is not yet a reliable product.

### Impact

M6 cannot be released directly without M7.

---

## DEC-286

### Status

Accepted

### Title

M8 以 Private Single-user Deployment 作为首个正式发布

### Decision

The first release:

- Does not provide public registration
- Does not promise high availability
- Is desktop-first
- Uses manual publishing
- Runs in a controlled production environment
- Includes Backup, Monitoring, and Rollback

### Reason

The product should first validate sustained real use before expanding user scale.

### Impact

Initial success is measured through completion, trust, editing value, reuse value, and reliability.

---

## DEC-287

### Status

Accepted

### Title

Codex Work Item 必须具备边界、Context、Acceptance 和测试要求

### Decision

Every Work Item includes:

- Goal
- In Scope
- Out of Scope
- Relevant DEC
- Contracts
- Allowed Modules
- Acceptance Criteria
- Tests
- Documentation Update

### Reason

Broad implementation prompts encourage scope expansion, cross-module modification, and poor reviewability.

### Impact

Tasks such as “Implement ContentOS” are prohibited.

---

## DEC-288

### Status

Accepted

### Title

每个 Pull Request 聚焦一个可独立审核和回滚的目标

### Decision

A Pull Request may include Domain, Migration, API, UI, and Tests when they complete one Thin Slice.

It must not include unrelated modules or broad refactoring.

### Reason

Pure technical-layer PRs create incomplete behavior, while overly broad PRs become difficult to review and rollback.

### Impact

PR scope is defined by one clear user or system capability.

---

## DEC-289

### Status

Accepted

### Title

Repository 使用 `AGENTS.md` 约束 Coding Agent 行为

### Decision

Root `AGENTS.md` records:

- Product goal
- Authoritative documents
- Technical stack
- Module boundaries
- Migration rules
- Test rules
- Security rules
- Documentation Sync
- Prohibited actions

### Reason

Coding Agents need a concise and executable entry point rather than the complete historical Session archive.

### Impact

`AGENTS.md` is updated with Current-truth specifications and does not duplicate every Session.

---

## DEC-290

### Status

Accepted

### Title

Historical Session、Decision Register 与 Current-truth Specification 使用不同职责

### Decision

Sessions preserve discussion history.

Decision Register preserves Accepted DEC.

Current-truth documents preserve the integrated rules implementation must follow.

Later Accepted Decisions override earlier conflicting Decisions.

### Reason

Relying only on Session transcripts increases implementation Context and risks using superseded conclusions.

### Impact

M0 extracts authoritative Current-truth Specifications from the Session archive.

---

## DEC-291

### Status

Accepted

### Title

所有实施任务使用 Definition of Ready 与 Definition of Done

### Decision

A Task starts only when scope, dependencies, Contracts, and testable Acceptance Criteria are known.

A Task completes only when code, Tests, Migration, Authorization, Errors, Observability, and Documentation are complete.

### Reason

This prevents undefined work from entering implementation and prevents Happy-path-only completion.

### Impact

Agent Tasks additionally require Fixtures, Eval Cases, Baseline comparison, and cost data.

---

## DEC-292

### Status

Accepted

### Title

Scope Change、Bug 与 Implementation Detail 使用不同治理流程

### Decision

Bug enters the defect flow.

Implementation Detail that does not alter Accepted Decisions enters a normal Work Item.

Changes to MVP, Domain, Workflow, Security, Agent responsibility, technical architecture, or Release Gate require a new DEC.

### Reason

Accepted product and architecture boundaries must not change silently during coding.

### Impact

ContentOS remains evolvable after Session-024, but core changes are explicit and auditable.

---

## DEC-293

### Status

Accepted

### Title

正式 MVP 的完成标准是完整、可靠、可恢复的双输出闭环

### Decision

MVP completion requires a user to produce an Approved Blog Export and Approved Xiaohongshu Export from Sources.

The system must remain correct through refresh, duplicate Commands, duplicate Jobs, Provider failure, Worker crash, Redis loss, and upstream Version changes.

### Reason

Completed pages or successful model calls do not prove that the product works.

### Impact

MVP Definition of Done is tied to the complete Vertical Slice and Recovery Gates.

---

## DEC-294

### Status

Accepted

### Title

MVP 首轮验证以任务完成、内容信任、编辑价值、复用价值与可靠性为核心

### Decision

The initial MVP does not use growth, engagement, or revenue as its primary success criteria.

It validates:

- Dual-output completion
- Trust in Source and Opinion boundaries
- Reduction in creation and layout effort
- Reuse of Content Foundation
- System reliability

### Reason

The product must first prove its core workflow value before optimizing growth.

### Impact

Initial metrics focus on Package Completion, Editing, Revision, Cost, and Reliability.

---

# 85. Rejected or Deferred Approaches

## Generic Agent Platform

Rejected for MVP because ContentOS must first validate one content-production workflow.

## Blog-only Formal MVP

Rejected because dual-platform output is a core value proposition.

## Automatic Publishing

Deferred because it introduces account access, platform permission, rollback, and publication failure risks.

## Multi-user Collaboration

Deferred because the personal single-user use case must be validated first.

## Public Share

Deferred because Export and external access require different authorization models.

## Analytics Dashboard

Deferred because early validation focuses on production workflow quality rather than platform-performance analysis.

## Full File-format Support

Deferred because every parser adds security, resource, Schema, and testing scope.

## Free-form Design Canvas

Rejected because the MVP uses Component Registry and structured Design Specification.

## Workflow Builder

Rejected because the MVP uses one fixed versioned Workflow Template.

## Agent Marketplace

Rejected because Agent behavior remains controlled through approved Agent Specs.

## Build All Infrastructure First

Rejected because implementation follows Vertical Slices.

## Generate Entire Product in One Codex Task

Rejected because the work would be unbounded, difficult to review, and likely to violate accepted boundaries.

## Time-based Milestone Completion

Rejected because Milestones require demonstrable capability and Exit Criteria.

## Silent Scope Changes during Implementation

Rejected because major changes require a new DEC.

## Page Completion as MVP Completion

Rejected because the product requires reliability, recovery, versioning, security, and dual Export.

---

# 86. Open Questions

The following questions move from architecture discussion into implementation planning:

1. Which exact pnpm version will be pinned?
2. Which exact Next.js, NestJS, Drizzle, BullMQ, Ajv, and Playwright versions will be selected initially?
3. Which test runner will be used?
4. Will the project use ESLint and Prettier or Biome?
5. Which CI platform will be used?
6. Which local S3-compatible Object Storage will be used?
7. Which production Object Storage will be used?
8. Which authentication implementation will be selected?
9. Will Sessions be stored in PostgreSQL or Redis?
10. Which PostgreSQL major version will be selected?
11. Which Redis deployment and persistence mode will be used?
12. Which real model Provider Adapter will be implemented first?
13. Which initial Model Configuration will be used for Research?
14. Which Chinese Font Bundle will be approved?
15. Which Font licences need to be recorded?
16. Which Component variants belong in Component Registry v1?
17. Which Brand Theme is used in the first Render Fixture?
18. Which Markdown Editor will be used?
19. Which Diff library will be used?
20. Which drag-and-drop library will be used for XHS pages?
21. How will the SSE stream be organized?
22. Will SSE support `Last-Event-ID`?
23. Which Queue names and Job retention settings will be used?
24. What Task Lease duration is appropriate?
25. How often does Reconciliation run?
26. Which object-key naming convention will be used?
27. Which exact Source Fetch limits will be selected?
28. Which HTML extraction library will be selected?
29. Which Markdown sanitizer will be selected?
30. Which URL Validator and SSRF implementation will be selected?
31. Which Schema files are required in M1?
32. How will JSON Schema generate TypeScript boundary types?
33. How will Schema and generated-type drift be checked?
34. How will API clients be generated from OpenAPI?
35. Which Runtime Config library will be used?
36. How will Secret References be resolved locally?
37. How will Secret References be resolved in production?
38. Which logging library will be used?
39. Which OpenTelemetry backend will be selected?
40. Which reverse proxy will be used?
41. Which container registry will be used?
42. Which VPS or compute host will be used for the first private release?
43. Which state services will be self-hosted or managed?
44. What minimum CPU and RAM are required for Renderer?
45. How many concurrent Render Jobs are safe?
46. What Backup frequency is appropriate?
47. What RPO and RTO are acceptable?
48. How long are Raw Model Outputs retained?
49. How long are Preview Renders retained?
50. How long are processed Outbox Events retained?
51. How long are completed Queue Jobs retained?
52. How will User Data Export be introduced after MVP?
53. Which Agent Eval Dataset is created first?
54. How many Research Core Cases are sufficient for M3?
55. How many Writer Cases are sufficient for M4?
56. How many Packaging Cases are sufficient for M5?
57. How many Visual and Render Fixtures are sufficient for M6?
58. Which Holdout access rules will be used?
59. Which performance thresholds will block M7?
60. Which cost thresholds will block Release?
61. Which accessibility standard will be the formal baseline?
62. Which Safari versions will be supported?
63. How will a private user account be provisioned in M8?
64. Will M8 use one production user or support invite-only accounts?
65. Which metrics are shown to the user versus operations only?
66. How will Known Limitations be presented?
67. How will future requests be classified as Must, Should, Could, or Won’t?
68. Which initial Current-truth document should be created first?
69. Should the Decision Register contain full DEC text or concise summaries with Session links?
70. How will Accepted DEC overrides be represented?
71. Which Work Item tracking format will be used?
72. Will Work Items be stored in GitHub Issues or repository Markdown?
73. Which PR template will enforce Definition of Done?
74. Which branch strategy will be used?
75. How will database migrations be tested in Pull Requests?
76. How will Agent Evals be triggered and cost-limited?
77. How will real Provider credentials remain disabled in normal development?
78. How will Renderer network isolation be tested locally?
79. How will Redis-loss drills be automated?
80. Which Session-024 decisions require a new DEC if later changed?

These questions do not block Session-024 confirmation.

They are implementation decisions to be resolved inside their relevant Milestones unless they alter an Accepted architectural boundary.

---

# 87. Documentation Updates

Create:

```text
docs/sessions/session-024.md
```

Update:

```text
docs/decisions/decisions.md
```

Append:

```text
DEC-267
DEC-268
DEC-269
DEC-270
DEC-271
DEC-272
DEC-273
DEC-274
DEC-275
DEC-276
DEC-277
DEC-278
DEC-279
DEC-280
DEC-281
DEC-282
DEC-283
DEC-284
DEC-285
DEC-286
DEC-287
DEC-288
DEC-289
DEC-290
DEC-291
DEC-292
DEC-293
DEC-294
```

---

## 88. Current-truth Documents to Create in M0

```text
docs/product/mvp-scope.md
docs/product/product-definition.md
docs/product/user-and-jobs.md

docs/architecture/domain-overview.md
docs/architecture/technical-architecture.md
docs/architecture/repository-structure.md
docs/architecture/process-topology.md
docs/architecture/workflow-overview.md
docs/architecture/artifact-versioning.md
docs/architecture/agent-runtime.md
docs/architecture/rendering.md

docs/security/security-baseline.md
docs/security/data-classification.md
docs/security/source-fetcher.md
docs/security/secret-management.md

docs/quality/test-strategy.md
docs/quality/release-gates.md
docs/quality/vertical-slice-acceptance.md

docs/implementation/roadmap.md
docs/implementation/work-item-template.md
docs/implementation/milestone-exit-criteria.md
```

---

## 89. Repository Governance Files to Create

```text
AGENTS.md
README.md
CONTRIBUTING.md
.github/pull_request_template.md
.github/issue_template/
```

Exact hosting-platform paths may change based on the selected Git provider.

---

## 90. Documentation Sync Checklist

- [x] DEC-267 confirmed
- [x] DEC-268 confirmed
- [x] DEC-269 confirmed
- [x] DEC-270 confirmed
- [x] DEC-271 confirmed
- [x] DEC-272 confirmed
- [x] DEC-273 confirmed
- [x] DEC-274 confirmed
- [x] DEC-275 confirmed
- [x] DEC-276 confirmed
- [x] DEC-277 confirmed
- [x] DEC-278 confirmed
- [x] DEC-279 confirmed
- [x] DEC-280 confirmed
- [x] DEC-281 confirmed
- [x] DEC-282 confirmed
- [x] DEC-283 confirmed
- [x] DEC-284 confirmed
- [x] DEC-285 confirmed
- [x] DEC-286 confirmed
- [x] DEC-287 confirmed
- [x] DEC-288 confirmed
- [x] DEC-289 confirmed
- [x] DEC-290 confirmed
- [x] DEC-291 confirmed
- [x] DEC-292 confirmed
- [x] DEC-293 confirmed
- [x] DEC-294 confirmed
- [ ] Save this document as `docs/sessions/session-024.md`
- [ ] Append DEC-267 through DEC-294 to `docs/decisions/decisions.md`
- [ ] Confirm Session-001～024 are present
- [ ] Audit Decision Register continuity
- [ ] Resolve duplicate or superseded DEC references
- [ ] Create `docs/product/mvp-scope.md`
- [ ] Create `docs/architecture/technical-architecture.md`
- [ ] Create `docs/architecture/domain-overview.md`
- [ ] Create `docs/architecture/repository-structure.md`
- [ ] Create `docs/architecture/workflow-overview.md`
- [ ] Create `docs/security/security-baseline.md`
- [ ] Create `docs/quality/test-strategy.md`
- [ ] Create `docs/implementation/roadmap.md`
- [ ] Create `docs/implementation/work-item-template.md`
- [ ] Create `AGENTS.md`
- [ ] Create Repository
- [ ] Create M0 Work Items
- [ ] Begin M0 only after Current-truth documents are available
- [ ] Review every future Scope Change against DEC-292

---

# 91. Final Session Summary

ContentOS MVP is a:

```text
Private
Single-user
Desktop-first
Personal AI Content Studio
```

It accepts:

```text
Public URL
Pasted Text
.md
.txt
```

Each Content Package supports:

```text
1 Primary Source
+
0–5 Supporting Sources
```

The complete user workflow is:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

The formal MVP requires both:

```text
Approved Blog Export
+
Approved Xiaohongshu Export
```

Blog and Xiaohongshu share a Content Foundation but are generated, edited, versioned, and approved independently.

MVP includes:

```text
Working Copy
Immutable Version
Artifact Head
Approval
Dependency
Provenance
Revision Proposal
Outdated
Optimistic Concurrency
```

These are core product capabilities rather than optional enterprise features.

MVP includes a structured Content Package Workspace with dedicated Stage Editors and a constrained Chief Editor Panel.

MVP does not include:

```text
Multi-user Collaboration
Automatic Publishing
Analytics
Public Share
Workflow Builder
Agent Marketplace
Plugin Platform
General File Support
Kubernetes
Kafka
Temporal
```

Implementation follows:

```text
M0 开工基线
M1 产品骨架与领域基础
M2 Source 与 Workflow 基础
M3 Research
M4 Human Opinion 与 Blog
M5 Xiaohongshu Content
M6 Design、Render 与 Export
M7 Hardening 与 Release Gate
M8 Private MVP Release
```

Each Milestone requires:

```text
Demo
Exit Criteria
Tests
Documentation
No Blocking Defect
```

Implementation uses Thin Vertical Slices and a limited Architecture Runway.

Codex receives bounded Work Items with:

```text
Goal
Scope
Relevant DEC
Contracts
Acceptance Criteria
Tests
Documentation Update
```

Every Pull Request focuses on one independently reviewable and reversible objective.

Repository governance uses:

```text
Historical Sessions
Decision Register
Current-truth Specifications
AGENTS.md
```

Session-024 establishes the formal MVP Definition of Done:

> A user can start from Sources and obtain an Approved Blog Export and Approved Xiaohongshu Export through a traceable, reviewable, and recoverable Workflow. The system remains correct after refresh, duplicate Commands, duplicate Jobs, Provider failure, Worker crash, Redis loss, and upstream Version changes.

The first MVP evaluates success through:

```text
Task Completion
Content Trust
Editing Value
Reuse Value
Reliability
```

With Session-024 confirmed, ContentOS completes its initial product and technical architecture phase.

The next phase is no longer another core design Session.

The next phase is:

```text
M0 — 开工基线
```