# 98. Decisions

## DEC-140

### Status

Accepted

### Title

Content Package Workspace 是 ContentOS 的核心产品界面

### Decision

ContentOS uses Content Package as the primary user-facing object.

Agents, Tasks, Runs, Workflows, Versions, and Events are presented as supporting details inside a Package.

The MVP does not use an Agent list or Workflow designer as the primary product entry point.

### Reason

The user’s goal is to complete one content project rather than manage AI infrastructure.

### Impact

Dashboard, navigation, workflow status, and editing interfaces are organized around Content Packages.

---

## DEC-141

### Status

Accepted

### Title

MVP 一级页面限定为 Dashboard、New Content Package、Content Package Workspace 和 Settings

### Decision

The MVP primary navigation contains:

```text
Dashboard
New Content Package
Content Package Workspace
Settings
```

Independent Agent, Prompt, Asset, Workflow, Render, and Analytics administration pages are deferred.

### Reason

A compact information architecture keeps implementation focused on the end-to-end content workflow.

### Impact

Advanced technical capabilities appear inside Package stages or Advanced Details.

---

## DEC-142

### Status

Accepted

### Title

Dashboard 优先展示需要用户处理的 Content Package 和下一步动作

### Decision

Dashboard prioritizes:

- Needs Your Attention
- In Progress
- Recent Content Packages
- Primary Create Action

Operational statistics and Analytics are not the main MVP experience.

### Reason

The user primarily needs to know what requires action and what is currently happening.

### Impact

Every Dashboard Package card includes a user-facing state and recommended next action.

---

## DEC-143

### Status

Accepted

### Title

New Content Package 使用轻量创建流程

### Decision

Creating a Package requires only:

1. Primary Source
2. Optional Supporting Sources
3. Requested output branch
4. Content Mode or a deferred choice

Other metadata remains optional.

Source Capture starts automatically after creation.

### Reason

The content workflow should begin with minimal setup friction.

### Impact

The MVP does not use a complex project-configuration wizard.

---

## DEC-144

### Status

Accepted

### Title

Content Package Workspace 使用 Stage Navigation、Structured Workspace 和 Chief Editor Panel

### Decision

Workspace consists of:

- Package Header
- Stage Navigation
- Main Structured Workspace
- Collapsible Chief Editor Panel
- History or Timeline access

### Reason

Users need to understand stage context, edit structured Artifacts, and receive AI assistance in one coherent interface.

### Impact

Chief Editor Chat is embedded as an assistance layer rather than becoming a separate chat-only product.

---

## DEC-145

### Status

Accepted

### Title

结构化编辑器是 Artifact 的权威编辑界面，Chat 只发起 Proposal 或 Command

### Decision

Chat may:

- Create Revision Proposals
- Explain workflow state
- Propose next actions
- Produce Workflow Command Proposals

Chat may not silently overwrite an Artifact or directly create Approval.

### Reason

Conversation is effective for expressing intent, while structured editors are required for accurate editing, validation, Diff, provenance, and version control.

### Impact

All Chat-generated changes become visible in the relevant Editor and require Apply or explicit Command execution.

---

## DEC-146

### Status

Accepted

### Title

Workspace 使用独立阶段编辑器，而不是通用 JSON Editor

### Decision

The MVP provides:

- Sources Workspace
- Research Review Workspace
- Human Opinion Workspace
- Blog Editor
- Xiaohongshu Editor
- Design Workspace
- Render and Export Workspace
- History Workspace

JSON Contracts appear only in Advanced Details.

### Reason

Each Artifact has a distinct user task and requires a dedicated interaction model.

### Impact

The frontend must implement specialized stage experiences.

---

## DEC-147

### Status

Accepted

### Title

Blog 与 Xiaohongshu 在 Workspace 中显示为并列分支

### Decision

After the shared Content Foundation becomes ready, Blog and Xiaohongshu appear as parallel branches with independent states and review Gates.

Neither branch appears as the child of the other.

### Reason

The two outputs share approved upstream content but are independent platform Artifacts.

### Impact

Overview and Stage Navigation must represent parallel branch progress.

---

## DEC-148

### Status

Accepted

### Title

Current Action 由 Workflow 状态和 Policy 推导，并在 Workspace 中保持显著

### Decision

Every Package and stage displays:

- What is happening
- Whether user action is required
- Why execution is blocked
- Recommended next action
- Available legal Commands

Planner may generate the explanation.

Executor and Workflow Policy determine legal actions.

### Reason

A multi-stage workflow becomes confusing without a clear next-action model.

### Impact

Workflow APIs must provide user-facing Status Summary and Available Commands.

---

## DEC-149

### Status

Accepted

### Title

内部技术信息使用渐进式披露

### Decision

Default UI uses creator-oriented language.

Internal identifiers, Agent Runs, Prompt Versions, Input Snapshots, Model Configuration, token usage, and Workflow Events are available through Advanced Details.

### Reason

ContentOS must remain approachable while preserving technical auditability.

### Impact

Technical data remains stored but does not dominate the primary editing interface.

---

## DEC-150

### Status

Accepted

### Title

Working Copy 自动保存，但 Version 与 Approval 必须通过明确动作创建

### Decision

User edits autosave to Mutable Working Copy.

Autosave does not create an immutable Version.

Version creation and Approval require explicit actions.

The UI may offer a combined action, but the domain records remain separate.

### Reason

This avoids Version explosion while preserving clear checkpoints and Approval history.

### Impact

Every Artifact Editor must display Working Copy, Version, and Approval state.

---

## DEC-151

### Status

Accepted

### Title

AI 内容修改统一通过可比较、可选择应用的 Revision Proposal

### Decision

AI does not directly overwrite Working Copy content.

Revision Proposal shows:

- Original content
- Proposed content
- Modification scope
- Reason
- Validation
- Target Revision

The user may Apply, Selectively Apply, or Reject.

### Reason

The user must retain control over formal content, Human Opinion, and platform expression.

### Impact

Blog and Xiaohongshu Editors require structured Diff and Proposal state.

---

## DEC-152

### Status

Accepted

### Title

Approval 界面必须绑定不可变 Version 并显示 Validation Summary

### Decision

Approval targets one immutable Version.

Before Approval, the UI displays:

- Blocking Errors
- Warnings
- Dependency Versions
- Provenance summary
- Relevant validation metrics

Approval is disabled when Blocking Errors exist.

### Reason

The user must know exactly which Version and risk state they are approving.

### Impact

Every Human Gate requires a dedicated review summary.

---

## DEC-153

### Status

Accepted

### Title

Research Evidence、Human Opinion 和内容 Provenance 可从具体内容内联访问

### Decision

Users can navigate from:

- Research Item to Source Evidence
- Blog statement to Research Item
- Xiaohongshu page to Research and Opinion
- First-person statement to Confirmed Opinion and original response

Provenance remains collapsed by default.

### Reason

Provenance only provides product value when it is accessible during review and editing.

### Impact

Editors require an Evidence Drawer or Provenance Inspector.

---

## DEC-154

### Status

Accepted

### Title

Warning 与 Blocking Error 使用不同视觉和操作语义

### Decision

Warning may be reviewed, acknowledged, and continued when Policy permits.

Blocking Error requires correction, dependency replacement, or a legal fallback.

The UI must not rely only on color and must not provide a normal “continue anyway” action for Blocking Errors.

### Reason

Warnings and blocking conditions represent different domain meanings.

### Impact

Validation UI must expose severity, impact, location, and resolution action.

---

## DEC-155

### Status

Accepted

### Title

Stale 和 Outdated Artifact 保留历史访问，但不作为当前发布候选

### Decision

Stale and Outdated Artifacts may be:

- Viewed
- Compared
- Downloaded
- Restored as a new Working Copy

They remain clearly marked and do not act as the current publishing candidate.

### Reason

Historical Artifacts retain audit and recovery value but must not be confused with current output.

### Impact

Workspace and History must distinguish current, stale, outdated, and historical Artifacts.

---

## DEC-156

### Status

Accepted

### Title

Design Workspace 只允许视觉层修改，内容修改返回 Xiaohongshu Editor

### Decision

Design Workspace may edit:

- Component
- Asset
- Emphasis
- Theme Token
- Attribution placement
- Visual configuration

Canonical text edits return to Xiaohongshu Working Copy and create a new content Version.

### Reason

Design Specification must not become a second editable content source.

### Impact

Design Workspace requires an explicit `Edit Content` return flow.

---

## DEC-157

### Status

Accepted

### Title

Preview Render、Final Render、Export 和 Published 在 UI 中保持独立状态

### Decision

The interface distinguishes:

```text
Preview
Final Render
Exported
Published
```

Publication requires explicit user confirmation.

### Reason

Visual preview, validated output, delivery package, and platform publication are separate events.

### Impact

Render and Export Workspace must provide separate states and actions.

---

## DEC-158

### Status

Accepted

### Title

Agent 进度使用真实阶段，不展示虚假的 LLM 完成百分比

### Decision

Agent progress is displayed using real execution phases:

- Preparing
- Generating
- Validating
- Saving
- Awaiting Review

Specific numeric progress is shown only for deterministically countable work, such as rendered pages.

### Reason

LLM generation does not normally expose a reliable completion percentage.

### Impact

Task APIs and UI must not invent model progress values.

---

## DEC-159

### Status

Accepted

### Title

ContentOS MVP 采用 Desktop-first，并为移动端提供有限查看与审批能力

### Decision

Desktop is the primary experience for:

- Research review
- Blog editing
- Xiaohongshu editing
- Design review
- Diff
- Provenance inspection
- Version comparison

Mobile MVP supports limited reading, Human Opinion response, simple Approval, status viewing, and export viewing.

### Reason

Core ContentOS workflows require large-screen structured editing and side-by-side inspection.

### Impact

Full mobile editing is deferred.
