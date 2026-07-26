# ContentOS Session-010

**Status:** Formalized\
&#x2A;*Session Type:** Product Interaction and Editorial Workflow Architecture\
&#x2A;*Topic:** Blog Editor Interaction, AI Revision Proposals, Version Comparison, and Approval Workflow\
&#x2A;*Date:** 2026-07-26

---

## 1. Context

Session-009 established the Blog Artifact and PersonalBlog integration boundary:

- Blog Artifact and Public Blog Post are separate domain objects.
- The MVP uses Markdown as the canonical Blog body format.
- Markdown and structured Blocks must not become two independently editable sources of truth.
- Blog versions are immutable.
- Formal exports use a Blog Export Package.
- PersonalBlog owns the final public slug, URL, publication state, and website rendering.
- Formal Blog Export Packages are intended to represent stable and approved content.

The next unresolved problem was the editing workflow:

> How can a user and AI safely collaborate on a Markdown Blog without creating a new immutable version for every keystroke or allowing AI to silently overwrite user content?

This Session defines:

- Working Copy behavior
- Version creation rules
- AI revision proposals
- Concurrent-edit protection
- Version comparison
- Approval targeting
- Historical version restoration
- Formal export eligibility

---

## 2. Core Editing Model

The Blog Editor separates:

```text
Mutable Working Copy
≠
Immutable Blog Version
```

### Mutable Working Copy

A Working Copy is the current editable state of a Blog Artifact.

It supports:

- User typing
- Automatic saving
- Undo and redo
- AI Revision Proposals
- Temporary incomplete edits
- Revision-number tracking
- Conflict protection

A Working Copy may change many times without producing a permanent Blog Version.

### Immutable Blog Version

A Blog Version is a meaningful and permanent content snapshot.

Once created, it must not be edited in place.

Blog Versions support:

- Historical traceability
- Human approval
- Version comparison
- Restoration
- Export
- Future PersonalBlog synchronization

---

## 3. Working Copy Model

Recommended conceptual structure:

```json
{
  "working_copy_id": "blogwork_001",
  "artifact_id": "blog_001",
  "base_version_id": "blogver_003",
  "revision_number": 27,
  "body": {
    "format": "markdown",
    "schema_version": "contentos.blog-body/markdown-v1",
    "content": "# Article\n\n..."
  },
  "document_hash": "sha256:...",
  "autosaved_at": "2026-07-26T12:00:00Z"
}
```

### Field Responsibilities

| Field             | Responsibility                                            |
| ----------------- | --------------------------------------------------------- |
| `working_copy_id` | Unique identity of the editable draft                     |
| `artifact_id`     | Stable Blog Artifact identity                             |
| `base_version_id` | Immutable Version from which the Working Copy was created |
| `revision_number` | Incrementing editable-state revision                      |
| `body`            | Current canonical Markdown content                        |
| `document_hash`   | Content-integrity and conflict-detection value            |
| `autosaved_at`    | Last successful automatic save                            |

---

## 4. Automatic Saving

Normal typing does not create a new immutable version.

Automatic save updates only the current Working Copy.

Autosave may occur:

- After a short editing delay
- When the editor loses focus
- Before an AI request begins
- Before navigating away
- Before opening version comparison
- Before submitting for review

Automatic saving should preserve editing continuity without polluting version history.

The UI should communicate states such as:

```text
Saving...
Saved
Save failed
Offline changes
Conflict detected
```

---

## 5. Version Creation Checkpoints

A new immutable Blog Version is created only at a meaningful checkpoint.

Recommended checkpoints include:

1. Writer Agent produces the first complete draft.
2. The user explicitly selects **Save Version**.
3. The user accepts a substantial AI revision.
4. The user submits content for review.
5. The user approves a version.
6. The user restores content from a historical version.
7. The user generates a complete alternative draft.
8. The system creates a final export snapshot.

Not every accepted small wording change must automatically create a Version.

The implementation may distinguish between:

- Minor proposal applied to Working Copy
- Significant proposal saved as a Version checkpoint

The user should retain the ability to manually save a Version at any time.

---

## 6. Version Creation Reasons

Each Blog Version should record why it was created.

Recommended values:

```text
initial_generation
manual_checkpoint
ai_revision_accepted
submitted_for_review
changes_requested
approved
restored_from_version
full_regeneration
export_snapshot
```

Example:

```json
{
  "version_id": "blogver_004",
  "artifact_id": "blog_001",
  "version_number": 4,
  "parent_version_id": "blogver_003",
  "created_by": {
    "type": "user",
    "id": "user_001"
  },
  "creation_reason": "submitted_for_review",
  "content_hash": "sha256:...",
  "created_at": "2026-07-26T13:00:00Z"
}
```

Version history should explain both:

- What changed
- Why the snapshot exists

---

## 7. Blog Editor Workspace

The Blog Editor remains inside the Content Package Workspace.

Recommended layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Blog title · Working Copy · Based on v3                  │
│ Save Version · Submit Review · History · Preview         │
├──────────────┬──────────────────────────┬────────────────┤
│ Outline      │ Markdown Editor          │ AI Assistant   │
│              │                          │                │
│ Introduction │ # Article title          │ Rewrite        │
│ Concept      │                          │ Shorten        │
│ Analysis     │ Article content...       │ Explain        │
│ Opinion      │                          │ Add example    │
│ Conclusion   │                          │                │
└──────────────┴──────────────────────────┴────────────────┘
```

The main areas are:

- Derived Outline
- Markdown Editor
- Preview
- Version History
- Contextual AI Assistant

---

## 8. Derived Outline

The Outline is generated from Markdown Headings.

It may support:

- Section navigation
- Current-section highlighting
- Selecting a section for AI assistance
- Showing sections with pending proposals
- Showing added or removed sections during comparison

The Outline is not independently editable canonical content.

The relationship remains:

```text
Markdown
→ Parser
→ Derived Outline
```

If the Heading structure changes, the Outline is regenerated.

---

## 9. Editor and Preview Modes

The Blog Editor may support:

```text
Editor
Preview
Split View
```

### Editor

Displays and edits canonical Markdown.

### Preview

Displays the rendered Blog appearance.

### Split View

Displays Markdown and rendered output together.

The MVP must support Editor and Preview.

Split View may be implemented when it does not delay the main editing workflow.

---

## 10. AI Assistant Responsibilities

The contextual AI Assistant may read:

- Current selection
- Current section
- Current Working Copy
- Approved Research Result
- Confirmed Human Opinion
- Available Brand Rules
- Blog title and summary
- Source references
- Current document revision

The AI Assistant may help with:

- Rewriting
- Shortening
- Expanding
- Simplifying
- Improving transitions
- Removing repetition
- Adding headings
- Splitting long paragraphs
- Adding an explanation
- Integrating approved Human Opinion
- Adding supported Research content

The AI Assistant must not directly and silently overwrite canonical Markdown.

---

## 11. Revision Proposal Model

Every AI-requested content modification must first produce a Revision Proposal.

Workflow:

```text
User selects text or section
→ User gives instruction
→ AI generates Revision Proposal
→ Editor shows Before and After
→ User accepts, rejects, edits, or regenerates
```

Recommended structure:

```json
{
  "proposal_id": "proposal_001",
  "artifact_id": "blog_001",
  "working_copy_id": "blogwork_001",

  "target": {
    "type": "selection",
    "selected_text": "Original selected content",
    "selection_hash": "sha256:...",
    "document_revision": 27
  },

  "instruction": "Make this clearer without changing the opinion.",

  "replacement_markdown": "Revised content",

  "rationale": "Reduces repetition and moves the conclusion earlier.",

  "warnings": [],

  "status": "pending"
}
```

Possible Proposal states:

```text
pending
accepted
rejected
expired
conflicted
superseded
```

---

## 12. Revision Proposal Actions

The user may:

- Accept
- Reject
- Edit before applying
- Request another version
- Ask why the change was proposed
- Apply only part of the proposal
- Cancel the request

For the MVP, partial application may be deferred if it materially increases implementation complexity.

The minimum required actions are:

```text
Accept
Reject
Regenerate
```

---

## 13. Diff Presentation

The Editor should display AI modifications visibly.

Example:

```diff
- MCP 是一个可以让很多软件去一起交流的东西。
+ MCP 是一种标准化协议，用于连接 AI 应用、工具与外部数据源。
```

The interface should not rely only on an AI message such as:

```text
The content has been updated.
```

The user must see the actual content difference before application.

---

## 14. Concurrent-Edit Protection

An AI request may take time to complete.

During that time, the user may continue editing.

To prevent an outdated AI response from overwriting newer user work, every Proposal must reference:

- Working Copy revision
- Target selection hash
- Optionally the full document hash

When applying a Proposal, deterministic application logic checks:

```text
Is the current document revision unchanged?
Does the selected content still match the stored hash?
```

If the content has changed, the Proposal must not be applied automatically.

The UI should display:

```text
The document changed while this revision was being generated.
Review the new difference or generate a new proposal.
```

Conflict resolution is an application responsibility, not an LLM judgment.

---

## 15. Section Targeting in Markdown

The MVP does not require permanent Block identifiers.

Sections can be derived from the current Markdown structure.

A temporary section reference may include:

```json
{
  "section_key": "2.3",
  "heading_path": [
    "MCP 为什么重要",
    "对 Agent 开发者的影响"
  ],
  "start_offset": 1240,
  "end_offset": 1860,
  "document_revision": 27
}
```

These offsets are valid only for the referenced Working Copy revision.

After the Markdown changes, the parser recalculates section positions.

This preserves the future Blocks boundary without requiring Blocks during the MVP.

---

## 16. Supported AI Editing Operations

### Expression Operations

- Rewrite more clearly
- Shorten
- Expand
- Simplify terminology
- Adjust tone
- Remove repetition
- Improve paragraph transitions

### Structural Operations

- Generate a section heading
- Split a long paragraph
- Suggest combining repeated sections
- Suggest section reordering
- Generate a section summary

### Content Operations

- Add an explanation
- Add a supported example
- Add a conclusion
- Integrate confirmed Human Opinion
- Add facts from an approved Research Result

---

## 17. Restricted AI Operations

### Adding New Facts

If an AI revision introduces a new factual claim, it must:

- Reference an existing approved Research Result
- Reference an available Source
- Mark the statement as requiring verification
- Or request additional Research Agent work

The Writer Agent must not invent evidence, statistics, quotations, or examples.

### Changing Human Opinion

AI may improve wording but must not silently reverse or materially alter the creator’s position.

If a proposed revision may change meaning, it should include a warning.

Example:

```text
This revision may change the creator’s original position.
```

### Inventing Personal Experience

AI must not add first-person claims such as:

```text
I used this in my work.
My team experienced this problem.
I tested this product last month.
```

unless that information comes from confirmed Human Opinion.

### Removing References

If a modified section contains citations or public references, the Proposal should warn when they are removed or disconnected from the associated claim.

---

## 18. Local Revision and Full Regeneration

### Local Revision

Targets:

- Selection
- Paragraph
- Section

It produces a Revision Proposal that may update the current Working Copy after user approval.

### Full Regeneration

A request to rewrite the entire Blog using a different structure must not overwrite the current Working Copy.

It creates an Alternative Draft.

Example:

```text
Blog Artifact
├── Current Working Copy
└── Alternative Draft B
```

The user can compare both and select one as the active Working Copy.

The MVP does not require complex branch merging.

It only needs to preserve the current draft when generating a full alternative.

---

## 19. Version Comparison

The MVP should support version comparison.

### Initial MVP Diff

Use Markdown text comparison showing:

- Added text
- Deleted text
- Modified lines

### Future Markdown-Aware Diff

A later version may classify changes by structure:

```text
Title changed
Section added
Paragraph modified
List item removed
Reference removed
```

Example:

```text
Section: “MCP 是什么”
- Two paragraphs modified

New section:
- “MCP 对产品经理意味着什么”

Removed reference:
- Source-003
```

The MVP may begin with text diff while maintaining a Markdown parser for future structural comparison.

---

## 20. Restoring Historical Versions

Restoring a historical version must not delete later history.

Correct behavior:

```text
Select v2
→ Create Working Copy from v2
→ User reviews or edits
→ Save as v5
```

Version history becomes:

```text
v1
v2
v3
v4
v5 — Restored from v2
```

The new Version should record:

```text
restored_from_version_id
```

or an equivalent creation relationship.

---

## 21. Approval Target

Approval applies to one immutable Blog Version.

Incorrect model:

```json
{
  "artifact_id": "blog_001",
  "approved": true
}
```

Correct model:

```json
{
  "approval_id": "approval_001",
  "target_type": "blog_version",
  "target_id": "blogver_005",
  "status": "approved"
}
```

Approval means:

```text
Blog Version v5 is approved.
```

It does not mean:

```text
The Blog Artifact is permanently approved.
```

---

## 22. Editing an Approved Version

When a user edits an approved Version:

```text
v5 — Approved
→ Create new Working Copy based on v5
→ Save as v6 — Draft
```

Version v5 remains immutable and approved.

Version v6 begins a new editorial cycle.

This preserves:

- The last approved output
- The new unfinished work
- The ability to export or publish the approved Version
- Clear synchronization state

---

## 23. Blog Version Status Model

Recommended version states:

```text
draft
in_review
changes_requested
approved
superseded
archived
```

Recommended transitions:

```text
draft
→ in_review
→ approved
```

When changes are required:

```text
in_review
→ changes_requested
→ draft
```

When a newer Version is approved:

```text
previous approved version
→ superseded
```

The previous approved Version remains historically valid and must not be deleted.

---

## 24. Single-User Approval

The MVP is a single-user product, but approval remains useful.

The same user performs two conceptual roles:

```text
Creator
→ Creates and edits content

Editor
→ Confirms readiness for export or publication
```

Approval is an explicit cognitive checkpoint.

It distinguishes:

```text
Still being edited
```

from:

```text
Ready to become a formal output
```

Approval is not dependent on multi-user permissions.

---

## 25. Export Eligibility

### Copy Current Markdown

The user may copy Markdown from:

- Working Copy
- Draft Version
- Approved Version

When the content is not approved, the UI must clearly label it:

```text
Draft — Not approved
```

### Download Blog Export Package

A formal Blog Export Package may be generated only from an Approved Version.

The Export Manifest must record:

- `artifact_id`
- `version_id`
- `version_number`
- Contract version
- Export time
- File checksums

This ensures the package represents a stable and approved content snapshot.

---

## 26. Post-Export Changes

Example:

```text
v5 — Approved and exported
v6 — Current Draft
```

The Workspace should show:

```text
Last exported version: v5
Current working version: v6
Unexported changes exist
```

Future PersonalBlog integration may extend this to:

```text
Last imported: v5
Currently published: v5
Latest ContentOS version: v6
```

ContentOS must not imply that later edits are already reflected in PersonalBlog.

---

## 27. Chat and Editor Boundary

A user may request a change through Chief Editor Chat.

Example:

```text
Make the second section easier to understand.
```

The correct workflow is:

```text
Chat receives the instruction
→ Creates Revision Proposal
→ Blog Editor displays the difference
→ User accepts or rejects
```

Chat must not be the only place where content changes are represented.

The relationship remains:

```text
Chat initiates collaboration.
Editor represents canonical content state.
User authorizes application.
```

---

## 28. End-to-End Editorial Workflow

```text
Writer Agent generates Blog v1
        ↓
Create Working Copy based on v1
        ↓
User edits Markdown
        ↓
Working Copy autosaves
        ↓
User selects a paragraph
        ↓
Requests AI revision
        ↓
AI returns Revision Proposal
        ↓
User compares Before and After
        ↓
User accepts Proposal
        ↓
Working Copy updates
        ↓
User selects Save Version
        ↓
Create Blog v2
        ↓
User submits for review
        ↓
Create or mark Review Version
        ↓
User approves
        ↓
Approved Blog Version
        ↓
Generate Blog Export Package
```

---

## 29. MVP Exclusions

The MVP does not require:

- Multi-user real-time editing
- Collaborative cursors
- Block-level comments
- Three-way merge
- Git-style complex branching
- A Version for every keystroke
- Autonomous AI acceptance
- Autonomous AI approval
- Automatic overwrite of published content
- Complex semantic merging
- Permanent paragraph IDs
- Structured Blocks
- Full rich-text collaboration infrastructure

---

# 30. Decisions

## DEC-051

### Status

Accepted

### Title

Blog Editor 使用 Mutable Working Copy 与 Immutable Versions

### Decision

用户的日常 Markdown 编辑发生在可自动保存的 Mutable Working Copy 中。

有意义的内容 Checkpoint 创建不可变 Blog Version。

Working Copy 与正式 Blog Version 是不同的数据对象。

### Reason

如果每次编辑都创建版本，版本历史会被大量无意义记录污染。

如果正式版本可以直接修改，又会破坏：

- 可追溯性
- 审批状态
- 版本比较
- 导出稳定性
- 恢复能力

### Impact

Blog 数据模型必须区分：

- Working Copy
- Immutable Blog Version

Editor、Approval 和 Export 流程需要引用正确的对象类型。

---

## DEC-052

### Status

Accepted

### Title

Blog 版本只在有意义的 Checkpoint 创建

### Decision

以下操作可以创建正式 Blog Version：

- Writer Agent 首次完整生成
- 用户手动保存版本
- 接受重要 AI 修改
- 提交审核
- 批准文章
- 恢复历史版本
- 完整重新生成
- 正式导出快照

普通键盘输入和自动保存只更新 Working Copy。

### Reason

版本历史应该表达有意义的内容状态，而不是记录每一次键盘操作。

### Impact

系统需要：

- 定义版本 Checkpoint
- 保存 `creation_reason`
- 将 Autosave 与 Version Creation 分离
- 在 UI 中区分 Saved Working Copy 和 Saved Version

---

## DEC-053

### Status

Accepted

### Title

AI 修改以 Revision Proposal 形式呈现

### Decision

AI 对 Blog 正文的修改必须先创建 Revision Proposal。

用户查看 Before 和 After 后，可以：

- Accept
- Reject
- Regenerate
- Edit before applying

AI 不得静默覆盖 canonical Markdown。

### Reason

用户需要：

- 理解 AI 修改内容
- 保持最终编辑控制权
- 防止观点被静默改变
- 防止重要信息被意外删除
- 对内容修改负责

### Impact

Blog Editor 需要实现：

- Proposal 状态
- Before/After Diff
- Accept/Reject 操作
- Proposal 应用逻辑
- Proposal 审计信息

---

## DEC-054

### Status

Accepted

### Title

AI 局部修改使用 Revision 与 Hash 保护

### Decision

Revision Proposal 必须引用：

- Working Copy Revision
- Target Selection Hash
- 必要时引用完整 Document Hash

如果正文在 Proposal 生成期间发生变化，旧 Proposal 不得自动应用。

### Reason

AI 返回修改结果前，用户可能已经编辑了相同内容。

缺少并发保护可能导致 AI 覆盖用户的新修改。

### Impact

应用层必须实现乐观并发控制。

冲突检测由确定性程序负责，而不是由 LLM 判断。

---

## DEC-055

### Status

Accepted

### Title

Blog 审批针对不可变 Version

### Decision

Approval 的目标是一个具体的 Blog Version，而不是整个 Blog Artifact。

编辑已批准 Version 时，系统创建新的 Draft Working Copy。

原批准 Version 保持不可变且继续保留批准状态。

### Reason

同一篇 Blog 的不同版本可能处于不同审核状态。

Artifact 级全局 Approval 无法准确表达版本生命周期。

### Impact

以下对象必须引用 `version_id`：

- Approval
- Export
- Future PersonalBlog Import
- Future Publication
- Version Comparison

---

## DEC-056

### Status

Accepted

### Title

恢复旧版本通过创建新版本完成

### Decision

恢复历史版本时，不删除、覆盖或重写后续版本。

系统从历史 Version 创建新的 Working Copy，并在保存后生成一个新的 Blog Version。

### Reason

版本恢复本身也是一次新的编辑决策。

保留完整历史有助于：

- 审计
- 回滚
- 比较
- 理解文章演化
- 避免误删后续内容

### Impact

新版本需要记录：

- `parent_version_id`
- `restored_from_version_id`
- `creation_reason`

或等价信息。

---

## DEC-057

### Status

Accepted

### Title

正式 Blog Export Package 仅从 Approved Version 生成

### Decision

用户可以复制当前 Draft Markdown，但正式 Blog Export Package 只能从 Approved Version 生成。

未批准内容必须明确标记为 Draft。

### Reason

正式项目间交换需要一个：

- 稳定
- 不可变
- 已审核
- 可追踪

的内容身份。

### Impact

Blog Export Manifest 必须引用被导出的具体 `version_id`。

Export UI 必须区分：

- Copy Current Markdown
- Download Approved Blog Package

---

## DEC-058

### Status

Accepted

### Title

MVP Blog Editor 采用结构化 Workspace 与协作式 AI

### Decision

MVP Blog Editor 包含：

- Derived Outline
- Markdown Editor
- Preview
- Version History
- Contextual AI Assistant

Chat 可以发起修改，但修改结果必须在 Blog Editor 中展示并由用户确认。

### Reason

Chat 适合：

- 表达意图
- 请求解释
- 发起修改

Editor 适合：

- 表示 canonical content
- 展示差异
- 编辑正文
- 管理版本
- 管理审批
- 管理导出

### Impact

Blog 阶段不采用纯 Chat 交互。

Content Package Workspace 仍然是 Blog 状态的权威界面。

---

## 31. Rejected or Deferred Approaches

### Creating a Version for Every Keystroke

Rejected because it creates noisy and unusable version history.

### Editing Immutable Versions Directly

Rejected because it breaks approval and export traceability.

### AI Silent Overwrite

Rejected because users must review and authorize content modifications.

### Applying Stale AI Proposals

Rejected because newer user edits may be lost.

### Artifact-Level Global Approval

Rejected because approval belongs to a specific immutable Version.

### Deleting Later Versions During Restore

Rejected because restoration must preserve complete history.

### Formal Export from an Unapproved Draft

Rejected because formal project-to-project exchange requires stable approved content.

### Chat-Only Blog Editing

Rejected because Chat cannot reliably represent canonical content, version state, and exact modifications.

### Full Git-Style Branching in the MVP

Deferred because the MVP only needs Working Copy, Alternative Draft, Version history, and restoration.

---

## 32. Open Questions

The following questions remain unresolved:

1. How frequently should Working Copy autosave?
2. Should autosave keep short-term local recovery history?
3. What size of AI change automatically qualifies as a significant checkpoint?
4. Should accepting a Proposal create a Version immediately or only when explicitly saved?
5. How should the editor display AI rationale?
6. Should Proposal rationale be optional or required?
7. How should users apply only part of a Proposal?
8. How should citations be protected during paragraph replacement?
9. What Diff library should be used?
10. Should the MVP support word-level or line-level Diff?
11. How should Markdown tables be compared?
12. How should images be displayed in Diff?
13. How should Alternative Drafts be named and managed?
14. Can multiple Working Copies exist for one Blog Artifact?
15. What happens when a user opens ContentOS on two devices?
16. How long should rejected and expired Proposals be retained?
17. Should every approved Version automatically supersede the prior approved Version?
18. Can an approved Version be unapproved?
19. How should approval comments be stored?
20. Should formal export create an additional immutable export snapshot?
21. How will the UI show exported, imported, and published version differences?
22. How should the future Blocks model preserve current Proposal history?

---

## 33. Documentation Updates

Create:

```text
docs/sessions/session-010.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-051
DEC-052
DEC-053
DEC-054
DEC-055
DEC-056
DEC-057
DEC-058
```

Future documents to create:

```text
docs/product/blog-editor.md
docs/product/blog-review-flow.md
docs/architecture/blog-working-copy.md
docs/architecture/blog-versioning.md
docs/architecture/revision-proposal.md
docs/architecture/blog-approval.md
```

Possible future Schema files:

```text
schemas/blog-working-copy-v1.json
schemas/blog-version-v1.json
schemas/blog-revision-proposal-v1.json
schemas/blog-approval-v1.json
```

These paths are suggestions and are not yet formal implementation decisions.

---

## 34. Documentation Sync Checklist

- [x] DEC-051 confirmed
- [x] DEC-052 confirmed
- [x] DEC-053 confirmed
- [x] DEC-054 confirmed
- [x] DEC-055 confirmed
- [x] DEC-056 confirmed
- [x] DEC-057 confirmed
- [x] DEC-058 confirmed
- [x] Save this document as `docs/sessions/session-010.md`
- [x] Add DEC-051 through DEC-058 to `docs/decisions/decisions.md`
- [ ] Define Working Copy Schema
- [ ] Define Blog Version Schema
- [ ] Define Revision Proposal Schema
- [ ] Define Approval Schema
- [ ] Define Blog Editor UI states
- [ ] Define Diff behavior
- [ ] Define Alternative Draft behavior
- [ ] Define Autosave and recovery behavior
- [ ] Review AGENTS.md after Blog specifications become authoritative

---

## 35. Session Summary

The ContentOS Blog Editor separates a mutable, autosaved Working Copy from immutable Blog Versions.

Normal editing updates the Working Copy, while meaningful editorial checkpoints create permanent Versions.

AI-assisted editing follows a Revision Proposal model. AI modifications are displayed as visible differences and require user approval before being applied.

Revision numbers and content hashes prevent stale AI proposals from overwriting newer user changes.

Approvals belong to specific immutable Blog Versions rather than the Blog Artifact as a whole.

Restoring historical content creates a new Version and never destroys later history.

Formal Blog Export Packages can only be generated from Approved Versions, while Draft Markdown may still be copied for temporary use.

The Blog Editor combines a Derived Outline, Markdown Editor, Preview, Version History, and contextual AI Assistant. Chat may initiate revisions, but the structured Editor remains the authoritative interface for content state, differences, approval, and export.
