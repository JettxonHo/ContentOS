# 127. Decisions

## DEC-160

### Status

Accepted

### Title

ContentOS 使用模块化领域数据模型，Content Package 是聚合入口而不是巨型数据对象

### Decision

Content Package establishes:

- Project identity
- Content Mode
- Requested outputs
- Package lifecycle
- Current Artifact references

Sources, Research, Human Opinion, Blog, Xiaohongshu, Design, Render, Export, Workflow, and Agent Runtime are owned by their respective modules.

### Reason

The product requires clear domain boundaries, parallel execution, focused transactions, and maintainable data ownership.

### Impact

Content Package APIs may aggregate module data, but the database does not store all content inside one giant Package object.

---

## DEC-161

### Status

Accepted

### Title

Stable Entity ID、Immutable Version ID、Working Copy Revision 与 Execution ID 分离

### Decision

ContentOS distinguishes:

- Stable Entity ID
- Immutable Version ID
- Working Copy ID
- Working Copy Revision
- Execution ID
- Append-only Record ID

### Reason

These identities represent different lifecycle semantics.

Combining them would weaken versioning, concurrency, provenance, and audit behavior.

### Impact

Every Schema and API must identify which ID category each field belongs to.

---

## DEC-162

### Status

Accepted

### Title

领域 ID 使用不可推断的 Opaque Identifier

### Decision

Formal domain IDs use UUID, UUIDv7, ULID, or an equivalent opaque identifier.

User-visible Version Numbers, Page Numbers, Source Numbers, and Attempt Numbers remain display values only.

### Reason

Opaque identifiers provide safer access, stable migration, distributed creation, and long-term references.

### Impact

The exact ID-generation method is selected during technical architecture design.

---

## DEC-163

### Status

Accepted

### Title

重要 Artifact 采用 Stable Artifact、Mutable Working Copy 与 Immutable Versions 的统一结构

### Decision

Research, Human Opinion, Blog, Xiaohongshu, and Design follow:

```text
Stable Artifact
├── Mutable Working Copy
├── Immutable Versions
└── Artifact Head
```

Immutable Versions record:

- Parent Version
- Version Number
- Content Hash
- Dependencies
- Creator
- Creation time
- Schema Version

### Reason

A unified lifecycle simplifies editing, Diff, Approval, restoration, dependency tracking, and UI behavior.

### Impact

Each Artifact retains a typed Body while sharing common Version metadata.

---

## DEC-164

### Status

Accepted

### Title

ContentOS 不使用万能 Artifact JSON 表替代类型化领域模型

### Decision

ContentOS may share Artifact metadata conventions.

Research, Human Opinion, Blog, Xiaohongshu, Design, and other Artifacts retain type-specific Contracts and models.

Structured JSON is allowed only with an explicit Schema Version and validation.

### Reason

One universal JSON table would weaken constraints, queries, migrations, validation, and domain ownership.

### Impact

JSONB may store parts of an Artifact Body, but it does not replace typed domain Contracts.

---

## DEC-165

### Status

Accepted

### Title

Artifact Head 独立维护 Latest、Review Candidate、Approved 与 Working Copy 指针

### Decision

Artifact Head or an equivalent pointer model records:

- Working Copy
- Latest Version
- Review Candidate Version
- Approved Version

Historical Versions remain immutable.

ContentOS does not use one generic `current_version_id` or mutable `is_current` flag to represent all meanings.

### Reason

Latest, under-review, and approved Versions may differ.

### Impact

Version creation and Approval must update Artifact Head transactionally.

---

## DEC-166

### Status

Accepted

### Title

Version Dependency Graph 是第一类结构化数据

### Decision

Downstream Artifact Versions, Designs, Render Outputs, and Export Packages record exact upstream Version dependencies through structured Dependency Edges.

Important dependencies cannot exist only inside Artifact Body or Agent metadata.

### Reason

Dependency Graph is required for:

- Stale propagation
- Outdated propagation
- Impact analysis
- Historical reproduction
- Validation
- Retention decisions

### Impact

ContentOS requires a Dependency Edge Contract and dependency-query service.

---

## DEC-167

### Status

Accepted

### Title

Approval 使用独立 Append-only Record，并绑定具体不可变 Version

### Decision

Approval records:

- Target Version
- Actor
- Command
- Validation Result
- Warning Acknowledgement
- Timestamp

New Approval records do not overwrite historical Approval records.

### Reason

Approval is a meaningful domain decision rather than a mutable Boolean.

### Impact

Artifact Head identifies the currently approved Version while Approval history remains append-only.

---

## DEC-168

### Status

Accepted

### Title

Provenance 使用类型化关系和稳定内容定位符

### Decision

ContentOS uses typed Contracts for:

- Research Evidence
- Blog Research Usage
- Xiaohongshu Research Usage
- Human Opinion Usage
- Direct Quote Usage
- Asset Provenance

Content locations use stable Section IDs, Page IDs, Field names, Item IDs, or equivalent locators.

### Reason

Unrestricted JSON and character-only ranges cannot reliably support review, migration, selective editing, and provenance inspection.

### Impact

Artifact Bodies require stable internal content IDs where provenance is needed.

---

## DEC-169

### Status

Accepted

### Title

PostgreSQL 保存结构化领域数据，Object Storage 保存大型快照和二进制文件

### Decision

PostgreSQL stores:

- Metadata
- Text and structured Bodies
- Working Copies
- Versions
- Dependencies
- Provenance
- Workflow state
- Approvals
- Object references

Object Storage stores:

- Raw snapshots
- Uploaded files
- Images
- Render outputs
- Export archives
- Large binary or raw files

### Reason

Relational transactions and binary-file storage have different operational requirements.

### Impact

Stored files are referenced through Object Key, MIME Type, size, and Hash.

---

## DEC-170

### Status

Accepted

### Title

核心对象默认归档而不是物理删除

### Decision

Content Packages, Artifacts, Versions, Workflows, Assets, Render Outputs, and Export Packages use Archive or equivalent lifecycle states by default.

Ordinary workflow actions do not physically delete historical dependencies.

### Reason

Version history, provenance, Approval, and reproducibility depend on historical data.

### Impact

Permanent deletion and data-erasure behavior are addressed separately in privacy and security design.

---

## DEC-171

### Status

Accepted

### Title

公开 API DTO 与数据库及 ORM 模型分离

### Decision

Public application APIs use stable request and response DTOs.

Database models, domain models, and API DTOs remain conceptually separate.

### Reason

This prevents database refactoring, internal fields, and persistence decisions from directly breaking the API Contract.

### Impact

The Application Layer performs mapping and aggregate-query composition.

---

## DEC-172

### Status

Accepted

### Title

ContentOS API 区分无副作用 Query、Working Copy Edit 与结构化 Workflow Command

### Decision

ContentOS uses:

- Query API for reads
- Revision-controlled Working Copy API for Draft edits
- Explicit Version-creation API
- Structured Workflow Command API for approvals and workflow state changes

Clients cannot directly patch immutable Versions, Approval Records, Artifact Heads, or Workflow Node states.

### Reason

Ordinary editing and authoritative domain transitions have different consistency and audit requirements.

### Impact

Application services enforce all critical state changes.

---

## DEC-173

### Status

Accepted

### Title

所有关键创建与 Command API 支持 Idempotency 和 Optimistic Concurrency

### Decision

Creation, generation, Command, Render, and Export operations support Idempotency Keys.

Working Copy and Workflow changes use Expected Revision.

Conflicts return structured `409 Conflict` responses.

### Reason

Network retries, duplicate clicks, callbacks, and concurrent browser states must not create duplicate Tasks, Versions, Approvals, or Exports.

### Impact

The Application Layer must persist idempotent outcomes and enforce Revision checks.

---

## DEC-174

### Status

Accepted

### Title

长时间生成任务使用异步 API Contract

### Decision

Agent generation, Visual generation, Asset generation, Render, and other long-running operations return:

```text
202 Accepted
```

and provide Task, Workflow Node, Command, or Status references.

The initiating HTTP request does not wait for full completion.

### Reason

AI and rendering operations are long-running, retryable, and unsuitable for ordinary request lifetimes.

### Impact

Clients retrieve progress through polling or a future push mechanism.

---

## DEC-175

### Status

Accepted

### Title

API 使用统一错误、Cursor Pagination、API Version 和 Schema Version 约定

### Decision

ContentOS APIs use:

- Stable error codes
- Structured error details
- Retryable flag
- Correlation ID
- Cursor Pagination
- `/v1` API Version
- Artifact-level Schema Versions
- UTC ISO 8601 timestamps
- Explicit language and locale where relevant

### Reason

Shared conventions prevent modules from developing incompatible API behavior.

### Impact

ContentOS requires an authoritative API Conventions document and shared response Schemas.

---

## DEC-176

### Status

Accepted

### Title

重要领域变化通过同事务 Outbox Event 可靠传播

### Decision

Important domain changes such as:

- Version Approval
- Artifact Head update
- Dependency invalidation
- Export selection

store their Outbox Event in the same PostgreSQL transaction as the domain state change.

A Dispatcher later processes the event for workflow progression, notifications, dependency propagation, and Query Projection updates.

### Reason

This prevents committed domain changes from losing their downstream event due to process failure.

### Impact

The MVP architecture includes a Transactional Outbox, while the specific Queue and Dispatcher technology remains deferred.
