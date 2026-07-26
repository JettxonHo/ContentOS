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
