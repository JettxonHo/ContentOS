# ContentOS Session-009

**Status:** Formalized  
**Session Type:** Content Contract and External Integration Architecture  
**Topic:** Blog Artifact Schema, Markdown Export Contract, and PersonalBlog Integration Boundary  
**Date:** 2026-07-26

---

## 1. Context

Session-008 confirmed that the ContentOS MVP will support two outputs from the same Content Package:

- Blog Draft
- Xiaohongshu Carousel

The ContentOS Blog MVP does not require a public Blog website.

ContentOS will first produce, edit, approve, version, and export Blog Artifacts. A separate PersonalBlog project may later receive those approved Artifacts and publish them publicly.

The unresolved architectural questions were:

1. What exactly is stored in a Blog Artifact?
2. What is the canonical representation of Blog body content?
3. How should Blog content be exported?
4. Which metadata belongs to ContentOS?
5. Which metadata belongs to PersonalBlog?
6. How can both projects integrate without sharing database models?
7. Can the MVP begin with Markdown while retaining a future migration path toward structured Blocks?

---

## 2. Core Architecture

ContentOS separates three concepts:

```text
Blog Artifact
≠
Blog Export Package
≠
PersonalBlog Post
```

### Blog Artifact

An internal ContentOS domain object used for:

- Content generation
- Editing
- Version management
- Human approval
- Source traceability
- Agent-run references
- Export preparation

### Blog Export Package

A versioned and portable exchange format used between ContentOS and another publishing system.

It contains:

- Article Markdown
- Export metadata
- Assets
- Version identifiers
- File checksums

### PersonalBlog Post

An object owned by the future PersonalBlog project.

It controls:

- Final public slug
- Public URL
- Publication status
- Website layout
- Website navigation
- Sitemap and RSS
- Website-level SEO rendering
- Deployment

The intended relationship is:

```text
Content Package
→ Blog Artifact
→ Blog Export Mapper
→ Blog Export Package
→ PersonalBlog Import Adapter
→ PersonalBlog Post
```

---

## 3. Responsibility Boundary

### ContentOS Owns

ContentOS is responsible for:

- Original sources
- Structured research
- Human Opinion
- Blog generation
- Blog editing
- Blog version history
- Content approval
- Suggested publishing metadata
- Source traceability
- Markdown export
- Export assets
- Export contract versions

### PersonalBlog Owns

PersonalBlog is responsible for:

- Final public slug
- Final public URL
- Website routing
- Publication and unpublishing
- Scheduling
- Website templates
- Website navigation
- Website image storage
- Sitemap
- RSS
- Final SEO tags
- Deployment

ContentOS must not directly modify PersonalBlog database tables.

PersonalBlog must not directly depend on ContentOS internal database tables.

---

## 4. Blog Artifact Identity

A Blog must have both:

- A stable Article identity
- An immutable Version identity

Recommended identity structure:

```json
{
  "artifact_id": "blog_01ABC",
  "version_id": "blogver_01XYZ",
  "content_package_id": "cp_01DEF",
  "version_number": 3,
  "parent_version_id": "blogver_01PREVIOUS"
}
```

### Field Responsibilities

| Field | Responsibility |
|---|---|
| `artifact_id` | Stable identity shared by all versions of the same Blog |
| `version_id` | Unique identity of one immutable version |
| `content_package_id` | Parent Content Package |
| `version_number` | Human-readable sequential version |
| `parent_version_id` | Direct predecessor of the current version |

Example:

```text
artifact_id: blog_mcp_intro

v1 — Writer Agent first draft
v2 — User opinion revision
v3 — AI-assisted polish
v4 — Approved version
```

All four versions retain the same `artifact_id`, while every version has its own `version_id`.

---

## 5. Blog Artifact Layers

The Blog Artifact is divided into the following logical layers:

```text
Blog Artifact
├── Identity
├── Editorial Content
├── Publishing Metadata
├── Internal Traceability
├── Generation Reference
├── Version and Approval
└── Lifecycle Metadata
```

---

## 6. Editorial Content

The MVP Editorial Content contains:

- Title
- Optional subtitle
- Summary
- Blog body
- Language

Recommended structure:

```json
{
  "editorial": {
    "title": "为什么 AI Agent 都在讨论 MCP？",
    "subtitle": null,
    "summary": "一篇解释 MCP 对 Agent 生态意义的文章。",
    "body": {
      "format": "markdown",
      "schema_version": "contentos.blog-body/markdown-v1",
      "content": "# 正文\n\n……"
    },
    "language": "zh-CN"
  }
}
```

The `body` container is intentionally format-aware.

The MVP only supports:

```json
{
  "format": "markdown"
}
```

The format field exists to preserve a future migration boundary.

---

## 7. Canonical Body Model

### MVP Canonical Model

During the MVP:

```text
Markdown
=
Canonical Blog Body
```

The Markdown stored in:

```text
editorial.body.content
```

is the only editable and authoritative representation of the Blog body.

The MVP must not maintain another independently editable Blocks representation.

---

### Derived Data

The following may be derived from Markdown:

- Outline
- Table of Contents
- Heading anchors
- Reading time
- Word count
- Section index
- Search text

For example:

```text
Markdown Headings
→ Markdown Parser
→ Derived Outline
```

Derived data may be cached for performance, but it is not a second canonical content source.

---

## 8. Future Blocks Migration Boundary

ContentOS may later migrate from a Markdown Canonical Model to a structured Blocks Canonical Model.

A future Blog body may use:

```json
{
  "body": {
    "format": "blocks",
    "schema_version": "contentos.blog-body/blocks-v1",
    "content": [
      {
        "id": "block_001",
        "type": "paragraph",
        "children": []
      }
    ]
  }
}
```

A possible migration path is:

```text
Markdown
→ Markdown Parser
→ Markdown AST
→ ContentOS Blocks
```

When Blocks become canonical:

```text
Blocks
=
Canonical internal content

Markdown
=
Derived export representation
```

Markdown and Blocks must never remain two independently editable canonical representations.

---

### Historical Version Preservation

Historical Markdown versions do not need to be rewritten.

Example:

```text
Blog v1 — markdown-v1
Blog v2 — markdown-v1
Blog v3 — markdown-v1
Blog v4 — blocks-v1
Blog v5 — blocks-v1
```

Each Blog version records its own body format and schema version.

---

### Migration Fallback

Content that cannot be safely converted into a known Block may temporarily use a fallback representation such as:

```json
{
  "type": "raw_markdown",
  "content": "Original Markdown content"
}
```

Any future migration must preserve original content and identify conversion uncertainty.

---

## 9. Conditions for Migrating to Blocks

Migration to Blocks should be considered only when one or more validated requirements emerge:

- Drag-and-drop section editing
- Block-level AI revision
- Block-level source attribution
- Rich media components
- Reusable Callout or Diagram components
- Multi-channel structured reuse
- Block-level comments
- Multi-user collaboration
- Complex visual editing
- Reordering content without editing Markdown
- Component-aware rendering across channels

The existence of these possible future capabilities does not justify implementing Blocks during the MVP.

---

## 10. Publishing Metadata

ContentOS may recommend publishing metadata without owning the final public result.

Recommended structure:

```json
{
  "publishing_metadata": {
    "suggested_slug": "why-ai-agents-need-mcp",
    "excerpt": "解释 MCP 为什么正在成为 AI Agent 的重要基础设施。",
    "tags": [
      "AI Agent",
      "MCP"
    ],
    "author_profile_id": "author_default",
    "cover_asset_id": null,
    "seo_title": "为什么 AI Agent 都在讨论 MCP？",
    "seo_description": "从产品和生态角度理解 MCP 对 AI Agent 的意义。"
  }
}
```

The field is named:

```text
suggested_slug
```

rather than:

```text
slug
```

because PersonalBlog owns final route resolution.

PersonalBlog may adjust a conflicting slug:

```text
Suggested:
why-ai-agents-need-mcp

Resolved:
why-ai-agents-need-mcp-2
```

---

## 11. Editorial Status and Publication Status

ContentOS and PersonalBlog use different status domains.

### ContentOS Editorial Status

Possible states:

```text
draft
in_review
approved
superseded
archived
```

These describe content readiness and editorial history.

### PersonalBlog Publication Status

Possible states:

```text
unpublished
scheduled
published
unlisted
withdrawn
```

These describe public website behavior.

The two status systems must not share one field.

Example:

```text
ContentOS:
approved

PersonalBlog:
unpublished
```

The content is approved but not publicly available.

Another example:

```text
ContentOS:
superseded

PersonalBlog:
published
```

An older Blog version may still be online while a new ContentOS version awaits review.

---

## 12. Internal Traceability

The Blog Artifact retains internal relationships to its creation evidence.

Example:

```json
{
  "traceability": {
    "source_ids": [
      "src_001",
      "src_002"
    ],
    "research_result_id": "research_001",
    "human_opinion_ids": [
      "opinion_001"
    ],
    "citation_map": [
      {
        "claim_id": "claim_001",
        "source_id": "src_001",
        "source_location": "paragraph_12"
      }
    ]
  }
}
```

This information supports:

- Source verification
- Claim traceability
- Future revision
- Auditability
- Human Opinion preservation
- Research reuse

Internal identifiers should not automatically appear in public Blog metadata.

---

## 13. Public References

Public references are different from internal traceability.

ContentOS may produce a public reference section such as:

```markdown
## 参考资料

1. 官方产品文档
2. 原作者文章
3. 相关研究材料
```

Public References may be included in the Article Markdown.

Internal workflow identifiers should not be exported as public reader-facing metadata.

Examples of internal fields that should remain private:

```text
research_result_id
workflow_run_id
agent_run_id
human_opinion_id
```

---

## 14. Generation Reference

The Blog Artifact records only a reference to its generating Agent Run.

Example:

```json
{
  "generation": {
    "created_by": "writer_agent",
    "generation_run_id": "agent_run_001"
  }
}
```

The complete generation data belongs to the Agent Run record.

The Agent Run may store:

- Model provider
- Model name
- Prompt version
- Schema version
- Token usage
- Cost
- Latency
- Input references
- Validation result
- Retry history
- Error information

This avoids duplicating execution metadata inside every Artifact version.

---

## 15. Recommended MVP Blog Artifact Schema

```json
{
  "schema_version": "contentos.blog-artifact/v1",

  "artifact_id": "blog_01ABC",
  "version_id": "blogver_01XYZ",
  "content_package_id": "cp_01DEF",

  "version_number": 3,
  "parent_version_id": "blogver_01PREVIOUS",

  "status": "approved",

  "editorial": {
    "title": "为什么 AI Agent 都在讨论 MCP？",
    "subtitle": null,
    "summary": "一篇解释 MCP 对 Agent 生态意义的文章。",
    "body": {
      "format": "markdown",
      "schema_version": "contentos.blog-body/markdown-v1",
      "content": "# 正文\n\n……"
    },
    "language": "zh-CN"
  },

  "publishing_metadata": {
    "suggested_slug": "why-ai-agents-need-mcp",
    "excerpt": "解释 MCP 为什么正在成为 AI Agent 的重要基础设施。",
    "tags": [
      "AI Agent",
      "MCP"
    ],
    "author_profile_id": "author_default",
    "cover_asset_id": null,
    "seo_title": "为什么 AI Agent 都在讨论 MCP？",
    "seo_description": "从产品和生态角度理解 MCP 对 AI Agent 的意义。"
  },

  "traceability": {
    "source_ids": [
      "src_001"
    ],
    "research_result_id": "research_001",
    "human_opinion_ids": [
      "opinion_001"
    ],
    "citation_map": []
  },

  "generation": {
    "created_by": "writer_agent",
    "generation_run_id": "agent_run_001"
  },

  "created_at": "2026-07-26T10:00:00Z",
  "updated_at": "2026-07-26T12:00:00Z",
  "approved_at": "2026-07-26T12:10:00Z"
}
```

This is an initial domain schema, not a final database table definition.

---

## 16. Markdown Compatibility

ContentOS exports a platform-independent, GFM-compatible Markdown subset.

The initial supported syntax includes:

- Headings
- Paragraphs
- Bold
- Italic
- Ordered lists
- Unordered lists
- Blockquotes
- Links
- Images
- Fenced code blocks
- Tables
- Horizontal rules

The initial export contract excludes:

- MDX
- JSX
- React Components
- Astro Components
- Hugo Shortcodes
- Framework-specific layout directives
- CMS-specific custom tags

Example of a framework-specific construct that should not enter the export contract:

```mdx
<Callout type="warning">
This is important.
</Callout>
```

Portable alternative:

```markdown
> **注意：** 这是一个重要提示。
```

---

## 17. Blog Export Package

ContentOS offers two Blog export actions.

### Copy Markdown

A convenience action for:

- Quick manual use
- Pasting into another editor
- Reviewing plain content

### Download Blog Package

The formal project-to-project exchange format.

Recommended package structure:

```text
why-ai-agents-need-mcp/
├── article.md
├── manifest.json
└── assets/
    ├── cover.webp
    ├── diagram-01.png
    └── screenshot-01.png
```

The package may be delivered as a directory or ZIP archive.

---

## 18. Article Frontmatter

The exported `article.md` uses portable YAML Frontmatter.

Example:

```markdown
---
schema_version: contentos.blog-export/v1

contentos_artifact_id: blog_01ABC
contentos_version_id: blogver_01XYZ
contentos_version_number: 3

title: "为什么 AI Agent 都在讨论 MCP？"
slug: "why-ai-agents-need-mcp"
description: "从产品和生态角度理解 MCP 对 AI Agent 的意义。"
excerpt: "解释 MCP 为什么正在成为 AI Agent 的重要基础设施。"
language: "zh-CN"

author: "Jettson"

tags:
  - "AI Agent"
  - "MCP"

cover_image: "./assets/cover.webp"

created_at: "2026-07-26T10:00:00Z"
updated_at: "2026-07-26T12:00:00Z"
published_at: null
---

# 为什么 AI Agent 都在讨论 MCP？

文章正文……
```

The export contract should not use framework-specific field names as its canonical fields.

A PersonalBlog Import Adapter may map them to framework-specific names.

Example:

```text
description
→ Site-specific description field

created_at
→ Site-specific publication date field

cover_image
→ Site-specific hero image field
```

---

## 19. Export Manifest

The `manifest.json` supports machine-to-machine import.

Recommended structure:

```json
{
  "contract_version": "contentos.blog-export/v1",
  "export_id": "export_01ABC",
  "exported_at": "2026-07-26T12:20:00Z",

  "artifact": {
    "artifact_id": "blog_01ABC",
    "version_id": "blogver_01XYZ",
    "version_number": 3,
    "checksum": "sha256:..."
  },

  "files": [
    {
      "path": "article.md",
      "mime_type": "text/markdown",
      "checksum": "sha256:..."
    },
    {
      "path": "assets/cover.webp",
      "mime_type": "image/webp",
      "checksum": "sha256:..."
    }
  ]
}
```

The manifest may support:

- Duplicate detection
- File-integrity validation
- Idempotent import
- Version comparison
- Future incremental synchronization
- Import diagnostics

---

## 20. Asset Path Rules

Exported Markdown should use relative asset paths.

Example:

```markdown
![MCP 架构图](./assets/mcp-architecture.png)
```

It should not depend on temporary ContentOS storage URLs.

Reasons:

- Temporary URLs may expire
- Object-storage providers may change
- Export packages should remain portable
- PersonalBlog should control final asset storage
- Packages should be inspectable offline

During import, PersonalBlog may:

```text
Read relative assets
→ Copy or upload assets
→ Create final website URLs
→ Rewrite Markdown image paths
```

---

## 21. PersonalBlog Integration Stages

Integration will evolve in stages.

### Stage 1: File Export

```text
ContentOS
→ Download Blog Export Package
→ User imports package manually
→ PersonalBlog publishes content
```

This is the MVP integration.

Benefits:

- Minimal infrastructure
- Easy debugging
- No authentication
- No API dependency
- Contract can be validated early

---

### Stage 2: Manual Script or Local Adapter

```text
ContentOS Export Package
→ Local Import Script
→ PersonalBlog content directory or database
```

This may reduce repetitive copying without requiring a full remote API.

---

### Stage 3: HTTP Import API

```text
ContentOS
→ PersonalBlog Import API
→ Pending Blog Post
→ Human review
→ Publication
```

This supports:

- Automated import
- Import result reporting
- Version synchronization
- Conflict handling
- Multiple publishing destinations

---

### Stage 4: Optional Git Adapter

```text
ContentOS
→ Generate Markdown and Assets
→ Commit to PersonalBlog repository
→ Trigger site deployment
```

A Git Adapter may be useful for a static Blog, but it is an optional publishing adapter rather than the universal Blog Contract.

---

## 22. Future HTTP Import API

The future PersonalBlog may expose:

```http
POST /api/v1/content-imports
```

Conceptual request:

```json
{
  "contract_version": "contentos.blog-export/v1",

  "artifact_id": "blog_01ABC",
  "version_id": "blogver_01XYZ",
  "version_number": 3,

  "content": {
    "title": "",
    "suggested_slug": "",
    "description": "",
    "body_markdown": "",
    "tags": []
  },

  "assets": []
}
```

Conceptual response:

```json
{
  "import_id": "import_01ABC",
  "status": "accepted",

  "artifact_id": "blog_01ABC",
  "version_id": "blogver_01XYZ",

  "resolved_slug": "why-ai-agents-need-mcp",
  "publication_status": "unpublished",
  "public_url": null
}
```

The exact API is deferred until both projects have stable domain models.

---

## 23. Idempotency

The future Import API must not create duplicate content when the same Blog version is submitted more than once.

Recommended idempotency identity:

```text
artifact_id + version_id
```

Example:

```http
Idempotency-Key: blog_01ABC:blogver_01XYZ
```

When the same version is received again, PersonalBlog should return the existing import result instead of creating another Post.

---

## 24. Published Version Safety

A newly imported Blog version must not automatically overwrite an existing public article.

Example:

```text
Blog v3
Published

Blog v4
Imported from ContentOS
```

Recommended behavior:

```text
Blog v4
→ Pending Revision
→ Difference Review
→ Human Approval
→ Replace Published Version
```

The following actions remain separate:

```text
Import
Publish
Update Published Version
```

This prevents an incorrect Agent revision from immediately changing public content.

---

## 25. Complete Integration Architecture

```text
ContentOS Domain
│
├── Blog Artifact
├── Artifact Version
├── Approval
└── Traceability
        ↓
Blog Export Mapper
        ↓
ContentOS Blog Export Contract v1
│
├── article.md
├── manifest.json
└── assets/
        ↓
PersonalBlog Import Adapter
        ↓
PersonalBlog Post Model
│
├── Final Slug
├── Public URL
├── Publication State
├── Site Metadata
└── Rendered Website Page
```

Both projects depend on the versioned contract rather than each other’s internal database implementation.

---

# 26. Decisions

## DEC-043

### Status

Accepted

### Title

Blog Artifact 与 Public Blog Post 分离

### Decision

ContentOS 的 Blog Artifact 是内容生产、编辑、审核和版本管理对象。

PersonalBlog 的 Blog Post 是公开发布、网站展示和网站路由对象。

两者通过版本化的 Blog Export Contract 连接，不共享内部数据库模型。

### Reason

内容生产与公开发布具有不同的：

- 职责
- 数据模型
- 状态
- 生命周期
- 安全要求
- 迭代节奏

将两者合并会使 ContentOS 绑定特定网站实现，并增加双方演进成本。

### Impact

ContentOS 和 PersonalBlog 可以作为两个独立项目开发。

两个项目需要通过 Adapter 和版本化交换契约集成。

---

## DEC-044

### Status

Accepted — Revised

### Title

MVP 使用 Markdown 作为 Blog 正文的唯一事实来源，并保留向 Blocks 迁移的边界

### Decision

ContentOS MVP 使用 Markdown 作为 Blog 正文的唯一权威表示。

Blog Body 使用带格式标识和 Schema Version 的容器：

```json
{
  "body": {
    "format": "markdown",
    "schema_version": "contentos.blog-body/markdown-v1",
    "content": ""
  }
}
```

Outline、Table of Contents、章节索引和阅读时长等数据从 Markdown 派生，不作为第二份可独立编辑的正文。

未来当结构化编辑、Block 级 AI 操作、富媒体组件或多渠道内容复用需求得到验证后，ContentOS 可以将新的 Blog 版本迁移为 Blocks Canonical Model。

迁移后：

- Blocks 成为唯一内部正文事实来源
- Markdown 由 Blocks 派生并用于导出
- Markdown 和 Blocks 不允许同时作为两份可编辑事实来源
- 历史 Markdown 版本可以原样保留
- 每个版本记录自己的 Body Format 和 Schema Version

### Reason

Markdown 可以显著降低 MVP 的：

- 编辑器复杂度
- Agent 输出复杂度
- 版本管理复杂度
- 导出复杂度
- PersonalBlog 对接成本

格式标识与 Schema Version 可以防止 ContentOS 永久绑定 Markdown，并为未来 Blocks 迁移建立明确边界。

### Impact

MVP 需要：

- Markdown Editor
- Markdown Parser
- Markdown Preview
- Derived Outline
- Markdown Export

MVP 暂不需要：

- Block Editor
- Block Schema
- Block Renderer
- Block-level collaboration
- Markdown-to-Blocks Migration Tool

未来迁移时需要新增：

- Block Schema
- Structured Editor
- Markdown Importer
- Markdown Exporter
- Migration Tool
- Fallback strategy
- Human review process

---

## DEC-045

### Status

Accepted

### Title

Blog Markdown 使用平台无关的 GFM-compatible 子集

### Decision

ContentOS 导出平台无关的通用 Markdown。

导出内容不包含：

- MDX
- JSX
- Astro Components
- Hugo Shortcodes
- React Components
- CMS-specific tags
- Framework-specific directives

### Reason

Blog Artifact 和 Blog Export Contract 不应该绑定 PersonalBlog 的技术框架。

平台无关 Markdown 更容易：

- 迁移
- 审核
- 版本控制
- 手动使用
- 被不同博客系统导入

### Impact

PersonalBlog Import Adapter 负责将通用 Markdown 和通用 Frontmatter 转换为网站框架需要的结构。

---

## DEC-046

### Status

Accepted

### Title

正式 Blog 交换格式采用 Blog Export Package

### Decision

ContentOS 的正式 Blog 交换格式包含：

```text
article.md
manifest.json
assets/
```

ContentOS 同时保留：

```text
Copy Markdown
```

作为便捷操作。

### Reason

单个 Markdown 文件无法完整、可靠地携带：

- 图片资产
- Artifact 版本
- Export 版本
- 文件校验信息
- 机器导入信息
- 未来同步信息

### Impact

ContentOS 需要实现：

- Blog Export Mapper
- YAML Frontmatter
- Export Manifest
- Relative asset paths
- Package or ZIP generation
- File checksums

---

## DEC-047

### Status

Accepted

### Title

ContentOS 提供推荐 slug，PersonalBlog 拥有最终公开地址

### Decision

ContentOS 输出：

```text
suggested_slug
```

PersonalBlog 负责：

- 最终 slug
- Slug 唯一性
- 最终公开 URL
- 网站路由

### Reason

只有发布网站知道：

- 当前路由规则
- 已存在的 slug
- 重定向策略
- 网站语言路径
- URL 迁移规则

### Impact

未来 PersonalBlog Import Result 需要返回：

- `resolved_slug`
- `public_url`
- `publication_status`

---

## DEC-048

### Status

Accepted

### Title

ContentOS 与 PersonalBlog 禁止直接数据库耦合

### Decision

ContentOS 和 PersonalBlog 通过：

- Versioned Export Contract
- Import Adapter
- Import API
- Optional publishing adapter

进行集成。

两个项目不直接读取或写入对方数据库表。

### Reason

直接数据库耦合会：

- 暴露内部实现
- 限制独立演进
- 增加迁移风险
- 破坏领域边界
- 增加安全风险
- 使测试和部署复杂化

### Impact

两个项目分别维护自己的领域模型。

Blog Export Contract 成为稳定集成边界。

---

## DEC-049

### Status

Accepted

### Title

PersonalBlog 集成采用分阶段策略

### Decision

ContentOS 与 PersonalBlog 的集成顺序为：

```text
File Export
→ Manual or Script Import
→ HTTP Import API
→ Optional Git Adapter
```

ContentOS MVP 不要求 PersonalBlog API。

### Reason

文件导出可以最早验证：

- Blog Artifact Schema
- Markdown compatibility
- Frontmatter
- Asset packaging
- Version identity
- PersonalBlog import assumptions

API 和 Git 权限应在两个项目的领域模型稳定后实现。

### Impact

ContentOS MVP 优先实现稳定的 Blog Export Package。

PersonalBlog 初版可以先使用手动导入或本地脚本。

---

## DEC-050

### Status

Accepted

### Title

未来 Blog Import API 必须版本化且幂等

### Decision

未来 PersonalBlog Import API 使用版本化 Contract。

API 根据：

```text
artifact_id + version_id
```

识别同一个 Blog 版本，防止重复导入。

新版本默认创建：

```text
Pending Revision
```

不得自动覆盖已发布版本。

### Reason

网络重试可能重复发送相同请求。

Blog 更新也可能包含错误内容。

系统必须避免：

- 重复文章
- 重复导入
- 未经审核的线上覆盖
- 无法追踪的版本更新

### Impact

未来 PersonalBlog 需要支持：

- Import records
- Contract version
- Idempotency
- Version comparison
- Pending Revision
- Human approval
- Publication update workflow
- Import conflict handling

---

## 27. Rejected or Deferred Approaches

### Markdown and Blocks as Dual Canonical Sources

Rejected because two independently editable sources will eventually diverge.

### Blocks Canonical Model in the MVP

Deferred because it would require a structured editor, Block Schema, import/export conversion, migration rules, and more complex Agent contracts before the core product value is validated.

### Permanent Markdown-Only Architecture

Rejected as a long-term constraint.

The MVP uses Markdown, but the Body Format and Schema Version preserve a future Blocks migration path.

### Framework-Specific Markdown

Rejected because it would bind ContentOS to one PersonalBlog framework.

### Single Markdown File as the Only Formal Contract

Rejected because it cannot reliably package assets, versions, checksums, and machine-import metadata.

### Shared Database Between ContentOS and PersonalBlog

Rejected because it violates project boundaries and prevents independent evolution.

### Automatic Overwrite of Published Content

Rejected because imported revisions require human review.

### PersonalBlog API in the ContentOS MVP

Deferred because file export is sufficient to validate the first integration contract.

---

## 28. Open Questions

The following questions remain unresolved:

1. Which fields in Blog Artifact are required and which are optional?
2. What is the maximum supported Markdown feature set?
3. Will inline HTML be allowed?
4. Will footnotes be included in Markdown v1?
5. How will citations be represented in Markdown?
6. Should Public References be a dedicated field or remain part of the body?
7. How will cover images be selected and approved?
8. Which image formats will Blog Export Package support?
9. Should the export package always be ZIP-compressed?
10. How will export checksums be calculated?
11. How will Markdown headings generate stable anchors?
12. How will section-level AI revision work in the Markdown Editor?
13. How will the user compare two Blog versions?
14. Will PersonalBlog preserve the original ContentOS version ID?
15. How will PersonalBlog report publication updates back to ContentOS?
16. When should Blocks migration be reconsidered?
17. What should the first Blocks Schema contain?
18. How will unsupported Markdown content be handled during future migration?
19. Should the future API transfer files directly or use signed asset URLs?
20. Should the Blog Export Contract be reused by other publishing channels?

---

## 29. Documentation Updates

Create:

```text
docs/sessions/session-009.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-043
DEC-044
DEC-045
DEC-046
DEC-047
DEC-048
DEC-049
DEC-050
```

Future documents to create:

```text
docs/architecture/blog-artifact-contract.md
docs/architecture/blog-export-contract.md
docs/architecture/blog-body-format.md
docs/architecture/personal-blog-integration.md
docs/product/blog-editor.md
```

Possible future schema files:

```text
schemas/blog-artifact-v1.json
schemas/blog-export-manifest-v1.json
schemas/blog-body-markdown-v1.json
```

These paths are suggestions and are not yet formal implementation decisions.

---

## 30. Documentation Sync Checklist

- [x] DEC-043 confirmed
- [x] DEC-044 revised and confirmed
- [x] DEC-045 confirmed
- [x] DEC-046 confirmed
- [x] DEC-047 confirmed
- [x] DEC-048 confirmed
- [x] DEC-049 confirmed
- [x] DEC-050 confirmed
- [ ] Save this document as `docs/sessions/session-009.md`
- [ ] Add DEC-043 through DEC-050 to `docs/decisions/decisions.md`
- [ ] Create the formal Blog Artifact Contract
- [ ] Create the formal Blog Export Contract
- [ ] Define Markdown v1 syntax boundaries
- [ ] Define Blog Editor interactions
- [ ] Define Blog version comparison behavior
- [ ] Define PersonalBlog manual import behavior
- [ ] Review AGENTS.md after the contracts become authoritative
- [ ] Reconsider Blocks only after validated requirements emerge

---

## 31. Session Summary

ContentOS separates its internal Blog Artifact from the portable Blog Export Package and the public PersonalBlog Post.

The ContentOS MVP uses Markdown as the only canonical Blog body representation, but the Body container includes a format identifier and Schema Version to preserve a future migration path toward structured Blocks.

Markdown and Blocks will never be maintained as two independently editable sources of truth.

ContentOS exports a platform-independent GFM-compatible Markdown subset and avoids framework-specific syntax.

The formal exchange format is a Blog Export Package containing:

```text
article.md
manifest.json
assets/
```

ContentOS recommends publishing metadata, while PersonalBlog owns the final slug, public URL, publication state, website rendering, and deployment.

The two projects remain independently deployable and do not share database models.

Integration begins with file export, may progress to manual scripts, and can later add a versioned and idempotent HTTP Import API. New Blog versions must not automatically overwrite published content without human approval.