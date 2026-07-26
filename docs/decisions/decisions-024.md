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
