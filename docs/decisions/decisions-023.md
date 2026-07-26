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
