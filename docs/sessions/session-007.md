# ContentOS Session-007

**Status:** Formalized  
**Session Type:** Data and Memory Architecture  
**Topic:** Content Package Data Model, Database Design, Memory Layer, and RAG Boundaries  
**Date:** 2026-07-26

---

## 1. Context

ContentOS has already established the following product and architecture foundations:

- ContentOS is a Web App with a multi-agent backend.
- The Chief Editor coordinates specialized agents.
- The Chief Editor uses an LLM Planner, deterministic Executor, and Validators.
- Important workflow stages require human approval.
- Blog and Xiaohongshu are separate outputs derived from the same Content Package.
- Visual production is driven by a Design Specification.
- Image generation and final rendering are separate capabilities.
- The rendering system uses a component-based architecture.

The next unresolved issue was the data foundation:

> What does ContentOS store, how is content versioned, what counts as memory, and where is RAG actually necessary?

---

## 2. Core Conclusion

The Content Package is not a single article and should not be implemented as one large JSON document.

It is a content-project aggregate that connects all information, decisions, outputs, assets, workflow activity, approvals, and performance data produced during one content-creation cycle.

Conceptually:

```text
Content Package
│
├── Sources
├── Research Results
├── Human Opinions
├── Output Artifacts
│   ├── Blog
│   └── Xiaohongshu
├── Design Specifications
├── Visual Assets
├── Workflow Runs
├── Agent Tasks
├── Approvals
└── Analytics Snapshots
```

The Content Package provides a stable identity and lifecycle for the project, while related entities are stored and versioned independently.

---

## 3. Content Package as Aggregate Root

A Content Package represents one complete content initiative.

Example:

```json
{
  "id": "cp_xxx",
  "working_title": "MCP 内容项目",
  "topic": "MCP",
  "content_domain": "ai_agent",
  "target_audience": [
    "AI 产品经理",
    "AI 初学者"
  ],
  "requested_outputs": [
    "blog",
    "xiaohongshu"
  ],
  "current_stage": "research_review",
  "overall_status": "active",
  "created_at": "",
  "updated_at": "",
  "archived_at": null
}
```

The Content Package should primarily store:

- Project identity
- Topic metadata
- Requested outputs
- Current workflow stage
- Overall status
- References to active artifact versions

It should not directly contain every source, draft, visual asset, execution log, and analytics record.

---

## 4. Core Data Entities

### 4.1 ContentPackage

Represents the complete content project.

Responsibilities:

- Identify the project
- Track the current stage
- Associate all related content assets
- Expose overall progress in the Dashboard
- Reference currently active output versions

---

### 4.2 Source

Stores original information sources.

Example:

```json
{
  "id": "src_xxx",
  "content_package_id": "cp_xxx",
  "source_type": "web_article",
  "url": "",
  "title": "",
  "author": "",
  "published_at": "",
  "raw_text": "",
  "captured_at": "",
  "content_hash": ""
}
```

One Content Package may contain multiple sources:

- Primary X post
- Full external article
- Official documentation
- Supporting research material
- User-uploaded notes

Original source content must not be silently modified by an Agent.

If a source is fetched again or changes, the system should preserve a new snapshot rather than overwrite the old one.

---

### 4.3 ResearchResult

Stores structured output produced by the Research Agent.

Example:

```json
{
  "id": "research_xxx",
  "content_package_id": "cp_xxx",
  "version": 1,
  "summary": "",
  "key_points": [],
  "facts": [],
  "claims_to_verify": [],
  "controversies": [],
  "questions_for_creator": [],
  "source_references": [],
  "model_info": {},
  "created_at": ""
}
```

Research results should retain:

- Referenced sources
- Supported facts
- Uncertain claims
- Model information
- Prompt or contract version
- Creation time

This allows ContentOS to explain how a conclusion was produced.

---

### 4.4 HumanOpinion

Stores the creator’s own judgment and experience.

Example:

```json
{
  "id": "opinion_xxx",
  "content_package_id": "cp_xxx",
  "version": 1,
  "position": "",
  "personal_experience": "",
  "examples": [],
  "disagreements": [],
  "practical_advice": [],
  "input_method": "text",
  "created_at": ""
}
```

AI may help organize or polish a Human Opinion, but the system must preserve:

- The creator’s original input
- The AI-assisted version
- The approval state

The AI must not fabricate personal experiences on the creator’s behalf.

---

### 4.5 OutputArtifact

Represents a platform-specific content output.

Common structure:

```json
{
  "id": "artifact_xxx",
  "content_package_id": "cp_xxx",
  "artifact_type": "blog",
  "version": 1,
  "status": "draft",
  "content": {},
  "created_by": "writer_agent",
  "created_at": "",
  "approved_at": null
}
```

Supported initial artifact types:

- Blog
- Xiaohongshu

Possible future artifact types:

- Newsletter
- LinkedIn post
- Video script
- WeChat article

#### Blog Artifact

May include:

```json
{
  "title": "",
  "slug": "",
  "summary": "",
  "outline": [],
  "body_markdown": "",
  "seo_title": "",
  "seo_description": "",
  "tags": [],
  "related_content_ids": []
}
```

#### Xiaohongshu Artifact

May include:

```json
{
  "platform_title_candidates": [],
  "selected_platform_title": "",
  "cover": {
    "eyebrow": "",
    "title": "",
    "subtitle": ""
  },
  "pages": [],
  "caption": "",
  "hashtags": [],
  "design_spec_id": ""
}
```

Platform title, cover title, cover subtitle, and page headings remain separate fields.

---

### 4.6 DesignSpecification

Stores the Visual Agent’s structured design intent.

Example:

```json
{
  "id": "design_xxx",
  "artifact_id": "artifact_xxx",
  "version": 1,
  "theme_id": "brand_default",
  "canvas": {
    "width": 1080,
    "height": 1440
  },
  "pages": [
    {
      "page_number": 1,
      "purpose": "hook",
      "component": "cover_slide",
      "layout": "title_top_visual_bottom",
      "heading": "",
      "body": "",
      "highlight_words": [],
      "visual_requirement": {
        "required": true,
        "type": "illustration",
        "prompt": ""
      }
    }
  ]
}
```

This separation allows ContentOS to:

- Regenerate visual assets without rewriting content
- Change templates without changing the article
- Replace the image-generation provider
- Re-render content using another brand theme
- Maintain design version history

---

### 4.7 VisualAsset

Stores metadata for generated, uploaded, or reused assets.

Example:

```json
{
  "id": "asset_xxx",
  "content_package_id": "cp_xxx",
  "design_spec_id": "design_xxx",
  "asset_type": "generated_illustration",
  "storage_url": "",
  "prompt": "",
  "provider": "",
  "model": "",
  "width": 1024,
  "height": 1024,
  "status": "approved",
  "created_at": ""
}
```

Possible asset types:

- Generated illustration
- Uploaded screenshot
- Diagram
- Chart
- Icon
- Reusable brand asset
- Rendered page
- Export package

Binary files should be stored in object storage.

The database should store metadata and references rather than large binary files.

---

### 4.8 WorkflowRun

Stores one execution of an orchestration plan.

Example:

```json
{
  "id": "run_xxx",
  "content_package_id": "cp_xxx",
  "workflow_type": "create_blog_and_xhs",
  "status": "waiting_for_approval",
  "current_step": "approve_human_opinion",
  "plan": [],
  "started_at": "",
  "completed_at": null
}
```

Each Agent task should also be traceable:

```json
{
  "id": "task_xxx",
  "workflow_run_id": "run_xxx",
  "agent_type": "research_agent",
  "task_type": "analyze_sources",
  "status": "completed",
  "input_refs": [],
  "output_ref": "research_xxx",
  "attempt": 1,
  "error": null
}
```

This supports:

- Dashboard progress
- Retry behavior
- Failure inspection
- Cost and model tracking
- Pause and resume
- Human approval checkpoints

---

### 4.9 Approval

Stores a human decision at a specific workflow checkpoint.

Example:

```json
{
  "id": "approval_xxx",
  "content_package_id": "cp_xxx",
  "target_type": "output_artifact",
  "target_id": "artifact_xxx",
  "approval_type": "content_quality",
  "status": "approved",
  "comment": "",
  "created_at": ""
}
```

Approval types may include:

- Research approval
- Human Opinion confirmation
- Blog draft approval
- Xiaohongshu title selection
- Visual direction approval
- Publishing approval

A single `approved: true` field is insufficient because ContentOS contains multiple independently reviewed stages.

---

### 4.10 AnalyticsSnapshot

Stores platform performance as time-series snapshots.

Example:

```json
{
  "id": "metric_xxx",
  "artifact_id": "artifact_xxx",
  "platform": "xiaohongshu",
  "captured_at": "",
  "views": 0,
  "likes": 0,
  "saves": 0,
  "comments": 0,
  "shares": 0,
  "followers_gained": 0
}
```

Content performance changes over time.

The system should preserve multiple snapshots rather than overwrite one final metrics record.

---

## 5. Mutability and Versioning

### 5.1 Append-Only or Versioned Data

The following should not be silently overwritten:

- Original source snapshots
- Original human input
- Research Agent outputs
- Output Artifact versions
- Design Specification versions
- Published content versions
- Workflow execution logs
- Approval records
- Analytics Snapshots

Changes should create new records or new versions.

---

### 5.2 Directly Mutable Data

The following may be updated directly when appropriate:

- Content Package working title
- Current stage
- Overall status
- Selected active artifact
- Selected title candidate
- Tags
- Archive state
- User-facing organization metadata

---

### 5.3 MVP Version Model

The MVP does not require a Git-like content-diff system.

Important versioned entities should initially support:

```text
version
parent_version_id
created_by
created_at
status
```

Example lifecycle:

```text
Blog v1 — Writer Agent draft
Blog v2 — User revision
Blog v3 — AI-assisted polish
Blog v4 — Published version
```

The Content Package may reference the active version while retaining older versions.

---

## 6. Database Architecture

The recommended MVP data architecture is:

```text
PostgreSQL
├── Structured entities
├── Relationships
├── Workflow state
├── Approvals
├── Versions
├── Analytics
└── JSONB content payloads

Object Storage
├── Source files
├── Screenshots
├── Generated illustrations
├── Rendered images
└── Export packages
```

PostgreSQL is preferred because ContentOS has strong relational requirements:

- One Content Package to multiple Sources
- One Artifact to multiple versions
- One Workflow Run to multiple Agent Tasks
- One Artifact to multiple approvals
- One Artifact to multiple Analytics Snapshots
- One Design Specification to multiple Visual Assets

JSONB can provide flexibility for platform-specific Artifact structures without abandoning relational integrity.

A specific PostgreSQL or object-storage provider is not selected in this Session.

---

## 7. Memory Layer

Memory is not one undifferentiated AI memory store.

ContentOS separates memory according to purpose and lifecycle.

---

### 7.1 Working Memory

Represents the current execution state.

Contains:

- Current Content Package
- Current workflow stage
- Completed tasks
- Pending tasks
- Current active Artifact
- Approval status
- Current Agent outputs

Working Memory is primarily workflow state stored in the normal database.

It does not require RAG.

---

### 7.2 Content Memory

Represents the creator’s historical content.

May answer:

- What topics have already been covered?
- Which concepts have already been explained?
- Which articles should be internally linked?
- Has the creator expressed a similar opinion before?
- Which visual assets could be reused?

Content Memory supports both:

- Structured metadata queries
- Future semantic retrieval

---

### 7.3 Brand Memory

Stores stable brand rules and approved examples.

Structured Brand Memory may include:

```json
{
  "brand_name": "",
  "positioning": "",
  "target_audience": [],
  "tone": [
    "清晰",
    "克制",
    "有观点"
  ],
  "avoid_tone": [
    "夸张营销",
    "虚假权威"
  ],
  "visual_style": "minimal_tech",
  "primary_templates": [],
  "preferred_terms": [],
  "banned_phrases": []
}
```

Stable rules should be stored as structured data.

Approved articles and visual samples may later support semantic retrieval.

---

### 7.4 Platform Intelligence

Represents knowledge about publishing platforms.

May include:

- Official creator guidance
- Platform policies
- Content-format requirements
- Official campaigns and notices
- Internal platform strategy notes
- High-performing examples
- Account-specific performance data
- Time-sensitive platform changes

Platform Intelligence may combine:

- Structured rules
- Document retrieval
- Metadata filters
- Analytics

It should not be stored only in one Agent prompt.

---

### 7.5 Performance Memory

Connects historical content strategies with real results.

Possible dimensions include:

- Topic
- Title strategy
- Cover style
- Content structure
- Visual type
- Publication time
- Views
- Saves
- Comments
- Follower growth

Performance Memory should primarily use structured analytics and deterministic calculations.

LLMs may explain findings but should not replace the underlying analysis.

---

## 8. RAG Boundaries

RAG is appropriate when ContentOS must retrieve relevant passages from a large amount of non-structured or semi-structured knowledge.

### Appropriate RAG Scenarios

- Retrieving relevant Xiaohongshu creator guidance
- Finding historical content semantically related to a new topic
- Selecting approved writing-style examples
- Retrieving relevant background research from a knowledge library
- Finding older content that may support internal linking

### Inappropriate RAG Scenarios

Do not use RAG for:

- Current workflow state
- Current selected title
- Approval status
- Exact brand rules
- Agent input validation
- Permissions
- Publishing state
- Analytics calculations
- Determining the next state-machine transition
- Reading known fields from the current Content Package

These cases require deterministic database access, typed configuration, or application logic.

---

## 9. MVP Retrieval Strategy

The MVP will not introduce a separate vector database.

The initial retrieval capabilities should use:

```text
PostgreSQL
+
JSONB
+
Metadata filters
+
Tags
+
Full-text search
```

Vector retrieval should be introduced only after a real need is demonstrated, such as:

- A large historical content library
- Platform documentation that cannot be handled with normal search
- Semantic style-example retrieval
- Repeated failures of tags and full-text search

If vector retrieval becomes necessary, PostgreSQL-compatible vector search should be considered before introducing a separate database.

---

# 10. Decisions

## DEC-030

### Title

Content Package 作为系统聚合根，而不是单一 JSON 文档

### Decision

Content Package 负责关联 Sources、Research Results、Human Opinions、Output Artifacts、Design Specifications、Visual Assets、Workflow Runs、Approvals 和 Analytics Snapshots。

Content Package 不直接把所有内容存储在一个巨大 JSON 字段中。

### Reason

内容生产会产生多个来源、多个版本、多个平台产物、多个审批记录和多次工作流执行。

将全部数据塞入一个 JSON 文档会导致：

- 修改历史难以追踪
- Agent 容易互相覆盖结果
- 独立回滚困难
- 数据分析困难
- 并发更新风险增加

### Impact

影响：

- 数据库实体设计
- API 设计
- Agent 数据契约
- Dashboard 页面结构
- 内容版本管理方式

---

## DEC-031

### Title

MVP 数据层采用 PostgreSQL 与 Object Storage

### Decision

ContentOS 的结构化数据、实体关系、工作流状态、版本、审批和分析记录保存在 PostgreSQL 中。

图片、截图、源文件、生成资产和渲染输出保存在 Object Storage 中。

### Reason

ContentOS 同时需要：

- 可靠的实体关系
- 灵活的平台内容结构
- 事务和状态管理
- 大型二进制文件存储

PostgreSQL 的关系能力和 JSONB 灵活性适合 ContentOS，而 Object Storage 更适合管理图片与导出文件。

### Impact

后续架构应：

- 使用关系型数据模型
- 将二进制文件与业务数据分离
- 在数据库中保存文件元数据和引用
- 避免把大型文件直接存进 PostgreSQL

---

## DEC-032

### Title

关键内容资产采用追加式版本管理

### Decision

Source、Research Result、Human Opinion、Output Artifact、Design Specification 和发布内容的重要修改创建新版本，不直接覆盖历史版本。

系统应保存版本号、父版本引用、创建者、创建时间和状态。

### Reason

ContentOS 需要支持：

- 来源追踪
- 人工修改历史
- Agent 输出审计
- 版本比较
- 回滚
- 发布内容留档

直接覆盖会破坏可追溯性，并使错误难以定位。

### Impact

相关实体需要支持：

- `version`
- `parent_version_id`
- `created_by`
- `created_at`
- `status`

Content Package 需要能够引用当前激活版本。

---

## DEC-033

### Title

Memory Layer 按职责拆分

### Decision

ContentOS 的 Memory Layer 拆分为：

- Working Memory
- Content Memory
- Brand Memory
- Platform Intelligence
- Performance Memory

不将所有记忆统一放入一个模糊的向量数据库或 Agent Prompt。

### Reason

不同类型的记忆具有不同的：

- 数据来源
- 生命周期
- 更新机制
- 准确性要求
- 查询方式
- 使用权限

例如工作流状态需要确定性读取，而历史文章可能需要语义检索。

### Impact

后续 Memory Architecture 和 Agent Specs 必须分别定义：

- 每类记忆保存什么
- 谁负责更新
- 哪些 Agent 可以读取
- 如何进行版本管理
- 使用结构化查询还是语义检索

---

## DEC-034

### Title

RAG 只用于非结构化知识的相关性检索

### Decision

RAG 用于平台资料、历史内容、品牌样本和补充研究的相关性检索。

当前工作流状态、审批、明确品牌规则、指标计算、权限和当前 Content Package 字段使用确定性的数据库查询或应用逻辑。

### Reason

RAG 适合从大量非结构化材料中查找相关上下文，但不适合作为所有数据读取的统一方案。

滥用 RAG 会降低：

- 准确性
- 可解释性
- 稳定性
- 可测试性

### Impact

每个 Agent Spec 必须明确：

- 读取结构化数据库
- 使用全文搜索
- 使用语义检索
- 使用确定性规则

中的哪一种或哪几种方式。

---

## DEC-035

### Title

MVP 不引入独立向量数据库

### Decision

MVP 首先使用 PostgreSQL、JSONB、标签、元数据过滤和全文搜索。

只有在真实的语义检索需求被验证后，才增加向量检索能力。

### Reason

当前内容规模和产品阶段不足以证明独立向量数据库带来的基础设施复杂度。

过早引入会增加：

- 部署成本
- 数据同步问题
- 调试难度
- 检索评估工作
- 系统维护负担

### Impact

MVP 架构保持简单。

未来需要向量检索时，优先评估 PostgreSQL 兼容的向量能力，再决定是否引入独立向量数据库。

---

## 11. Rejected or Deferred Approaches

### One Large Content Package JSON

Deferred because it does not support safe versioning, independent entities, or traceable Agent outputs.

### MongoDB as the Default MVP Database

Not selected because ContentOS has strong relational, workflow, approval, and versioning requirements.

### Independent Vector Database in the MVP

Not selected because the semantic retrieval need has not yet been demonstrated.

### RAG for All Memory

Rejected because structured rules, current state, analytics, approvals, and permissions require deterministic access.

### Overwriting Agent Output

Rejected because it removes auditability and rollback capability.

---

## 12. Open Questions

The following questions remain unresolved:

1. Which PostgreSQL provider will be used?
2. Which Object Storage provider will be used?
3. Should Source raw text remain in PostgreSQL or be moved to Object Storage above a size threshold?
4. How will Artifact versions be compared in the UI?
5. How will the system identify the active version of each Artifact?
6. Which Memory types can be modified automatically by an Agent?
7. Which Memory updates require human approval?
8. How will Platform Intelligence documents be collected and refreshed?
9. How will retrieval quality be evaluated when semantic search is introduced?
10. What data-retention and deletion rules will apply?
11. How will model usage, token cost, and execution duration be recorded?
12. Which data entities belong in the MVP vertical slice?

---

## 13. Documentation Updates

Create:

```text
docs/sessions/session-007.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

- DEC-030
- DEC-031
- DEC-032
- DEC-033
- DEC-034
- DEC-035

Future documents to create:

```text
docs/architecture/content-package.md
docs/architecture/data-model.md
docs/architecture/memory-layer.md
docs/architecture/retrieval-and-rag.md
```

The following existing documents should later be updated:

```text
AGENTS.md
docs/product/vision.md
```

Update them only when the new architecture documents become authoritative enough to replace their current high-level descriptions.

---

## 14. Documentation Sync Checklist

- [x] Session-007 decisions confirmed
- [ ] Save this document as `docs/sessions/session-007.md`
- [ ] Add DEC-030 through DEC-035 to `docs/decisions/decisions.md`
- [ ] Create Content Package architecture specification
- [ ] Create data-model specification
- [ ] Create Memory Layer specification
- [ ] Create RAG boundary specification
- [ ] Review AGENTS.md after architecture specifications are completed

---

## 15. Session Summary

ContentOS will treat the Content Package as an aggregate content project rather than one large document.

Its sources, research results, human opinions, platform outputs, design specifications, visual assets, workflow runs, approvals, and analytics will be modeled as related and independently versioned entities.

The MVP will use PostgreSQL and Object Storage, while Memory will be separated by purpose.

RAG will be used only where semantic retrieval of non-structured knowledge is genuinely required, and no independent vector database will be introduced during the MVP without validated demand.