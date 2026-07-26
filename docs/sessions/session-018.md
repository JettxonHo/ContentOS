# ContentOS Session-018

**Status:** Formalized  
**Session Type:** Product Experience, Workspace Architecture, and Review UX  
**Topic:** Dashboard, Content Package Workspace, Structured Editors, Version Approval, Provenance, and Error States  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established ContentOS as a personal, multi-Agent content operating system.

The end-to-end domain chain is:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

The workflow architecture includes:

```text
LLM Planner
+
Deterministic Executor
+
Versioned Workflow Policy
```

The domain model also includes:

- Content Package
- Artifact Working Copies
- Immutable Artifact Versions
- Human Approval
- Revision Proposals
- Provenance
- Validation Results
- Workflow Commands
- Tasks
- Agent Runs
- Workflow Events
- Stale and Outdated propagation
- Preview Render
- Final Render
- Export Packages

The unresolved product question was:

> How should these technical and domain concepts become a coherent user experience?

This Session defines the Content Package-centered product interface and the primary user workflow.

---

## 2. Core UX Principle

ContentOS is organized around the user’s content project, not around infrastructure objects.

The primary user question is:

> 我正在创作的这一期内容，现在进行到哪里了？下一步需要我做什么？

The primary product object is:

```text
Content Package
```

The following objects support the Package but do not become primary navigation concepts:

- Agent
- Task
- Agent Run
- Workflow Node
- Prompt
- Model Configuration
- Version ID
- Validation Job
- Render Worker

The default interface uses creator-oriented language.

Technical details remain available through progressive disclosure.

---

## 3. Content Package as the Primary User Object

A Content Package represents one complete content-production project.

It may contain:

```text
Content Package
├── Sources
├── Research
├── Human Opinion
├── Blog
├── Xiaohongshu
├── Design
├── Render Outputs
├── Export Packages
└── Workflow History
```

A Package should communicate:

- What the content is about
- Which Sources are involved
- Which outputs were requested
- Current Content Mode
- Current workflow status
- Which branches are active
- Which step needs user attention
- Which Artifacts are current
- Which Artifacts are historical
- Whether any Warning or Blocking Error exists
- What the recommended next action is

---

## 4. MVP Information Architecture

The MVP contains four primary product areas:

```text
Dashboard
New Content Package
Content Package Workspace
Settings
```

Recommended routes:

```text
/dashboard
/content-packages/new
/content-packages/:id
/settings
```

The Content Package Workspace may use nested routes or internal tabs:

```text
/content-packages/:id/overview
/content-packages/:id/sources
/content-packages/:id/research
/content-packages/:id/opinion
/content-packages/:id/blog
/content-packages/:id/xiaohongshu
/content-packages/:id/design
/content-packages/:id/export
/content-packages/:id/history
```

The MVP does not require independent primary pages for:

- Agents
- Prompts
- Models
- Workflows
- Assets
- Tasks
- Render Workers
- Analytics
- Publishing Calendar

These capabilities may appear inside the relevant Package stage or Advanced Details.

---

## 5. Dashboard Purpose

The Dashboard answers:

```text
What needs my attention?
What is currently running?
What did I work on recently?
How do I start a new Content Package?
```

The Dashboard is not primarily an analytics page.

It should not prioritize metrics such as:

- Total Agent Runs
- Total tokens
- Total generated images
- Queue length
- Average model latency
- Render Worker status

These may appear later in an advanced operational area.

---

## 6. Dashboard Sections

The MVP Dashboard contains four main sections.

### 6.1 Primary Create Action

A prominent action:

```text
Create New Content Package
```

This remains the main workflow entry point.

---

### 6.2 Needs Your Attention

Shows Packages waiting for human action.

Examples:

- Source Review required
- Research Review required
- Human Opinion confirmation required
- Blog Review required
- Xiaohongshu Review required
- Design Review required
- Warning acknowledgement required
- Blocking Error requires correction
- Export Package ready

This section should appear above passive progress information.

---

### 6.3 In Progress

Shows active system execution.

Examples:

- Capturing Source
- Normalizing content
- Generating Research
- Generating Blog
- Generating Xiaohongshu
- Creating Design Specification
- Generating illustration
- Rendering page 5 of 8
- Creating Export Package

The language should describe user-visible work rather than raw Task names.

---

### 6.4 Recent Content Packages

Shows recently updated Packages.

Each card may display:

- Package title
- Source type
- Last updated time
- Content Mode
- Requested outputs
- Research state
- Blog state
- Xiaohongshu state
- Warning count
- Recommended next action

---

## 7. Content Package Dashboard Card

Recommended conceptual layout:

```text
┌─────────────────────────────────────────────┐
│ MCP 对普通用户意味着什么？                  │
│ Primary Source · Article                    │
│                                             │
│ Research       Approved                     │
│ Blog           Generating                   │
│ Xiaohongshu    Waiting for review           │
│                                             │
│ Next: Review Xiaohongshu content            │
│ Updated 5 minutes ago                       │
└─────────────────────────────────────────────┘
```

Cards should not show full Workflow Timeline or low-level identifiers by default.

---

## 8. User-facing Status Language

Default interface language should be understandable without knowledge of the architecture.

Preferred:

```text
正在整理来源
等待你审核 Research
Blog 正在生成
小红书内容需要确认
设计被第 5 页内容阻塞
发布素材包已准备好
```

Avoid default exposure of:

```text
Task queued
Agent Run 237
Workflow Node blocked
Promotion failed
Revision mismatch
```

Technical terminology may remain in Advanced Details.

---

## 9. New Content Package Experience

The creation process should remain lightweight.

The user should not configure the entire workflow before starting.

Recommended creation flow:

```text
Provide Source
→ Choose requested outputs
→ Choose or defer Content Mode
→ Create Package
```

A one-page form is preferred.

A two-step process is acceptable if the page remains simple.

---

## 10. Primary Source Input

A new Package requires one Primary Source.

Supported MVP inputs:

- Public URL
- Pasted text
- `.md`
- `.txt`

The interface clearly labels:

```text
Primary Source
```

Primary Source is required before Package creation.

---

## 11. Supporting Sources

The user may optionally add Supporting Sources.

The interface should distinguish them from the Primary Source.

Example:

```text
Primary Source
[URL or text]

Supporting Sources
[Add another source]
```

Supporting Sources remain optional and follow previously accepted MVP limits.

Adding Supporting Sources must not make initial Package creation unnecessarily difficult.

---

## 12. Requested Outputs

The user chooses:

```text
Blog
Xiaohongshu
Blog + Xiaohongshu
```

The product may recommend:

```text
Blog + Xiaohongshu
```

because the core ContentOS value is transforming one approved Content Foundation into two platform-specific outputs.

The user may still request a single branch.

---

## 13. Content Mode

The user may choose:

```text
Creator-led
Research-based
Decide later
```

### Creator-led

The workflow includes Human Opinion collection and confirmation.

### Research-based

The workflow does not invent a personal creator voice.

### Decide later

The workflow may proceed through Source and Research before requiring a final mode decision.

---

## 14. Optional Creation Fields

The New Content Package form may include optional fields:

- Working title
- Target audience
- Reason for creating the content
- Initial opinion
- Desired language
- Content purpose

These fields improve generation context but are not creation-blocking requirements.

---

## 15. Creation Result

After creation:

```text
Create Content Package
→ Open Content Package Workspace
→ Start Source Capture automatically
```

The user should not need to understand or manually start a Source Capture Task.

---

## 16. Content Package Workspace

The Workspace is the core ContentOS interface.

Recommended layout:

```text
┌──────────────────────────────────────────────────────┐
│ Package Header                                       │
├──────────────┬────────────────────────┬──────────────┤
│ Stage Nav    │ Main Workspace         │ Chief Editor │
│              │                        │ Panel        │
│              │                        │              │
├──────────────┴────────────────────────┴──────────────┤
│ Optional Timeline / Status Drawer                    │
└──────────────────────────────────────────────────────┘
```

The Chief Editor Panel may be collapsible.

The Main Workspace remains the primary editing surface.

---

## 17. Package Header

The Package Header displays:

- Package title
- Overall workflow state
- Requested outputs
- Content Mode
- Recommended next action
- Autosave state
- Pause or Resume action
- Package menu
- Historical or Outdated status when applicable

Example:

```text
MCP 对普通用户意味着什么？

Waiting for Research Review
Creator-led · Blog + Xiaohongshu
```

Internal IDs are not displayed by default.

---

## 18. Stage Navigation

Recommended Stage Navigation:

```text
Overview
Sources
Research
Human Opinion
Blog
Xiaohongshu
Design
Render & Export
History
```

Blog and Xiaohongshu appear as parallel stages.

Xiaohongshu is not visually nested under Blog.

---

## 19. Stage Status Indicators

Each stage displays one clear status.

Recommended visual semantics:

```text
Completed
In Progress
Needs Attention
Blocked
Not Started
Outdated
Skipped
```

The interface may combine icons, text, and color.

Color alone must not carry the meaning.

---

## 20. Overview Workspace

Overview is the Package control center.

It should summarize rather than duplicate every stage editor.

Recommended sections:

- Current Action
- Branch Status
- Source Summary
- Active Tasks
- Recent Events
- Warnings and Blocking Errors
- Current approved Versions
- Latest Export state

---

## 21. Current Action

Current Action is the most prominent Overview element.

Examples:

```text
Research Result 已生成。请确认哪些内容可以进入正式创作。
```

```text
Blog 和小红书内容正在并行生成。
```

```text
第 5 页内容超过所有兼容组件的安全容量，需要返回小红书编辑器处理。
```

Each Current Action includes one primary legal action when possible.

---

## 22. Branch Status

After the Content Foundation is ready, Overview displays parallel branches:

```text
Blog
Generating

Xiaohongshu
Waiting for content review
```

Each branch includes:

- Current status
- Current Version
- Warning count
- Next action
- Whether the branch was requested
- Whether the branch was explicitly skipped

---

## 23. Active Task Display

Active Tasks should use high-level progress descriptions.

Examples:

```text
正在整理 3 个来源
正在生成 Blog Draft
正在规划小红书分页
正在匹配页面组件
正在渲染第 5/8 页
```

The UI must not claim access to model internal reasoning.

---

## 24. Chief Editor Panel

Chief Editor Panel assists the user inside the Package context.

It may:

- Explain current workflow state
- Answer questions about the Package
- Recommend a legal next action
- Explain Warning and Blocking Error
- Create a Revision Proposal
- Locate Source Evidence
- Propose a Workflow Command
- Summarize progress
- Explain why an Artifact became stale or outdated

It is not the canonical editor.

---

## 25. Chat Initiates, Editor Remains Canonical

The accepted interaction principle is:

```text
Chat initiates
Editor remains canonical
```

Example:

```text
User:
“把小红书第 4 页写得更容易理解。”
```

Expected flow:

```text
Chat request
→ Create Revision Proposal
→ Show field-level Diff in Xiaohongshu Editor
→ User applies or rejects changes
```

Rejected flow:

```text
Chat request
→ Directly overwrite page 4
```

---

## 26. Chat-to-Command UX

When the user gives a workflow instruction:

```text
“这个 Research 没问题，继续。”
```

The system should:

1. Resolve the active Research Version.
2. Generate a structured Command Proposal.
3. Validate the target and Workflow Revision.
4. Execute through the Deterministic Executor.
5. Record the Approval and Workflow Event.
6. Advance the workflow legally.

The Chat message itself is not the Approval record.

---

## 27. Context-aware Chief Editor

Chief Editor should understand the current UI context, including:

- Current Content Package
- Current stage
- Current Artifact Version
- Selected page
- Selected Research Item
- Selected Warning
- Selected Revision Proposal
- Selected Source Evidence

Example:

```text
User opens Xiaohongshu page 5:
“这句话有来源吗？”
```

Chief Editor should inspect page 5 Provenance and related Research references.

It should not answer generically without checking the selected object.

---

## 28. Structured Stage Editors

The Workspace provides specialized editors:

```text
Sources Workspace
Research Review Workspace
Human Opinion Workspace
Blog Editor
Xiaohongshu Editor
Design Workspace
Render & Export Workspace
History Workspace
```

The MVP does not use one generic JSON editor as the primary interface.

---

## 29. Progressive Disclosure

Default UI shows understandable summaries.

Example:

```text
Research Version 3
Approved
Based on 3 Sources
```

Advanced Details may reveal:

```text
researchver_003
Agent Run
Prompt Template Version
Model Configuration
Input Snapshot
Validation Result
Token Usage
Workflow Events
```

Technical detail remains available without dominating the primary experience.

---

## 30. Sources Workspace

Sources Workspace presents the Source lifecycle in a creator-friendly way.

It may internally represent:

```text
Source Reference
Raw Snapshot
Extracted Content
Normalized Source Version
```

The default UI focuses on reviewable information rather than these internal layers.

---

## 31. Sources List

The Sources List distinguishes:

- Primary Source
- Supporting Sources

Each Source row displays:

- Title
- Source type
- Capture state
- Review state
- Warning state
- Last captured time

Example:

```text
Primary Source

Anthropic 发布 MCP 更新
Captured · Waiting for review
```

---

## 32. Normalized Source Review

The main Source review area displays:

- Title
- Author
- Publication date
- Original URL
- Normalized content
- Capture warnings
- Content-completeness warning
- Snapshot timestamp

User actions may include:

```text
Approve for Research
Edit Normalized Content
Recapture
Replace Source
Remove Supporting Source
```

Removing the Primary Source requires explicit replacement or confirmation.

---

## 33. Raw Snapshot Comparison

The user may open a comparison between:

```text
Raw Snapshot
and
Normalized Source
```

This supports checking whether:

- Important content was lost
- Navigation or advertisements remain
- Formatting damaged meaning
- Quotes were changed
- Tables or lists were incorrectly extracted

The Raw Snapshot remains immutable.

---

## 34. Research Review Workspace

Research Review is structured by Research Item type.

Recommended groups:

```text
Summary
Key Claims
Important Facts
Examples
Tensions
Open Questions
Needs Verification
Excluded Items
```

Each item displays:

- Research statement
- Review state
- Source count
- Evidence availability
- Warning
- Suggested use
- Correction state

---

## 35. Research Review Actions

User actions:

```text
Accept
Correct
Exclude
Mark as Needs Verification
Restore
```

Review state changes occur in the Research Review Working Copy.

Saving creates a new immutable Research Result Version.

Approval applies to that exact Version.

---

## 36. Evidence Drawer

Each Research Item can open an Evidence Drawer.

The evidence chain is:

```text
Research Item
→ Source Evidence
→ Source Snapshot
```

The Drawer may display:

- Source title
- Author
- URL
- Publication date
- Exact evidence excerpt
- Evidence location
- Direct quote status
- Supporting Source count
- Source warning

This allows Source verification without leaving the Workspace.

---

## 37. Research Bulk Review

The MVP may provide limited assistance such as:

```text
Accept all low-risk items
```

This should only be available when:

- Validation identifies the items as low risk
- High-risk items remain separately visible
- Corrections and Needs Verification remain unresolved
- The user still performs final Version approval

The product must not encourage blind approval of all Research.

---

## 38. Human Opinion Workspace

Human Opinion Workspace combines:

```text
Question Cards
+
Chief Editor Chat
```

The structured Question Cards remain the authoritative review interface.

---

## 39. Human Opinion Card

Each Question Card may display:

- Question
- Original user response
- AI Interpretation
- Confirmed Opinion Statement
- Optional Editorial Expression
- Status
- Follow-up question
- Provenance

User actions:

```text
Confirm
Edit and Confirm
Reject Interpretation
Skip Question
Answer Later
Use Current Answers
```

---

## 40. Human Opinion Separation

The interface must clearly distinguish:

```text
What you originally said
What AI understood
What is confirmed for use
```

Example:

```text
Your response:
“普通用户其实没必要学协议细节。”

AI interpretation:
普通用户更需要理解 MCP 带来的产品能力，而不是协议实现。

Status:
Waiting for confirmation
```

AI Interpretation must never appear as already confirmed by default.

---

## 41. Research-based Mode UX

If the user skips Human Opinion:

```text
Use Research-based Mode
```

the interface should explain:

- First-person creator claims will not be generated.
- Personal experience will not be invented.
- Blog and Xiaohongshu remain Research-based.
- The user may later return and add confirmed opinions through a new Version workflow.

---

## 42. Blog Editor

Blog Editor uses Markdown as the canonical body representation.

Recommended areas:

```text
Blog Plan
Blog Draft
Validation
Provenance
Version History
```

The editor should support:

- Markdown editing
- Section navigation
- Source inspector
- Human Opinion inspector
- Revision Proposals
- Version creation
- Validation summary
- Approval

---

## 43. Blog Plan UX

The Blog Plan is visible but does not always require a separate Human Gate.

Default MVP behavior may be:

```text
Generate Plan
→ Validate Plan
→ Generate Draft automatically
```

The user may:

- Inspect the Plan
- Edit it before regeneration
- Request another Plan
- Enable a future “approve outline first” option

The Plan remains Generation Metadata rather than a second editable body source.

---

## 44. Blog Revision Proposal

AI edits appear as Revision Proposals.

Example:

```text
Original:
MCP 是一种连接 AI 和工具的协议。

Proposed:
MCP 更像一套标准化连接方式，让 AI 应用能够以一致方式访问外部工具和数据。
```

Available actions:

```text
Apply
Apply Selected Changes
Reject
Request Another Revision
```

The Proposal must not overwrite the Working Copy automatically.

---

## 45. Blog Approval Summary

Before approval, the UI displays:

- Target Blog Version
- Research Version
- Human Opinion Version or Research-based Mode
- Blocking Error count
- Warning count
- Fact count
- Citation count
- Needs Verification count
- First-person usage count
- Source-overlap warnings

The primary action clearly states:

```text
Approve Blog Version 3
```

The UI should not use a vague button such as:

```text
Done
```

---

## 46. Xiaohongshu Editor

Xiaohongshu Editor is organized around the carousel.

Recommended structure:

```text
Platform Title
Cover Copy
Page List
Selected Page Editor
Caption
CTA
Hashtags
Validation
Provenance
Version History
```

---

## 47. Xiaohongshu Page List

The Page List displays:

```text
01 Cover
02 Context
03 Problem
04 Explanation
05 Creator Opinion
06 Practical Action
07 Summary
08 References
```

The user may:

- Select page
- Reorder pages
- Add page
- Delete page
- Duplicate structure where allowed
- View page Warning
- View Source count
- View Page Purpose

Page reordering updates the Working Copy rather than immediately creating a Version.

---

## 48. Xiaohongshu Page Editor

Each page is edited through structured fields:

- Page Purpose
- Heading
- Primary Message
- Supporting Points
- Quote
- Attribution
- Emphasis
- Content Density
- Research References
- Human Opinion References

The default editor is not one unrestricted text field.

Structured fields support:

- Better validation
- Component compatibility
- Provenance
- Revision Diff
- Visual handoff

---

## 49. Xiaohongshu Title Area

The title area independently manages:

```text
Platform Title Candidates
Selected Platform Title
Cover Title
Cover Subtitle
```

User actions may include:

- Select candidate
- Edit selected title
- Generate new candidates
- Compare candidates
- View title warnings
- Check title-body consistency

One shared generic title field is not used.

---

## 50. Caption Area

Caption remains separate from Carousel pages.

It contains:

- Caption body
- CTA
- Hashtags
- Public References

The interface may surface warnings such as:

```text
Caption heavily repeats the carousel.
```

The system must not silently delete repeated content.

---

## 51. Xiaohongshu Revision Diff

Revision Proposals should display field-level changes.

Example:

```text
Page 4

Heading:
Changed

Primary Message:
Changed

Supporting Point 2:
Removed

Attribution:
Unchanged
```

The user may selectively apply individual field changes.

The MVP does not require character-level merge conflict resolution.

---

## 52. Design Workspace

Design Workspace edits only the visual layer.

It displays:

- Carousel Preview
- Page thumbnails
- Selected page
- Selected Component
- Compatible Component alternatives
- Asset candidate
- Visual hierarchy
- Emphasis
- Theme Tokens
- Attribution placement
- Fit status
- Preview Render state

---

## 53. Design Content Boundary

The Design Workspace does not edit canonical Xiaohongshu text.

If the user attempts to edit text, the interface explains:

```text
This text comes from Xiaohongshu Content Version 3.

Editing the content will create a new Xiaohongshu Working Copy and make the current Design outdated.
```

Primary action:

```text
Edit Content
```

The workflow then returns to the Xiaohongshu Editor.

---

## 54. Component Selection UX

The user sees understandable component names.

Examples:

```text
Hero Cover
Single Point
Bullet Explanation
Comparison
Process Flow
Framework
Quote Focus
Illustration Explanation
Summary
References
```

Advanced Details may show:

```text
comparison_split@1.0.0
```

Incompatible Components remain disabled and explain why they are unavailable.

Example:

```text
This component supports at most 3 supporting points.
The current page contains 5.
```

---

## 55. Asset Selection UX

The user may:

- Use recommended asset
- Compare generated candidates
- Select another candidate
- Regenerate
- Use Asset Library item
- Upload a user asset
- Remove an optional image
- Switch to icon
- Switch to deterministic diagram
- Switch to typography-only layout

Each asset displays:

- Origin
- Approval state
- AI-generated status
- Attribution requirement
- Warning
- Resolution suitability
- Current usage

---

## 56. Preview Render UX

Preview is clearly labeled:

```text
Preview
```

The user may see:

- Page preview
- Pending Asset indicator
- Overflow warning
- Missing asset warning
- Preview timestamp
- Failed page
- Render details

Preview must not appear identical to the final publishing state without a visible status distinction.

---

## 57. Render & Export Workspace

Render & Export contains three areas:

```text
Final Render
Export Package
Publication Status
```

These remain separate states.

---

## 58. Final Render Area

Displays:

- Approved Design Version
- Final Render status
- Page count
- Render Validation summary
- Failed page when applicable
- Selected Final Render Output
- Render timestamp
- Re-render action
- Technical details in an expandable section

---

## 59. Export Package Area

Displays:

- Final images
- Platform Title
- Caption
- CTA
- Hashtags
- References
- Export Package Version
- Warning summary
- Download or Open Package action

The UI should make clear which content and render Versions the Package uses.

---

## 60. Publication Status

The MVP distinguishes:

```text
Not Published
Exported
Published
```

### Not Published

No publishing-ready Package has been created.

### Exported

A publishing-ready Package exists.

### Published

The user explicitly confirms that the content was published.

Export creation must not automatically set Published.

---

## 61. Primary Action Principle

Each stage should have one primary action where possible.

Examples:

```text
Approve Source Version 2
Approve Research Version 3
Confirm Human Opinion Version 1
Approve Blog Version 3
Approve Xiaohongshu Version 2
Approve Design Version 2
Create Export Package
```

Secondary actions may include:

- Save Version
- Request AI Revision
- Compare Versions
- Pause Workflow
- Open Advanced Details

Avoid simultaneous ambiguous actions such as:

```text
Continue
Save
Finish
Confirm
Next
Done
```

without clear distinctions.

---

## 62. Working Copy UX

Mutable Working Copy is displayed as:

```text
Editing Draft
```

Characteristics:

- Autosaved
- Editable
- Not yet immutable
- Not directly approved
- May contain unapplied Revision Proposals
- May diverge from the latest approved Version

---

## 63. Version UX

Immutable Versions are displayed as:

```text
Version 3
```

Characteristics:

- Saved checkpoint
- Immutable
- Comparable
- Reviewable
- Restorable as a new Working Copy
- Eligible for Approval when valid

---

## 64. Approval UX

Approved Version is displayed as:

```text
Approved Version 3
```

Characteristics:

- Explicitly approved
- Used by downstream workflow
- Remains historically approved
- Is not edited in place
- May become stale or outdated after upstream change

---

## 65. Autosave and Version Creation

Normal editing performs:

```text
Autosave Working Copy
```

It does not create a new Version on every input.

Recommended workflow:

```text
Edit Working Copy
→ Autosave
→ Save Version
→ Validate
→ Approve Version
```

The UI may provide a combined action:

```text
Save Version and Approve
```

Internally, Version creation and Approval remain separate records and events.

---

## 66. Revision Proposal

Every AI content edit is represented as a Revision Proposal.

Recommended fields:

- Proposal ID
- Target Artifact
- Target Working Copy Revision
- Modification scope
- Original content
- Proposed content
- Reason
- Validation result
- Agent Run
- Created time
- Status

---

## 67. Revision Proposal States

Recommended states:

```text
pending
partially_applied
applied
rejected
outdated
```

A Proposal becomes Outdated when:

- The target Working Copy changed materially
- The target field was edited manually
- A new Version replaced the editing context
- Another Proposal changed the same region

Outdated Proposals must not be silently applied.

---

## 68. Selective Apply

The user may apply a Proposal at a meaningful unit.

### Blog units

- Heading
- Paragraph
- Section
- Quote
- Sentence

### Xiaohongshu units

- Platform Title
- Cover Title
- Cover Subtitle
- Page
- Heading
- Primary Message
- Supporting Point
- Caption
- CTA
- Hashtag set

The MVP may avoid complex character-level merge logic.

---

## 69. Approval Summary

Before Approval, the UI displays a Validation Summary.

Example:

```text
Research Version 3

Blocking Errors: 0
Warnings: 2
Corrected Items: 3
Needs Verification: 1
Sources Used: 3
```

If acknowledgeable Warnings exist, the user reviews and acknowledges them.

If Blocking Errors exist, the Approval action is disabled.

---

## 70. Approval Target Clarity

The Approval button must name the exact target.

Preferred:

```text
Approve Research Version 3
```

Avoid:

```text
Approve Research
```

when multiple Versions exist.

This reduces stale-page approval mistakes.

---

## 71. Provenance UX

Provenance should be accessible from the content itself.

Examples:

### Research claim

```text
2 Sources
```

Clicking opens Evidence Drawer.

### Blog fact

```text
Source-backed
```

Clicking opens:

```text
Blog text
→ Research Item
→ Source Evidence
```

### First-person statement

```text
From your confirmed opinion
```

Clicking opens:

```text
Confirmed Opinion
→ Original Response
```

---

## 72. Provenance Presentation

Provenance should not clutter every sentence with internal identifiers.

Recommended interaction patterns:

- Small source indicators
- Hover details
- Side Drawer
- Inspector Panel
- Highlight-on-demand
- Validation Summary

Internal IDs appear only in Advanced Details.

---

## 73. Warning UX

Warning means:

> The user may continue after understanding the risk.

A Warning displays:

- Label
- Description
- Affected object
- Impact
- Recommended action
- Whether acknowledgement is required

Possible actions:

```text
Review
Acknowledge
Continue
```

when Workflow Policy allows continuation.

---

## 74. Blocking Error UX

Blocking Error means:

> The current Artifact cannot legally or safely enter the next stage.

It displays:

- Error title
- Affected object
- Why it blocks
- Which dependency is involved
- Exact repair action
- Direct navigation to the problem

No ordinary:

```text
Continue anyway
```

action is provided.

---

## 75. Error Navigation

Clicking an Error should open the affected object.

Example:

```text
Design blocked:
Page 5 does not fit any compatible Component.
```

Available action:

```text
Open Xiaohongshu Page 5
```

The user should not need to manually search the Package.

---

## 76. Warning Accessibility

Warnings and Errors must not rely only on color.

They include:

- Icon
- Severity text
- Written explanation
- Direct action
- Accessible focus behavior

Example:

```text
Warning:
Page 4 is close to the Component capacity limit.
Final rendering may require compact spacing.
```

---

## 77. Stale UX

Stale generally describes an upstream analysis object that requires re-evaluation.

Example:

```text
Research needs update because the approved Source changed.
```

The UI should explain:

- What changed
- Which Artifact is affected
- Whether historical content remains available
- Which regeneration action is recommended

---

## 78. Outdated UX

Outdated generally describes a downstream Artifact based on an older approved upstream Version.

Example:

```text
This Design is based on Xiaohongshu Version 3.
Version 4 is now approved.
```

The Artifact remains accessible but is no longer the current publishing candidate.

---

## 79. Historical Artifact Access

Stale and Outdated Artifacts may still be:

- Viewed
- Compared
- Downloaded
- Restored as a new Working Copy
- Re-rendered if dependencies remain available
- Used for historical audit

They must be clearly labeled:

```text
Historical
Outdated
Not current publishing candidate
```

---

## 80. Regeneration Actions

When an Artifact becomes stale or outdated, the interface provides explicit actions.

Examples:

```text
Regenerate Research from latest Source
Update Blog from latest Research
Regenerate Xiaohongshu from latest Opinion
Recreate Design from Xiaohongshu Version 4
Render latest approved Design
Create new Export Package
```

Avoid generic actions such as:

```text
Refresh
```

because they do not explain what will change.

---

## 81. Agent Progress UX

Agent execution displays real execution phases.

Recommended:

```text
Preparing inputs
Generating
Validating
Saving result
Waiting for review
```

Render execution may show:

```text
Rendering page 5 of 8
```

because page count is deterministic.

---

## 82. No False LLM Percentage

The interface must not display arbitrary model completion percentages such as:

```text
Research Agent 73%
```

unless progress can be measured deterministically.

LLM generation usually cannot provide a trustworthy completion percentage.

---

## 83. Advanced Agent Run Details

Advanced Details may include:

- Task
- Agent type
- Input Versions
- Start time
- Attempt
- Agent Spec Version
- Prompt Version
- Model Configuration
- Validation Result
- Token usage
- Cost estimate
- Error
- Raw Output reference

This area supports debugging without overwhelming the default UI.

---

## 84. Task Failure Message

A failure message should answer:

1. What happened?
2. What content was affected?
3. What can the user do now?

Example:

```text
Xiaohongshu generation failed.

Reason:
The model returned an invalid structure without Page Purpose twice.

Impact:
Research and Human Opinion are preserved.

Next actions:
Retry generation or use another configured model.
```

Avoid generic messages such as:

```text
Something went wrong.
```

---

## 85. Pause UX

Pause Workflow explanation:

```text
Stop automatically starting new workflow steps.
Currently running Tasks may still finish.
```

Pause does not delete or discard content.

---

## 86. Resume UX

Resume Workflow explanation:

```text
Recheck current Versions, dependencies, and completed Tasks, then continue from the latest consistent state.
```

Resume should not blindly restart from an old stage pointer.

---

## 87. Cancel UX

Cancel Workflow explanation:

```text
Stop future execution for this Workflow.
Existing Sources, Research, drafts, Versions, and outputs will remain available.
```

Cancel is a high-impact action and should require explicit confirmation.

---

## 88. History Workspace

History may organize:

```text
Versions
Approvals
Workflow Events
Agent Runs
Warnings
Exports
```

Default Timeline uses user-friendly language.

A Technical Details view may show:

- Internal IDs
- Commands
- Events
- Runs
- Revisions
- Input Snapshots
- Failure classifications

---

## 89. Version Comparison

The MVP should support comparing Versions.

### Blog comparison

Shows:

- Added text
- Removed text
- Changed text
- Source-reference changes
- Human Opinion reference changes

### Xiaohongshu comparison

Shows:

- Page additions
- Page deletions
- Reordering
- Field changes
- Caption changes
- Title changes

### Design comparison

Shows:

- Component changes
- Asset changes
- Theme changes
- Emphasis changes
- Attribution-placement changes

The MVP does not require full three-way merging.

---

## 90. Restore Historical Version

Historical Versions remain immutable.

Restore flow:

```text
Select Historical Version
→ Restore as New Working Copy
→ Edit
→ Save New Version
```

The original historical Version remains unchanged.

---

## 91. Empty States

Each stage should explain why it has no content yet.

Example:

```text
Blog has not been generated.

Required:
✓ Research approved
○ Human Opinion waiting for confirmation

After confirming your opinions, Blog generation will start automatically.
```

An empty stage should not appear as a blank editor.

---

## 92. Loading States

Loading text should describe actual workflow activity.

Preferred:

```text
Generating Xiaohongshu Packaging Plan
```

Avoid repetitive generic text:

```text
AI is thinking...
```

The user may access:

- Task details
- Pause Workflow
- Cancellation state
- Failure history
- Retry availability

---

## 93. Distinct State UX

The UI must distinguish:

```text
Empty
Loading
Awaiting Review
Blocked
Failed
Completed
Outdated
```

These states have different meanings and available actions.

They must not all appear as:

```text
Unavailable
```

---

## 94. Desktop-first Experience

The MVP is Desktop-first.

Desktop is required for effective:

- Research Evidence review
- Long-form Blog editing
- Carousel page editing
- Design preview
- Field-level Diff
- Version comparison
- Provenance inspection
- Chief Editor side panel

---

## 95. Mobile MVP

Mobile may support:

- Viewing Package status
- Reading Sources and Research
- Answering Human Opinion questions
- Simple Approval actions
- Viewing Blog or Xiaohongshu content
- Viewing final exports
- Marking publication state

The MVP does not promise full mobile:

- Blog editing
- Carousel restructuring
- Design component editing
- Version Diff
- Advanced Provenance review

---

## 96. Basic Accessibility

The MVP should support:

- Keyboard navigation
- Visible focus states
- Text labels for Warning and Error
- Dialog close behavior
- Field-level error navigation
- Semantic buttons
- Non-color-only status indication
- Meaningful image descriptions
- Accessible form labels

Detailed accessibility acceptance criteria remain part of implementation planning.

---

## 97. MVP Scope

### Included

- Content Package-centered Dashboard
- Needs Your Attention
- In Progress
- Recent Content Packages
- Lightweight Package creation
- Primary and Supporting Source inputs
- Output branch selection
- Content Mode selection
- Content Package Workspace
- Package Header
- Stage Navigation
- Overview
- Sources Workspace
- Research Review Workspace
- Evidence Drawer
- Human Opinion Workspace
- Blog Editor
- Xiaohongshu Editor
- Design Workspace
- Render & Export Workspace
- History
- Chief Editor Panel
- Chat-to-Proposal
- Chat-to-Command
- Working Copy autosave
- Explicit Version creation
- Version-specific Approval
- Validation Summary
- Revision Proposal Diff
- Selective Apply
- Provenance Inspector
- Warning and Blocking Error distinction
- Stale and Outdated states
- Regeneration actions
- Real execution phases
- Desktop-first interaction
- Limited mobile review

### Deferred

- Agent marketplace
- Prompt administration
- Workflow drag-and-drop editor
- Full Analytics Dashboard
- Publishing calendar
- Multi-user commenting
- Collaborative editing
- Figma-style free canvas
- Full mobile content editing
- JSON-first interface
- Chat-only product interaction
- Autonomous silent edits
- Full publication automation
- Complex three-way merges
- Advanced operational monitoring

---

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

---

## 99. Rejected or Deferred Approaches

### Agent-centered Primary Navigation

Rejected because users create content projects rather than manage Agent infrastructure.

### Workflow Designer as the Main Product

Rejected because the MVP uses a fixed Workflow Template and focuses on content creation.

### Chat-only Editing

Rejected because Chat cannot provide reliable field-level editing, Version control, and Provenance review.

### Generic JSON Editor

Rejected as the default interface because domain Artifacts require specialized editors.

### Blog as the Parent of Xiaohongshu

Rejected because they are parallel branches.

### Autosave Creating a Version on Every Edit

Rejected because it would cause Version explosion.

### AI Silent Overwrite

Rejected because all AI changes require visible Revision Proposals.

### Ambiguous Approval Buttons

Rejected because Approval must identify a specific immutable Version.

### Blocking Error Override

Rejected because required factuality, provenance, dependency, and output-integrity rules cannot be bypassed normally.

### Deleting Outdated Artifacts

Rejected because historical content retains audit and restoration value.

### Editing Canonical Text in Design Workspace

Rejected because Xiaohongshu Artifact remains the content source of truth.

### False AI Progress Percentage

Rejected because model generation progress cannot normally be measured accurately.

### Mobile-first Full Editor

Deferred because the core workflow requires substantial desktop workspace.

### Full Analytics Dashboard

Deferred until publication and performance data are introduced.

### Multi-user Collaboration

Deferred until identity, permissions, and collaboration requirements are defined.

---

## 100. Open Questions

The following questions remain unresolved:

1. What exact Dashboard card layout should be used?
2. How many Packages should Needs Your Attention show?
3. How should archived Packages appear?
4. Should Dashboard support search in the MVP?
5. Which Package filters are required?
6. Should the user be able to duplicate a Package?
7. Can a Package start from pasted Research rather than a Source?
8. Should initial target audience be required for Xiaohongshu?
9. Should Content Mode default to Creator-led or Decide later?
10. Should creation allow immediate pasted Human Opinion?
11. Should Source Capture start before the Workspace route loads?
12. How should capture progress appear?
13. Should Supporting Sources be reorderable?
14. How should Primary Source replacement work?
15. Should removed Supporting Sources remain in history?
16. Which stages appear when a branch is not requested?
17. Should unrequested branches appear disabled or hidden?
18. Can requested branches be added after Package creation?
19. How should branch addition affect Workflow Instance?
20. Which Current Action should take priority when two Gates need attention?
21. Should Blog and Xiaohongshu review actions appear simultaneously?
22. Should the Chief Editor Panel open by default?
23. How much screen width should the Panel use?
24. Can Chat mention a specific field or page through selection context?
25. How should selected-context references appear in Chat?
26. Should Chat show proposed Commands before execution?
27. Which Commands require an additional confirmation step?
28. Should simple approval commands execute immediately?
29. How should Chat history relate to Workflow Events?
30. Should Chat history be versioned or archived?
31. Which Source fields are editable?
32. Should Normalized Source use a rich-text editor?
33. How should tables appear in Source review?
34. How should failed extraction sections be displayed?
35. Which Research Item categories belong in MVP?
36. How should Research corrections show before and after text?
37. Should low-risk batch acceptance exist in the first release?
38. Which items qualify as low risk?
39. How should Evidence Drawer handle multiple Sources?
40. Can users add manual Research Items?
41. How should manually added Research record provenance?
42. Can Human Opinion answers be recorded by voice?
43. Is audio transcription in MVP or deferred?
44. How many Question Cards should be visible at once?
45. Should Human Opinion Chat and Cards stay synchronized?
46. How should rejected interpretations be retained?
47. Which Markdown editor library should be used?
48. Should Blog preview appear beside the editor?
49. Should Blog Plan be editable separately?
50. Should Outline Review be an optional setting?
51. How should Blog citations appear during editing?
52. How should Source-overlap warnings highlight text?
53. Which fields are required for each Xiaohongshu Page Purpose?
54. How should page drag-and-drop affect Revision Proposals?
55. Can users add more than ten pages manually?
56. Should invalid page count block Version creation or only Approval?
57. How should selected title candidates be compared?
58. How many title candidates should the UI show?
59. Should Caption have Markdown formatting?
60. How should Hashtags be edited?
61. Should the Design Workspace show actual Theme Token names?
62. Which Component alternatives should be user-selectable?
63. Should the user be able to lock a Component?
64. How should pending generated assets appear in Preview?
65. Can Design Approval occur with an optional asset still pending?
66. Should Final Render start automatically after Design Approval?
67. Should Export creation require an explicit click?
68. Should Export Packages download as ZIP?
69. Should `post.md` be copyable directly?
70. Should Caption and Hashtags have separate copy buttons?
71. How should Publication Status be edited?
72. Should the user provide the published URL?
73. Should publication date be recorded?
74. How should stale and outdated statuses appear in mobile?
75. Should historical Artifacts be hidden by default?
76. How should Version comparison be routed?
77. Which Diff library should be used?
78. Should Design Version comparison use visual screenshots?
79. How should restored Working Copies be named?
80. Should restored Versions inherit previous Revision Proposals?
81. How long should Revision Proposals remain visible?
82. Can a partially applied Proposal be reapplied?
83. How should Proposal conflicts be shown?
84. Which Warnings are acknowledgeable in the UI?
85. Should Warning acknowledgement require a note?
86. How should Blocking Errors appear in Stage Navigation?
87. Which failure messages require user-facing localization?
88. Should Agent execution cost appear by default or only in Advanced Details?
89. Should Task cancellation be available in the MVP?
90. Which running Tasks can be cancelled safely?
91. How should Pause affect visible progress?
92. Should Cancel Workflow be reversible?
93. Should a completed Workflow allow Resume?
94. When should the system suggest creating a new Workflow Instance?
95. How should History group Events by stage?
96. Should Workflow Events be exportable?
97. Which keyboard shortcuts should be supported?
98. What minimum desktop width is supported?
99. Which mobile Approval actions are safe?
100. Which accessibility requirements become release-blocking?

---

## 101. Documentation Updates

Create:

```text
docs/sessions/session-018.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-140
DEC-141
DEC-142
DEC-143
DEC-144
DEC-145
DEC-146
DEC-147
DEC-148
DEC-149
DEC-150
DEC-151
DEC-152
DEC-153
DEC-154
DEC-155
DEC-156
DEC-157
DEC-158
DEC-159
```

Future documents to create:

```text
docs/product/dashboard.md
docs/product/new-content-package.md
docs/product/content-package-workspace.md
docs/product/overview-workspace.md
docs/product/sources-workspace.md
docs/product/research-review-workspace.md
docs/product/human-opinion-workspace.md
docs/product/blog-editor.md
docs/product/xiaohongshu-editor.md
docs/product/design-workspace.md
docs/product/render-export-workspace.md
docs/product/history-workspace.md
docs/product/chief-editor-panel.md
docs/product/revision-proposal-ux.md
docs/product/provenance-ux.md
docs/product/validation-ux.md
docs/product/mobile-scope.md
```

Possible future UI contracts:

```text
schemas/workspace-status-summary-v1.json
schemas/current-action-v1.json
schemas/available-command-v1.json
schemas/revision-proposal-v1.json
schemas/version-review-summary-v1.json
schemas/provenance-inspector-v1.json
schemas/validation-display-result-v1.json
```

These paths remain implementation suggestions rather than final repository contracts.

---

## 102. Documentation Sync Checklist

- [x] DEC-140 confirmed
- [x] DEC-141 confirmed
- [x] DEC-142 confirmed
- [x] DEC-143 confirmed
- [x] DEC-144 confirmed
- [x] DEC-145 confirmed
- [x] DEC-146 confirmed
- [x] DEC-147 confirmed
- [x] DEC-148 confirmed
- [x] DEC-149 confirmed
- [x] DEC-150 confirmed
- [x] DEC-151 confirmed
- [x] DEC-152 confirmed
- [x] DEC-153 confirmed
- [x] DEC-154 confirmed
- [x] DEC-155 confirmed
- [x] DEC-156 confirmed
- [x] DEC-157 confirmed
- [x] DEC-158 confirmed
- [x] DEC-159 confirmed
- [ ] Save this document as `docs/sessions/session-018.md`
- [ ] Add DEC-140 through DEC-159 to `docs/decisions/decisions.md`
- [ ] Define Dashboard specification
- [ ] Define Content Package card
- [ ] Define Package creation flow
- [ ] Define Workspace shell
- [ ] Define Stage Navigation states
- [ ] Define Overview Workspace
- [ ] Define Current Action API
- [ ] Define Chief Editor Panel behavior
- [ ] Define Chat-to-Proposal interaction
- [ ] Define Chat-to-Command interaction
- [ ] Define Sources Workspace
- [ ] Define Research Review Workspace
- [ ] Define Evidence Drawer
- [ ] Define Human Opinion Workspace
- [ ] Define Blog Editor
- [ ] Define Xiaohongshu Editor
- [ ] Define Design Workspace
- [ ] Define Render and Export Workspace
- [ ] Define History Workspace
- [ ] Define Working Copy autosave behavior
- [ ] Define Version creation actions
- [ ] Define Approval review summary
- [ ] Define Revision Proposal states and Diff
- [ ] Define Provenance Inspector
- [ ] Define Warning and Blocking Error UX
- [ ] Define Stale and Outdated UX
- [ ] Define Desktop and mobile boundaries
- [ ] Review AGENTS.md after Workspace specifications become authoritative

---

## 103. Session Summary

ContentOS is organized around Content Packages rather than Agents, Tasks, Prompts, or Workflow Nodes.

The MVP primary navigation contains:

```text
Dashboard
New Content Package
Content Package Workspace
Settings
```

Dashboard prioritizes:

```text
Needs Your Attention
In Progress
Recent Content Packages
Create New Content Package
```

Creating a Package requires only a Primary Source, optional Supporting Sources, requested outputs, and a Content Mode choice or deferred decision.

The Content Package Workspace contains:

```text
Package Header
Stage Navigation
Structured Stage Workspace
Chief Editor Panel
History and Timeline
```

Blog and Xiaohongshu appear as parallel branches.

Each domain stage uses a dedicated structured editor.

Chat assists by creating Revision Proposals or Workflow Command Proposals.

It does not silently edit Artifacts or directly create Approval.

Working Copies autosave.

Immutable Versions and Approval require explicit actions.

All AI content edits appear as visible, comparable, selectively applicable Revision Proposals.

Approval always targets one immutable Version and includes a Validation Summary.

Research Evidence and Human Opinion Provenance remain accessible from the specific content they support.

Warnings may be acknowledged when Policy allows.

Blocking Errors must be resolved and cannot be bypassed by an ordinary continue action.

Stale and Outdated Artifacts remain available for history, comparison, download, and restoration, but they do not remain the current publishing candidate.

Design Workspace edits only the visual layer.

Canonical content modifications return to the Xiaohongshu Editor and create a new content Version.

Preview, Final Render, Export, and Published remain distinct states.

Agent progress uses real execution phases and does not display invented LLM completion percentages.

The ContentOS MVP is Desktop-first, with limited mobile viewing, Human Opinion response, Approval, and export access.