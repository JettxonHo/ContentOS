# ContentOS Session-019

**Status:** Formalized  
**Session Type:** Domain Data Model, Identity, Persistence, and API Contract  
**Topic:** Core Entities, Working Copies, Immutable Versions, Dependencies, Provenance, Storage, Queries, and Commands  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the complete ContentOS production system:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

The product architecture now includes:

- Content Package
- Source Reference
- Raw Snapshot
- Normalized Source
- Research Result
- Human Opinion
- Blog Artifact
- Xiaohongshu Artifact
- Design Specification
- Visual Assets
- Render Output
- Export Package
- Workflow Instance
- Workflow Node
- Task
- Agent Run
- Approval
- Revision Proposal
- Validation Result
- Provenance
- Dependency propagation
- Working Copy
- Immutable Version
- Human Gate
- Append-only Workflow Event

The unresolved questions were:

1. Which objects are stable domain entities?
2. Which objects are mutable Working Copies?
3. Which objects are immutable Versions?
4. How should IDs, Version IDs, revisions, and execution IDs differ?
5. What does Content Package as Aggregate Root mean?
6. Should all Artifact types use one generic table?
7. How should current, latest, review-candidate, and approved Versions be represented?
8. How should dependencies and provenance be queryable?
9. How should Approval be stored?
10. What belongs in PostgreSQL?
11. What belongs in Object Storage?
12. How should the frontend query and change domain state?
13. Which operations are ordinary draft edits?
14. Which operations must use Workflow Commands?
15. How should long-running AI and rendering tasks behave through the API?
16. How should idempotency, concurrency, pagination, errors, and versioning be standardized?
17. How should domain changes reliably trigger downstream workflow activity?

This Session defines the core data language and API conventions for ContentOS.

---

## 2. Core Data-model Principle

ContentOS uses:

```text
Stable domain entities
+
Mutable Working Copies
+
Immutable Versions
+
Explicit structured relationships
+
Versioned structured bodies
+
Object Storage references
```

It does not use either extreme:

```text
Every object stored as one unrestricted JSON document
```

or:

```text
Every small field stored in a separate relational table
```

The data model should balance:

- Domain clarity
- Queryability
- Database constraints
- Version history
- Extensibility
- Agent-output flexibility
- Operational simplicity
- Historical reproducibility

---

## 3. Structured Data Rule

Frequently queried and relationship-critical information should be stored structurally.

Examples:

- Artifact identity
- Content Package relationship
- Version number
- Parent Version
- Approval target
- Dependency Version
- Workflow state
- Task state
- Actor
- Created time
- Object Storage key
- File hash
- Warning severity
- Provenance target
- Page ID
- Research Item ID

Flexible metadata may use structured JSON when it has an explicit Schema Version.

Examples:

- Model-provider metadata
- Render Environment Fingerprint
- Validation details
- Agent-generation metadata
- Platform Profile extensions
- Artifact Body
- Provider-specific generation parameters

JSON is allowed.

Unversioned and unvalidated JSON as the only domain contract is not allowed.

---

## 4. Domain Modules

The ContentOS data model is divided into domain modules:

```text
Content Package Module
Source Module
Research Module
Human Opinion Module
Publishing Content Module
Visual Module
Render and Export Module
Workflow Module
Agent Runtime Module
Platform and Brand Module
```

These modules may initially exist inside one modular monolith and one PostgreSQL database.

The module boundaries are logical ownership boundaries rather than immediate microservice boundaries.

---

## 5. Content Package Module

The Content Package Module owns:

- Content Package identity
- Package title
- Content Mode
- Requested output branches
- Package lifecycle
- Archive state
- Current Artifact family references
- Package overview
- Package-level revision
- Package creation metadata

It does not store every Source, Blog page, Design page, Asset, or Render file inside one giant Package object.

---

## 6. Source Module

The Source Module owns:

- Source Reference
- Primary or Supporting role
- Capture state
- Raw Snapshot
- Extracted Content
- Normalized Source Artifact
- Normalized Source Working Copy
- Normalized Source Versions
- Source metadata
- Source Evidence locator
- Source replacement history
- Source capture warnings

---

## 7. Research Module

The Research Module owns:

- Research Result Artifact
- Research Working Copy
- Research Result Versions
- Research Items
- Item categories
- Item Review State
- Evidence Links
- Research Validation Result
- Research correction history
- Research approval eligibility

---

## 8. Human Opinion Module

The Human Opinion Module owns:

- Question Cards
- Raw Human Responses
- AI Interpretations
- Confirmed Opinion Statements
- Optional Editorial Expressions
- Human Opinion Working Copy
- Human Opinion Versions
- Human Opinion provenance
- Creator-led and Research-based mode implications

Raw Human Response and AI Interpretation remain distinct records.

AI Interpretation does not become a confirmed user statement without explicit confirmation.

---

## 9. Publishing Content Module

The Publishing Content Module owns:

### Blog

- Blog Artifact
- Blog Working Copy
- Blog Versions
- Markdown Canonical Body
- Blog Plan metadata
- Blog Revision Proposals
- Blog provenance usage
- Blog Validation Results
- Blog Export Package references

### Xiaohongshu

- Xiaohongshu Artifact
- Xiaohongshu Working Copy
- Xiaohongshu Versions
- Stable Page IDs
- Platform Titles
- Cover copy
- Page content
- Caption
- CTA
- Hashtags
- Public references
- Revision Proposals
- Provenance usage
- Validation Results

Blog and Xiaohongshu share module infrastructure where appropriate but retain independent Schemas and rules.

---

## 10. Visual Module

The Visual Module owns:

- Design Artifact
- Design Working Copy
- Design Specification Versions
- Design Pages
- Content Bindings
- Component Registry
- Brand Theme
- Render Profile references
- Asset Requests
- Asset Registry
- Asset Versions
- Asset provenance
- Design Validation Results

---

## 11. Render and Export Module

The Render and Export Module owns:

- Render Profile
- Render Job
- Render Attempt
- Render Output
- Render Validation Result
- Selected Final Render Output
- Export Package
- Export Manifest
- Export eligibility
- Export object references
- Historical output lifecycle

---

## 12. Workflow Module

The Workflow Module owns:

- Workflow Template
- Workflow Policy
- Workflow Instance
- Workflow Nodes
- Workflow Commands
- Human Gates
- Approval Records
- Workflow Events
- Warning Acknowledgements
- Pause, Resume, Cancel, and Skip state
- Completion Policy
- Available Commands
- Current Action projection

---

## 13. Agent Runtime Module

The Agent Runtime Module owns:

- Task
- Agent Run
- Agent Run Attempt
- Frozen Input Snapshot
- Agent Spec reference
- Prompt Template reference
- Model Configuration reference
- Provider metadata
- Raw model output reference
- Parsed output
- Token and cost metadata
- Run Validation
- Promotion Result
- Failure classification

The model-routing and provider-execution details will be formalized in Session-020.

---

## 14. Platform and Brand Module

The Platform and Brand Module owns versioned configuration such as:

- Platform Content Profile
- Render Profile
- Brand Rules
- Brand Theme
- Component Registry
- Asset Policy
- Citation rules
- Output constraints
- Model-independent generation policies

These are versioned dependencies rather than permanent Prompt text.

---

## 15. Content Package as Aggregate Root

Content Package is the primary aggregate entry point for one content-production project.

It establishes:

- Package identity
- User-visible title
- Content Mode
- Requested branches
- Package lifecycle
- Package revision
- Current Artifact references
- Current Workflow reference

Conceptual structure:

```json
{
  "content_package_id": "cp_...",
  "title": "MCP 对普通用户意味着什么",
  "content_mode": "creator_led",
  "requested_outputs": [
    "blog",
    "xiaohongshu"
  ],
  "lifecycle_status": "active",
  "revision": 17,
  "created_at": "2026-07-26T10:00:00Z",
  "updated_at": "2026-07-26T18:00:00Z"
}
```

---

## 16. Aggregate Root Does Not Mean Giant Row

Content Package being the Aggregate Root does not mean that all Package data belongs in:

```text
one database row
one JSON column
one transaction
one lock
```

Such an implementation would cause:

- Blog and Xiaohongshu editing conflicts
- Long-running Tasks blocking normal edits
- Excessively broad optimistic-concurrency conflicts
- Growing rows
- Accidental cross-module overwrites
- Difficult module ownership
- Difficult query optimization

The architecture instead uses:

```text
Package identity and references
+
Independent module transactions
+
Explicit dependency edges
+
Reliable domain events
```

---

## 17. Package-level Heads

The Package may expose current Artifact references for query convenience.

Conceptually:

```json
{
  "content_package_id": "cp_001",
  "current_references": {
    "normalized_source_approved_version_ids": [
      "sourcever_002"
    ],
    "research_review_candidate_version_id": "researchver_003",
    "research_approved_version_id": "researchver_002",
    "human_opinion_confirmed_version_id": "opinionver_001",
    "blog_approved_version_id": null,
    "xiaohongshu_approved_version_id": "xhsver_002",
    "design_approved_version_id": "designver_001",
    "selected_final_render_output_id": "renderout_004"
  }
}
```

The physical implementation may use structured pointer records rather than one JSON field.

---

## 18. Identity Categories

ContentOS distinguishes five identity categories:

```text
Stable Entity ID
Immutable Version ID
Working Copy ID and Revision
Execution ID
Append-only Record ID
```

These categories must not be treated as interchangeable.

---

## 19. Stable Entity ID

Stable Entity ID identifies one long-lived logical object.

Examples:

```text
content_package_id
source_reference_id
normalized_source_artifact_id
research_result_id
human_opinion_artifact_id
blog_artifact_id
xiaohongshu_artifact_id
design_artifact_id
asset_id
workflow_instance_id
task_id
```

Example:

```text
Blog Artifact blog_001
├── Blog Version 1
├── Blog Version 2
└── Blog Version 3
```

`blog_001` continues to identify the logical Blog output family.

---

## 20. Immutable Version ID

Immutable Version ID identifies one exact, immutable snapshot.

Examples:

```text
normalized_source_version_id
research_result_version_id
human_opinion_version_id
blog_version_id
xiaohongshu_version_id
design_version_id
asset_version_id
platform_profile_version_id
brand_theme_version_id
component_registry_version_id
```

After creation, the following must not change:

- Body
- Dependency set
- Provenance
- Content hash
- Parent reference
- Creation metadata
- Schema Version

A change creates a new Version.

---

## 21. Working Copy ID

Working Copy ID identifies a mutable editing object.

Examples:

```text
normalized_source_working_copy_id
research_working_copy_id
human_opinion_working_copy_id
blog_working_copy_id
xiaohongshu_working_copy_id
design_working_copy_id
```

A Working Copy may be autosaved repeatedly.

It is not consumed as the formal dependency of an approved downstream Artifact.

---

## 22. Working Copy Revision

Every Working Copy uses a monotonically increasing Revision.

Example:

```text
Revision 17
Revision 18
Revision 19
```

Revision supports:

- Autosave
- Optimistic concurrency
- Revision Proposal targeting
- Stale editor detection
- Conflict prevention
- Version creation checkpoints
- Safe selective apply

Revision is not an immutable Artifact Version.

---

## 23. Execution ID

Execution IDs identify operational work rather than content identity.

Examples:

```text
command_id
task_id
agent_run_id
agent_run_attempt_id
render_job_id
render_attempt_id
generation_run_id
```

A single Task may have multiple Agent Runs.

A single Design Version may have multiple Render Jobs.

Execution history does not change the underlying Artifact identity.

---

## 24. Append-only Record ID

Append-only records use independent IDs.

Examples:

```text
approval_id
workflow_event_id
dependency_edge_id
provenance_usage_id
revision_proposal_id
warning_acknowledgement_id
validation_result_id
object_reference_id
```

These records capture decisions, relationships, validations, and events.

They are not represented only by mutable flags on other objects.

---

## 25. Opaque Identifier Policy

Formal ContentOS IDs use non-guessable, non-recycled opaque identifiers.

Possible implementation choices include:

```text
UUID
UUIDv7
ULID
```

The exact choice is deferred to the technical architecture.

Opaque IDs are preferred because they:

- Are difficult to enumerate
- Do not expose business volume
- Can be generated across processes
- Remain stable across migrations
- Avoid collision with display numbers
- Support future service boundaries

---

## 26. Display Numbers

User-visible numbers remain separate from formal IDs.

Examples:

```text
Version 3
Page 5
Source 2
Attempt 2
```

These numbers help users understand ordering.

They are not safe global references.

Formal relationships always use opaque IDs.

---

## 27. Shared Version Metadata

Important Artifact Versions follow a shared metadata convention.

Conceptual structure:

```json
{
  "version_id": "blogver_003",
  "artifact_id": "blog_001",
  "content_package_id": "cp_001",

  "version_number": 3,
  "parent_version_id": "blogver_002",

  "schema_version": "contentos.blog-version/v1",
  "body_schema_version": "contentos.blog-body/markdown-v1",

  "created_from_working_copy_revision": 18,

  "created_by": {
    "actor_type": "user",
    "actor_id": "user_001"
  },

  "content_hash": "sha256:...",

  "created_at": "2026-07-26T18:00:00Z"
}
```

Different Artifact types retain different Bodies while sharing common Version metadata.

---

## 28. Version Number

Version Number is a sequential display property within one Stable Artifact.

Example:

```text
Blog Artifact blog_001
├── Version 1
├── Version 2
└── Version 3
```

Formal dependencies must reference:

```text
blog_version_id = blogver_003
```

They must not rely only on:

```text
version_number = 3
```

because Version Number is not globally unique.

---

## 29. Parent Version

`parent_version_id` identifies the Version from which a new Version logically developed.

Example:

```text
Blog v2
→ restored or edited
→ Blog v3
```

A Version may have:

- One Parent Version
- No Parent Version for initial creation
- Future branch metadata if branching workflows are later introduced

MVP does not require a full Git-like content graph.

A linear or lightly branched parent relationship is sufficient.

---

## 30. Content Hash

Every immutable Version should have a stable Content Hash.

The hash may cover:

- Canonical Body
- Relevant immutable metadata
- Dependency summary where appropriate
- Schema Version

Content Hash supports:

- Duplicate detection
- Integrity checking
- Render reproducibility
- Export Manifest verification
- Idempotent Version creation
- Debugging

Hash calculation details remain an implementation decision.

---

## 31. Actor Reference

Important creation and state-change records contain an Actor Reference.

Conceptual structure:

```json
{
  "actor_type": "user",
  "actor_id": "user_001"
}
```

Supported Actor types may include:

```text
user
agent
system
service
```

Examples:

- User approves Research
- Agent creates a Revision Proposal
- System marks a Design outdated
- Render Service creates a Render Output
- Workflow Executor creates a Task

Even in the single-user MVP, Actor must be retained.

---

## 32. Stable Artifact Structure

Important content families use:

```text
Stable Artifact
├── Mutable Working Copy
├── Immutable Versions
└── Artifact Head
```

Examples:

- Research Result
- Human Opinion
- Blog
- Xiaohongshu
- Design Specification

This shared structure supports a consistent product experience.

---

## 33. Working Copy Structure

Conceptual Working Copy:

```json
{
  "working_copy_id": "xhswc_001",
  "artifact_id": "xhs_001",
  "content_package_id": "cp_001",

  "base_version_id": "xhsver_002",
  "revision": 18,

  "body_schema_version": "contentos.xhs-artifact/v1",
  "body": {},

  "updated_by": {
    "actor_type": "user",
    "actor_id": "user_001"
  },

  "updated_at": "2026-07-26T18:15:00Z"
}
```

`base_version_id` identifies the immutable Version from which editing began.

---

## 34. Working Copy Lifecycle

Recommended lifecycle:

```text
Create from Approved or selected Version
→ Edit
→ Autosave Revision
→ Apply Revision Proposals
→ Create Immutable Version
→ Continue editing or reset base
```

Creating a Version does not require deletion of the Working Copy.

After Version creation, the Working Copy may:

- Continue from the saved Version
- Reset its `base_version_id`
- Remain open for further edits
- Be replaced through restore flow

Exact UX behavior remains an implementation detail.

---

## 35. Artifact Head

Artifact Head records which objects are currently relevant to workflow operations.

Conceptual structure:

```json
{
  "artifact_id": "blog_001",

  "working_copy_id": "blogwc_001",
  "latest_version_id": "blogver_003",
  "review_candidate_version_id": "blogver_003",
  "approved_version_id": "blogver_002",

  "revision": 9,
  "updated_at": "2026-07-26T18:20:00Z"
}
```

---

## 36. Artifact Head Meanings

### `working_copy_id`

Current mutable editing object.

### `latest_version_id`

Most recently created immutable Version.

### `review_candidate_version_id`

Version currently presented at a Human Gate.

### `approved_version_id`

Version currently authorized for downstream consumption.

These may refer to different Versions.

---

## 37. No Generic `current_version_id`

ContentOS does not rely on one ambiguous field:

```text
current_version_id
```

because “current” may mean:

- Latest saved
- Being reviewed
- Approved
- Displayed
- Published
- Selected for rendering

The API and data model must use explicit pointer names.

---

## 38. No Mutable `is_current` on Version

Historical Version rows must not be repeatedly modified through:

```text
is_current = true
```

This approach risks:

- Multiple current rows
- Broad update transactions
- Conflicting meanings of current
- Difficult history
- Concurrent pointer corruption

Version remains immutable.

Current relationships are stored in Artifact Head or equivalent pointer records.

---

## 39. No Universal Artifact Body Table

ContentOS does not model all Artifacts as:

```text
artifacts
- artifact_id
- artifact_type
- content_json
- status
```

Such a model would weaken:

- Type constraints
- Query quality
- Domain validation
- Migration safety
- Editor contracts
- Provenance relations
- Database integrity
- Developer understanding

---

## 40. Typed Artifact Models

ContentOS shares metadata conventions but maintains type-specific models.

Conceptually:

```text
research_result_artifacts
research_working_copies
research_result_versions
research_items

blog_artifacts
blog_working_copies
blog_versions

xiaohongshu_artifacts
xiaohongshu_working_copies
xiaohongshu_versions
xiaohongshu_pages

design_artifacts
design_working_copies
design_versions
design_pages
```

The exact table decomposition remains an implementation decision.

The domain and API Contracts remain typed.

---

## 41. Structured JSON Bodies

JSONB may be used for typed Artifact Bodies when:

- A formal Schema exists
- A Schema Version exists
- Validation runs on write
- Stable internal IDs exist
- Important cross-object relationships are separately queryable
- Migration behavior is defined

Example Blog Body:

```json
{
  "format": "markdown",
  "schema_version": "contentos.blog-body/markdown-v1",
  "content": "# Article title\n..."
}
```

Example XHS Body may remain structured JSON with stable Pages and fields.

---

## 42. Relational Fields versus JSON Fields

Prefer relational or indexed fields for:

- Content Package ID
- Artifact ID
- Version ID
- Version number
- Parent Version
- Approval status projection
- Head pointers
- Dependency edges
- Page ID
- Research Item ID
- Actor
- Timestamps
- Workflow state
- Task state
- Object key
- Hash
- Severity

Prefer Schema-governed JSON for:

- Artifact Body
- Validation detail collection
- Render Environment Fingerprint
- Provider-specific metadata
- Agent-generation parameters
- Optional Platform extensions

---

## 43. Version Dependency Graph

Version dependencies are first-class data.

Every important downstream Version records exact upstream Versions.

Examples:

```text
Blog v3
├── Research v2
└── Human Opinion v1
```

```text
Xiaohongshu v4
├── Research v2
├── Human Opinion v1
└── Platform Profile v1
```

```text
Design v2
├── Xiaohongshu v4
├── Brand Theme v1
├── Component Registry v1
└── Asset Versions
```

```text
Render Output v3
├── Design v2
├── Render Profile v1
├── Font Bundle v1
└── Renderer v1
```

---

## 44. Dependency Edge

Conceptual Dependency Edge:

```json
{
  "dependency_edge_id": "dep_001",

  "dependent_object_type": "blog_version",
  "dependent_object_id": "blogver_003",

  "dependency_object_type": "research_result_version",
  "dependency_object_id": "researchver_002",

  "role": "content_foundation",
  "required": true,

  "created_at": "2026-07-26T18:00:00Z"
}
```

Dependency Edges are immutable.

A changed dependency set requires a new dependent Version.

---

## 45. Dependency Roles

Possible roles include:

```text
primary_source
supporting_source
content_foundation
human_opinion
platform_profile
brand_theme
component_registry
visual_asset
render_profile
font_bundle
renderer
public_reference
```

Roles support:

- Impact analysis
- Validation
- UI explanation
- Stale propagation
- Historical reproduction

The exact enum set remains part of future Contract design.

---

## 46. Dependencies Must Be Queryable

Important dependencies must not exist only inside:

```json
{
  "generation_metadata": {
    "research_version_id": "..."
  }
}
```

The system must be able to answer:

- Which Blog Versions depend on Research v2?
- Which Designs depend on XHS v4?
- Which Render Outputs use Asset v3?
- Which exports use Font Bundle v1?
- Which objects become outdated after an upstream Approval?
- Which files must be retained for reproduction?

Artifact Body may include a dependency summary.

The structured Dependency Graph remains authoritative for relationship queries.

---

## 47. Historical Validity versus Current Eligibility

An Artifact may remain historically valid while no longer being the current candidate.

Relevant concepts include:

```text
historically_valid
review_candidate
approved_current
stale
outdated
invalidated
```

Example:

```text
Research v2
→ Blog v3
```

Research v3 later becomes approved.

Blog v3 remains historically tied to Research v2.

It becomes `outdated`.

Its dependencies are not rewritten.

---

## 48. Stale and Outdated Propagation

Propagation uses:

```text
Artifact Heads
+
Dependency Graph
+
Workflow Policy
+
Domain Events
```

Example:

```text
Approve Research v3
→ Update Research Head
→ Find dependent Blog/XHS Versions
→ Mark current downstream candidates outdated
→ Record Workflow Events
→ Update Current Action
→ Offer regeneration
```

Historical objects are preserved.

---

## 49. Invalidated State

`invalidated` is reserved for confirmed defects, not normal upstream updates.

Possible causes:

- Corrupted file
- Proven incorrect rendering
- Broken Manifest
- Security issue
- Missing essential historical dependency
- Confirmed data-integrity failure

A newer upstream Version normally causes `stale` or `outdated`, not `invalidated`.

---

## 50. Approval as Independent Record

Approval is a first-class append-only record.

Conceptual structure:

```json
{
  "approval_id": "approval_001",

  "content_package_id": "cp_001",
  "artifact_type": "research_result",
  "artifact_version_id": "researchver_003",

  "decision": "approved",

  "actor": {
    "actor_type": "user",
    "actor_id": "user_001"
  },

  "command_id": "cmd_001",
  "validation_result_id": "validation_005",

  "acknowledged_warning_ids": [
    "warning_001"
  ],

  "created_at": "2026-07-26T18:30:00Z"
}
```

---

## 51. Approval Is Not a Boolean

The system does not treat Approval only as:

```text
approved = true
```

because that would lose:

- Which Version was approved
- Who approved it
- When it was approved
- Which Validation Result was reviewed
- Which Warnings were acknowledged
- Which Command created the decision
- Whether another Version later became current

A derived status may exist for query performance.

The Approval Record remains authoritative history.

---

## 52. Approval History

Multiple Versions may have historical Approval Records.

Example:

```text
Blog v1 — Approved
Blog v2 — Approved
Blog v3 — Approved
```

Artifact Head determines which Approved Version is currently consumed:

```text
approved_version_id = blogver_003
```

Historical Approvals are not deleted or overwritten.

---

## 53. Warning Acknowledgement

Warning acknowledgement is separate from Approval.

Conceptual record:

```json
{
  "warning_acknowledgement_id": "warnack_001",
  "warning_id": "warning_001",
  "artifact_version_id": "researchver_003",

  "actor": {
    "actor_type": "user",
    "actor_id": "user_001"
  },

  "note": null,
  "created_at": "2026-07-26T18:29:00Z"
}
```

Acknowledgement binds to a specific Warning and Version.

It does not remove the original Warning.

---

## 54. Revision Proposal

Revision Proposal is an independent object.

Conceptual structure:

```json
{
  "revision_proposal_id": "proposal_001",

  "content_package_id": "cp_001",
  "target_artifact_type": "xiaohongshu",
  "target_working_copy_id": "xhswc_001",
  "target_revision": 18,

  "scope": {
    "page_id": "page_004",
    "field": "primary_message"
  },

  "base_value": "Original content",
  "proposed_value": "Proposed content",

  "reason": "Improve clarity for a non-technical audience.",

  "created_by_agent_run_id": "agentrun_012",
  "status": "pending",

  "created_at": "2026-07-26T18:00:00Z"
}
```

---

## 55. Revision Proposal Conflict

A Proposal targets one Working Copy Revision.

If the Working Copy advances and the target field changes, the Proposal may become:

```text
outdated
```

It must not silently overwrite newer edits.

Possible actions:

- Regenerate against the latest Revision
- Manually copy selected content
- Reject
- Compare with current value

---

## 56. Selective Apply Records

Applying a Proposal should record:

- Proposal ID
- Applied scope
- Previous Working Copy Revision
- New Working Copy Revision
- Actor
- Applied time

A partially applied Proposal remains:

```text
partially_applied
```

The exact apply-record structure remains an implementation decision.

---

## 57. Provenance as Typed Relationships

ContentOS does not use one unrestricted `provenance_json` as the only provenance model.

It uses shared provenance conventions and typed relationships.

Primary types include:

```text
Research Evidence Link
Blog Research Usage
Xiaohongshu Research Usage
Human Opinion Usage
Direct Quote Usage
Asset Provenance
Public Attribution
```

---

## 58. Research Evidence Link

The evidence chain is:

```text
Research Item
→ Source Evidence
→ Source Snapshot
```

A Research Evidence Link may include:

- Research Item ID
- Source Version ID
- Snapshot ID
- Evidence excerpt
- Stable source locator
- Direct-quote flag
- Evidence role
- Confidence or review state
- Public attribution data

---

## 59. Blog Research Usage

Blog provenance links a stable Blog content location to Research.

Example:

```text
Blog Section or Span
→ Research Item
→ Source Evidence
```

This supports:

- Source inspection
- Citation validation
- Impact analysis
- Fact tracing
- Content review

---

## 60. Xiaohongshu Research Usage

Xiaohongshu provenance links:

```text
Page ID
+
Field
→ Research Item
```

Example locator:

```json
{
  "target_type": "xiaohongshu_page_field",
  "page_id": "page_005",
  "field": "primary_message"
}
```

This supports field-level evidence access and revision tracking.

---

## 61. Human Opinion Usage

Human Opinion provenance links:

```text
Blog or Xiaohongshu field
→ Confirmed Opinion Statement
→ Raw Human Response
```

The system must distinguish:

- Confirmed Opinion
- Optional Editorial Expression
- Original user response
- AI Interpretation

First-person content may only use eligible confirmed objects.

---

## 62. Direct Quote Usage

Direct Quote provenance links:

```text
Published quote
→ Exact Source Evidence
→ Public Attribution
```

Direct Quote usage requires:

- Exact evidence
- Stable Source reference
- Public attribution rule
- Quote status
- Validation

If exact evidence is unavailable, the system should paraphrase rather than fabricate a quote.

---

## 63. Asset Provenance

Asset provenance links:

```text
Design page
→ Asset Version
→ Asset Origin
```

Origin may include:

- Generated asset
- User upload
- Source image
- System icon
- Screenshot
- Licensed asset
- Deterministic diagram

Asset Provenance should include rights and attribution metadata where available.

---

## 64. Stable Target Locator

Provenance should use stable content identifiers.

Blog example:

```json
{
  "target_type": "blog_section",
  "section_id": "section_004",
  "span_id": "span_012"
}
```

Xiaohongshu example:

```json
{
  "target_type": "xiaohongshu_page_field",
  "page_id": "page_005",
  "field": "primary_message"
}
```

Character ranges may be stored as supplemental data.

They must not be the only stable locator.

---

## 65. Stable Internal Content IDs

Typed Bodies should include stable internal IDs where provenance, Diff, migration, or selective updates require them.

Examples:

- `research_item_id`
- `question_id`
- `opinion_statement_id`
- `blog_section_id`
- `blog_span_id`
- `page_id`
- `supporting_point_id`
- `asset_slot_id`

These IDs persist across compatible edits where the semantic object remains the same.

---

## 66. PostgreSQL and Object Storage

The persistence architecture uses:

```text
PostgreSQL
+
Object Storage
```

PostgreSQL provides:

- Transactions
- Relationships
- Constraints
- Version pointers
- Queryability
- Workflow state
- Audit metadata

Object Storage provides:

- Binary-file storage
- Large snapshot storage
- Render output storage
- Asset storage
- Export archive storage

---

## 67. PostgreSQL Responsibilities

PostgreSQL stores:

- Content Packages
- Source References
- Structured Source metadata
- Working Copies
- Version metadata
- Text and structured Artifact Bodies
- Artifact Heads
- Research Items
- Xiaohongshu Pages
- Design-page metadata
- Dependency Edges
- Provenance Links
- Approval Records
- Warning Acknowledgements
- Revision Proposals
- Workflow Instances
- Workflow Nodes
- Commands
- Tasks
- Agent Run metadata
- Validation Results
- Asset metadata
- Render Job metadata
- Render Output metadata
- Export Manifest metadata
- Object references
- File hashes
- Lifecycle states
- Timestamps

Markdown and moderately sized structured text may remain in PostgreSQL.

---

## 68. Object Storage Responsibilities

Object Storage stores:

- Raw HTML snapshots
- Large source snapshots
- Uploaded `.md` and `.txt` originals
- Future PDF or audio originals
- AI-generated images
- User-uploaded images
- Screenshots
- Asset derivatives
- Preview files
- Rendered PNG files
- Export ZIP archives
- Large raw model outputs
- Debug bundles
- Binary manifests where applicable

---

## 69. Object Reference

Database records refer to stored files through Object References.

Conceptual structure:

```json
{
  "object_key": "assets/asset_004/v1/original.png",
  "mime_type": "image/png",
  "size_bytes": 482391,
  "sha256": "sha256:...",
  "storage_version": "1",
  "created_at": "2026-07-26T18:00:00Z"
}
```

The formal domain reference is an Object Key.

It is not a temporary public URL.

---

## 70. Temporary Download URLs

When the user downloads or previews a protected object, the system may generate a temporary access URL.

The temporary URL:

- Is not persisted as the permanent file reference
- May expire
- Is scoped to the user and object
- May be regenerated
- Does not alter historical domain records

This allows Object Storage providers to change without corrupting domain data.

---

## 71. Object Integrity

Important stored objects should retain:

- MIME type
- Byte size
- Hash
- Original filename where relevant
- Storage key
- Created time
- Derivative relationship
- Asset Version
- Availability state

Hash supports integrity and reproducibility checks.

---

## 72. Archive-first Lifecycle

Core ContentOS objects default to Archive rather than physical deletion.

Objects include:

- Content Package
- Artifact
- Working Copy
- Version
- Workflow Instance
- Asset
- Render Output
- Export Package

Archive preserves:

- Dependencies
- Approvals
- Provenance
- Workflow audit
- Version restore
- Historical render reproduction

---

## 73. Physical Deletion

Permanent deletion is not part of ordinary content workflow.

Physical deletion requires separate rules covering:

- User data request
- Privacy
- Retention
- Dependency impact
- Object Storage cleanup
- Audit retention
- Exported copies
- Provider logs

These rules will be formalized in Session-021.

---

## 74. API Design Principle

The public application API is not raw database CRUD.

ContentOS distinguishes:

```text
Query
Working Copy Edit
Version Creation
Workflow Command
Long-running Task
```

Clients must not directly mutate:

- Approval Records
- Immutable Versions
- Workflow Node states
- Artifact Heads
- Dependency Edges
- Promotion Results

These are modified through domain services and Commands.

---

## 75. Query API

Query APIs are side-effect free.

Examples:

```http
GET /v1/content-packages
GET /v1/content-packages/{content_package_id}
GET /v1/content-packages/{content_package_id}/overview
GET /v1/content-packages/{content_package_id}/sources
GET /v1/content-packages/{content_package_id}/research
GET /v1/blog-artifacts/{artifact_id}/versions
GET /v1/xiaohongshu-artifacts/{artifact_id}/working-copy
GET /v1/workflows/{workflow_instance_id}
GET /v1/workflows/{workflow_instance_id}/timeline
GET /v1/tasks/{task_id}
```

---

## 76. Application Query DTO

Query responses may aggregate several modules.

Example:

```http
GET /v1/content-packages/{content_package_id}/overview
```

Conceptual response:

```json
{
  "content_package": {},
  "workflow_status": {},
  "current_action": {},
  "branch_statuses": {},
  "attention_items": [],
  "active_tasks": [],
  "current_versions": {},
  "warnings": [],
  "recent_events": []
}
```

This is a read model.

It is not another domain source of truth.

---

## 77. Working Copy Edit API

Ordinary Draft edits use a Working Copy endpoint with Revision control.

Example:

```http
PATCH /v1/xiaohongshu-artifacts/{artifact_id}/working-copy
```

Request:

```json
{
  "expected_revision": 18,

  "changes": {
    "pages": [
      {
        "page_id": "page_004",
        "primary_message": "Updated content"
      }
    ]
  }
}
```

Response:

```json
{
  "working_copy_id": "xhswc_001",
  "revision": 19,
  "saved_at": "2026-07-26T18:20:00Z"
}
```

---

## 78. Patch Semantics

Working Copy edit Contracts should define explicit operations.

Possible approaches:

- Typed partial update
- JSON Merge Patch with Schema restrictions
- Domain-specific edit commands
- Field-level mutation DTOs

The exact approach remains an implementation decision.

Clients must not be able to patch:

- Artifact ID
- Approved Version pointer
- Dependency history
- Approval status
- Creation Actor
- Historical Version Body

---

## 79. Version Creation API

Creating an immutable Version is an explicit operation.

Example:

```http
POST /v1/xiaohongshu-artifacts/{artifact_id}/versions
```

Request:

```json
{
  "expected_working_copy_revision": 19,
  "parent_version_id": "xhsver_002"
}
```

Response:

```json
{
  "version_id": "xhsver_003",
  "version_number": 3,
  "validation_status": "pending",
  "created_at": "2026-07-26T18:22:00Z"
}
```

The server copies the current Working Copy into an immutable Version.

---

## 80. Immutable Version API

Immutable Versions do not expose a general update endpoint.

Rejected:

```http
PATCH /v1/xiaohongshu-versions/xhsver_003
```

To change content:

```text
Open or update Working Copy
→ Create new Version
```

Metadata such as derived status may be updated through domain services without changing immutable Body or dependency identity.

---

## 81. Workflow Command API

State-changing workflow actions use structured Commands.

Example:

```http
POST /v1/workflows/{workflow_instance_id}/commands
```

Request:

```json
{
  "command_type": "ApproveResearchVersion",

  "target": {
    "research_result_version_id": "researchver_003"
  },

  "expected_revision": 12
}
```

Response:

```json
{
  "command_id": "cmd_001",
  "status": "succeeded",
  "workflow_revision": 13,

  "created_event_ids": [
    "event_021"
  ],

  "scheduled_task_ids": [
    "task_031",
    "task_032"
  ]
}
```

---

## 82. Command Operations

Operations requiring structured Commands include:

- Approve Source Version
- Approve Research Version
- Confirm Human Opinion Version
- Select Research-based Mode
- Approve Blog Version
- Approve Xiaohongshu Version
- Approve Design Version
- Start or retry generation
- Pause Workflow
- Resume Workflow
- Cancel Workflow
- Skip optional branch
- Acknowledge Warning
- Select Final Render Output
- Create Export Package
- Archive Package

Clients must not directly patch equivalent internal states.

---

## 83. Working Copy Edits versus Commands

Working Copy edits are frequent, reversible Draft mutations.

Commands represent meaningful domain decisions or workflow transitions.

Examples:

```text
Edit Blog paragraph
→ Working Copy API
```

```text
Approve Blog Version 3
→ Workflow Command
```

```text
Change XHS Page 4 heading
→ Working Copy API
```

```text
Skip Human Opinion and use Research-based Mode
→ Workflow Command
```

---

## 84. Synchronous Operations

Operations expected to complete quickly may return synchronously.

Examples:

- Create Content Package
- Save Working Copy
- Create immutable Version
- Submit Approval Command
- Pause Workflow
- Resume Workflow
- Select Final Render Output
- Archive Package

Typical responses:

```text
200 OK
201 Created
```

A synchronous Command may also schedule asynchronous Tasks and return their IDs.

---

## 85. Long-running Operations

Long-running operations include:

- Source capture
- Source extraction
- Research generation
- Blog generation
- Xiaohongshu generation
- Design generation
- Asset generation
- Final Render
- Large Export creation

These operations use asynchronous APIs.

---

## 86. Asynchronous Response

A long-running request returns:

```http
202 Accepted
```

Conceptual response:

```json
{
  "command_id": "cmd_021",
  "status": "accepted",

  "task_id": "task_042",
  "workflow_node_id": "blog_generation",

  "status_url": "/v1/tasks/task_042"
}
```

The original HTTP request does not remain open until generation completes.

---

## 87. Task Status Query

Example:

```http
GET /v1/tasks/task_042
```

Response:

```json
{
  "task_id": "task_042",
  "status": "running",

  "phase": "validating",

  "attempts": 1,

  "result": null,
  "failure": null,

  "updated_at": "2026-07-26T18:30:00Z"
}
```

The exact real-time delivery technology is deferred.

Possible implementations include:

- Polling
- Server-sent Events
- WebSocket
- In-app notifications

---

## 88. HTTP Status and Task Status

HTTP request status and domain Task status remain separate.

Example:

```http
GET /v1/tasks/task_042
→ 200 OK
```

Response:

```json
{
  "task_id": "task_042",
  "status": "failed",
  "failure": {
    "classification": "validation_failure",
    "retryable": false
  }
}
```

The API request succeeded even though the underlying Task failed.

---

## 89. Idempotency

Creation and Command APIs support idempotency.

Recommended header:

```http
Idempotency-Key: <opaque-value>
```

Applicable operations include:

- Create Content Package
- Create Version
- Submit Workflow Command
- Start Agent generation
- Start Render
- Create Export Package
- Upload or register Asset where duplicate handling matters

---

## 90. Idempotency Behavior

For the same Idempotency Key and equivalent request:

- The first result is returned
- No duplicate resource is created
- No duplicate Task is started
- No duplicate Approval is recorded
- No duplicate Export is generated

A materially different request using the same Key returns an idempotency conflict.

---

## 91. Idempotency Record

Conceptually, the system may retain:

- Idempotency Key
- Request hash
- Actor
- Endpoint or Command type
- Response reference
- Created time
- Expiration or retention policy

The exact storage mechanism remains an implementation decision.

---

## 92. Optimistic Concurrency

Working Copies, Workflow Instances, and other mutable coordination records use optimistic concurrency.

Requests include:

```json
{
  "expected_revision": 18
}
```

or an equivalent HTTP conditional header.

The MVP may standardize on request-body `expected_revision`.

---

## 93. Revision Conflict

If the current Revision differs, the server returns:

```http
409 Conflict
```

Conceptual response:

```json
{
  "error": {
    "code": "revision_conflict",
    "message": "The working copy has changed.",
    "details": {
      "expected_revision": 18,
      "current_revision": 19
    },
    "retryable": false,
    "correlation_id": "corr_001"
  }
}
```

The client must refresh or merge through an explicit flow.

---

## 94. State Conflict

`409 Conflict` may also represent:

- Target Version is no longer the review candidate
- Workflow is paused
- Workflow is cancelled
- Equivalent Task already exists
- Command already executed
- Artifact Head changed
- Selected output changed concurrently

Error codes must distinguish these conditions.

---

## 95. Domain Validation Error

A request may be structurally valid but violate domain rules.

Example:

```text
Approve Research Version with Blocking Errors
```

Recommended response:

```http
422 Unprocessable Entity
```

with a structured error body.

---

## 96. Unified Error Contract

All API errors follow one structure.

```json
{
  "error": {
    "code": "blocking_validation_error",
    "message": "Research Version 3 cannot be approved.",

    "details": {
      "artifact_version_id": "researchver_003",
      "blocking_error_ids": [
        "validation_issue_004"
      ]
    },

    "retryable": false,
    "correlation_id": "corr_001",

    "available_actions": [
      {
        "action": "open_research_item",
        "target_id": "researchitem_007"
      }
    ]
  }
}
```

---

## 97. Error Contract Fields

The Error Contract includes:

- Stable error code
- User-readable message
- Structured details
- Retryable flag
- Correlation ID
- Optional available actions
- Optional affected object
- Optional failure classification

Internal stack traces are not returned to normal clients.

---

## 98. HTTP Status Convention

Recommended status semantics:

```text
200 OK
Successful query or synchronous command

201 Created
Resource created

202 Accepted
Asynchronous work accepted

400 Bad Request
Malformed request or invalid syntax

401 Unauthorized
Authentication required

403 Forbidden
Actor lacks permission

404 Not Found
Resource unavailable or inaccessible

409 Conflict
Revision, idempotency, state, or concurrency conflict

422 Unprocessable Entity
Request is valid but violates domain rules

429 Too Many Requests
Rate or quota limit

500 Internal Server Error
Unexpected server failure

503 Service Unavailable
Temporary service failure
```

Security behavior will be expanded in Session-021.

---

## 99. Cursor Pagination

Large or continuously growing lists use Cursor Pagination.

Examples:

- Workflow Events
- Agent Runs
- Versions
- Content Packages
- Tasks
- Export history

Request:

```http
GET /v1/content-packages?limit=20&cursor=...
```

Response:

```json
{
  "items": [],
  "page": {
    "next_cursor": "...",
    "has_more": true
  }
}
```

---

## 100. Offset Pagination

High Offset pagination is not the default for growing event-like datasets.

Rejected default:

```text
?page=5000
```

Small static option lists may use simpler pagination or no pagination.

The API convention should choose pagination by data behavior.

---

## 101. Filtering

List APIs expose only explicit filters.

Possible filters:

```text
lifecycle_status
needs_attention
requested_output
content_mode
created_after
updated_after
artifact_state
workflow_state
```

Clients cannot submit arbitrary database columns or raw query expressions.

---

## 102. Sorting

Supported sort fields are explicitly enumerated.

Possible examples:

```text
updated_at
created_at
title
version_number
```

The server validates sort fields and direction.

Database implementation details remain hidden.

---

## 103. API DTO Boundary

API DTOs remain separate from:

- ORM Entities
- Database rows
- Internal domain service objects
- Provider-specific metadata
- Internal security fields

Conceptual flow:

```text
Database Model
→ Domain Model
→ Application Query or Command Result
→ API DTO
```

---

## 104. Why ORM Entities Are Not API Contracts

Directly serializing ORM Entities would risk:

- Leaking internal fields
- Breaking API after schema changes
- Exposing foreign-key structure
- Coupling frontend to database design
- Returning security-sensitive values
- Preventing aggregate queries
- Making deprecation difficult

API Schema evolves independently.

---

## 105. API Versioning

The API uses a Major Version prefix:

```text
/v1/
```

API Version governs:

- Endpoint structure
- Request DTO
- Response DTO
- Error semantics
- Pagination conventions
- Authentication behavior

Breaking API changes require a new Major Version.

---

## 106. Artifact Schema Versioning

Artifact Bodies and internal Contracts use independent Schema Versions.

Examples:

```text
contentos.blog-body/markdown-v1
contentos.xhs-artifact/v1
contentos.design-spec/v1
contentos.render-output/v1
contentos.workflow-command/v1
```

Schema Version governs the interpretation of stored domain content.

---

## 107. API Version versus Schema Version

API and Artifact Schema solve different problems.

```text
API Version
→ How clients communicate with ContentOS
```

```text
Artifact Schema Version
→ How stored or exported domain objects are interpreted
```

API v1 may read several historical Artifact Schema Versions.

Responses must preserve or expose the relevant Schema Version.

---

## 108. Time Convention

All formal timestamps use:

```text
ISO 8601
UTC
```

Example:

```text
2026-07-26T18:30:00Z
```

The UI converts timestamps to the user’s local timezone.

Database storage must not rely on ambiguous local timestamps.

---

## 109. Language and Locale

Formal content objects should record language and locale explicitly.

Example:

```json
{
  "language": "zh",
  "locale": "zh-CN"
}
```

Possible uses include:

- Prompt selection
- Validation
- Typography
- Render Profile
- Tokenization estimates
- UI labels
- Export behavior

Language should not be inferred permanently from Body text alone.

---

## 110. Domain Events

Important domain changes produce structured Domain Events.

Examples:

```text
ContentPackageCreated
NormalizedSourceVersionApproved
ResearchVersionApproved
HumanOpinionVersionConfirmed
BlogVersionApproved
XiaohongshuVersionApproved
DesignVersionApproved
RenderOutputSucceeded
ExportPackageCreated
ArtifactBecameOutdated
```

Domain Events support downstream coordination.

---

## 111. Domain Event Uses

Domain Events may trigger:

- Workflow progression
- Dependency propagation
- Task creation
- Notification creation
- Overview Projection update
- Search-index update
- Analytics event
- Current Action recalculation
- Historical timeline entry

The consuming mechanism remains implementation-specific.

---

## 112. Transactional Outbox

Critical domain state changes and their Outbox Events should be stored in the same PostgreSQL transaction.

Example:

```text
Create Approval Record
+
Update Artifact Head
+
Insert Outbox Event
→ Commit together
```

A Dispatcher later processes the Outbox Event.

---

## 113. Why Outbox Is Required

Without a transactional Outbox:

```text
Approval transaction succeeds
→ Process crashes
→ Workflow event is never sent
```

The Artifact becomes approved, but downstream generation never begins.

The Outbox pattern avoids this state divergence.

---

## 114. Outbox Event

Conceptual structure:

```json
{
  "outbox_event_id": "outbox_001",
  "event_type": "ResearchVersionApproved",

  "aggregate_type": "research_result",
  "aggregate_id": "research_001",

  "payload": {
    "research_result_version_id": "researchver_003",
    "content_package_id": "cp_001"
  },

  "status": "pending",
  "created_at": "2026-07-26T18:30:00Z"
}
```

The exact Dispatcher, Queue, and retry mechanism are deferred to Session-022.

---

## 115. Workflow Event versus Domain Event

Domain Event and Workflow Event may overlap but serve different purposes.

### Domain Event

Represents a meaningful change in a domain module.

Example:

```text
ResearchVersionApproved
```

### Workflow Event

Represents user-visible workflow history and orchestration activity.

Example:

```text
research_version_approved
blog_generation_started
```

One Domain Event may cause one or more Workflow Events.

The MVP may share infrastructure while retaining conceptual distinction.

---

## 116. Query Projection

Complex UI screens use Query Projections or Application Queries.

Examples:

```text
Package Overview Projection
Dashboard Needs-attention Projection
Workflow Timeline Projection
Current Action Projection
Artifact Review Summary
```

These read models aggregate authoritative domain data.

They do not become editable sources of truth.

---

## 117. Projection Consistency

Some Projection data may update asynchronously.

Examples:

- Dashboard counts
- Recent activity
- Search results
- Timeline summaries
- Notification badges

The underlying Approval, Version, Artifact Head, and Workflow state remain authoritative.

The UI may briefly tolerate eventual consistency for derived summaries.

---

## 118. Strong-consistency Operations

Strong consistency is required for:

- Working Copy revision update
- Immutable Version creation
- Artifact Head update
- Approval creation
- Command idempotency
- Task creation
- Dependency Edge creation
- Selected Final Render Output
- Export eligibility
- Warning acknowledgement
- Workflow revision update

These operations should use transactions and concurrency checks.

---

## 119. Eventual-consistency Operations

Eventual consistency is acceptable for:

- Dashboard statistics
- Search indexing
- Notifications
- Timeline projections
- Analytics
- Recent-activity summaries
- Cost reports

The user-facing product must still clearly reflect authoritative decisions where necessary.

---

## 120. Conceptual Entity Relationship

```text
ContentPackage
│
├── SourceReference
│   ├── RawSnapshot
│   ├── ExtractedContent
│   └── NormalizedSourceArtifact
│       ├── WorkingCopy
│       ├── ArtifactHead
│       └── Versions
│
├── ResearchResultArtifact
│   ├── WorkingCopy
│   ├── ArtifactHead
│   ├── Versions
│   ├── ResearchItems
│   └── EvidenceLinks
│
├── HumanOpinionArtifact
│   ├── Questions
│   ├── RawResponses
│   ├── Interpretations
│   ├── WorkingCopy
│   ├── ArtifactHead
│   └── Versions
│
├── BlogArtifact
│   ├── WorkingCopy
│   ├── ArtifactHead
│   ├── Versions
│   ├── RevisionProposals
│   └── ProvenanceUsages
│
├── XiaohongshuArtifact
│   ├── WorkingCopy
│   ├── ArtifactHead
│   ├── Versions
│   ├── Pages
│   ├── RevisionProposals
│   └── ProvenanceUsages
│
├── DesignArtifact
│   ├── WorkingCopy
│   ├── ArtifactHead
│   ├── Versions
│   ├── Pages
│   └── AssetUsages
│
├── RenderJobs
│   ├── Attempts
│   └── RenderOutputs
│
├── ExportPackages
│
└── WorkflowInstances
    ├── Nodes
    ├── Commands
    ├── Tasks
    │   └── AgentRuns
    ├── Approvals
    ├── WarningAcknowledgements
    └── WorkflowEvents
```

Cross-object relationships use:

```text
Dependency Edges
Provenance Links
Artifact Heads
Object References
Domain Events
```

---

## 121. Example: Editing and Approval

```text
User edits Blog Working Copy revision 17
        ↓
PATCH with expected_revision = 17
        ↓
Working Copy becomes revision 18
        ↓
User creates Blog Version
        ↓
Blog Version 3 created from revision 18
        ↓
Validation runs
        ↓
User submits ApproveBlogVersion Command
        ↓
Executor checks Workflow revision and Validation
        ↓
Approval Record created
        ↓
Blog Artifact Head approved_version_id = Blog Version 3
        ↓
Outbox Event inserted
        ↓
Domain Event dispatched
```

---

## 122. Example: Upstream Change

```text
Research v2 approved
        ↓
Blog v3 generated from Research v2
        ↓
Blog v3 approved
        ↓
Research v3 later approved
```

The system performs:

```text
Create Approval for Research v3
Update Research Artifact Head
Insert Domain Event
Query dependency graph
Mark Blog v3 outdated
Create Workflow Event
Update Current Action Projection
Offer “Regenerate Blog from Research v3”
```

The system does not:

```text
Delete Blog v3
Rewrite Blog v3 dependency
Pretend Blog v3 used Research v3
Modify Blog v3 Body
```

---

## 123. Example: Revision Conflict

```text
User opens XHS Working Copy revision 18
        ↓
Another edit saves revision 19
        ↓
First browser submits edit expecting revision 18
```

Response:

```http
409 Conflict
```

The first browser must refresh or perform an explicit merge.

The server must not silently overwrite revision 19.

---

## 124. Example: Repeated Approval Request

```text
Approve Research v3 request sent
        ↓
Network timeout
        ↓
Client repeats same Idempotency Key
```

The server returns the original Command result.

It does not create:

- A second Approval
- Duplicate Blog Task
- Duplicate Xiaohongshu Task
- Duplicate workflow progression

---

## 125. Example: Async Generation

```text
User requests Blog generation
        ↓
POST Workflow Command
        ↓
202 Accepted
        ↓
Task created
        ↓
Agent Run begins
        ↓
Output validated and promoted
        ↓
Workflow Event and UI projection update
```

The original HTTP request is not held open for the entire generation.

---

## 126. MVP Scope

### Included

- Modular domain data model
- Content Package aggregate entry point
- Stable Entity IDs
- Immutable Version IDs
- Working Copy IDs and revisions
- Execution IDs
- Append-only record IDs
- Opaque identifiers
- Shared Version metadata
- Artifact Heads
- Typed Artifact Contracts
- Schema-versioned JSON Bodies
- Structured Dependency Graph
- Independent Approval Records
- Warning Acknowledgement records
- Revision Proposals
- Typed Provenance Links
- Stable content locators
- PostgreSQL
- Object Storage
- Object References
- Archive-first lifecycle
- Query APIs
- Working Copy edit APIs
- Version-creation APIs
- Workflow Command APIs
- Asynchronous long-running operations
- Idempotency
- Optimistic concurrency
- Unified errors
- Cursor pagination
- API Versioning
- Artifact Schema Versioning
- Domain Events
- Transactional Outbox
- Application Query Projections

### Deferred

- Final physical table design
- ORM selection
- Database-index design
- Database-sharding strategy
- Multiple service databases
- Event-sourced persistence
- Graph database
- Dedicated vector database
- Public external API program
- GraphQL
- Offline-first synchronization
- Multi-user conflict-free editing
- Permanent-deletion implementation
- Cross-region storage replication
- Full data warehouse
- Final Queue and Dispatcher technology

---

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

---

## 128. Rejected or Deferred Approaches

### Giant Content Package Row

Rejected because it would make transactions, concurrency, and module ownership too broad.

### Universal Artifact JSON Table

Rejected because it would weaken type safety, migrations, queries, and domain rules.

### Every Field as a Separate Table

Rejected because it would create unnecessary relational complexity for evolving structured Bodies.

### One Generic Current Version

Rejected because latest, review-candidate, approved, rendered, and published concepts differ.

### Mutable `is_current` on Historical Versions

Rejected because current-state meaning belongs in explicit pointer records.

### Version Update through PATCH

Rejected because immutable Versions are historical snapshots.

### Approval as Boolean

Rejected because Approval needs Actor, target Version, Validation, Warning, Command, and time.

### Dependencies Hidden Only in Generation Metadata

Rejected because impact analysis and stale propagation require queryable relationships.

### Provenance as Unrestricted JSON

Rejected because content tracing requires typed relationships and stable locators.

### Character Range as the Only Locator

Rejected because text edits make raw offsets unstable.

### Binary Files Stored Directly in Main Domain Rows

Rejected because large files and rendered assets belong in Object Storage.

### Temporary Download URL as Permanent Reference

Rejected because URLs expire and couple the domain to a storage provider.

### Physical Delete as Normal User Action

Rejected because historical dependencies and Approvals must be preserved.

### Raw Database CRUD API

Rejected because clients must not directly mutate workflow and immutable objects.

### ORM Entity as Public DTO

Rejected because persistence and API contracts evolve independently.

### Long-held HTTP Connection for Agent Generation

Rejected because long-running work requires asynchronous Task semantics.

### Duplicate Requests Starting Duplicate Work

Rejected through idempotency.

### Last-write-wins Working Copy Updates

Rejected because Revision checks are required.

### Offset-only Pagination

Rejected for growing event and Version histories.

### Microservice Database per Module in MVP

Deferred because a modular monolith and shared PostgreSQL provide lower implementation complexity.

### Complete Event Sourcing

Deferred because normal state models plus Workflow Events and Transactional Outbox provide sufficient MVP reliability.

---

## 129. Open Questions

The following questions remain unresolved:

1. Which opaque ID format will be selected?
2. Should IDs include readable type prefixes?
3. Will Version Numbers be generated through database sequences or application logic?
4. How should concurrent Version creation be serialized?
5. Should Version Number gaps be allowed?
6. Which fields belong in the Content Package row?
7. Should requested outputs use an array, relation table, or bit field?
8. How should Content Mode changes be versioned?
9. Can one Package have multiple active Workflow Instances?
10. Which current references belong at Package level versus Artifact Head?
11. Should Artifact Head be one shared generic table or type-specific tables?
12. How should Artifact Head revisions work?
13. Does every Artifact always have one Working Copy?
14. Can a historical Version be reviewed without becoming a review candidate?
15. Can two Working Copies exist for one Artifact in the single-user MVP?
16. How should restore-as-new-Working-Copy work internally?
17. Which Artifact Bodies should use JSONB?
18. Which Artifact fields require normalized relational columns?
19. Should Xiaohongshu Pages be separate rows or embedded JSON?
20. Should Blog Sections have separate relational records?
21. How should Markdown span IDs be preserved through editing?
22. How should stable IDs survive AI regeneration?
23. How should page splits and merges affect stable Page IDs?
24. Which dependency roles belong in the first enum?
25. Should Dependency Edge support optional dependencies?
26. How should dependency cycles be prevented?
27. Which objects may legally depend on Working Copies?
28. Should Preview Render depend on a Working Copy Revision rather than a Version?
29. How should Preview dependencies be retained?
30. Should dependency state be calculated dynamically or persisted?
31. Which stale/outdated states belong on Artifact Version versus Artifact Head?
32. How should historical-validity state be represented?
33. Should Approval support `rejected` decisions?
34. Should Version rejection be stored as Approval-like review decision?
35. Can an approved Version be explicitly revoked?
36. What state results from revoked Approval?
37. Should Warning Acknowledgements expire after dependency changes?
38. Can one Approval reference several Warning Acknowledgements?
39. Should Approval notes be supported?
40. Should Revision Proposals store complete values or patches?
41. How should large Blog Proposal diffs be stored?
42. Should applied Proposal scopes create independent Apply records?
43. How should partially applied Proposals be represented?
44. Which Provenance Usage types belong in MVP?
45. How should Blog spans be located reliably in Markdown?
46. Should Provenance be attached to AST nodes?
47. How should user-edited text preserve existing Provenance?
48. When should Provenance be invalidated after editing?
49. Can users manually relink Provenance?
50. Should public attribution be stored separately from internal provenance?
51. Which text sizes remain in PostgreSQL?
52. At what threshold should raw output move to Object Storage?
53. Should Raw Snapshot HTML be compressed?
54. Which Object Storage naming convention should be used?
55. How should object-key collision be prevented?
56. Should Object References be shared across duplicate files?
57. How should asset deduplication work?
58. Which hash algorithm will be used?
59. How should missing Object Storage files be detected?
60. What retention applies to Preview files?
61. Should Export ZIP be created eagerly or on demand?
62. How should Object Storage lifecycle rules be configured?
63. Which archive states are required?
64. Should archived Working Copies remain editable?
65. Which objects can be unarchived?
66. How should permanent deletion requests traverse dependencies?
67. Which Query DTOs are required for the MVP?
68. Should REST resources use plural nouns consistently?
69. Should Commands share one endpoint or use typed endpoints?
70. How should Command Schemas be discovered by the frontend?
71. Should Working Copy updates use JSON Patch?
72. Should each editor use a type-specific mutation endpoint?
73. How should autosave batching work?
74. Should Working Copy API return a server-generated Diff?
75. How should large edit conflicts be shown?
76. Should Version creation automatically begin Validation?
77. Can Version creation fail because Validation fails?
78. Should invalid Versions be stored?
79. Which Commands execute synchronously?
80. Which Commands always create Tasks?
81. How long are idempotency keys retained?
82. How should idempotency scope relate to Actor?
83. What happens when the same key is reused with a different request?
84. Should API use `If-Match` instead of request-body revision?
85. Which mutable objects require revisions beyond Working Copy and Workflow?
86. How should Artifact Head updates expose conflicts?
87. Which error codes belong in API v1?
88. How should errors be localized?
89. Should user-facing and developer-facing messages be separate fields?
90. Which APIs require Cursor Pagination immediately?
91. How should cursors be signed?
92. Should cursor ordering be stable across updates?
93. Which filters belong on the Dashboard query?
94. How should archived items affect pagination?
95. How should API deprecation be communicated?
96. How should old Artifact Schema Versions be migrated?
97. Should migration create new Versions or transform stored data?
98. Which Domain Events are required in MVP?
99. Should Workflow Event and Domain Event share one persistence table?
100. Which operations require Transactional Outbox?
101. How are Outbox Events retried?
102. How are duplicate Outbox deliveries handled?
103. How long are processed Outbox Events retained?
104. Should Query Projections use database views, materialized tables, or application queries?
105. Which Projections require eventual consistency?
106. How will the application detect projection lag?
107. Which fields require database uniqueness constraints?
108. Which foreign-key constraints should be strict?
109. How should archived dependencies affect foreign keys?
110. Which database operations require row locks?
111. How should database migrations preserve immutable history?
112. How will test fixtures generate complete dependency graphs?
113. How should imported external Artifacts be identified?
114. Can Artifact IDs be preserved during import?
115. How should duplicate imports be detected?
116. How should future multi-user ownership affect all entities?
117. Which records require tenant or owner fields now?
118. Should single-user MVP still include `owner_user_id`?
119. How should user data export reconstruct files and metadata?
120. Which API Contracts become public documentation?

---

## 130. Documentation Updates

Create:

```text
docs/sessions/session-019.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-160
DEC-161
DEC-162
DEC-163
DEC-164
DEC-165
DEC-166
DEC-167
DEC-168
DEC-169
DEC-170
DEC-171
DEC-172
DEC-173
DEC-174
DEC-175
DEC-176
```

Future documents to create:

```text
docs/architecture/domain-model.md
docs/architecture/content-package-model.md
docs/architecture/artifact-versioning.md
docs/architecture/artifact-head.md
docs/architecture/dependency-graph.md
docs/architecture/provenance-model.md
docs/architecture/approval-model.md
docs/architecture/revision-proposal-model.md
docs/architecture/persistence-boundaries.md
docs/architecture/object-storage-contract.md
docs/architecture/domain-events.md
docs/architecture/transactional-outbox.md
docs/api/api-conventions.md
docs/api/query-api.md
docs/api/working-copy-api.md
docs/api/version-api.md
docs/api/workflow-command-api.md
docs/api/error-contract.md
docs/api/pagination.md
```

Possible future Schema files:

```text
schemas/content-package-v1.json
schemas/artifact-version-metadata-v1.json
schemas/artifact-head-v1.json
schemas/dependency-edge-v1.json
schemas/approval-v1.json
schemas/warning-acknowledgement-v1.json
schemas/revision-proposal-v1.json
schemas/provenance-usage-v1.json
schemas/object-reference-v1.json
schemas/api-error-v1.json
schemas/cursor-page-v1.json
schemas/async-task-response-v1.json
schemas/outbox-event-v1.json
```

These paths remain architectural suggestions rather than final implementation decisions.

---

## 131. Documentation Sync Checklist

- [x] DEC-160 confirmed
- [x] DEC-161 confirmed
- [x] DEC-162 confirmed
- [x] DEC-163 confirmed
- [x] DEC-164 confirmed
- [x] DEC-165 confirmed
- [x] DEC-166 confirmed
- [x] DEC-167 confirmed
- [x] DEC-168 confirmed
- [x] DEC-169 confirmed
- [x] DEC-170 confirmed
- [x] DEC-171 confirmed
- [x] DEC-172 confirmed
- [x] DEC-173 confirmed
- [x] DEC-174 confirmed
- [x] DEC-175 confirmed
- [x] DEC-176 confirmed
- [ ] Save this document as `docs/sessions/session-019.md`
- [ ] Add DEC-160 through DEC-176 to `docs/decisions/decisions.md`
- [ ] Define domain-module ownership
- [ ] Define Content Package Contract
- [ ] Define ID categories
- [ ] Select opaque ID format
- [ ] Define shared Version metadata
- [ ] Define Working Copy Contract
- [ ] Define Artifact Head Contract
- [ ] Define typed Artifact Bodies
- [ ] Define Dependency Edge Contract
- [ ] Define dependency-role enum
- [ ] Define stale and outdated propagation
- [ ] Define Approval Contract
- [ ] Define Warning Acknowledgement Contract
- [ ] Define Revision Proposal Contract
- [ ] Define Provenance Usage Contracts
- [ ] Define stable content-locator rules
- [ ] Define Object Reference Contract
- [ ] Define PostgreSQL and Object Storage boundaries
- [ ] Define Archive lifecycle
- [ ] Define Query API conventions
- [ ] Define Working Copy mutation API
- [ ] Define Version-creation API
- [ ] Define Workflow Command API
- [ ] Define async Task response
- [ ] Define Idempotency behavior
- [ ] Define optimistic-concurrency behavior
- [ ] Define API Error Contract
- [ ] Define Cursor Pagination
- [ ] Define API and Artifact Schema versioning
- [ ] Define Domain Event catalog
- [ ] Define Transactional Outbox
- [ ] Define Package Overview Projection
- [ ] Review AGENTS.md after data and API Contracts become authoritative

---

## 132. Session Summary

ContentOS uses a modular domain data model.

Content Package is the aggregate entry point for one content project, but it is not a giant JSON object or a universal transaction boundary.

The system distinguishes:

```text
Stable Entity ID
Immutable Version ID
Working Copy ID
Working Copy Revision
Execution ID
Append-only Record ID
```

Formal IDs use opaque identifiers.

User-visible numbers remain display-only values.

Important Artifact families follow:

```text
Stable Artifact
├── Mutable Working Copy
├── Immutable Versions
└── Artifact Head
```

Artifact Head separately identifies:

```text
Working Copy
Latest Version
Review Candidate Version
Approved Version
```

Historical Versions remain immutable.

ContentOS does not use one universal Artifact JSON table.

Artifact types retain type-specific Schemas and domain rules.

Schema-versioned JSONB may be used for typed Bodies and flexible metadata.

Version Dependency Graph is first-class structured data.

Downstream Versions reference exact upstream Versions.

Dependencies are never silently rewritten when newer upstream Versions appear.

Approval is an independent append-only record tied to one immutable Version.

Warning Acknowledgement and Revision Proposal are also independent records.

Provenance uses typed relationships and stable content locators such as:

```text
Research Item ID
Blog Section ID
Page ID
Field
Opinion Statement ID
Asset Slot ID
```

PostgreSQL stores structured domain data, relationships, text Bodies, Versions, workflow state, and file references.

Object Storage stores raw snapshots, uploaded files, images, rendered outputs, and export archives.

Formal objects reference stable Object Keys rather than temporary download URLs.

Core objects default to Archive instead of physical deletion.

ContentOS APIs distinguish:

```text
Query
Working Copy Edit
Version Creation
Workflow Command
Asynchronous Task
```

Clients cannot directly patch Approval, Artifact Head, Workflow Node, or immutable Versions.

Critical creation and Command APIs support idempotency.

Mutable Working Copies and Workflow state use optimistic-concurrency revisions.

Long-running AI and rendering operations return `202 Accepted` and expose Task status.

API v1 uses:

- Stable errors
- Structured details
- Correlation IDs
- Cursor Pagination
- UTC ISO 8601 timestamps
- Independent Artifact Schema Versions

Important domain changes use a Transactional Outbox so that workflow progression, dependency propagation, notification, and read-model updates cannot be silently lost after a successful database transaction.