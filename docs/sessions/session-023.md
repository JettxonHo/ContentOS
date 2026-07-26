# ContentOS Session-023

**Status:** Formalized  
**Session Type:** Quality Assurance, Agent Evaluation, and Release Governance  
**Topic:** Tests, Agent Evals, Quality Metrics, Recovery Drills, Acceptance Criteria, and Release Gates  
**Date:** 2026-07-27  
**Accepted Decisions:** DEC-244～DEC-266  
**Previous Session:** Session-022  
**Next Session:** Session-024

---

## 1. Context

Previous Sessions established ContentOS as a complete AI-assisted content-production system:

```text
Source
→ Research
→ Human Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

The architecture now includes:

- Content Package
- Mutable Working Copy
- Immutable Version
- Artifact Head
- Version Dependency Graph
- Provenance
- Approval
- Workflow Template
- Workflow Instance
- Workflow Command
- Task
- Agent Run
- Model Call Attempt
- Agent Spec
- Prompt Template
- Model Configuration
- Model Adapter
- Model Router
- Runtime Policy
- Validation Profile
- Transactional Outbox
- BullMQ Queue
- Source Fetcher
- Renderer
- Security and deletion architecture
- Containerized deployment

The remaining quality question was:

> How does ContentOS prove that the system is reliable, the generated content is acceptable, critical invariants remain intact, and a release is safe to deploy?

This Session defines the testing, evaluation, acceptance, and release-governance model.

---

## 2. Quality-system Overview

ContentOS distinguishes four quality mechanisms:

```text
Tests
→ Verify deterministic system behavior

Agent Evals
→ Assess generative-output quality

Acceptance Gates
→ Decide whether a release is allowed

Production Monitoring
→ Detect regressions after release
```

These mechanisms are related but must not be treated as interchangeable.

---

## 3. Tests

Tests verify deterministic rules and expected system behavior.

Examples include:

- Immutable Versions cannot be overwritten.
- Working Copy revision conflicts return `409 Conflict`.
- Approval binds to one exact Version.
- A Blocking Error prevents Approval.
- Unapproved Research cannot enter Writer Agent input.
- Duplicate Queue delivery does not create duplicate Artifact Versions.
- A cancelled Task’s late result cannot be promoted.
- Final Export cannot use an invalid or stale dependency.
- Renderer cannot access the public internet.
- Deleted data cannot reappear in the active system after restore.

Most Test outcomes are:

```text
pass
fail
```

---

## 4. Agent Evals

Agent Evals assess qualities that cannot be completely expressed as deterministic rules.

Examples include:

- Whether Research covered the important information
- Whether Blog structure is clear
- Whether writing synthesizes rather than paraphrases Source order
- Whether Xiaohongshu pages form a coherent narrative
- Whether Caption complements rather than duplicates the Carousel
- Whether Visual hierarchy is appropriate
- Whether a selected Component fits the Page Purpose

Eval results may include:

- Dimension scores
- Critical Failure labels
- Pairwise preferences
- Judge notes
- Human-review notes
- Cost and latency
- Failure rate

Agent Eval does not replace deterministic Validation.

---

## 5. Acceptance Gates

Acceptance combines Tests, Evals, security results, performance, and operational evidence into a release decision.

Conceptually:

```text
Deterministic Tests pass
+
Security Gates pass
+
Critical Agent failures do not regress
+
Cost and latency stay within approved bounds
+
Complete Vertical Slice passes
→ Release Candidate may be approved
```

A Candidate may not pass merely because its average writing score is high.

---

## 6. Production Monitoring

After release, ContentOS continues monitoring:

- Schema Failure Rate
- Domain Validation Failure Rate
- Schema Repair Rate
- Domain Regeneration Rate
- Provider Fallback Rate
- Task Success Rate
- Queue Delay
- Outbox Lag
- Render Fit Failure
- Unsupported Claim findings
- First-person violations
- User Revision Requests
- Cost per approved Artifact
- Approval and edit behavior

Pre-release testing does not replace production-quality monitoring.

---

## 7. Core Quality Principles

ContentOS adopts:

```text
Deterministic Invariants First
Human-centered Evaluation
Versioned Evaluation Data
Critical Failures over Average Score
Paired Regression Comparison
Reproducible Eval Runs
No Hidden Production-data Reuse
```

---

## 8. Deterministic Rules First

A rule that can be verified by code must not be delegated to an LLM Judge.

Examples:

- Whether Evidence exists
- Whether a Direct Quote matches the Source
- Whether a Version is Approved
- Whether an Artifact depends on the correct Version
- Whether a Component exists
- Whether a First-person statement traces to Confirmed Human Opinion
- Whether the Owner is authorized
- Whether a Blocking Error exists
- Whether an Export is eligible

These rules are enforced through:

- Domain logic
- Schema Validation
- Domain Validators
- Database constraints
- Workflow Policy
- Authorization
- Deterministic tests

---

## 9. Hard Gates and Dimension Scores

ContentOS uses:

```text
Hard Gates
+
Independent Quality Dimensions
```

A Hard Gate failure cannot be offset by high scores elsewhere.

Example:

```text
Clarity: high
Structure: high
Grounding: failed
```

The output remains unacceptable.

ContentOS does not reduce all quality to one universal score such as:

```text
AI Quality Score: 82
```

---

## 10. Quality Dimensions

Relevant dimensions may include:

```text
Grounding
Coverage
Evidence Precision
Evidence Recall
Faithfulness
Human Opinion Fidelity
First-person Integrity
Citation Correctness
Synthesis Quality
Structure
Clarity
Readability
Platform Fit
Narrative Flow
Visual Integrity
Cost
Latency
Reliability
```

Each Agent uses the dimensions relevant to its own responsibility.

---

## 11. Test Architecture

The accepted Test hierarchy is:

```text
Static and Contract Tests
        ↓
Domain Unit Tests
        ↓
Validator Tests
        ↓
Repository and Migration Tests
        ↓
API Integration Tests
        ↓
Queue and Worker Tests
        ↓
Workflow Scenario Tests
        ↓
Agent Runtime Deterministic Tests
        ↓
Agent Evals
        ↓
End-to-end Vertical Slice
        ↓
Security and Recovery Drills
```

---

## 12. Static Tests

Static checks include:

- TypeScript strict Typecheck
- Lint
- Formatting
- Circular Workspace dependency detection
- Domain-to-Infrastructure import violations
- Unhandled Promise checks
- Unsafe type checks
- Secret-pattern scan
- Dependency vulnerability scan
- Dead configuration references

Static checks provide early feedback but do not replace Runtime Validation.

---

## 13. Contract Tests

Contract Tests verify:

- JSON Schema validity
- Unique Schema `$id`
- Schema Version
- Schema draft consistency
- Agent Spec references
- Prompt Template references
- Runtime Policy references
- Validation Profile references
- Model Configuration references
- Workflow Template references
- Component Registry references
- Export Manifest compatibility
- OpenAPI and generated-client synchronization

Missing or incompatible Contracts must fail before production execution.

---

## 14. Schema Compatibility Tests

A new Schema Version must be tested for:

- New Reader support for permitted historical Versions
- New Writer producing the intended Schema
- Breaking-change detection
- Major Schema Version requirements
- Historical Artifact rendering
- Historical Artifact export
- Workflow compatibility
- Migration requirements

A Schema is not considered safe merely because its own definition is valid.

---

## 15. Domain Unit Tests

Each Domain Module tests its own invariants.

### Content Package

- Package creation
- Owner assignment
- Requested branches
- Content Mode
- Archive
- Current references

### Artifact Versioning

- Working Copy revision
- Immutable Version creation
- Parent Version
- Version Number
- Content Hash
- Artifact Head
- Restore-as-new-Version
- Historical Version preservation

### Approval

- Exact Version binding
- Blocking Error prevention
- Warning acknowledgement
- Approval history
- Approved Head update

### Dependency

- Exact upstream Version dependency
- Immutable Dependency Edge
- Outdated propagation
- Historical validity
- Dependency-cycle prevention

---

## 16. Validator Tests

Every Validator requires at least:

```text
valid fixture
invalid fixture
boundary fixture
adversarial fixture
```

Examples for First-person Validation:

- Confirmed first-person opinion
- Unconfirmed personal experience
- Research-based Mode with invented experience
- Quoted first-person Source text
- Ambiguous first-person sentence
- Editorial Expression linked to Confirmed Opinion

Validator behavior must be reproducible and explainable.

---

## 17. Repository Tests

Repository Tests use real PostgreSQL behavior to verify:

- Table constraints
- Unique constraints
- Foreign keys
- Transactions
- Row locks
- Optimistic concurrency
- Version Number allocation
- Artifact Head updates
- Idempotency
- Outbox persistence
- Task Lease
- Ownership
- Archive state

Mock Repository tests alone are insufficient for relational invariants.

---

## 18. Migration Tests

Every Migration must support:

```text
Empty Database
→ Apply all migrations
```

```text
Previous supported schema
→ Apply latest migrations
```

```text
Realistic seeded data
→ Apply migration
→ Verify invariants
```

Migration verification includes:

- Backfill completeness
- Artifact Head validity
- Version history preservation
- Approval preservation
- Dependency preservation
- Object Reference validity
- Owner preservation
- Outbox correctness
- Idempotency constraints

---

## 19. API Integration Tests

API Integration Tests use:

- Real NestJS API
- Real PostgreSQL
- Authentication
- Authorization
- Repository Adapters
- Application Use Cases

They verify:

- Login and Session
- Owner authorization
- Query APIs
- Working Copy autosave
- Revision conflict
- Version creation
- Workflow Commands
- Idempotency
- Error Contract
- Cursor Pagination
- SSE authorization
- Temporary file access
- Archive
- Delete Request

---

## 20. Queue and Worker Tests

Queue tests verify:

- Outbox dispatch
- Duplicate Outbox delivery
- Duplicate Queue Job
- Provider Retry
- Provider Fallback
- Worker crash
- Lease expiry
- Cancellation
- Late result
- Redis temporary outage
- Redis data loss
- Reconciliation
- Duplicate Promotion prevention

---

## 21. Critical Queue Invariants

The following outcomes are mandatory:

```text
Same Task processed twice
→ No duplicate Artifact Version
```

```text
Database commits but queue dispatch fails
→ Outbox later redispatches
```

```text
Worker finishes but Queue acknowledgement fails
→ Redelivery returns existing result
```

```text
Worker crashes
→ Expired Lease allows recovery
```

```text
Workflow is cancelled
→ Late result cannot be promoted
```

```text
Redis loses queue state
→ PostgreSQL Reconciliation recreates eligible Jobs
```

---

## 22. Workflow Scenario Tests

Workflow testing covers complete scenarios rather than isolated methods.

Primary scenario:

```text
Create Package
→ Capture Source
→ Approve Source
→ Generate Research
→ Correct Research
→ Approve Research
→ Confirm Human Opinion
→ Generate Blog and Xiaohongshu in parallel
→ Approve Xiaohongshu
→ Generate Design
→ Approve Design
→ Final Render
→ Export
```

Failure and alternative scenarios include:

- Source Capture Failure
- Pasted-text fallback
- Research Validation Failure
- Research correction
- Human Opinion Skip
- Research-based Mode
- Blog Agent failure
- Xiaohongshu branch cancellation
- Design outdated
- Asset generation failure
- Render Retry
- Workflow Pause
- Workflow Resume
- Upstream Version replacement
- Delete Request

---

## 23. Workflow Invariant Testing

Property-based or model-based tests may generate Command sequences and check:

- Unknown states are never entered.
- Approved Versions always exist.
- Completed Nodes never depend on unapproved inputs.
- Cancelled Workflows do not create new Tasks.
- Final Export always uses eligible dependencies.
- Historical Versions are never overwritten.
- Outdated Artifacts are not treated as current publishing candidates.
- Duplicate Commands remain idempotent.

The generated test data does not determine correctness; Workflow rules do.

---

## 24. Agent Runtime Deterministic Tests

Fake Provider Fixtures test:

- Successful Structured Output
- Malformed JSON
- Deterministic normalization
- Schema Repair
- Domain Regeneration
- Provider Timeout
- Rate Limit
- Provider unavailable
- Fallback
- Context Capacity Error
- Budget Exceeded
- Cancellation
- Safety Refusal
- Content filtering
- Raw Output persistence
- Frozen Input Snapshot
- Prompt Version preservation
- Model Call Attempt history
- Validation before Promotion
- Late result handling

These tests do not require a real model.

---

## 25. Agent Eval Objects

ContentOS defines:

```text
Eval Dataset
Eval Case
Eval Configuration
Eval Run
Eval Case Result
Metric Result
Judge Run
Human Review
Baseline
Release Evaluation
```

These objects are versioned and auditable.

---

## 26. Eval Dataset

Eval Dataset represents a versioned group of cases for one Agent or quality domain.

Conceptual structure:

```json
{
  "eval_dataset_id": "research-core",
  "dataset_version": 1,
  "agent_type": "research",
  "status": "active",
  "case_count": 0
}
```

Dataset changes create a new Version.

---

## 27. Eval Case

An Eval Case may contain:

- Input objects
- Source material
- Human Opinion where relevant
- Generation Request
- Expected invariants
- Gold Evidence
- Required facts
- Forbidden facts
- Rubric
- Known risks
- Critical Failure labels
- Data classification
- Source and usage rights

A Case does not require one exact prose answer.

---

## 28. Eval Configuration

Eval Configuration fixes:

- Agent Spec Version
- Prompt Template Version
- Model Configuration
- Runtime Policy
- Validation Profile
- Parser Version
- Deterministic Validator Versions
- Judge Configuration
- Dataset Version

Changing any of these produces a different Eval Configuration.

---

## 29. Eval Run

Eval Run records:

- Dataset Version
- Case IDs
- Candidate Configuration
- Baseline Configuration
- Runtime
- Provider
- Execution time
- Token Usage
- Cost
- Case Results
- Failure summary
- Randomization metadata
- Judge Runs
- Human Reviews

Eval Runs are immutable historical records.

---

## 30. Eval Dataset Groups

ContentOS uses four major Dataset groups:

```text
Core Regression Set
Adversarial Set
Holdout Set
Production-derived Regression Set
```

---

## 31. Core Regression Set

Core Set covers normal high-value cases:

- One clear Primary Source
- Multiple Supporting Sources
- Creator-led Mode
- Research-based Mode
- Chinese long-form content
- Short Source
- Conflicting but resolvable Source
- Blog and Xiaohongshu dual output
- Standard eight-page Carousel
- Standard Design flow

Developers may use this Set during everyday iteration.

---

## 32. Adversarial Set

Adversarial cases include:

- Source conflict
- Missing Source
- Prompt Injection
- Hidden instruction
- Long context
- Incorrect numeric claims
- Similar but contradictory facts
- Missing Citation
- First-person fabrication temptation
- Nonexistent Component
- Excessive page density
- Provider truncation
- Malformed JSON
- Asset failure
- Safety refusal
- Context-capacity pressure

---

## 33. Holdout Set

Holdout Set is reserved for independent release validation.

It is not used continuously for Prompt-specific tuning.

Its purposes are:

- Detecting overfitting
- Evaluating new Prompt or Model candidates
- Validating Agent Spec changes
- Checking performance on less familiar cases
- Supporting final Release Gates

Holdout expectations should not be repeatedly modified to help a Candidate pass.

---

## 34. Production-derived Regression Set

A real production failure may become a regression Case only when:

- Personal information is removed
- Sensitive content is not copied unnecessarily
- Usage is permitted
- The issue is represented as a safe pattern
- The related defect or incident is recorded
- Dataset review approves inclusion

Production user data does not automatically become Eval data.

---

## 35. Eval Data Security

Default Eval sources are:

- Synthetic cases
- Public and permitted Sources
- Purpose-built fixtures
- De-identified issue patterns

Default exclusions include:

- Raw Human Opinion
- Private upload
- Unpublished Blog
- Production Raw Prompt
- Provider Secret
- Private Render Output

Any exception requires explicit authorization and policy.

---

## 36. Gold Constraints

For generative content, Gold data should primarily define:

- Facts that must appear
- Facts that must not appear
- Required Evidence
- Acceptable Citation
- Required Human Opinion
- Prohibited First-person claims
- Required Page Purpose
- Allowed Components
- Rubric criteria
- Critical Failure conditions

The goal is not to reproduce one reference article word for word.

---

## 37. Exact Match

Exact Match is appropriate for:

- Schema
- Enum
- ID
- Direct Quote
- Numeric fact
- Citation URL
- Component Name
- Manifest field
- Deterministic file
- Exact dependency identity

It is not the primary metric for:

- Blog prose
- Title creativity
- Caption wording
- Summary language
- Visual reasoning explanation

---

## 38. Research Agent Eval

Research Agent dimensions include:

### Source Coverage

Whether important Source information and themes are covered.

### Evidence Precision

Whether linked Evidence truly supports each Research Item.

### Evidence Recall

Whether important factual claims requiring Evidence have Evidence.

### Unsupported Claim Rate

The proportion of concrete claims lacking formal Evidence.

### Conflict Handling

Whether conflicting Sources are distinguished rather than silently merged.

### Source-role Awareness

Whether Primary and Supporting Sources are treated correctly.

### Needs-verification Handling

Whether uncertainty is preserved.

### Instruction Resistance

Whether malicious Source instructions are ignored.

---

## 39. Human Opinion Flow Eval

Human Opinion evaluation includes:

- Question relevance
- Question duplication
- Leading-question risk
- AI Interpretation fidelity
- Confirmed Statement fidelity
- Original Response traceability
- Creator-led versus Research-based behavior
- First-person eligibility
- Follow-up limits
- Skip behavior

The system must not treat generated interpretation as confirmed user opinion.

---

## 40. Writer Agent Eval

Writer dimensions include:

### Grounding

Concrete facts trace to approved Research Evidence.

### Human Opinion Fidelity

User opinion is preserved without distortion.

### First-person Integrity

First-person text uses confirmed eligible Human Opinion.

### Synthesis Quality

The article synthesizes ideas rather than following Source order mechanically.

### Structure

The title, introduction, sections, transitions, and conclusion are coherent.

### Citation Correctness

Citations support the relevant claims.

### Direct Quote Integrity

Quoted text matches exact Evidence.

### Source-overlap Risk

The output does not excessively copy Source wording.

### Readability

The article is clear and appropriate for its audience.

---

## 41. Packaging Agent Eval

Packaging dimensions include:

### Content Fidelity

Xiaohongshu content remains faithful to Research and Human Opinion.

### Narrative Flow

The Carousel moves coherently from Hook to explanation and takeaway.

### Page Purpose

Each page has one clear primary function.

### Density

Pages avoid excessive text, empty filler, and multiple competing topics.

### Title Separation

Platform Title, Cover Title, and Page Heading maintain distinct roles.

### Caption Complementarity

Caption adds context rather than repeating the Carousel.

### First-person Integrity

Creator-led and Research-based rules are respected.

### Platform Profile Compliance

The output follows the exact Platform Profile Version.

---

## 42. Visual Agent Eval

Visual dimensions include:

### Content Binding

Design elements bind to the correct content fields.

### Component Validity

Only registered Components are used.

### Information Hierarchy

Primary and supporting information are visually distinguishable.

### Semantic Fit

The chosen Component matches the Page Purpose.

### Asset Policy

Generated images do not carry required precise text or factual diagrams.

### Theme Compliance

The Design follows the Brand Theme.

### Fit Risk

The layout does not create obvious overflow or density risk.

### Cross-page Consistency

The Carousel maintains a coherent visual system.

---

## 43. Render Evaluation

Render primarily uses deterministic validation.

Checks include:

- Page count
- Dimensions
- File type
- MIME
- File hash
- Font presence
- Missing Asset
- Text overflow
- Clipping
- Element overlap
- Empty Page
- Pixel ratio
- Manifest consistency
- Environment Fingerprint
- No unauthorized network request

---

## 44. Screenshot Regression

Controlled Render Fixtures use Golden Screenshots.

Flow:

```text
Design Fixture
→ Fixed Renderer Container
→ Render
→ Pixel comparison with approved baseline
```

Regression handling may account for:

- Anti-aliasing tolerance
- Approved Browser changes
- Approved Font changes
- Masked dynamic regions
- Known non-content variation

Pixel-diff thresholds may vary by Component and scenario.

---

## 45. Renderer-change Gate

The following changes trigger full Render Regression:

- Playwright
- Chromium
- Linux base image
- Font Bundle
- Component Registry
- Theme
- Render CSS
- Render Profile
- Pixel ratio
- Screenshot library

Infrastructure changes may affect pixels even when business logic does not change.

---

## 46. LLM-as-Judge Boundary

LLM-as-Judge may assist with:

- Clarity
- Structure
- Readability
- Synthesis quality
- Narrative flow
- Title separation
- Style consistency
- Pairwise preference

It cannot be the sole authority for:

- Evidence existence
- Direct Quote exactness
- Approval validity
- Authorization
- First-person provenance
- Component existence
- Secret leakage
- Deletion completeness
- Dependency identity

---

## 47. Judge Configuration

Judge Run records:

- Judge Model Configuration
- Judge Prompt Version
- Rubric Version
- Candidate order
- Input
- Temperature
- Output
- Token Usage
- Cost
- Failure
- Randomization information

A Judge upgrade does not rewrite historical results.

---

## 48. Pairwise Evaluation

Candidate and Baseline outputs should often be compared anonymously.

Process:

```text
Baseline output
vs
Candidate output
```

Reviewer evaluates:

- Faithfulness
- Clarity
- Structure
- Synthesis
- Platform Fit
- Overall preference
- Critical Failure

To reduce Position Bias:

- Randomize A/B order
- Hide configuration names
- Repeat a sample with reversed order
- Monitor preference reversal
- Separate deterministic failures from stylistic preference

---

## 49. Human Calibration

Before Judge results become release signals, they must be compared with human review.

Calibration evaluates:

- Agreement with human ranking
- Critical Failure miss rate
- Long-text behavior
- Style preference bias
- Self-model preference
- Position Bias
- Fluency-over-factuality bias
- Confidence reliability

An uncalibrated Judge remains informational.

---

## 50. Human Review Rubric

Human Review must be structured.

Recommended fields:

- Dimension Score
- Critical Failure
- Evidence Note
- Preference
- Revision Reason
- Reviewer Confidence
- Additional comment

A note such as “feels good” is not sufficient release evidence.

---

## 51. Baseline

Each Agent maintains an approved Baseline configuration.

Example:

```text
writer-agent/v1
prompt-v4
model-config-A
runtime-policy-v1
validation-profile-v1
```

Candidate and Baseline run against the same Dataset Version.

The Baseline remains available for rollback.

---

## 52. Regression Analysis

Candidate evaluation checks:

- Critical Failure count
- Per-dimension change
- Case-level regressions
- Cost regression
- Latency regression
- Schema Repair Rate
- Domain Regeneration Rate
- Provider Fallback Rate
- Success Rate

An improvement in style does not compensate for new unsupported facts.

---

## 53. Zero-tolerance Invariants

The following are release-blocking:

```text
Unauthorized access
Secret leakage
Approval bypass
Historical Version overwrite
Owner data crossover
Blocking Error bypass
Direct Quote without Evidence
Fabricated first-person experience
Illegal Dependency Promotion
Cancelled late-result Promotion
Final Export using stale or invalid dependencies
Renderer unauthorized network access
Deleted data returning to the active system
Duplicate Artifact Promotion
```

These failures are not eligible for average-score trade-offs.

---

## 54. Threshold-based Metrics

The following may use controlled thresholds:

- Schema Repair Rate
- Domain Regeneration Rate
- Provider Fallback Rate
- User edit distance
- Revision Request rate
- Direct Approval rate
- Render Fit Warning rate
- Average Task duration
- Queue delay
- Token usage
- Cost
- Judge clarity
- Human preference

Final values are determined from Baseline and deployment data.

---

## 55. Cost Evaluation

Agent Candidate cost includes:

- Input Tokens
- Output Tokens
- Repair cost
- Regeneration cost
- Fallback cost
- Judge cost
- Failed attempts
- Successful Promotion rate

The preferred metric is:

```text
Total Cost per Valid Promoted Artifact
```

Comparing only the price of one model call is insufficient.

---

## 56. Latency Evaluation

Latency is decomposed into:

```text
Queue Wait
Context Build
Provider Latency
Parse
Schema Validation
Domain Validation
Repair
Promotion
Total Task Duration
```

This allows the system to distinguish Provider latency from Queue, Validation, or database problems.

---

## 57. Reliability Evaluation

Key reliability metrics include:

- Task Success Rate
- Agent Run Success Rate
- First-attempt Success Rate
- Repair Rate
- Regeneration Rate
- Fallback Rate
- Reconciliation Recovery Rate
- Duplicate Promotion Count
- Stuck Task Count
- Outbox Lag
- Render Retry Rate

---

## 58. User-edit Signals

User behavior may provide quality signals:

- Draft-to-Approved Diff
- Full rewrite rate
- Field-level edit frequency
- Proposal acceptance rate
- Direct Approval rate
- Revision Request count
- Branch abandonment
- Approval time

These signals do not prove content quality by themselves.

---

## 59. Feedback Governance

User feedback may create:

- Feedback Label
- Defect
- Regression Case proposal
- Prompt-improvement hypothesis
- UX issue
- Validator issue

Feedback does not automatically:

- Modify Prompt
- Modify Agent Spec
- Change Model Router
- Train a model
- Change Platform Profile
- Change Release Baseline

All configuration changes remain versioned and reviewed.

---

## 60. Performance Testing

Performance testing covers:

### API

- Dashboard Query
- Package Overview
- Working Copy autosave
- Version List
- Workflow Command
- SSE connection

### Database

- Artifact Head lookup
- Dependency queries
- Workflow Timeline
- Outbox batch
- Reconciliation
- Version creation

### Queue

- Parallel Agent Jobs
- Render Jobs
- Backlog recovery
- Worker concurrency
- Retry load

### Renderer

- One page
- Eight-page Carousel
- Large Assets
- Multiple jobs
- Browser recycle
- Memory use

---

## 61. Performance Intent

The personal MVP does not need internet-scale throughput.

Performance Gate exists to ensure:

- No obvious N+1 behavior
- Autosave remains responsive
- Dashboard is usable
- Eight-page Render does not exhaust memory
- Blog and Xiaohongshu branches do not deadlock
- Queue backlog can recover
- Worker concurrency matches the host budget
- Database queries remain bounded

Thresholds are calibrated on the intended deployment hardware.

---

## 62. Security Release Gate

Session-021 security tests enter the formal release process:

- Authentication
- Authorization
- Prompt Injection
- SSRF
- Upload
- Secret handling
- Logging and redaction
- Export safety
- Deletion
- Backup Restore

Release is blocked by:

- Unresolved Critical or High vulnerability
- Owner authorization bypass
- Secret leakage
- SSRF access to internal destinations
- Export containing restricted files
- Deletion falsely marked complete
- Deleted data returning after restore

---

## 63. Recovery Drills

ContentOS requires practical recovery exercises:

- Worker Crash Drill
- Redis Loss Drill
- Provider Outage Drill
- Object Storage Failure Drill
- Database Restore Drill
- Deletion Restore Drill
- Renderer Crash Drill
- Outbox Delay Drill

Recovery is evaluated by the final domain state, not merely whether a process restarted.

---

## 64. End-to-end Vertical Slice

The primary MVP acceptance path is:

```text
Create Content Package
→ Add URL or pasted Source
→ Capture and normalize
→ Generate and review Research
→ Confirm or skip Human Opinion
→ Generate Blog
→ Generate Xiaohongshu
→ Approve Xiaohongshu
→ Generate Design
→ Preview
→ Approve Design
→ Final Render
→ Export
```

---

## 65. Vertical Slice Failure Coverage

Acceptance also covers:

- Source Capture failure and pasted-text fallback
- Research correction
- Human Opinion Skip
- Blog and Xiaohongshu parallel execution
- Xiaohongshu Revision Request
- Asset failure and deterministic degradation
- Render Retry
- Upstream Research Version making downstream Artifacts outdated
- Workflow Pause
- Workflow Resume
- Browser refresh and state recovery
- Duplicate Workflow Command
- Duplicate Queue Job
- Export eligibility enforcement

---

## 66. UX Acceptance

MVP UX acceptance checks:

- Current stage is always visible.
- Next action is clear.
- Warning and Blocking Error are distinct.
- Working Copy, Review Candidate, and Approved Version are distinct.
- AI Proposal never silently overwrites content.
- Outdated status is understandable.
- Task progress and failure are visible.
- Refresh does not lose authoritative state.
- Privileged operations use clear confirmation.
- Export is not confused with Published.
- Recovery actions are presented where possible.

---

## 67. Accessibility Baseline

The MVP includes:

- Keyboard navigation
- Visible Focus
- Form labels
- Field-linked errors
- Status not communicated by color alone
- Logical heading hierarchy
- Image alternative text
- Contrast checks
- Accessible Loading states
- Accessible Progress states

Accessibility is part of frontend acceptance rather than a post-MVP afterthought.

---

## 68. Browser Acceptance

The initial desktop browser matrix prioritizes:

- Current Chromium-based desktop browser
- Current Safari desktop browser

Mobile creation is not a full MVP acceptance target.

Mobile may support limited:

- Viewing
- Review
- Human Opinion response
- Export access

---

## 69. Definition of Done

A feature is not complete merely because code has been merged.

Definition of Done includes:

```text
Domain rule implemented
Tests added
Contracts updated
Migration added where needed
Authorization checked
Error states handled
Observability added
Documentation updated
Feature Flag handled where relevant
Acceptance scenario passed
```

Agent-related work also includes:

```text
Eval Case added
Baseline comparison completed
Cost recorded
Failure Fixtures added
```

---

## 70. CI Tiers

ContentOS uses three CI and release tiers.

---

## 71. Tier 1: Pull Request Fast Gate

Runs:

- Lint
- Formatting
- Typecheck
- Static security checks
- Contract Tests
- Schema Tests
- Domain Unit Tests
- Validator Tests
- Fast Repository Tests
- Fake Provider Agent Runtime Tests
- Dependency checks

Purpose:

- Fast developer feedback
- Blocking structural defects before merge

---

## 72. Tier 2: Main Integration Gate

Runs:

- Full PostgreSQL integration
- Redis and BullMQ integration
- Migration Tests
- API Integration
- Workflow Scenarios
- Queue and Worker recovery tests
- Renderer Component Snapshots
- Security integration tests
- E2E API flows

Purpose:

- Validate the merged system as a complete application

---

## 73. Tier 3: Release Gate

Runs:

- Full affected Agent Eval
- Holdout Eval
- Pairwise Baseline Comparison
- Human Review sample
- Full Render Regression
- Performance Tests
- Security Tests
- Recovery Drills
- Staging Vertical Slice
- Container vulnerability scan
- Deployment smoke test

Purpose:

- Decide whether a release may enter production

---

## 74. Eval Frequency

### Prompt Template Change

Run:

- Relevant Core Regression Set
- Relevant Adversarial Set
- Cost comparison
- Baseline pairwise comparison

### Model Configuration Change

Run:

- Full affected Agent Eval
- Provider Integration
- Cost and latency
- Repair and fallback analysis
- Holdout sample

### Agent Spec or Schema Change

Run:

- Full Agent Eval
- Contract compatibility
- Workflow Scenarios
- Human Review
- Promotion compatibility

### Formal Release

Run:

- Complete Release Evaluation
- Holdout
- Security
- Render Regression
- Vertical Slice
- Recovery checks

---

## 75. Prompt Release Governance

Prompt Templates are production configuration.

Prompt changes may alter:

- Grounding
- Citation
- First-person behavior
- Page count
- Structure
- Style
- Cost
- Schema Repair Rate

Therefore every Prompt change requires:

- New Version
- Review
- Eval
- Baseline comparison
- Release approval
- Rollback target

Unversioned production Prompt editing is prohibited.

---

## 76. Model Release Governance

A new Model Configuration is not approved merely because the model is marketed as stronger.

It must be tested for:

- Structured Output
- Context Capacity
- Chinese quality
- Safety refusal
- Cost
- Latency
- Schema Repair Rate
- Domain Validation
- Provider error behavior
- Full affected Agent Eval

---

## 77. Agent Spec Release Governance

Agent Spec changes require checking:

- Input Contract
- Output Contract
- Validator compatibility
- Workflow Template compatibility
- Candidate Promotion
- Stored Artifact compatibility
- Eval Profile
- API Contract
- Documentation

Breaking behavior requires a new Agent Spec Version.

---

## 78. Release Gate Categories

Release Gates are classified as:

```text
Blocking
Conditional
Informational
```

### Blocking

Failure prevents release.

### Conditional

Release requires explicit approval, risk documentation, and monitoring.

### Informational

Tracked for optimization but does not determine correctness.

---

## 79. Blocking Gates

The minimum Blocking Gates include:

- Typecheck
- Contract validity
- Migration validity
- Domain Unit Tests
- Critical Workflow Scenarios
- Authorization
- No unresolved Critical Security Finding
- Zero-tolerance invariants
- No duplicate Promotion
- Final Render Validation
- Complete Vertical Slice
- No new Agent Critical Failure
- No critical Holdout regression

---

## 80. Conditional Gates

Possible Conditional Gates include:

- Small cost increase
- Small latency increase
- Non-critical style decrease
- Moderate Repair Rate change
- Moderate Provider Fallback change
- Non-core Screenshot difference

Conditional approval records:

- Risk
- Reason
- Owner
- Follow-up action
- Monitoring metric
- Rollback condition

---

## 81. Informational Metrics

Examples:

- Title preference
- Caption length
- Edit distance
- Time to Approval
- Page navigation
- Token distribution
- Provider cache behavior
- Non-critical style scores

Informational metrics support optimization but do not replace correctness checks.

---

## 82. Release Evaluation Record

Every formal release creates a Release Evaluation Record.

Conceptual structure:

```json
{
  "release_evaluation_id": "releaseeval_001",
  "release_version": "contentos-0.1.0",
  "status": "approved",
  "blocking_gate_results": [],
  "conditional_gate_results": [],
  "eval_run_ids": [],
  "security_result_ids": [],
  "approved_by": {
    "actor_type": "user",
    "actor_id": "user_001"
  }
}
```

Release Evaluation is immutable historical evidence.

---

## 83. Rollback Conditions

Rollback or Feature Disable may be triggered by:

- Secret leakage
- Authorization bypass
- Approval bypass
- Duplicate Promotion
- Data loss
- Unsupported Claim increase
- First-person fabrication
- Systemic Render failure
- Cost runaway
- Provider refusal spike
- Deletion failure
- Large stuck-Task increase
- Queue recovery failure

Prompt, Model Configuration, Agent Spec, and Feature Flags should support independent rollback.

---

## 84. Production Quality Monitoring

Recommended production indicators:

```text
Schema Failure Rate
Domain Validation Failure Rate
Repair Rate
Regeneration Rate
Fallback Rate
Task Success Rate
Revision Request Rate
User Edit Distance
Unsupported Claim findings
First-person violations
Render Fit Failure
Queue Wait
Outbox Lag
Cost per approved Artifact
```

Alerts should focus on meaningful changes rather than isolated normal variation.

---

## 85. Input and Requirement Drift

Quality may regress even without code or Prompt changes.

Possible causes:

- Longer Sources
- More Supporting Sources
- More private business documents
- More technical Chinese topics
- Platform Profile changes
- Different user writing goals
- Different Source quality

Eval Dataset must evolve through controlled governance.

---

## 86. Eval Dataset Governance

Dataset changes record:

- Added Case
- Removed Case
- Changed Rubric
- Changed Gold Evidence
- Changed Critical Failure
- Data source
- Reason
- Reviewer
- Dataset Version

A Candidate failure must not be resolved by silently weakening the Dataset.

---

# 87. Decisions

## DEC-244

### Status

Accepted

### Title

ContentOS 明确区分 Tests、Agent Evals、Acceptance Gates 与 Production Monitoring

### Decision

Tests verify deterministic system behavior.

Agent Evals assess generative quality.

Acceptance Gates determine release eligibility.

Production Monitoring detects regressions and drift after deployment.

### Reason

Treating all quality activity as one form of testing obscures the difference between deterministic rules and generative quality.

### Impact

CI, Eval Harness, Release Evaluation, and Monitoring use distinct but linked Contracts.

---

## DEC-245

### Status

Accepted

### Title

所有可确定的安全与领域规则优先使用代码测试和 Validator

### Decision

Approval, Dependency, First-person Provenance, Direct Quote Evidence, Component Validity, Authorization, Export Eligibility, and other deterministic rules are validated through code.

LLM Judge is not authoritative for these rules.

### Reason

Deterministic constraints should not depend on probabilistic model judgment.

### Impact

Agent Evals focus on quality dimensions that cannot be fully determined through code.

---

## DEC-246

### Status

Accepted

### Title

质量评估使用 Hard Gates 与独立维度分数，不使用单一万能质量分

### Decision

ContentOS preserves independent dimensions such as Grounding, Coverage, Faithfulness, Structure, Clarity, Platform Fit, Visual Integrity, Cost, Latency, and Reliability.

Critical Failure triggers a Hard Gate.

Average score cannot compensate for critical defects.

### Reason

A universal score would hide severe factual, permission, provenance, and reliability failures.

### Impact

Release Evaluation reports dimension results and Critical Failures separately.

---

## DEC-247

### Status

Accepted

### Title

ContentOS 建立分层测试体系覆盖 Domain、Database、API、Queue、Workflow 与 E2E

### Decision

The test hierarchy includes:

- Static
- Contract
- Domain Unit
- Validator
- Repository
- Migration
- API Integration
- Queue and Worker
- Workflow Scenario
- Agent Runtime deterministic tests
- End-to-end Vertical Slice

### Reason

No single Test layer can cover the complete ContentOS risk surface.

### Impact

Each module requires a formal Test Matrix.

---

## DEC-248

### Status

Accepted

### Title

Workflow 通过场景测试与状态不变量测试共同验证

### Decision

ContentOS tests complete Happy Paths and Failure Paths including Pause, Resume, Cancel, Retry, Outdated, and Delete behavior.

Property-based or model-based tests validate Workflow invariants across Command sequences.

### Reason

Workflow defects often emerge through combinations of individually valid actions.

### Impact

Workflow Templates and Policies require executable scenario Fixtures.

---

## DEC-249

### Status

Accepted

### Title

Queue 和 Worker 必须通过重复投递、Crash、Lease 与 Reconciliation 测试

### Decision

Release testing verifies:

- At-least-once delivery
- Duplicate Job
- Worker Crash
- Lease expiry
- Redis loss
- Outbox Retry
- Cancellation
- Late Result
- Duplicate Promotion prevention

### Reason

Recovery behavior is part of the architecture’s correctness rather than an optional production optimization.

### Impact

Fault Injection and Recovery Scenarios are included in integration testing.

---

## DEC-250

### Status

Accepted

### Title

Agent Runtime 使用 Fake Provider 完成确定性执行测试

### Decision

Parse, Schema Validation, Repair, Regeneration, Fallback, Budget, Cancellation, Raw Output, and Promotion behavior are tested with deterministic Fake Provider Fixtures.

Real models are reserved for Agent Eval and Provider Integration.

### Reason

Daily tests cannot depend on model randomness, network availability, or cost.

### Impact

Every Runtime Failure Classification requires a Fixture.

---

## DEC-251

### Status

Accepted

### Title

ContentOS 建立版本化 Eval Dataset、Eval Case 和 Eval Run

### Decision

Agent Eval uses versioned objects:

- Eval Dataset
- Eval Case
- Eval Configuration
- Eval Run
- Metric Result
- Judge Run
- Human Review
- Baseline
- Release Evaluation

### Reason

Prompt, model, and Agent configuration require a repeatable and auditable evaluation foundation.

### Impact

Every Release Eval stores a complete Eval Manifest.

---

## DEC-252

### Status

Accepted

### Title

Eval Dataset 分为 Core、Adversarial、Holdout 与 Production-derived Regression Set

### Decision

Core Set supports regular development.

Adversarial Set covers high-risk cases.

Holdout Set supports independent pre-release validation.

Production-derived Set contains only reviewed, permitted, de-identified issue patterns.

### Reason

One visible Dataset encourages overfitting and misses important real-world failures.

### Impact

Dataset changes require Versioning, reason, and review.

---

## DEC-253

### Status

Accepted

### Title

生产用户内容默认不得进入 Agent Eval Dataset

### Decision

Eval Dataset defaults to synthetic data, permitted public data, and purpose-built cases.

Production user data may be used only through explicit authorization, de-identification, and a separate data policy.

### Reason

Agent Eval must not become a hidden channel for data duplication or secondary use.

### Impact

Eval Harness follows ContentOS data classification and Retention Policies.

---

## DEC-254

### Status

Accepted

### Title

生成式内容不使用逐字 Gold Answer，改用事实约束、Evidence 与 Rubric

### Decision

Blog, Caption, Title, and other generative outputs are evaluated using:

- Required facts
- Forbidden facts
- Evidence
- Human Opinion Fidelity
- Structure Rubric
- Style Rubric
- Critical Failure

Exact Match is reserved for appropriate structural and precise information.

### Reason

High-quality generated content rarely has one unique textual answer.

### Impact

Eval Cases store structured Gold Constraints rather than one reference article.

---

## DEC-255

### Status

Accepted

### Title

每类 Agent 使用独立质量维度和失败标签

### Decision

Research, Human Opinion, Writer, Packaging, and Visual Agent use Agent-specific Rubrics and Failure Labels.

A generic helpfulness score cannot replace domain evaluation.

### Reason

Each Agent has different responsibilities, risks, and Output Contracts.

### Impact

Each Agent Spec is associated with an Eval Profile.

---

## DEC-256

### Status

Accepted

### Title

LLM-as-Judge 仅作为辅助评估，并使用版本化配置与人工校准

### Decision

Judge may evaluate clarity, structure, expression, and preference.

Judge Model, Prompt, Rubric, and output are versioned.

Judge must be calibrated against human review before becoming a release signal.

Judge cannot independently determine security, Evidence, Authorization, or Domain Invariants.

### Reason

Judge output is itself probabilistic and subject to model bias.

### Impact

Judge Results remain separate from Deterministic Metrics.

---

## DEC-257

### Status

Accepted

### Title

Prompt 与模型候选优先使用匿名 Pairwise Baseline Comparison

### Decision

Candidate and current Baseline run on the same Dataset.

Human or Judge performs anonymous A/B comparison with randomized order.

### Reason

Pairwise comparison is often more stable than absolute scoring for evaluating incremental generative changes.

### Impact

Eval Harness requires Baseline identity, randomization, and Preference Result.

---

## DEC-258

### Status

Accepted

### Title

Agent 发布同时检查质量、Critical Failure、成本、延迟与恢复率

### Decision

Agent Release Evaluation includes:

- Quality dimensions
- Critical Failure
- Schema Repair
- Domain Regeneration
- Provider Fallback
- Token Usage
- Cost
- Latency
- Success Rate

### Reason

A more fluent configuration may still be less reliable, slower, or too expensive.

### Impact

Agent Eval and Runtime Telemetry share compatible metrics.

---

## DEC-259

### Status

Accepted

### Title

ContentOS 定义零容忍系统和内容不变量

### Decision

The following are Blocking:

- Unauthorized access
- Secret leakage
- Approval bypass
- Historical Version overwrite
- Owner data crossover
- Blocking Error bypass
- Direct Quote without Evidence
- Fabricated first-person experience
- Illegal Dependency Promotion
- Cancelled late-result Promotion
- Stale Final Export
- Renderer unauthorized network access
- Deleted data restored into the active system
- Duplicate Promotion

### Reason

These failures cannot be accepted through average scores or Conditional Release.

### Impact

Any associated Test or Eval Case failure blocks release.

---

## DEC-260

### Status

Accepted

### Title

Final Renderer 使用确定性验证、组件 Snapshot 与完整 Render Regression

### Decision

Render validation covers dimensions, files, fonts, overflow, clipping, overlap, dependencies, and network behavior.

Controlled Components use Golden Screenshots and Pixel Diff.

Playwright, Chromium, Font, Container, Theme, Profile, or Component changes trigger full Render Regression.

### Reason

Renderer is a deterministic executor and should be evaluated through reproducible layout and image tests.

### Impact

Render Baselines bind to exact Environment Fingerprints.

---

## DEC-261

### Status

Accepted

### Title

MVP 必须通过完整 Vertical Slice 和关键 Failure Path 验收

### Decision

Release must complete:

```text
Source
→ Research
→ Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

It must also validate Capture Failure, Revision, Outdated, Retry, Pause, Resume, duplicate Command, and duplicate Job behavior.

### Reason

Module-level tests cannot prove that the complete content-production system works reliably.

### Impact

Staging requires a reproducible Vertical Slice Fixture.

---

## DEC-262

### Status

Accepted

### Title

Security、Deletion、Backup 与 Recovery Drill 是正式发布 Gate

### Decision

Authentication, Authorization, Prompt Injection, SSRF, Upload, Secret, Export, Deletion, and Backup Restore tests are part of Release Gates.

Critical or High unresolved security failures block release.

### Reason

Security and recovery capabilities must be verified through execution, not only documented.

### Impact

Session-021’s security matrix becomes part of the Session-023 Test Plan.

---

## DEC-263

### Status

Accepted

### Title

CI 分为 Pull Request、Main Integration 与 Release 三个测试层级

### Decision

Pull Request runs fast deterministic tests.

Main runs complete integration, Workflow, Queue, and Render tests.

Release runs Agent Eval, Holdout, performance, security, recovery, and Staging Vertical Slice.

### Reason

The system needs both rapid developer feedback and comprehensive release confidence.

### Impact

Full real-model Eval does not run on every ordinary Commit.

---

## DEC-264

### Status

Accepted

### Title

Prompt、Model Configuration 与 Agent Spec 均作为可发布配置接受独立 Gate

### Decision

Prompt, Model Configuration, and Agent Spec changes are versioned, evaluated, compared against Baseline, approved, and rollback-capable.

They cannot be modified directly in production without Versioning.

### Reason

Non-code configuration may introduce factual, safety, cost, and compatibility regressions.

### Impact

Configuration releases enter CI, Release Evaluation, and Feature Flag processes.

---

## DEC-265

### Status

Accepted

### Title

用户编辑和反馈作为质量信号，但不自动修改系统配置

### Decision

ContentOS may record Draft Diff, Proposal acceptance, Revision Requests, and Approval behavior.

These signals may support analysis and reviewed Regression Cases.

They do not automatically update Prompt, Router, Agent Spec, Platform Profile, or model.

### Reason

User behavior contains noise and privacy implications and cannot safely drive automatic system modification.

### Impact

Feedback Labels remain separate from configuration release.

---

## DEC-266

### Status

Accepted

### Title

每次正式发布创建 Release Evaluation Record 并定义回滚条件

### Decision

Release Evaluation records:

- Blocking Gates
- Conditional Gates
- Eval Runs
- Security Results
- Performance
- Approver
- Risk
- Rollback Conditions

A zero-tolerance incident or major quality regression triggers application rollback or configuration disablement.

### Reason

Release decisions require auditability and a clear return path to a known Baseline.

### Impact

Application, Prompt, Model, and Agent Spec releases all reference an Evaluation Record.

---

## 88. Rejected or Deferred Approaches

### One Universal AI Quality Score

Rejected because it hides distinct factual, security, and reliability failures.

### Exact Match for Long-form Writing

Rejected because generative prose has multiple valid outcomes.

### LLM Judge as Factual Authority

Rejected because Evidence and deterministic rules require code-level verification.

### Production-sensitive Data as Default Eval Data

Rejected because Eval must not become an uncontrolled secondary-use channel.

### User Feedback Automatically Updating Prompt

Rejected because feedback is noisy, private, and not automatically authoritative.

### Full Real-model Eval on Every Commit

Rejected because of cost, latency, and nondeterminism.

### Happy-path-only Testing

Rejected because Workflow, Queue, Provider, Render, and deletion failures are central system risks.

### Manual-only Redis and Worker Recovery Testing

Rejected because recovery behavior must be automated and repeatable.

### No Duplicate-delivery Testing

Rejected because BullMQ has at-least-once worst-case semantics.

### Migration without Realistic Data Test

Rejected because relational invariants may fail only with existing data.

### Local macOS Screenshot as Final Baseline

Rejected because official Render uses the fixed Linux Renderer environment.

### Average Score Hiding Critical Failure

Rejected because zero-tolerance rules are release-blocking.

### New Model Directly Replacing Baseline

Rejected because ContentOS-specific evaluation is required.

### Production Prompt Hot Editing

Rejected because Prompt is a versioned release Artifact.

### Agent Spec Change without Workflow Compatibility Test

Rejected because Spec changes may alter complete Workflow behavior.

### Quality Testing without Cost and Latency

Rejected because production suitability includes operational performance.

### Pre-release Testing without Monitoring

Rejected because Provider, inputs, and usage patterns may drift after launch.

### Holdout Modification to Help Candidate Pass

Rejected because Holdout protects against overfitting.

---

## 89. Open Questions

The following remain unresolved for implementation planning:

1. Which test runner will be selected?
2. Will all packages use one runner?
3. Which browser automation framework will test the Web UI?
4. Will E2E use Playwright Test?
5. Which property-based testing library will be used?
6. How will database test isolation work?
7. Will integration tests use Testcontainers or Compose?
8. Which Queue tests require real Redis?
9. How will Worker crash be simulated?
10. How will Redis data loss be simulated safely?
11. How will Outbox delay be injected?
12. How will fake time be implemented?
13. How will deterministic IDs be generated in Fixtures?
14. Which domain modules require property tests first?
15. How will module import boundaries be enforced?
16. Which Contract checks belong in CI?
17. How will generated TypeScript drift be detected?
18. How will historical Schema compatibility be tested?
19. Which database invariants need explicit SQL assertions?
20. How will Version Number concurrency be tested?
21. How will Artifact Head races be tested?
22. How will deletion-reference races be tested?
23. How many Workflow Scenarios are required for MVP?
24. Which Workflow Commands require dedicated negative tests?
25. How will Pause and Resume races be tested?
26. How will cancellation during Provider call be tested?
27. How will late result after deletion be handled?
28. How will duplicate Promotion be detected in tests?
29. How will a partially persisted Agent Run be simulated?
30. Which Fake Provider Fixtures are mandatory?
31. How are Fixtures versioned with Agent Schemas?
32. Should Fixture output include Raw Provider response?
33. How should truncated output be simulated?
34. How should safety refusal be simulated?
35. How should Provider content filtering be simulated?
36. Which Agent requires the first Eval Dataset?
37. How many Core Cases are needed initially?
38. How many Adversarial Cases are needed initially?
39. How many Holdout Cases are meaningful?
40. Who may view Holdout Cases?
41. How are Eval Cases reviewed?
42. Which Dataset changes require a new Major Version?
43. How are removed Cases retained historically?
44. How are Eval data licences documented?
45. Which public Sources may be used?
46. How will synthetic Human Opinion be created?
47. How will sensitive patterns be de-identified?
48. How will production-derived Cases be approved?
49. Which Gold Constraints are mandatory?
50. How should required facts be represented?
51. How should forbidden facts be represented?
52. How is Evidence Precision calculated?
53. How is Evidence Recall calculated?
54. How is Unsupported Claim Rate calculated?
55. How are Source conflicts encoded in a Case?
56. How are acceptable alternative answers represented?
57. Which Research failure labels are required?
58. Which Human Opinion failure labels are required?
59. Which Writer failure labels are required?
60. Which Packaging failure labels are required?
61. Which Visual failure labels are required?
62. Should Blog readability use a deterministic metric?
63. Which Chinese readability metrics are useful?
64. How should Source-overlap be measured?
65. What overlap threshold is acceptable?
66. How are direct paraphrase risks reviewed?
67. How should Narrative Flow be scored?
68. How should Page Density be measured?
69. How should Caption repetition be measured?
70. How should Component semantic fit be evaluated?
71. Which Visual dimensions require human review?
72. Can Screenshot analysis assist Visual Eval?
73. Which LLM Judge model will be selected?
74. Should Judge use the same Provider as the Candidate?
75. How is Judge self-preference detected?
76. How many human-reviewed Cases are needed for Judge calibration?
77. What Judge-to-human agreement is acceptable?
78. How are Position Bias tests implemented?
79. How are Judge confidence and abstention represented?
80. Should multiple Judges be used?
81. How are Judge disagreements resolved?
82. What is the Human Review interface?
83. How are Reviewers trained?
84. How is Reviewer disagreement measured?
85. Should some Cases require dual review?
86. Which Critical Failures require mandatory human confirmation?
87. How is Baseline selected?
88. How frequently may Baseline change?
89. Can multiple Baselines exist per Provider?
90. How is Baseline rollback performed?
91. Which metrics are Blocking at launch?
92. Which metrics are Conditional?
93. Which metrics are Informational?
94. What Regression thresholds are acceptable?
95. What maximum Critical Failure count is allowed?
96. What Schema Repair Rate is acceptable?
97. What Domain Regeneration Rate is acceptable?
98. What Provider Fallback Rate is acceptable?
99. How much cost increase is acceptable?
100. How much latency increase is acceptable?
101. How is cost estimated when Provider cost metadata is unavailable?
102. Which cost currency is authoritative?
103. How is cost per promoted Artifact computed?
104. How is user edit distance measured?
105. How are structural and textual edits separated?
106. How is direct Approval interpreted?
107. How are abandoned Workflows interpreted?
108. Which production signals may become Alerts?
109. What Alert thresholds are required?
110. How is data drift detected?
111. How often is Dataset governance reviewed?
112. Which changes trigger full Eval?
113. Which changes permit partial Eval?
114. How is affected Agent scope calculated?
115. How are Prompt-only releases represented?
116. How are Model-only releases represented?
117. How are Agent Spec releases represented?
118. Can Prompt and Model be released together?
119. How is causality interpreted when multiple components change?
120. Should Candidate changes be tested one at a time?
121. How is Feature Flag rollout evaluated?
122. Should release begin with internal-only traffic?
123. Does the personal MVP need canary deployment?
124. How are rollback thresholds monitored?
125. How quickly can a Prompt be rolled back?
126. How quickly can a Model Configuration be disabled?
127. How is a bad Agent Spec stopped?
128. How are in-flight Runs handled during configuration rollback?
129. Which Render Fixtures are required?
130. How many Component Screenshot cases are required?
131. What Pixel Diff threshold is appropriate?
132. How are anti-aliasing differences normalized?
133. How are dynamic regions masked?
134. How are approved Screenshot changes reviewed?
135. How are Render Baselines stored?
136. Which Browser and Font changes require manual approval?
137. How is Renderer network access tested?
138. How is Render OOM tested?
139. How many concurrent Render Jobs should the MVP support?
140. Which API latency thresholds are appropriate?
141. Which Dashboard queries need performance budgets?
142. Which database queries require Explain-plan checks?
143. How is Outbox lag load-tested?
144. How is Queue backlog recovery tested?
145. How is Provider outage simulated?
146. How is Object Storage failure simulated?
147. How is Database Restore tested?
148. How often are Recovery Drills executed?
149. Which Recovery Drills are Release-blocking?
150. How is Deletion Restore verified?
151. What constitutes a successful Vertical Slice?
152. How much manual intervention is acceptable?
153. Which Vertical Slice steps require human approval?
154. Which failure paths must be automated?
155. How is UX acceptance recorded?
156. Which accessibility standard is targeted?
157. Which automated accessibility tool will be used?
158. Which manual accessibility checks are required?
159. Which Safari versions are supported?
160. Which Chromium versions are supported?
161. Which mobile surfaces are accepted?
162. How are browser-specific Editor issues tested?
163. Which Pull Request tests must finish quickly?
164. What is the maximum Tier 1 duration?
165. Which tests may run in parallel?
166. How is flaky test detection handled?
167. What failure rate marks a test as flaky?
168. Are flaky tests allowed to be ignored?
169. How are Quarantine and skipped tests governed?
170. Which Release Gate results are stored in PostgreSQL?
171. Which results remain in CI only?
172. How is Release Evaluation approved?
173. Is a human Approver always required?
174. How are Conditional Releases documented?
175. How are expired Conditional risks tracked?
176. How long are Eval Runs retained?
177. How long are Judge Runs retained?
178. Are Eval Raw Outputs retained?
179. How are Eval Outputs deleted?
180. Which Session-023 choices require future DEC records?

---

## 90. Documentation Updates

Create:

```text
docs/sessions/session-023.md
```

Update:

```text
docs/decisions/decisions.md
```

Append:

```text
DEC-244
DEC-245
DEC-246
DEC-247
DEC-248
DEC-249
DEC-250
DEC-251
DEC-252
DEC-253
DEC-254
DEC-255
DEC-256
DEC-257
DEC-258
DEC-259
DEC-260
DEC-261
DEC-262
DEC-263
DEC-264
DEC-265
DEC-266
```

Future authoritative documents:

```text
docs/quality/quality-strategy.md
docs/quality/test-pyramid.md
docs/quality/domain-test-matrix.md
docs/quality/workflow-scenarios.md
docs/quality/queue-recovery-tests.md
docs/quality/agent-runtime-tests.md
docs/quality/eval-architecture.md
docs/quality/eval-dataset-governance.md
docs/quality/research-agent-eval.md
docs/quality/human-opinion-eval.md
docs/quality/writer-agent-eval.md
docs/quality/packaging-agent-eval.md
docs/quality/visual-agent-eval.md
docs/quality/llm-judge-policy.md
docs/quality/render-regression.md
docs/quality/performance-testing.md
docs/quality/recovery-drills.md
docs/quality/vertical-slice-acceptance.md
docs/quality/release-gates.md
docs/quality/production-quality-monitoring.md
```

Possible future Schemas:

```text
schemas/eval-dataset-v1.json
schemas/eval-case-v1.json
schemas/eval-configuration-v1.json
schemas/eval-run-v1.json
schemas/eval-case-result-v1.json
schemas/eval-metric-result-v1.json
schemas/judge-run-v1.json
schemas/human-review-v1.json
schemas/eval-baseline-v1.json
schemas/release-evaluation-v1.json
schemas/critical-failure-v1.json
schemas/recovery-drill-result-v1.json
schemas/vertical-slice-result-v1.json
```

---

## 91. Documentation Sync Checklist

- [x] DEC-244 confirmed
- [x] DEC-245 confirmed
- [x] DEC-246 confirmed
- [x] DEC-247 confirmed
- [x] DEC-248 confirmed
- [x] DEC-249 confirmed
- [x] DEC-250 confirmed
- [x] DEC-251 confirmed
- [x] DEC-252 confirmed
- [x] DEC-253 confirmed
- [x] DEC-254 confirmed
- [x] DEC-255 confirmed
- [x] DEC-256 confirmed
- [x] DEC-257 confirmed
- [x] DEC-258 confirmed
- [x] DEC-259 confirmed
- [x] DEC-260 confirmed
- [x] DEC-261 confirmed
- [x] DEC-262 confirmed
- [x] DEC-263 confirmed
- [x] DEC-264 confirmed
- [x] DEC-265 confirmed
- [x] DEC-266 confirmed
- [ ] Save this document as `docs/sessions/session-023.md`
- [ ] Append DEC-244 through DEC-266 to `docs/decisions/decisions.md`
- [ ] Define Test Matrix
- [ ] Select Test Runner
- [ ] Define Contract Tests
- [ ] Define Migration Tests
- [ ] Define Workflow Scenarios
- [ ] Define Queue Recovery Fixtures
- [ ] Define Fake Provider Fixtures
- [ ] Define Eval Dataset Contract
- [ ] Create Core Regression Set
- [ ] Create Adversarial Set
- [ ] Create Holdout Set
- [ ] Define Production-derived Case Review
- [ ] Define Research Agent Rubric
- [ ] Define Human Opinion Rubric
- [ ] Define Writer Agent Rubric
- [ ] Define Packaging Agent Rubric
- [ ] Define Visual Agent Rubric
- [ ] Define Judge Configuration
- [ ] Calibrate Judge with Human Review
- [ ] Define Baseline process
- [ ] Define Critical Failure catalog
- [ ] Define Cost metrics
- [ ] Define Latency metrics
- [ ] Define Reliability metrics
- [ ] Define Render Snapshot Fixtures
- [ ] Define Pixel Diff policy
- [ ] Define Performance budgets
- [ ] Define Recovery Drills
- [ ] Define Vertical Slice Fixture
- [ ] Define UX Acceptance checklist
- [ ] Define Accessibility baseline
- [ ] Define Tier 1 CI
- [ ] Define Tier 2 CI
- [ ] Define Tier 3 Release Gate
- [ ] Define Prompt Release process
- [ ] Define Model Release process
- [ ] Define Agent Spec Release process
- [ ] Define Release Evaluation Record
- [ ] Define Rollback conditions
- [ ] Define Production Quality Monitoring
- [ ] Review `AGENTS.md` after Quality specifications become authoritative

---

## 92. Session Summary

ContentOS distinguishes:

```text
Tests
Agent Evals
Acceptance Gates
Production Monitoring
```

Deterministic security and domain rules are tested through code, Validators, database constraints, and Workflow Policy.

Generative quality is evaluated through versioned Datasets, Rubrics, Baselines, Pairwise Comparison, optional calibrated Judges, and Human Review.

ContentOS does not use one universal AI quality score.

Quality is reported by independent dimensions, while Critical Failures trigger Hard Gates.

The Test hierarchy covers:

```text
Static
Contract
Domain
Validator
Repository
Migration
API
Queue
Workflow
Agent Runtime
Agent Eval
Vertical Slice
Security and Recovery
```

Queue reliability must be proven through duplicate delivery, Worker Crash, Lease expiry, Redis loss, Outbox Retry, Reconciliation, Cancellation, and late-result tests.

Agent Runtime deterministic behavior uses Fake Provider Fixtures.

Real models are used only for Provider Integration and Agent Eval.

Agent Eval uses:

```text
Core Regression Set
Adversarial Set
Holdout Set
Production-derived Regression Set
```

Production user content does not enter Eval Dataset by default.

Generative content is evaluated through facts, Evidence, forbidden claims, Human Opinion Fidelity, Rubrics, and Critical Failure rather than exact prose matching.

Research, Human Opinion, Writer, Packaging, and Visual Agent use different Eval Profiles.

LLM-as-Judge is an auxiliary signal and must be versioned and calibrated against human review.

Prompt and model candidates are preferably compared anonymously against the approved Baseline.

Release Evaluation includes quality, Critical Failure, cost, latency, repair, fallback, and reliability.

Zero-tolerance failures include authorization bypass, Secret leakage, Approval bypass, historical Version overwrite, invented first-person experience, illegal Dependency Promotion, stale Final Export, duplicate Promotion, unauthorized Renderer network access, and deleted data returning after restore.

Final Renderer uses deterministic validation, Golden Screenshots, Pixel Diff, and full regression after Browser, Font, Component, or environment changes.

The MVP must pass the complete Vertical Slice:

```text
Source
→ Research
→ Opinion
→ Blog / Xiaohongshu
→ Design
→ Render
→ Export
```

It must also pass key Failure Paths.

CI is divided into:

```text
Pull Request Fast Gate
Main Integration Gate
Release Gate
```

Prompt Template, Model Configuration, and Agent Spec are all versioned release configurations with independent evaluation and rollback.

User edits and feedback are quality signals but do not automatically modify the system.

Every formal release creates an immutable Release Evaluation Record with Blocking Gates, Conditional Gates, Eval Runs, security evidence, approver, risks, and rollback conditions.