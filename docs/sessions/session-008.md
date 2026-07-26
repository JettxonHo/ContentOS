# ContentOS Session-008

**Status:** Formalized\
&#x2A;*Session Type:** MVP Scope and Product Architecture\
&#x2A;*Topic:** MVP Vertical Slice, Core Entities, Product Surfaces, and Blog Channel Boundary\
&#x2A;*Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the long-term direction of ContentOS:

- ContentOS is a personal AI content operating system.
- The product uses a Web App with a multi-agent backend.
- A Chief Editor coordinates specialized Agents.
- Blog and Xiaohongshu are separate outputs of the same Content Package.
- Important workflow stages require human approval.
- Visual production uses a Design Specification and deterministic Render Engine.
- PostgreSQL and Object Storage are the recommended MVP data-layer direction.
- Content Package, Memory Layer, and RAG boundaries have been conceptually defined.

However, the long-term architecture contains more capabilities than should be implemented in the first product version.

The unresolved question was:

> What is the smallest complete version of ContentOS that can validate its core product value?

This Session narrows the system into an end-to-end MVP Vertical Slice.

---

## 2. Core MVP Principle

The ContentOS MVP will not be created by implementing a small part of every long-term subsystem.

It will instead complete one full content-production cycle.

The selected Vertical Slice is:

```text
Submit source
→ Preserve source
→ Generate structured research
→ Review research
→ Collect human opinion
→ Generate blog draft
→ Generate Xiaohongshu content
→ Generate a limited Design Specification
→ Render Xiaohongshu images
→ Review outputs
→ Export manually
```

The result of one completed workflow is one reusable Content Package.

Conceptually:

```text
Content Package
├── Source
├── Research Result
├── Human Opinion
├── Blog Artifact
├── Xiaohongshu Artifact
├── Design Specification
└── Rendered Output
```

The purpose of the MVP is to validate whether an individual creator will use an AI content team to turn one valuable source into original, reviewed, multi-platform content assets.

---

## 3. MVP Product Hypothesis

The primary product hypothesis is:

> A creator will gain meaningful value from a structured AI-assisted workflow that preserves the original source, incorporates real human opinion, and transforms one topic into different platform-native outputs.

The MVP must therefore validate all three of the following:

1. AI research reduces the effort required to understand and organize a source.
2. Human Opinion makes the final content more original and personally valuable.
3. One shared Content Package can support different Blog and Xiaohongshu expressions.

The MVP does not need to validate:

- Autonomous publishing
- Platform analytics
- Multi-user collaboration
- Full long-term memory
- Dynamic model routing
- Fully autonomous Agent orchestration

---

## 4. MVP Output Scope

### 4.1 Blog Output

The Blog MVP produces an editable Blog Artifact.

The minimum Blog Artifact includes:

```json
{
  "title": "",
  "slug": "",
  "summary": "",
  "outline": [],
  "body_markdown": "",
  "tags": [],
  "status": "draft"
}
```

The ContentOS Blog experience must support:

- Blog draft generation
- Markdown editing
- Article preview
- Section-level revision
- Human approval
- Version preservation
- Copying Markdown
- Exporting a Markdown file

The initial Blog MVP does not include:

- Automatic Blog deployment
- CMS integration
- A public Blog website
- Domain configuration
- Comment functionality
- Complex SEO research
- Automatic internal linking
- Theme customization
- Automatic publishing

A Blog Artifact is considered complete for the ContentOS MVP when the user can review, edit, approve, and export it.

---

### 4.2 Xiaohongshu Output

The Xiaohongshu MVP produces:

- Platform title candidates
- A selected platform title
- Cover title
- Cover subtitle
- Six to ten carousel pages
- Caption
- Hashtags
- A limited Design Specification
- Rendered PNG images

Platform title, cover title, cover subtitle, and page headings remain separate fields.

The initial Xiaohongshu MVP does not include:

- Automatic publishing
- Account authorization
- Video production
- Animation
- Unlimited template generation
- A large visual-theme marketplace
- Automatic performance synchronization

---

## 5. Blog Website Boundary

A public personal Blog website is not a prerequisite for implementing the ContentOS Blog MVP.

ContentOS and the future Blog website are separate products with separate responsibilities.

```text
ContentOS
→ Produces and manages Blog Artifacts

Personal Blog
→ Publishes and presents approved Blog Artifacts
```

ContentOS owns:

- Source processing
- Research
- Human Opinion
- Blog generation
- Blog editing
- Blog versions
- Approval
- Export

The future personal Blog project owns:

- Public article pages
- Homepage
- Article lists
- Navigation
- Tags and categories
- Domain and deployment
- Public visual theme
- Search discoverability
- Website-specific rendering

The personal Blog should be designed after the ContentOS Blog Artifact format is sufficiently stable.

This avoids designing the Blog website around assumptions that later conflict with ContentOS output.

---

## 6. Future ContentOS and Blog Integration

The intended future relationship is:

```text
ContentOS
→ Approved Blog Artifact
→ Export or Publishing API
→ Personal Blog
→ Public Article
```

The first integration may be manual:

```text
ContentOS exports Markdown
→ User copies the file
→ File is added to the Blog repository
→ Blog is deployed
```

A later integration may use an API or Git-based publishing adapter.

Possible future contract:

```json
{
  "id": "artifact_xxx",
  "type": "blog",
  "title": "",
  "slug": "",
  "description": "",
  "body_markdown": "",
  "tags": [],
  "cover_image_url": null,
  "published_at": null,
  "version": 1,
  "status": "approved"
}
```

The final API contract is not defined in this Session.

It should be designed after:

- The Blog Artifact Schema is formalized
- The editing workflow is defined
- Export requirements are validated
- The personal Blog technology direction is selected

No new Decision identifier is assigned to this clarification in Session-008.

---

## 7. MVP Core Data Entities

Session-007 described the long-term data model.

The MVP will implement only the entities required by the selected Vertical Slice.

---

### 7.1 ContentPackage

Represents the complete content project.

Minimum fields:

```json
{
  "id": "cp_xxx",
  "working_title": "",
  "topic": "",
  "status": "active",
  "current_stage": "source_submitted",
  "requested_outputs": [
    "blog",
    "xiaohongshu"
  ],
  "created_at": "",
  "updated_at": ""
}
```

The Content Package is the primary object shown in the Dashboard and Workspace.

---

### 7.2 Source

Stores the original source material.

MVP source-input methods may include:

- Pasting a URL
- Pasting source text
- Uploading Markdown
- Uploading TXT

The MVP does not need universal automated extraction from every website or social platform.

Minimum Source data includes:

- Source type
- URL, when available
- Title
- Author, when available
- Original text
- Capture time
- Content Package reference

The original source must remain traceable and must not be overwritten by derived AI content.

---

### 7.3 ResearchResult

Stores structured Research Agent output.

Minimum content includes:

- Summary
- Key points
- Facts
- Claims requiring verification
- Questions for the creator
- Source references

The Research Result becomes the shared content foundation for later Blog and Xiaohongshu outputs.

---

### 7.4 HumanOpinion

Stores the creator’s real input.

Minimum content includes:

- Original user response
- Position
- Personal experience
- Agreements
- Disagreements
- Practical recommendations

The MVP should collect Human Opinion through structured questions or form fields.

It should not attempt to infer a complete personal opinion automatically from long-term memory.

---

### 7.5 OutputArtifact

The MVP uses a common Artifact abstraction with two types:

```text
blog
xiaohongshu
```

Minimum common fields:

```json
{
  "id": "artifact_xxx",
  "content_package_id": "cp_xxx",
  "artifact_type": "blog",
  "version": 1,
  "status": "draft",
  "content": {},
  "created_by": "writer_agent",
  "created_at": ""
}
```

Important regenerations or human edits should create new versions instead of silently destroying the previous version.

---

### 7.6 DesignSpecification

The MVP Design Specification applies primarily to the Xiaohongshu Artifact.

The Visual Agent may select from a limited component set:

```text
cover
section
bullet-list
comparison
quote
summary
cta
```

Example:

```json
{
  "theme": "default",
  "pages": [
    {
      "page_number": 1,
      "component": "cover",
      "heading": "",
      "subtitle": ""
    },
    {
      "page_number": 2,
      "component": "bullet-list",
      "heading": "",
      "body": ""
    }
  ]
}
```

The MVP will not allow the LLM to invent arbitrary layout systems.

---

### 7.7 RenderedOutput

Stores the relationship between:

- Xiaohongshu Artifact
- Design Specification
- Rendered files

Example:

```json
{
  "id": "render_xxx",
  "artifact_id": "artifact_xxx",
  "design_spec_id": "design_xxx",
  "status": "completed",
  "files": [],
  "created_at": ""
}
```

Rendered files should be exportable as PNG images.

---

### 7.8 WorkflowRun

Stores progress through the selected content-production workflow.

The MVP stages are:

```text
source
research
opinion
blog
packaging
design
render
review
completed
```

Workflow state must remain available after the user closes and reopens the application.

---

### 7.9 Approval

The MVP must preserve separate approval checkpoints.

Minimum approval targets include:

- Research Result
- Human Opinion
- Blog Artifact
- Xiaohongshu Artifact
- Final visual output

Approval must not be represented only by one global Boolean field.

---

## 8. Deferred Data Entities and Capabilities

The following capabilities do not enter the first Vertical Slice.

### AnalyticsSnapshot

Deferred because the MVP does not automatically connect to publishing platforms or collect performance data.

### Publication

Deferred because publishing is manual in the MVP.

### Performance Memory

Deferred until real published-content data exists.

### Full Platform Intelligence

The MVP may use curated rule files or simple platform guidance, but it will not initially implement a full platform knowledge-management system.

### Vector Search and Full RAG

Deferred according to Session-007 decisions.

### Dynamic Model Router

Model and Agent interfaces remain decoupled, but the first version may use a simple configuration mapping tasks to selected models.

### Multi-user and Team Permissions

Deferred because the first version is a single-user personal studio.

---

## 9. MVP Agent Scope

The MVP preserves the following logical Agent boundaries:

```text
Chief Editor
Research Agent
Writer Agent
Packaging Agent
Visual Agent
```

The Render Engine is not an Agent.

---

### 9.1 Chief Editor

The MVP Chief Editor is primarily a deterministic Orchestrator.

It is responsible for:

- Starting the workflow
- Calling the correct Agent
- Tracking current stage
- Waiting for human approval
- Resuming the workflow
- Handling revision requests
- Exposing progress to the interface

The MVP Chief Editor may use limited LLM planning, but it does not run an unrestricted autonomous loop.

---

### 9.2 Research Agent

Responsible for:

- Understanding the source
- Producing structured research
- Separating facts from uncertain claims
- Creating questions for the user
- Preserving source references

---

### 9.3 Writer Agent

Responsible only for the Blog Artifact.

Inputs include:

- Sources
- Approved Research Result
- Confirmed Human Opinion
- Available Brand Rules

Output:

- Versioned Blog Artifact

---

### 9.4 Packaging Agent

Responsible for Xiaohongshu expression.

Outputs include:

- Platform title candidates
- Cover copy
- Page-level content
- Caption
- Hashtags

It does not produce final rendered images.

---

### 9.5 Visual Agent

Responsible for converting Xiaohongshu content into a limited Design Specification.

It selects supported components, page purposes, information hierarchy, and optional visual requirements.

---

### 9.6 Render Engine

The Render Engine is deterministic application code.

It receives:

```text
Xiaohongshu Artifact
+
Design Specification
+
Theme
+
Optional visual assets
```

It produces:

```text
Rendered PNG files
```

The Render Engine does not perform open-ended content reasoning.

---

## 10. MVP Deployment Architecture

Agents in the MVP are logical modules, not independent services.

Conceptually:

```text
Backend Application
├── orchestration/
├── agents/
│   ├── research/
│   ├── writer/
│   ├── packaging/
│   └── visual/
├── schemas/
├── database/
├── model-adapters/
└── rendering/
```

Each Agent should still have its own:

- Prompt
- Input Schema
- Output Schema
- Validator
- Tests

The MVP does not require:

- Independent Agent deployment
- Agent-specific databases
- Microservices
- Message queues
- Distributed workflow infrastructure

---

## 11. MVP Product Surfaces

The MVP uses three core product surfaces.

---

### 11.1 Dashboard

The Dashboard displays all Content Packages.

Each package may show:

- Working title
- Source type
- Current stage
- Requested outputs
- Last updated time
- Pending user action

The Dashboard answers:

> What content projects exist, and where is each one currently blocked?

---

### 11.2 New Content Package

The creation surface supports:

- URL input
- Source-text input
- File upload
- Working topic
- Output selection:
  - Blog
  - Xiaohongshu
  - Both

Submitting the form creates a new Content Package and opens its Workspace.

---

### 11.3 Content Package Workspace

The Workspace is the primary MVP interface.

Recommended structure:

```text
Left:
Workflow stages

Center:
Current structured content and editor

Right:
Chief Editor Chat and contextual assistance
```

#### Left-side stages

```text
1. Source
2. Research
3. Your Opinion
4. Blog
5. Xiaohongshu
6. Visual
7. Export
```

#### Center workspace

May display:

- Source Viewer
- Research Review
- Human Opinion form
- Blog editor and preview
- Xiaohongshu page editor
- Visual preview
- Export tools

#### Right-side Chat

Supports:

- Questions about the current stage
- Revision requests
- Explanations
- Human input collection
- Coordination with the Chief Editor

The Chat is not the authoritative representation of project state.

---

## 12. Workspace and Chat Relationship

The MVP follows this principle:

```text
Workspace is the state interface.
Chat is the collaboration interface.
```

A Chat-only product would make it difficult to understand:

- Current Artifact versions
- Workflow state
- Approval state
- Exact modifications
- Page-level Xiaohongshu content
- Whether a change affected Blog or Xiaohongshu

Structured project state must remain visible and editable in the Workspace.

---

## 13. MVP Workflow State Machine

Recommended initial states:

```text
draft
→ source_ready
→ research_generated
→ research_approved
→ waiting_for_opinion
→ opinion_confirmed
→ blog_generated
→ blog_approved
→ xhs_generated
→ xhs_approved
→ design_generated
→ rendered
→ final_approved
→ completed
```

Revision states may include:

```text
blog_revision_requested
xhs_revision_requested
visual_revision_requested
```

Example transition:

```text
blog_approved
→ blog_revision_requested
→ blog_generated
```

Workflow state is controlled by deterministic application logic rather than being inferred from Chat history.

---

## 14. Human Approval Checkpoints

The MVP contains four main review checkpoints.

### Checkpoint 1: Research Review

The user verifies:

- Whether the source was understood correctly
- Whether important claims are accurate
- Whether uncertain information is clearly identified
- What deserves further development

### Checkpoint 2: Human Opinion

The user provides and confirms:

- Personal position
- Experience
- Agreements
- Disagreements
- Practical recommendations

### Checkpoint 3: Content Review

The user reviews Blog and Xiaohongshu Artifacts separately.

The user may:

- Edit directly
- Request targeted revision
- Generate a new version
- Approve the Artifact

### Checkpoint 4: Final Visual Review

The user reviews rendered Xiaohongshu pages and approves or requests a revision before export.

---

## 15. Explicit MVP Exclusions

The first Vertical Slice excludes:

```text
Automatic Xiaohongshu publishing
Automatic Blog publishing
Platform account authorization
Automatic analytics synchronization
Analytics Agent
Publisher Agent
Independent vector database
Full RAG system
Multi-user accounts
Team permissions
Billing
Dynamic model routing
Microservices
Message queues
Unrestricted autonomous Agent loops
Video production
Multilingual content generation
Advanced Blog CMS
```

These capabilities are not permanently rejected.

They are postponed because they are not necessary to validate the first content-production loop.

---

## 16. MVP Success Criteria

The MVP succeeds when one user can:

1. Add one real information source.
2. Preserve the original source.
3. Review structured AI research.
4. Add and confirm personal opinions.
5. Generate and edit a Blog draft.
6. Generate a platform-native Xiaohongshu carousel.
7. Export publishable Xiaohongshu PNG images.
8. Copy or export Blog Markdown.
9. Preserve the distinction between Source, AI Analysis, and Human Opinion.
10. Close the application and continue the workflow later.
11. Revise an Artifact without destroying the original source or prior Artifact versions.
12. Understand the current workflow stage and pending action.

The MVP is not considered successful merely because all Agent functions can technically run.

---

## 17. Recommended Implementation Slices

### Slice 1: Source to Research

Implement:

- Content Package creation
- Source input
- Source preservation
- Research Agent
- Research Review

Validation goal:

> Does the user trust and value the structured research result?

---

### Slice 2: Research to Human Opinion to Blog

Implement:

- Human Opinion form
- Opinion confirmation
- Writer Agent
- Blog editor
- Blog preview
- Markdown export

Validation goal:

> Can the system integrate the creator’s real perspective rather than only summarize the source?

---

### Slice 3: Content Foundation to Xiaohongshu Packaging

Implement:

- Packaging Agent
- Title candidates
- Cover copy
- Page structure
- Caption
- Hashtags
- Page-level editing

Validation goal:

> Is the Xiaohongshu output genuinely platform-native rather than a shortened Blog post?

---

### Slice 4: Design Specification to Rendered Output

Implement:

- Limited component library
- Default theme
- Visual Agent
- Design Specification
- React-based rendering
- PNG export

Validation goal:

> Can structured content be reliably transformed into a consistent visual deliverable?

---

# 18. Decisions

## DEC-036

### Status

Accepted

### Title

MVP 采用端到端 Vertical Slice

### Decision

ContentOS MVP 优先完成从信息源输入，到 Blog Draft、小红书内容和渲染图片导出的完整闭环。

MVP 不采用同时开发所有长期模块、但每个模块只完成一部分的横向方式。

### Reason

完整闭环可以验证 ContentOS 最核心的用户价值：

- 是否能减少内容研究和整理成本
- 是否能融合用户真实观点
- 是否能复用同一 Content Package
- 是否能生成不同平台内容
- 是否能输出可使用的最终资产

仅实现大量分散模块不能验证用户是否真正需要该产品。

### Impact

MVP 的：

- 产品范围
- 开发计划
- 数据实体
- Agent 实现顺序
- 验收标准

都应围绕一条完整内容生产链路组织。

---

## DEC-037

### Status

Accepted

### Title

MVP 保留 Blog 与小红书双输出

### Decision

第一个 ContentOS MVP 同时支持：

- Blog Draft
- Xiaohongshu Carousel

两个输出共享同一个 Source、Research Result 和 Human Opinion，但拥有不同的内容结构和表达方式。

### Reason

ContentOS 的核心假设之一是：

> 一个 Content Package 可以支持多个平台的不同内容表达。

如果 MVP 只实现一个平台，就无法验证：

- Content Package 的复用价值
- Blog 与小红书的差异化输出
- Packaging Agent 的独立价值
- 多平台内容资产模型

### Impact

MVP 必须包含：

- Writer Agent
- Packaging Agent
- Blog Artifact
- Xiaohongshu Artifact
- Blog 编辑和导出能力
- 小红书基础视觉渲染能力

---

## DEC-038

### Status

Accepted

### Title

MVP 使用确定性工作流和有限 LLM 规划

### Decision

MVP 的 Chief Editor 使用明确状态机控制工作流。

LLM 可以负责有限的内容判断、任务建议和用户沟通，但不运行开放式、无限制的自主 Agent 循环。

### Reason

确定性状态机更容易：

- 测试
- 调试
- 暂停和恢复
- 展示进度
- 处理审批
- 控制失败重试
- 保证下一步行为可预测

开放式自主 Agent 会增加早期产品的不确定性和故障复杂度。

### Impact

Chief Editor 的 MVP 定位首先是：

```text
Deterministic Orchestrator
+
Limited LLM Assistance
```

而不是完全自主的 AI 主管。

---

## DEC-039

### Status

Accepted

### Title

Agent 在 MVP 中作为逻辑边界而非独立服务

### Decision

Research、Writer、Packaging 和 Visual Agent 使用独立的：

- Prompt
- Input Schema
- Output Schema
- Validation
- Tests

但它们部署在同一个后端应用中，不作为独立微服务运行。

### Reason

独立服务会提前引入：

- 网络通信
- 服务发现
- 部署管理
- 分布式日志
- 消息队列
- 数据一致性
- 故障恢复

这些复杂度不能直接提高 MVP 的核心价值验证能力。

### Impact

MVP 采用模块化单体架构，同时保留 Agent 的职责和契约边界。

未来可以在真实规模和性能需求出现后拆分服务。

---

## DEC-040

### Status

Accepted

### Title

MVP Web App 使用三个核心 Surface

### Decision

ContentOS MVP 包含三个核心产品 Surface：

1. Dashboard
2. New Content Package
3. Content Package Workspace

Chief Editor Chat 集成在 Content Package Workspace 中。

Chat 不作为项目事实和工作流状态的唯一界面。

### Reason

用户既需要自然语言协作，也需要：

- 可见的工作流阶段
- 可编辑的结构化内容
- Artifact 版本
- 审批状态
- 页面级预览
- 明确的导出结果

纯 Chat 交互难以稳定表达这些状态。

### Impact

MVP 产品设计应围绕 Content Package Workspace 展开。

Dashboard 负责项目入口，Workspace 负责内容和状态，Chat 负责协作。

---

## DEC-041

### Status

Accepted

### Title

MVP 仅支持人工导出，不支持自动发布

### Decision

ContentOS MVP 输出：

- Blog Markdown
- Xiaohongshu PNG
- Caption
- Hashtags

用户手动将内容发布到个人 Blog 或小红书。

MVP 不连接平台账号，也不执行自动发布。

### Reason

自动发布会引入：

- 平台授权
- 登录状态
- 风控
- API 限制
- 发布失败处理
- 状态同步
- 平台兼容性维护

这些能力不能直接验证 ContentOS 的内容生产价值。

### Impact

以下能力推迟：

- Publisher Agent
- 平台账号连接
- 自动 Blog 发布
- 自动小红书发布
- 发布状态同步

MVP 需要提供稳定的复制、下载和导出能力。

---

## DEC-042

### Status

Accepted

### Title

Analytics 与高级 Memory 能力推迟到内容生产闭环验证后

### Decision

首个 Vertical Slice 不实现：

- Analytics Agent
- Performance Memory
- 完整 Platform Intelligence
- 完整 RAG
- 向量检索
- 独立向量数据库

这些能力在内容生产闭环和真实发布流程验证后再评估。

### Reason

Analytics 和 Performance Memory 依赖真实发布数据。

RAG 和向量检索依赖足够规模的历史内容和非结构化知识。

在数据规模和使用需求出现前实现这些能力，会造成过度设计。

### Impact

MVP 聚焦：

- 内容输入
- 研究
- 人类观点
- 内容生成
- 审核
- 视觉渲染
- 人工导出

未来架构仍为高级 Memory 和 Retrieval 能力保留扩展空间。

---

## 19. Deferred Questions

The following questions remain open:

1. What is the final Blog Artifact Schema?
2. Which Markdown frontmatter fields are required?
3. How will Blog versions be compared in the Workspace?
4. Will the ContentOS Blog preview use the same styles as the future public Blog?
5. What API contract will connect ContentOS with the future personal Blog?
6. Should publishing use an HTTP API, Git commit, webhook, or file export?
7. What frontend and backend frameworks will the MVP use?
8. Which model will be used for each logical Agent in the first implementation?
9. What is the minimum supported source-extraction capability?
10. Which Xiaohongshu components are required in the first rendering library?
11. How will users edit individual carousel pages?
12. How will Agent revision requests create new Artifact versions?
13. How will model costs and Agent execution logs be exposed?
14. Which approval transitions can be reversed?

---

## 20. Documentation Updates

Create:

```text
docs/sessions/session-008.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-036
DEC-037
DEC-038
DEC-039
DEC-040
DEC-041
DEC-042
```

Future documents to create:

```text
docs/product/mvp-scope.md
docs/product/content-package-workspace.md
docs/architecture/mvp-vertical-slice.md
docs/architecture/workflow-state-machine.md
docs/architecture/blog-artifact-contract.md
docs/architecture/blog-integration.md
```

The future personal Blog should be created as a separate project after the Blog Artifact contract becomes sufficiently stable.

Possible directory relationship:

```text
/Users/ketchup/Desktop/
├── ContentOS/
└── PersonalBlog/
```

This directory structure is an implementation suggestion, not a formal Decision in this Session.

---

## 21. Documentation Sync Checklist

- [x] DEC-036 through DEC-042 confirmed
- [ ] Save this document as `docs/sessions/session-008.md`
- [ ] Add DEC-036 through DEC-042 to `docs/decisions/decisions.md`
- [ ] Create `docs/product/mvp-scope.md`
- [ ] Define the Blog Artifact Schema
- [ ] Define the Content Package Workspace interaction
- [ ] Define the deterministic workflow state machine
- [ ] Define the limited Xiaohongshu component library
- [ ] Define the manual export contract
- [ ] Design the future personal Blog only after the Blog Artifact contract is stable
- [ ] Review AGENTS.md after the MVP specifications become authoritative

---

## 22. Session Summary

ContentOS will validate its core product value through one complete Vertical Slice rather than by partially implementing every long-term subsystem.

The MVP will accept one source, create structured research, collect the creator’s real opinion, generate separate Blog and Xiaohongshu Artifacts, create a limited Design Specification, render Xiaohongshu images, and allow manual export.

Blog and Xiaohongshu remain two separate outputs of the same Content Package.

The ContentOS Blog MVP does not require a public Blog website. ContentOS first defines and validates the Blog Artifact. A separate personal Blog project can later consume approved Blog Artifacts through a stable file or API contract.

The MVP uses deterministic workflow orchestration, logical Agent boundaries inside one backend application, three core product surfaces, human review checkpoints, and manual publishing.

Analytics, advanced Memory, RAG, vector search, automatic publishing, microservices, and multi-user capabilities are deferred until the content-production loop has been validated.
