# ContentOS Session-017

**Status:** Formalized  
**Session Type:** Workflow Orchestration, State Machine, and Failure Recovery  
**Topic:** Chief Editor, Workflow Template, Tasks, Agent Runs, Commands, Human Gates, and Execution Recovery  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the full ContentOS production chain:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

Each stage already contains its own domain rules:

- Mutable Working Copy
- Immutable Versions
- Validation Gate
- Human Approval
- Dependency tracking
- `stale` or `outdated` propagation
- Structured Agent input and output
- `success`, `partial`, and `blocked` results
- Explicit provenance
- Deterministic rendering and export rules

However, the system still required a unified orchestration model.

The unresolved questions were:

1. What exactly is Chief Editor?
2. Which decisions may be made by an LLM Planner?
3. Which state changes must remain deterministic?
4. How should Workflow, Task, Agent Run, and Artifact Version differ?
5. How should Artifact state and execution state be separated?
6. Which stages may continue automatically?
7. Which stages require user approval?
8. How should Blog and Xiaohongshu branches run in parallel?
9. How should workflows pause, resume, cancel, and skip optional steps?
10. What happens when an upstream Version changes during an Agent Run?
11. How should retries, repairs, and failures be classified?
12. How should repeated Commands and callbacks avoid duplicate work?
13. How should Chat instructions become reliable system operations?
14. How should workflow history and audit events be preserved?

This Session defines the workflow-orchestration architecture.

---

## 2. Chief Editor Positioning

Chief Editor is the ContentOS workflow coordination layer.

It is not a super-Agent with unrestricted authority over all content.

Its purpose is:

> Determine the next legal workflow action based on current Artifact Versions, approvals, validation results, user instructions, workflow policy, and dependency state.

Chief Editor is responsible for:

- Creating Workflow Instances
- Reading Workflow Templates
- Evaluating prerequisites
- Creating Tasks
- Scheduling Agent Runs
- Scheduling deterministic services
- Waiting at Human Gates
- Handling branch execution
- Handling retry and repair decisions
- Propagating stale and outdated states
- Pausing, resuming, and cancelling workflows
- Suggesting the next action
- Recording workflow events
- Explaining blocked states to the user

Chief Editor is not responsible for:

- Writing Blog content
- Creating Xiaohongshu page copy
- Editing Research
- Confirming Human Opinion
- Approving Artifacts on behalf of the user
- Bypassing Validation Gates
- Ignoring Blocking Errors
- Inventing new workflow stages
- Directly mutating state from natural-language output
- Publishing content without explicit permission

---

## 3. Chief Editor Architecture

Chief Editor consists of three distinct capabilities:

```text
Planner
+
Deterministic Executor
+
Workflow Policy
```

These capabilities may belong to one product surface, but they remain separate architectural responsibilities.

---

## 4. Planner

Planner may use an LLM.

It is responsible for:

- Understanding the user’s current goal
- Interpreting natural-language requests
- Explaining the workflow state
- Recommending the next legal step
- Suggesting repair options
- Suggesting whether to retry or return upstream
- Selecting requested output branches
- Generating structured Command Proposals
- Explaining why a workflow is blocked

Planner output is advisory until validated by the Executor.

Planner must not:

- Modify database state directly
- Approve a Version
- Create an Artifact Version directly
- Skip a required Gate
- Suppress a Blocking Error
- Start arbitrary Agents
- Construct an unrestricted workflow graph
- Treat conversational intent as already executed

Example:

```text
User:
“这份 Research 没问题，继续生成博客和小红书。”

Planner Proposal:
1. ApproveResearchVersion(researchver_003)
2. ContinueWorkflow(workflow_001)
```

The Proposal still requires deterministic validation and execution.

---

## 5. Deterministic Executor

Executor is an LLM-free state-transition layer.

It is responsible for:

- Receiving structured Commands
- Validating Command Schema
- Checking user authority
- Checking target Version
- Checking Expected Revision
- Checking workflow prerequisites
- Enforcing Workflow Policy
- Applying idempotency
- Acquiring a short-lived workflow lock
- Creating Tasks
- Scheduling Agent Runs
- Updating Node states
- Promoting valid Artifact outputs
- Recording Workflow Events
- Returning structured execution results

Only the Executor may perform authoritative state transitions.

The Executor must reject:

- Invalid state transitions
- Approval of outdated Versions
- Duplicate Task creation
- Commands targeting superseded objects
- Commands based on stale revisions
- Attempts to bypass Blocking Errors
- Planner actions outside the Workflow Template

---

## 6. Workflow Policy

Workflow Policy contains deterministic orchestration rules.

It defines:

- Which Node may become `ready`
- Which dependencies must exist
- Which dependencies must be Approved
- Which dependencies must not be stale
- Which Warnings may continue
- Which Blocking Errors stop execution
- Which stages require Human Gate
- Which Tasks may retry
- Which branches may execute in parallel
- Which optional Nodes may be skipped
- Which state transitions are legal
- Which downstream objects become stale or outdated
- Which Completion Policy applies

Workflow Policy must be:

- Structured
- Versioned
- Testable
- Auditable
- Separate from Planner Prompt text

The LLM Planner may explain or recommend actions, but it cannot redefine Workflow Policy.

---

## 7. Why Chief Editor Is Not a Super-Agent

A single unrestricted Chief Editor Agent would create several risks:

- It could modify content and workflow state simultaneously.
- Natural-language output could cause irreversible state changes.
- Approval and factuality boundaries could be bypassed.
- Retry behavior could become unpredictable.
- Workflow history would be difficult to audit.
- Prompt changes could unintentionally change business rules.
- One Agent would become responsible for every domain object.

ContentOS therefore uses:

```text
LLM for planning and interpretation
+
Deterministic code for authoritative execution
```

---

## 8. Workflow Template

ContentOS uses versioned Workflow Templates.

The first MVP template is conceptually named:

```text
content-package-dual-output/v1
```

A Workflow Template defines:

- Node IDs
- Node types
- Node dependencies
- Required Gates
- Optional branches
- Fork and join behavior
- Completion Policy
- Skip rules
- Retry policy references
- Workflow Policy version

Example:

```json
{
  "workflow_template_id": "content-package-dual-output/v1",

  "nodes": [
    {
      "node_id": "source_capture",
      "node_type": "service_task",
      "depends_on": []
    },
    {
      "node_id": "source_review",
      "node_type": "human_gate",
      "depends_on": [
        "source_capture"
      ]
    },
    {
      "node_id": "research_generation",
      "node_type": "agent_task",
      "depends_on": [
        "source_review"
      ]
    },
    {
      "node_id": "research_review",
      "node_type": "human_gate",
      "depends_on": [
        "research_generation"
      ]
    }
  ]
}
```

This is a conceptual contract rather than a final persistence model.

---

## 9. Fixed Workflow Template in the MVP

The MVP does not allow Planner to create arbitrary workflow graphs.

Rejected behavior:

```text
Run three Research Agents
→ Let two Writers debate
→ Ask another Agent to rank them
→ Repeat until satisfied
```

Allowed Planner decisions are limited to:

- Selecting requested output branches
- Recommending legal next steps
- Skipping optional stages when permitted
- Requesting a legal Node rerun
- Returning to an upstream review stage
- Suggesting user intervention
- Choosing among configured repair strategies

This avoids:

- Infinite Agent loops
- Unbounded cost
- Unpredictable execution
- Untestable workflow behavior
- Hidden state transitions
- Prompt-driven business logic

---

## 10. Workflow Instance

A Workflow Instance represents one concrete execution of a Workflow Template for one Content Package.

Recommended conceptual structure:

```json
{
  "workflow_instance_id": "workflow_001",
  "workflow_template_version": "content-package-dual-output/v1",
  "workflow_policy_version": "contentos-workflow-policy/v1",

  "content_package_id": "cp_001",
  "status": "active",

  "requested_outputs": [
    "blog",
    "xiaohongshu"
  ],

  "content_mode": "creator_led",

  "node_states": {},

  "revision": 12,

  "created_at": "2026-07-26T18:00:00Z",
  "updated_at": "2026-07-26T18:00:00Z"
}
```

A Content Package may eventually have more than one Workflow Instance.

Examples:

- Original dual-output workflow
- Rerun using new Sources
- Xiaohongshu-only workflow
- Future migration workflow
- Regeneration using a newer Agent Spec

Cancelling a Workflow Instance does not delete the Content Package.

---

## 11. Requested Output Branches

The Workflow Instance records requested outputs.

MVP-supported values:

```text
blog
xiaohongshu
```

Possible requests:

```text
["blog", "xiaohongshu"]
```

```text
["blog"]
```

```text
["xiaohongshu"]
```

The default ContentOS product experience may encourage dual output, but the architecture does not require both branches for every Content Package.

Requested branches affect:

- Which Nodes are activated
- Which Gates appear
- Completion Policy
- Which Tasks are created
- Which skipped states are legal

---

## 12. Separation of State Categories

ContentOS separates three categories of state:

```text
Artifact State
Workflow Node State
Workflow Instance State
```

A single `content_package.status` field must not attempt to express the entire system.

---

## 13. Artifact State

Artifact State represents the lifecycle of a domain object.

Examples include:

### Research Result

```text
draft
in_review
approved
stale
superseded
archived
```

### Human Opinion

```text
collecting
needs_confirmation
confirmed
review_required
superseded
archived
```

### Blog or Xiaohongshu Artifact

```text
draft
in_review
approved
outdated
superseded
archived
```

### Design Specification

```text
draft
in_review
approved
outdated
render_incompatible
superseded
archived
```

### Render Output

```text
succeeded
failed
outdated
invalidated
```

Artifact State is governed by the Artifact’s own domain rules.

---

## 14. Workflow Node State

Workflow Node State represents execution progress for one workflow step.

Recommended states:

```text
pending
ready
running
awaiting_review
blocked
succeeded
failed
cancelled
superseded
skipped
```

### `pending`

Dependencies are not yet satisfied.

### `ready`

All prerequisites are satisfied and the Task may begin.

### `running`

A Task or Agent Run is actively executing.

### `awaiting_review`

A Human Gate requires user action.

### `blocked`

Execution cannot continue until a specific problem is resolved.

### `succeeded`

The Node completed according to Workflow Policy.

### `failed`

The Node ended unsuccessfully and no automatic action is currently running.

### `cancelled`

Execution was cancelled.

### `superseded`

A newer Task or input dependency replaced the Node’s current execution path.

### `skipped`

The user explicitly skipped an optional Node or branch.

---

## 15. Workflow Instance State

Workflow Instance State represents the lifecycle of the overall workflow.

Recommended states:

```text
active
paused
blocked
completed
cancelled
archived
```

### `active`

The workflow may automatically advance.

### `paused`

Automatic advancement is disabled by user Command.

### `blocked`

No legal automatic action is available because a Blocking Error or unresolved dependency exists.

### `completed`

All requested branches satisfy the Completion Policy.

### `cancelled`

No additional automatic work will be scheduled.

### `archived`

The historical workflow is no longer active in the main workspace.

---

## 16. Derived Current Stage

The UI may display a human-readable current stage, such as:

```text
Waiting for Research Review
Generating Blog and Xiaohongshu
Design Review Required
Ready for Export
```

However, `current_stage` is derived from:

- Node states
- Artifact states
- Requested branches
- Human Gates
- Blocking conditions

It is not the authoritative state source.

---

## 17. Task

A Task represents a specific unit of work that the system intends to complete.

Examples:

```text
Capture Source
Normalize Source
Generate Research Result
Generate Blog Plan
Generate Blog Draft
Generate Xiaohongshu Plan
Generate Design Specification
Render Final Carousel
Create Export Package
```

Task is not the same as an Agent execution attempt.

Recommended conceptual structure:

```json
{
  "task_id": "task_001",
  "workflow_instance_id": "workflow_001",
  "node_id": "research_generation",

  "task_type": "agent_task",
  "status": "ready",

  "input_dependencies": {
    "normalized_source_version_ids": [
      "sourcever_002"
    ]
  },

  "idempotency_key": "workflow_001:research_generation:sourcever_002",

  "created_at": "2026-07-26T18:05:00Z"
}
```

---

## 18. Task States

Recommended Task states:

```text
created
ready
queued
running
awaiting_result
succeeded
failed
cancelled
superseded
```

Task state is operational.

It does not replace the Artifact State produced by the Task.

---

## 19. Agent Run

Agent Run represents one execution attempt by a specific Agent configuration.

Example:

```text
Task:
Generate Research Result

Agent Run 1:
Failed because output did not match schema

Agent Run 2:
Succeeded after repair
```

Recommended conceptual structure:

```json
{
  "agent_run_id": "agentrun_001",
  "task_id": "task_001",

  "agent_type": "research_agent",
  "agent_spec_version": "research-agent/v1",

  "model_configuration_id": "model-config-strong/v1",
  "prompt_template_version": "research-prompt/v3",

  "status": "running",
  "attempt": 1,

  "input_snapshot": {
    "normalized_source_version_ids": [
      "sourcever_002"
    ]
  },

  "started_at": "2026-07-26T18:05:10Z"
}
```

---

## 20. Agent Run Metadata

Agent Run should record:

- Agent Type
- Agent Spec Version
- Prompt Template Version
- Model Configuration
- Provider and model reference
- Input Snapshot
- Attempt number
- Start and finish times
- Token usage
- Cost estimate when available
- Raw output reference
- Parsed output reference
- Validation Result
- Error classification
- Repair relationship
- Produced Artifact reference

This enables:

- Debugging
- Evaluation
- Reproduction
- Cost analysis
- Agent comparison
- Prompt comparison
- Model replacement

---

## 21. Artifact Version

Artifact Version represents validated domain output.

Examples:

```text
Research Result Version 3
Blog Version 2
Xiaohongshu Version 4
Design Specification Version 2
```

The relationship is:

```text
Task
├── Agent Run 1 — failed
├── Agent Run 2 — succeeded
└── Artifact Version — created and promoted
```

Agent success does not automatically make an Artifact current or approved.

---

## 22. Frozen Input Snapshot

Every Agent Run uses a frozen input snapshot.

Once execution begins, the formal input Version set cannot change.

Example:

```text
Research Agent Run input:
Normalized Source v2
```

If the user approves Normalized Source v3 during execution, the current Run still remains based on v2.

It must not silently switch inputs.

Frozen inputs are required for:

- Reproducibility
- Audit
- Provenance
- Cost analysis
- Stale detection
- Result comparison
- Safe promotion

---

## 23. Input Snapshot Contents

Depending on Agent type, Input Snapshot may include:

- Source Version IDs
- Research Result Version ID
- Human Opinion Version ID
- Platform Profile Version
- Brand Theme Version
- Component Registry Version
- Asset Policy Version
- Agent Spec Version
- Prompt Template Version
- Model Configuration
- Generation Request
- Workflow Policy Version

The Snapshot must reference immutable Versions whenever possible.

---

## 24. Upstream Change During Execution

An upstream dependency may change while an Agent Run is active.

Example:

```text
Agent Run starts with Source v2
↓
User approves Source v3
↓
Agent Run based on Source v2 finishes
```

The result must not be silently discarded.

It should be saved for audit and comparison.

However, it must not automatically become the current Review Candidate.

---

## 25. Stale on Arrival

An output completed from no-longer-current input is marked conceptually as:

```text
stale_on_arrival
```

or:

```text
superseded_before_promotion
```

The precise implementation name remains a future data-model decision.

The system should:

- Preserve the raw Agent result
- Preserve the created Artifact Version when valid
- Record the input mismatch
- Prevent automatic promotion
- Explain the condition to the user
- Create or recommend a new Task using current inputs

This protects both execution history and current-state correctness.

---

## 26. Artifact Promotion

Agent output must pass a Promotion process.

Required flow:

```text
Persist Raw Output
→ Parse Output
→ Schema Validation
→ Domain Validation
→ Dependency Check
→ Create Artifact Version
→ Eligibility Check
→ Promote to Review Candidate
```

Promotion is separate from Agent Run completion.

---

## 27. Promotion Eligibility

An Artifact Version may become the current Review Candidate only when:

- Output parses successfully
- Schema Validation passes
- Required domain validation passes
- Input Versions remain valid
- Task is not superseded
- Workflow is not cancelled
- Node is still eligible
- No newer equivalent Artifact has already been promoted
- Idempotency rules permit promotion

If these conditions fail, the result may remain stored without becoming the current candidate.

---

## 28. Blog and Xiaohongshu Parallel Branches

Once the Content Foundation is ready:

```text
Approved Research Result
+
Confirmed Human Opinion
```

or:

```text
Approved Research Result
+
Explicit Research-based Mode
```

the workflow may fork:

```text
                 Content Foundation
                         |
            ┌────────────┴────────────┐
            ↓                         ↓
       Blog Branch             Xiaohongshu Branch
```

The branches:

- Share upstream Versions
- Use separate Tasks
- Use separate Agent Runs
- Produce independent Artifacts
- Have independent Human Gates
- May fail independently
- May be regenerated independently
- Do not use one another as the default source

---

## 29. Xiaohongshu Branch

The Xiaohongshu branch continues beyond Packaging:

```text
Packaging Plan
→ Xiaohongshu Artifact
→ Xiaohongshu Review Gate
→ Approved Xiaohongshu Version
→ Visual Agent
→ Design Review Gate
→ Approved Design Version
→ Final Render
→ Export Package
```

Each Node remains separately observable.

---

## 30. Blog Branch

The Blog branch is:

```text
Blog Plan
→ Blog Draft
→ Blog Review Gate
→ Approved Blog Version
→ Blog Export Package
```

The PersonalBlog publishing integration remains outside the current ContentOS MVP workflow.

---

## 31. Completion Policy

Each Workflow Template defines a Completion Policy.

For the dual-output template, the default may be:

```text
Blog branch reaches approved or export-ready terminal state
AND
Xiaohongshu branch reaches export-ready terminal state
```

For a single-output request:

```text
Requested branch reaches its defined terminal state
```

A branch may also terminate through explicit:

```text
skipped
```

if the branch is optional and the user issued a valid Skip Command.

A failed branch cannot be silently treated as skipped.

---

## 32. Human Gates

A Human Gate is a workflow Node that requires explicit user action.

The MVP includes the following primary Gates.

---

## 33. Source Approval Gate

```text
Normalized Source Version
→ Approved for Research
```

The user confirms that the normalized Source is sufficiently accurate and usable.

Research Agent cannot consume unapproved Source Versions.

---

## 34. Research Approval Gate

```text
Research Result Version
→ Approved
```

The user reviews:

- Summaries
- Claims
- Supported facts
- Uncertain claims
- Tensions
- Opportunities
- Evidence
- Corrections
- Exclusions

Only the Approved Research Result Version may enter downstream generation.

---

## 35. Human Opinion Confirmation Gate

In Creator-led Mode:

```text
Raw Response
→ AI Interpretation
→ Confirmed Opinion Statement
```

The user confirms what may represent their position or experience.

In Research-based Mode, the user explicitly skips this Gate.

Skipping changes downstream constraints.

---

## 36. Blog Approval Gate

```text
Blog Version
→ Approved
```

The user reviews and approves one immutable Blog Version.

Approval does not apply automatically to future Versions.

---

## 37. Xiaohongshu Content Approval Gate

```text
Xiaohongshu Artifact Version
→ Approved
```

The user approves:

- Platform Title
- Cover Title
- Cover Subtitle
- Pages
- Caption
- CTA
- Hashtags
- Public references

Only an Approved Xiaohongshu Version may enter Visual Agent.

---

## 38. Design Approval Gate

```text
Design Specification Version
→ Approved
```

The user reviews:

- Components
- Visual hierarchy
- Assets
- Attribution placement
- Theme application
- Preview output

Only an Approved Design Version may enter Final Render.

---

## 39. Final Export Action

Final Render may execute automatically after Design approval.

Creating, downloading, or marking an Export Package as the current publishing candidate remains user-visible.

The MVP does not treat automatic rendering as publication.

---

## 40. Semi-automatic Workflow

The MVP follows a semi-automatic orchestration model:

```text
User passes Human Gate
→ Executor automatically schedules next legal Tasks
→ Workflow continues
→ Next Human Gate pauses execution
```

Example:

```text
User approves Research
→ Human Opinion flow becomes ready
→ User confirms Opinion
→ Blog and Xiaohongshu Tasks begin in parallel
→ Each branch waits at its own review Gate
```

The user does not need to manually start every deterministic step.

The system also does not cross Human Gates without explicit action.

---

## 41. Workflow Command

Every state-changing action is represented as a structured Workflow Command.

Examples:

```text
ApproveSourceVersion
ApproveResearchVersion
ConfirmHumanOpinionVersion
SelectResearchBasedMode
GenerateBlog
GenerateXiaohongshu
ApproveBlogVersion
ApproveXiaohongshuVersion
ApproveDesignVersion
RetryTask
PauseWorkflow
ResumeWorkflow
CancelWorkflow
SkipOptionalBranch
AcknowledgeWarning
SelectFinalRenderOutput
CreateExportPackage
```

---

## 42. Command Contract

Recommended conceptual structure:

```json
{
  "command_id": "cmd_001",
  "command_type": "ApproveResearchVersion",

  "workflow_instance_id": "workflow_001",

  "target": {
    "research_result_version_id": "researchver_003"
  },

  "expected_revision": 12,

  "idempotency_key": "workflow_001:ApproveResearchVersion:researchver_003",

  "requested_by": {
    "type": "user"
  },

  "created_at": "2026-07-26T18:30:00Z"
}
```

Executor validates the Command before any state change occurs.

---

## 43. Chat-to-Command Flow

Chief Editor Chat may receive natural-language instructions.

Example:

> 这份 Research 没问题，继续生成博客和小红书。

Processing flow:

```text
Chat message
→ Planner interpretation
→ Command Proposal
→ Target Version resolution
→ User-authority check
→ Revision check
→ Executor validation
→ Command execution
→ Workflow Event
```

Chat message alone is not an Approval record.

---

## 44. Ambiguous Chat Instructions

If the user says:

> 继续。

Planner should use the current workflow context to propose the most likely legal action.

However, Executor must still confirm:

- Which Workflow Instance
- Which Gate is active
- Which Version is being approved or continued
- Whether the action is legal
- Whether a current Revision conflict exists

If no unambiguous legal action exists, the system should return a clear choice rather than inventing state.

---

## 45. Idempotency

Commands and Tasks must support idempotency.

Repeated delivery of:

```text
ApproveResearchVersion(researchver_003)
```

must not:

- Create duplicate Approval records
- Start duplicate Blog Tasks
- Start duplicate Xiaohongshu Tasks
- Duplicate notifications
- Create duplicate Workflow Events representing separate approvals

Task idempotency should include:

```text
Workflow Instance
+
Node ID
+
Input Version set
+
Relevant configuration Version
```

---

## 46. Idempotency Key

Example Task key:

```text
workflow_001:
research_generation:
sourcever_002:
research-agent-v1:
prompt-v3
```

Equivalent duplicate requests resolve to the existing Task or completed result.

A materially different input or configuration creates a new Task.

---

## 47. Expected Revision

State-sensitive Commands carry:

```text
expected_revision
```

Example:

A user loads Research v2 at Workflow Revision 12.

Before they click Approve, Research v3 becomes the current candidate and Workflow Revision becomes 13.

The old approval request must fail with:

```text
conflict
```

It must not approve the wrong Version.

---

## 48. Revision Conflict Result

Recommended result:

```json
{
  "status": "conflict",
  "reason": "workflow_revision_changed",
  "expected_revision": 12,
  "current_revision": 13,
  "current_review_target": "researchver_003"
}
```

The UI should refresh the user’s review context.

---

## 49. Workflow Lock or Lease

Critical state transitions require short-lived serialization.

The purpose is to prevent:

- Duplicate Node advancement
- Duplicate Task creation
- Simultaneous Resume and Cancel
- Concurrent promotion of equivalent outputs
- Conflicting branch updates

The implementation may use:

- Database transaction lock
- Advisory lock
- Queue serialization
- Distributed lease

The exact mechanism is deferred to the technical architecture Session.

Locks must remain short-lived and must not block normal content editing.

---

## 50. Workflow Event Log

Every important workflow change creates an immutable Workflow Event.

Example Event types:

```text
workflow_created
workflow_paused
workflow_resumed
workflow_cancelled

source_capture_started
source_capture_failed
source_version_created
source_version_approved

research_task_created
research_run_started
research_run_failed
research_version_created
research_version_approved

opinion_collection_started
opinion_version_confirmed
opinion_confirmation_skipped

blog_generation_started
blog_version_created
blog_version_approved

xiaohongshu_generation_started
xiaohongshu_version_created
xiaohongshu_version_approved

design_generation_started
design_version_created
design_version_approved

render_job_started
render_job_failed
render_output_created

export_package_created
warning_acknowledged
dependency_became_stale
artifact_became_outdated
```

---

## 51. Workflow Event Contract

Recommended conceptual structure:

```json
{
  "event_id": "event_001",
  "workflow_instance_id": "workflow_001",

  "event_type": "research_version_approved",

  "actor": {
    "type": "user",
    "actor_id": "user_001"
  },

  "subject": {
    "research_result_version_id": "researchver_003"
  },

  "metadata": {
    "command_id": "cmd_001"
  },

  "created_at": "2026-07-26T18:30:00Z"
}
```

Events are append-only.

---

## 52. Audit Log Without Full Event Sourcing

The MVP uses:

```text
Current State Models
+
Append-only Workflow Events
```

It does not require complete Event Sourcing.

Current domain state remains stored in normal models.

The Event Log supports:

- User-visible timeline
- Audit
- Debugging
- Notifications
- Incident investigation
- Workflow explanation
- Historical decision tracking

The system does not need to replay all events to reconstruct every table during the MVP.

---

## 53. Pause Workflow

Pause is an explicit Workflow Command.

When paused:

- No new automatic Tasks are created
- Existing `ready` Tasks remain waiting
- Running Tasks may finish
- Completed outputs are preserved
- Completed Tasks do not automatically advance the workflow
- Human editing remains available
- No Artifacts are deleted

Pause is intended to stop orchestration, not erase progress.

---

## 54. Running Tasks During Pause

Default behavior:

```text
Pause requested
→ Running Task may complete
→ Result is saved
→ Promotion may complete
→ Automatic next Node does not begin
```

A separate Cancel Task capability may attempt to interrupt a running call.

Pause and Task cancellation are not the same operation.

---

## 55. Resume Workflow

Resume does not simply continue from an old pointer.

Executor must re-evaluate:

- Current Artifact Versions
- Current approvals
- Stale dependencies
- Outdated outputs
- Running or completed Tasks
- Superseded Nodes
- New Blocking Errors
- Current requested branches
- Idempotency state

The workflow resumes from the latest consistent state.

---

## 56. Cancel Workflow

Cancel stops future execution for one Workflow Instance.

Cancellation behavior:

- No new Tasks are created
- Queued Tasks are cancelled where possible
- Running Tasks receive cancellation request where supported
- Existing Artifacts remain
- Existing Events remain
- Content Package remains
- Historical outputs remain accessible
- A future Workflow Instance may reuse existing Artifacts

Cancellation is not deletion.

---

## 57. Archive Workflow

Archive is a historical organization state.

An archived Workflow:

- Is not automatically executed
- Remains readable
- Preserves all events
- Preserves all Artifacts
- Is removed from the default active-workflow view

Archiving does not alter Artifact validity.

---

## 58. Skip Optional Step

Skip is allowed only for Nodes marked optional by Workflow Template and Policy.

MVP examples:

- Human Opinion confirmation
- Blog branch
- Xiaohongshu branch
- Optional generated illustration
- Optional CTA
- Optional Hashtag suggestion

Skip must record:

- Actor
- Target Node or branch
- Reason, when provided
- Effect on Completion Policy
- Effect on Content Mode
- Downstream constraints

---

## 59. Skipping Human Opinion

Skipping Human Opinion explicitly sets:

```text
content_mode = research_based
```

Consequences include:

- No unconfirmed first-person language
- No personal experience claims
- No creator-specific position
- Writer and Packaging prompts change
- First-person Validators remain active

The system must not silently fall back to invented creator voice.

---

## 60. Warning Acknowledgement

Warnings may be acknowledged through a structured Command.

Example:

```text
AcknowledgeWarning
```

The acknowledgement records:

- Warning ID
- Actor
- Target Version
- Timestamp
- Optional note

Acknowledging a Warning does not modify the underlying Validation Result.

It records that the user reviewed the risk.

---

## 61. Blocking Errors

Blocking Errors cannot be bypassed through ordinary acknowledgement.

Examples:

- Research is not approved
- Unsupported first-person experience
- Required Source Evidence is missing
- Required Attribution is missing
- Design depends on outdated XHS
- Final Render has missing pages
- Required font is missing
- Unapproved Asset is used
- Component cannot safely fit content

Resolution requires:

- Correcting the upstream object
- Replacing a dependency
- Selecting a legal fallback
- Creating a new Version
- Returning to an upstream stage
- Fixing system configuration

---

## 62. Failure Classification

Chief Editor uses a unified failure taxonomy:

```text
Validation Failure
Agent Execution Failure
Infrastructure Failure
Dependency Failure
Human Action Required
```

These categories determine the next workflow path.

---

## 63. Validation Failure

Examples:

- Output Schema invalid
- Unsupported first-person statement
- Missing citation
- Component incompatibility
- Render overflow
- Invalid Direct Quote

Possible actions:

- Schema repair
- Agent regeneration
- Return to content review
- Return to Design
- Human correction
- Block workflow

---

## 64. Agent Execution Failure

Examples:

- Model returns no useful output
- Model refuses unexpectedly
- Model output remains invalid after repair
- Provider error is not clearly transient
- Agent exceeds configured limits

Possible actions:

- Limited retry
- Use configured alternate model
- Change Model Configuration
- Request user action
- Mark Task failed

---

## 65. Infrastructure Failure

Examples:

- Worker crash
- Storage unavailable
- Temporary network timeout
- Queue delivery failure
- Browser startup failure

Possible actions:

- Automatic retry
- Backoff
- Move Task back to queue
- Surface service failure after retry limit

---

## 66. Dependency Failure

Examples:

- Upstream Version became stale
- Input Version was superseded
- Approved Asset became inaccessible
- Platform Profile missing
- Theme Version missing
- Required Source removed

Possible actions:

- Block Node
- Create new Task using current dependencies
- Return to upstream review
- Resolve dependency
- Mark output stale on arrival

---

## 67. Human Action Required

Examples:

- Source requires review
- Research needs correction
- Opinion needs confirmation
- Blog needs approval
- XHS needs approval
- Image candidate needs selection
- Design needs approval

These are represented as:

```text
awaiting_review
```

They are not treated as system failures.

---

## 68. Retry Policy

Retry behavior is controlled by Workflow Policy and Agent Runtime Policy.

The MVP does not allow unlimited automatic retries.

Retry decisions depend on:

- Failure classification
- Agent type
- Attempt count
- Model configuration
- Idempotency
- Input Version
- Workflow state
- User cancellation
- Cost limits

---

## 69. Agent Repair

A structured repair flow may handle limited output errors.

Example:

```text
Agent generates output
→ Schema Validation fails
→ Repair Attempt
→ Validate again
```

Repair must have a strict limit.

Each repair is recorded as:

- Separate Run Attempt
- Related Agent Run
- New raw output
- New Validation Result

The original invalid output remains preserved.

---

## 70. Repair Boundaries

Repair is suitable for:

- Invalid JSON
- Missing required field
- Incorrect enum value
- Formatting issue
- Minor schema mismatch

Repair is not automatically suitable for:

- Unsupported factual claim
- Invented personal experience
- Missing Source Evidence
- Severe content misinterpretation
- Incompatible Design
- Missing required dependency

These usually require regeneration or human review.

---

## 71. Duplicate Callback Protection

External Agent or Worker execution may return more than once.

Before creating an Artifact Version, Promotion checks:

- Task ID
- Agent Run ID
- Idempotency Key
- Existing successful result
- Existing Artifact Version
- Promotion status
- Workflow Node status

Equivalent duplicate callbacks must not create duplicate Versions.

---

## 72. Timeout and Late Result

A Task may be marked failed after timeout while the underlying execution later returns a result.

The late result must be evaluated.

Possible outcomes:

- Ignore duplicate because a newer successful Run exists
- Save as historical raw output
- Create an unpromoted Artifact Version
- Mark stale on arrival
- Promote only if the Task remains eligible and no equivalent result exists

The system must not automatically promote every late callback.

---

## 73. Superseded Task

A Task becomes `superseded` when:

- A newer input Version becomes current
- A newer equivalent Task is created
- User changes requested output mode
- Workflow is restarted from a newer checkpoint
- Another Task result has already been selected

Superseded Tasks may finish, but their results are not automatically promoted.

---

## 74. Approval Targets Immutable Versions

All approvals bind to immutable Versions.

Examples:

```text
Approve Research Result v3
Approve Blog v2
Approve Xiaohongshu v4
Approve Design v2
```

Approval must not bind to a mutable Working Copy.

If a new Version is created, it requires a new Approval.

---

## 75. Approval Record

Recommended conceptual structure:

```json
{
  "approval_id": "approval_001",
  "workflow_instance_id": "workflow_001",

  "artifact_type": "research_result",
  "artifact_version_id": "researchver_003",

  "status": "approved",

  "approved_by": {
    "type": "user",
    "actor_id": "user_001"
  },

  "created_at": "2026-07-26T18:30:00Z"
}
```

Approval history is append-only.

---

## 76. Approval Invalidation

An Approval remains historically true for the approved Version.

It may cease to make that Version the current candidate when:

- A newer Version is approved
- Upstream dependency changes
- The Artifact becomes stale or outdated
- The Version is invalidated due to confirmed defect

The historical Approval record is not deleted.

---

## 77. Dependency Propagation

Chief Editor coordinates dependency propagation already defined in previous Sessions.

Examples:

```text
Source Version changes
→ Research Result becomes stale
```

```text
Approved Research changes
→ Human Opinion becomes review_required
→ Blog and XHS become outdated
```

```text
Confirmed Human Opinion changes
→ Blog and XHS become outdated
```

```text
Approved XHS changes
→ Design and Render Output become outdated
```

```text
Approved Design changes
→ Render Output and Export Package become outdated
```

The propagation itself should be deterministic.

---

## 78. Workflow Response to Dependency Changes

When a dependency changes, Chief Editor should:

1. Update affected Artifact states.
2. Update relevant Node states.
3. Cancel or supersede incompatible Tasks.
4. Prevent promotion from old inputs.
5. Explain the impact to the user.
6. Recommend or create legal regeneration Tasks.
7. Preserve historical Versions.

---

## 79. User-visible Workflow Status

Chief Editor should show meaningful status rather than raw engine state.

Examples:

```text
Research 已生成，正在等待你的审核。
```

```text
Blog 和小红书内容正在并行生成。
```

```text
设计阶段被阻塞：第 5 页内容超过所有组件的安全容量。
```

```text
旧版小红书图片仍可下载，但由于内容已更新，它不再是当前发布候选。
```

---

## 80. Next-action Model

The product should expose a clear recommended next action.

Example structure:

```json
{
  "workflow_status": "blocked",

  "summary": "Design generation is blocked.",

  "reason": {
    "type": "content_fit_issue",
    "page_id": "page_005"
  },

  "recommended_actions": [
    {
      "command_type": "OpenXiaohongshuEditor",
      "label": "拆分第 5 页"
    },
    {
      "command_type": "RetryDesignAfterContentUpdate",
      "label": "修改后重新生成设计"
    }
  ]
}
```

Planner may generate the explanation.

Executor determines which Commands are legal.

---

## 81. Workflow Timeline

Workflow Event Log may power a timeline such as:

```text
18:00 Content Package created
18:02 Source capture completed
18:08 Source approved
18:10 Research generation started
18:13 Research version created
18:25 Research approved
18:26 Human Opinion collection started
18:34 Human Opinion confirmed
18:35 Blog and Xiaohongshu generation started
```

This helps users understand progress and supports portfolio demonstration.

---

## 82. Recommended MVP Workflow

```text
Create Content Package
        ↓
Submit Primary and Supporting Sources
        ↓
Capture and Normalize
        ↓
Source Review Gate
        ↓
Research Agent
        ↓
Research Review Gate
        ↓
Human Opinion Collection
        ↓
Confirm Human Opinion
or
Select Research-based Mode
        ↓
┌───────────────────────┴───────────────────────┐
↓                                               ↓
Writer Agent                              Packaging Agent
↓                                               ↓
Blog Review Gate                          XHS Review Gate
↓                                               ↓
Approved Blog Version                     Approved XHS Version
                                                ↓
                                           Visual Agent
                                                ↓
                                        Design Review Gate
                                                ↓
                                           Final Render
                                                ↓
                                          Export Package
```

Blog and Xiaohongshu branches execute independently after the shared Content Foundation becomes ready.

---

## 83. MVP Scope

### Included

- Chief Editor coordination layer
- LLM Planner
- Deterministic Executor
- Versioned Workflow Policy
- Fixed Workflow Template
- Workflow Instance
- Requested output branches
- Separate Artifact, Node, and Workflow states
- Task
- Agent Run
- Frozen Input Snapshot
- Artifact Promotion
- Stale-on-arrival handling
- Parallel Blog and Xiaohongshu branches
- Human Gates
- Semi-automatic continuation
- Structured Commands
- Chat-to-Command interpretation
- Idempotency
- Expected Revision
- Short-lived execution lock
- Workflow Event Log
- Pause
- Resume
- Cancel
- Skip optional stage
- Warning acknowledgement
- Blocking Error enforcement
- Failure classification
- Limited Retry and Repair
- Duplicate callback protection
- User-visible next-step recommendations

### Deferred

- LLM-created arbitrary workflow graphs
- Infinite autonomous Agent loops
- Full Event Sourcing
- Multi-user approval workflows
- Role-based approval routing
- External Webhook triggers
- Scheduled publishing
- Multi-tenant workflow isolation
- Cross-organization collaboration
- Advanced SLA management
- Dynamic marketplace workflows
- Automatic cost optimization across Providers
- Self-modifying Workflow Policy
- Autonomous publication

---

# 84. Decisions

## DEC-125

### Status

Accepted

### Title

Chief Editor 由 Planner、Deterministic Executor 和 Workflow Policy 组成

### Decision

Chief Editor is the workflow coordination layer.

The LLM Planner:

- Understands user goals
- Explains workflow state
- Recommends next actions
- Produces Command Proposals

The Deterministic Executor:

- Validates Commands
- Enforces state transitions
- Creates Tasks
- Schedules execution
- Records Events

Workflow Policy:

- Defines prerequisites
- Defines Gates
- Defines legal transitions
- Defines retry and failure behavior

### Reason

Natural-language planning and authoritative state mutation have different risks.

They must not be controlled by one unrestricted LLM.

### Impact

Chief Editor is not implemented as a super-Agent with direct write access to every domain object.

---

## DEC-126

### Status

Accepted

### Title

MVP 使用版本化固定 Workflow Template，不允许 LLM 动态创造任意流程图

### Decision

The MVP workflow structure is defined by a versioned Workflow Template.

Planner may only:

- Select requested branches
- Skip allowed optional stages
- Recommend legal next steps
- Request legal retries
- Return to an upstream stage

Planner may not create arbitrary Nodes, loops, or Agent teams.

### Reason

Fixed workflow templates provide:

- Predictability
- Testability
- Cost control
- Reproducibility
- State safety
- Easier debugging

### Impact

ContentOS must define an initial:

```text
content-package-dual-output/v1
```

Workflow Template.

---

## DEC-127

### Status

Accepted

### Title

Artifact State、Workflow Node State 与 Workflow Instance State 分离

### Decision

Artifact State describes the domain object.

Workflow Node State describes execution progress.

Workflow Instance State describes the overall workflow lifecycle.

A derived `current_stage` may be used for UI display but is not the sole source of truth.

### Reason

Parallel branches and independent Artifact lifecycles cannot be represented reliably by one global status field.

### Impact

The data model and UI must combine multiple state sources.

---

## DEC-128

### Status

Accepted

### Title

Task、Agent Run 与 Artifact Version 作为三个独立对象

### Decision

Task represents work to be completed.

Agent Run represents an execution attempt.

Artifact Version represents validated domain output.

### Reason

Retries, failures, model changes, duplicate callbacks, and version promotion must be independently observable.

### Impact

Workflow Engine, Agent Runtime, and Artifact Service require separate contracts.

---

## DEC-129

### Status

Accepted

### Title

Agent Run 使用冻结的版本化输入快照

### Decision

Every Agent Run records the exact immutable input Versions used at start.

The Run must not automatically switch to newer inputs during execution.

### Reason

Frozen input is required for:

- Reproducibility
- Audit
- Provenance
- Stale detection
- Cost analysis
- Reliable promotion

### Impact

Agent Run must store a complete Input Snapshot.

---

## DEC-130

### Status

Accepted

### Title

基于旧输入完成的结果保留，但标记为 Stale on Arrival

### Decision

If an upstream dependency changes during execution, the result from the old input is preserved.

It cannot automatically become the current Review Candidate.

Chief Editor should create or recommend a new Task using the current input Version.

### Reason

Completed work should not be silently discarded, but outdated input must not enter the current approval chain.

### Impact

Artifact Promotion must recheck dependencies after execution completes.

---

## DEC-131

### Status

Accepted

### Title

Blog 与 Xiaohongshu 在 Content Foundation 完成后作为独立并行分支

### Decision

After Approved Research and the required Human Opinion condition exist, Blog and Xiaohongshu may generate in parallel.

The branches share upstream Versions but do not depend on one another.

### Reason

Blog and Xiaohongshu are parallel platform outputs.

Serializing them would create unnecessary dependency and delay.

### Impact

Workflow Template requires:

- Fork behavior
- Independent Tasks
- Independent Gates
- Independent branch failure
- Completion Policy

---

## DEC-132

### Status

Accepted

### Title

MVP 采用自动执行步骤与人工 Gate 结合的半自动工作流

### Decision

After a Human Gate is passed, the system automatically starts the next legal Tasks.

The workflow pauses at Source, Research, Human Opinion, Blog, Xiaohongshu, and Design review Gates.

### Reason

A completely manual workflow is inefficient.

A fully automatic workflow would bypass essential human judgment.

### Impact

Workflow Engine must support:

```text
awaiting_review
```

and automatic continuation after valid approval.

---

## DEC-133

### Status

Accepted

### Title

所有状态变更通过结构化 Workflow Command 执行

### Decision

Buttons, Chat instructions, and system automation must all become structured Commands.

Executor validates and executes the Command.

Natural-language messages do not directly create Approval or state change.

### Reason

Structured Commands provide explicit:

- Target Version
- Actor
- Expected Revision
- Idempotency
- Audit record
- Legal transition

### Impact

ContentOS requires:

- Command Contract
- Command Handler
- Chat-to-Command interpretation
- Structured execution result

---

## DEC-134

### Status

Accepted

### Title

Workflow Command 与 Task 必须支持幂等和并发冲突检测

### Decision

Commands and Tasks use Idempotency Keys.

State-sensitive Commands use Expected Revision.

Critical transitions use a short-lived lock, lease, or equivalent serialization mechanism.

### Reason

Repeated clicks, callbacks, retries, and concurrent Workers must not produce duplicate Tasks, Approvals, or Artifact Versions.

### Impact

Workflow Engine must support:

- Idempotent execution
- Revision conflicts
- Duplicate detection
- Serialized critical transitions

---

## DEC-135

### Status

Accepted

### Title

ContentOS 保存 Append-only Workflow Event Log，但 MVP 不采用完整 Event Sourcing

### Decision

Important workflow actions are recorded as immutable Events.

Current state remains stored in ordinary domain models.

### Reason

Event Log provides audit and timeline value without requiring complete Event-sourced architecture.

### Impact

ContentOS requires:

- Workflow Event Contract
- Event persistence
- Timeline queries
- Event-to-notification mapping

---

## DEC-136

### Status

Accepted

### Title

Pause、Resume、Cancel 与 Skip 使用明确且不删除历史的工作流语义

### Decision

Pause stops automatic advancement.

Resume re-evaluates the latest consistent state.

Cancel stops future execution but preserves Artifacts.

Skip applies only to allowed optional stages and records its downstream effects.

### Reason

These actions have different meanings and must not be represented by one ambiguous stop state.

### Impact

Workflow Engine and UI require separate Commands and states for each operation.

---

## DEC-137

### Status

Accepted

### Title

失败分类决定 Repair、Retry、Return 或 Human Review

### Decision

Workflow failures are classified as:

- Validation Failure
- Agent Execution Failure
- Infrastructure Failure
- Dependency Failure
- Human Action Required

Only policy-approved conditions receive automatic Retry or Repair.

Retry and Repair have explicit limits.

### Reason

Different failures require different recovery paths.

Unclassified retries waste cost and hide real domain problems.

### Impact

Task Result, Agent Run, and Workflow Node must record:

- Failure classification
- Error code
- Attempt count
- Suggested resolution

---

## DEC-138

### Status

Accepted

### Title

Agent 输出必须通过 Promotion 流程后才能成为当前审核候选

### Decision

Agent output passes:

```text
Persist
→ Parse
→ Validate
→ Dependency Check
→ Artifact Version Creation
→ Eligibility Check
→ Review Candidate Promotion
```

A successful Agent response alone does not create a current Artifact candidate.

### Reason

Model output may be invalid, stale, duplicated, superseded, or produced after Workflow cancellation.

### Impact

Agent Runtime and Artifact Service require a formal Promotion boundary.

---

## DEC-139

### Status

Accepted

### Title

普通 Warning 可以被确认，Blocking Error 不能被常规人工绕过

### Decision

Users may acknowledge eligible Warnings and continue.

Blocking Errors require correction, dependency replacement, legal fallback, or upstream revision.

A normal “continue anyway” action cannot bypass Blocking Errors.

### Reason

Human review must not become a universal mechanism for bypassing provenance, factuality, dependency, or output-integrity rules.

### Impact

Validation Results must distinguish:

- Warning
- Acknowledgeable Warning
- Blocking Error

Workflow Policy defines which Warnings may continue.

---

## 85. Rejected or Deferred Approaches

### Super-Agent Chief Editor

Rejected because one unrestricted Agent must not own planning, content, approval, and state mutation.

### Planner Directly Updating State

Rejected because LLM output is not an authoritative transaction.

### Dynamic Workflow Graph Creation

Rejected for the MVP because it would reduce predictability and testability.

### One Global Content Package Status

Rejected because parallel Artifact branches require independent states.

### Chat Message as Approval

Rejected because Approval must target a specific immutable Version.

### Unlimited Retry and Self-reflection

Rejected because it creates uncontrolled cost and execution loops.

### Silent Input Switching

Rejected because Agent Runs require frozen inputs.

### Discarding Old-input Results

Rejected because execution history should remain inspectable.

### Promoting Every Successful Model Output

Rejected because successful response does not guarantee validity or current eligibility.

### Warning and Blocking Error Treated the Same

Rejected because some risks may be acknowledged while others violate required system constraints.

### Cancel Deleting Artifact History

Rejected because cancellation stops execution rather than erasing work.

### Full Event Sourcing

Deferred because append-only audit Events provide sufficient MVP value with lower implementation complexity.

### Multi-user Approval Routing

Deferred until account, permission, and collaboration architecture are defined.

---

## 86. Open Questions

The following questions remain unresolved:

1. Which exact Nodes belong in `content-package-dual-output/v1`?
2. Should Blog Export be a separate workflow Node?
3. Should Final Render start automatically after Design approval?
4. Should Export Package creation require an explicit user Command?
5. Should Source capture and extraction be separate Nodes?
6. Should Research Plan and Research Result be separate Tasks?
7. Should Blog Plan and Blog Draft be separate workflow Nodes?
8. Should Packaging Plan and XHS Artifact be separate workflow Nodes?
9. Should image-generation requests be child Tasks of the Visual Node?
10. How should subtask progress appear in the workflow timeline?
11. Which Nodes can run in parallel beyond Blog and XHS?
12. Can multiple Supporting Sources normalize in parallel?
13. How should a failed Supporting Source affect Primary Source progress?
14. Should Research begin when one Supporting Source is still unresolved?
15. How should optional Sources affect Task idempotency?
16. Which Human Gates are mandatory in Research-based Mode?
17. Should Blog approval be required when the user only wants Xiaohongshu?
18. Can Workflow requested outputs change after execution starts?
19. What happens if the user adds the Blog branch later?
20. Should adding a branch create a new Workflow Instance or modify the existing one?
21. Which Workflow Commands are exposed in the MVP UI?
22. Which Commands may Planner propose automatically?
23. Which Commands require explicit confirmation?
24. How should ambiguous Chat instructions be resolved?
25. Should Planner show the proposed Commands before execution?
26. Which Command types may the system issue automatically?
27. How should Command authorization be modeled in a single-user MVP?
28. What revision object should `expected_revision` refer to?
29. Should each Artifact Working Copy have an independent revision?
30. How should cross-object transactions be handled?
31. Which lock mechanism will be used?
32. How long should a Workflow lease remain valid?
33. What happens when a Worker dies while holding a lease?
34. How should Workflow recovery run after application restart?
35. Which queue or workflow framework will implement Task scheduling?
36. How are delayed retries represented?
37. How many Agent retries are allowed?
38. How many Schema Repair attempts are allowed?
39. Can a Retry use a different Model Configuration?
40. Does a model change create a new Task or a new Agent Run?
41. How should model fallback be recorded?
42. How should cost limits block additional retries?
43. How should late Agent results be retained?
44. How long should raw model outputs be retained?
45. Can an unpromoted Artifact Version be manually promoted?
46. Should stale-on-arrival results be visible in the main UI?
47. How should users compare stale and current results?
48. Which Warnings are acknowledgeable?
49. Can Warning acknowledgement expire after an upstream change?
50. Should Warning acknowledgement bind to a specific Version?
51. How should Workflow Node state be derived after an Artifact becomes outdated?
52. Does outdated downstream content automatically reopen a completed workflow?
53. Should regeneration occur automatically or only after user approval?
54. Can a completed Workflow become active again?
55. When should a new Workflow Instance be created instead?
56. How should Workflow archival work?
57. How should workflow history appear in Content Package Workspace?
58. Should Workflow Events be exportable?
59. Which Events trigger notifications?
60. How should failure explanations be localized?
61. Which workflow metrics should be recorded?
62. How should average Agent duration and failure rate be calculated?
63. Should cancelled Agent Runs still count toward cost reports?
64. How should partial branch completion affect overall workflow state?
65. Can the Workflow be marked completed if Blog is approved but XHS branch is skipped?
66. Can a failed optional image Task allow Design completion?
67. How should a legal fallback update Node state?
68. How should manual Artifact creation integrate with Workflow Tasks?
69. Can the user upload an externally written Blog Version?
70. Can the user manually create an XHS Artifact without Packaging Agent?
71. How should imported Artifacts record provenance?
72. Which parts of the workflow remain valid after manual replacement?
73. How should future Publisher and Analytics Nodes join the Template?
74. How will Workflow Template migration work?
75. Can an active Workflow change Template Version?
76. How should old Workflow Templates remain executable?
77. How should Workflow Policy changes affect active Instances?
78. Which policy changes apply only to new Tasks?
79. When should a Workflow become `blocked` versus a Node becoming `blocked`?
80. How should system-wide outages affect Workflow states?

---

## 87. Documentation Updates

Create:

```text
docs/sessions/session-017.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-125
DEC-126
DEC-127
DEC-128
DEC-129
DEC-130
DEC-131
DEC-132
DEC-133
DEC-134
DEC-135
DEC-136
DEC-137
DEC-138
DEC-139
```

Future documents to create:

```text
docs/agents/chief-editor.md
docs/architecture/workflow-template.md
docs/architecture/workflow-policy.md
docs/architecture/workflow-instance.md
docs/architecture/workflow-node.md
docs/architecture/task-contract.md
docs/architecture/agent-run-contract.md
docs/architecture/artifact-promotion.md
docs/architecture/workflow-command.md
docs/architecture/workflow-event.md
docs/architecture/workflow-idempotency.md
docs/architecture/workflow-failure-recovery.md
docs/product/workflow-timeline.md
docs/product/workflow-controls.md
```

Possible future Schema files:

```text
schemas/workflow-template-v1.json
schemas/workflow-policy-v1.json
schemas/workflow-instance-v1.json
schemas/workflow-node-v1.json
schemas/workflow-command-v1.json
schemas/workflow-event-v1.json
schemas/task-v1.json
schemas/agent-run-v1.json
schemas/agent-input-snapshot-v1.json
schemas/artifact-promotion-result-v1.json
schemas/workflow-failure-v1.json
schemas/warning-acknowledgement-v1.json
```

These paths are suggestions rather than final implementation decisions.

---

## 88. Documentation Sync Checklist

- [x] DEC-125 confirmed
- [x] DEC-126 confirmed
- [x] DEC-127 confirmed
- [x] DEC-128 confirmed
- [x] DEC-129 confirmed
- [x] DEC-130 confirmed
- [x] DEC-131 confirmed
- [x] DEC-132 confirmed
- [x] DEC-133 confirmed
- [x] DEC-134 confirmed
- [x] DEC-135 confirmed
- [x] DEC-136 confirmed
- [x] DEC-137 confirmed
- [x] DEC-138 confirmed
- [x] DEC-139 confirmed
- [ ] Save this document as `docs/sessions/session-017.md`
- [ ] Add DEC-125 through DEC-139 to `docs/decisions/decisions.md`
- [ ] Define `content-package-dual-output/v1`
- [ ] Define Workflow Policy v1
- [ ] Define Workflow Instance Contract
- [ ] Define Workflow Node State model
- [ ] Define Task Contract
- [ ] Define Agent Run Contract
- [ ] Define Input Snapshot Contract
- [ ] Define Artifact Promotion flow
- [ ] Define Stale-on-arrival behavior
- [ ] Define Workflow Command Contract
- [ ] Define Expected Revision behavior
- [ ] Define Idempotency rules
- [ ] Define Workflow lock or lease behavior
- [ ] Define Workflow Event Contract
- [ ] Define Pause, Resume, Cancel, and Skip semantics
- [ ] Define Human Gate behavior
- [ ] Define Warning acknowledgement
- [ ] Define Failure Classification
- [ ] Define Retry and Repair policies
- [ ] Define Workflow Completion Policy
- [ ] Review AGENTS.md after Workflow specifications become authoritative

---

## 89. Session Summary

Chief Editor is the ContentOS workflow coordination layer.

It consists of:

```text
LLM Planner
+
Deterministic Executor
+
Versioned Workflow Policy
```

Planner understands user intent and proposes actions.

Executor performs authoritative state changes.

Workflow Policy defines legal transitions, dependencies, Gates, retry rules, and branch behavior.

The MVP uses a fixed, versioned Workflow Template rather than allowing LLM-created workflow graphs.

ContentOS separates:

```text
Artifact State
Workflow Node State
Workflow Instance State
```

Task, Agent Run, and Artifact Version are separate objects.

Every Agent Run uses a frozen, versioned Input Snapshot.

If upstream input changes during execution, the old-input result is preserved but cannot automatically become the current Review Candidate.

Agent output must pass a formal Promotion pipeline:

```text
Persist
→ Parse
→ Validate
→ Check Dependencies
→ Create Artifact Version
→ Check Eligibility
→ Promote
```

Blog and Xiaohongshu become parallel branches after the shared Content Foundation is ready.

The MVP uses a semi-automatic workflow:

```text
Human Gate approval
→ Automatic legal execution
→ Next Human Gate
```

All state-changing actions become structured Workflow Commands.

Chat may propose Commands, but Chat text itself is not an Approval.

Commands and Tasks use idempotency and revision-conflict detection.

Critical state transitions use short-lived serialization.

ContentOS records append-only Workflow Events without requiring full Event Sourcing.

Pause, Resume, Cancel, and Skip have distinct meanings and never silently delete historical Artifacts.

Failures are classified as:

```text
Validation Failure
Agent Execution Failure
Infrastructure Failure
Dependency Failure
Human Action Required
```

Retry and Repair remain limited and policy-controlled.

Warnings may be acknowledged.

Blocking Errors cannot be bypassed through an ordinary continue action.

The result is a workflow system in which Agent autonomy remains useful, but all authoritative state changes, approvals, dependencies, and recovery paths remain explicit and testable.