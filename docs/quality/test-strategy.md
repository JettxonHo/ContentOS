# ContentOS Test Strategy

**Status:** Current Truth  
**Scope:** Quality model, verification layers, Agent evaluation boundaries, and test governance  
**Last Updated:** 2026-07-27

This specification defines how ContentOS verifies deterministic behavior, evaluates generative quality, accepts milestone behavior, and detects post-release regressions. It selects no test framework, CI platform, model, dataset, threshold, or implementation tooling.

Related current-truth documents: [MVP Scope](../product/mvp-scope.md), [Artifact Versioning](../architecture/artifact-versioning.md), [Workflow Overview](../architecture/workflow-overview.md), [Agent Runtime](../architecture/agent-runtime.md), [Rendering](../architecture/rendering.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Quality Model

ContentOS has four related but non-interchangeable quality mechanisms:

| Mechanism | Question answered | Authority |
|---|---|---|
| **Tests** | Does deterministic system behavior obey its Contract and invariants? | Deterministic code and controlled fixtures |
| **Agent Evals** | Is a versioned generative configuration sufficiently useful and safe on representative cases? | Versioned Eval evidence, deterministic checks, calibrated Judge assistance, and human review |
| **Acceptance Gates** | Is a milestone, release candidate, or configuration change eligible to advance? | Recorded Gate evidence and required human approval |
| **Production Monitoring** | Did quality, cost, reliability, or inputs regress after release? | Operational signals; it detects rather than retroactively approves a release |

Tests verify deterministic behavior. Agent Evals assess generative quality. Acceptance Gates decide progression or release eligibility. Production Monitoring detects production regression and input drift. None substitutes for another.

## 2. Quality Principles

- **Deterministic Invariants First:** code verifies rules that have an objective answer.
- **Human-centered Evaluation:** human editorial judgment remains material where quality is not deterministic.
- **Versioned Evaluation Data:** Dataset, case, rubric, configuration, Judge, and Baseline identities are retained.
- **Critical Failures over Average Score:** a severe failure blocks regardless of unrelated strengths.
- **Paired Regression Comparison:** Candidate and Baseline use the same Dataset Version whenever compared.
- **Reproducible Eval Runs:** the run preserves its input/configuration identity and historical result.
- **No Hidden Production-data Reuse:** production user content is not silently copied into evaluation material.

## 3. Hard Gates versus Dimension Scores

Hard Gates and quality dimensions are separate results.

- A **Critical Failure** triggers a Hard Gate.
- **Grounding, Coverage, Clarity, Structure, Platform Fit, Cost, Latency, and Reliability** are independently reported dimensions.
- ContentOS does not calculate or accept one universal “AI Quality Score.”
- A strong writing score cannot offset failed Evidence, Authorization, Approval, Dependency, Direct Quote, or First-person provenance.

Deterministic validators decide such facts as Evidence presence, Direct Quote exactness, Owner authorization, Approval eligibility, dependency identity, component registration, and Export eligibility. An LLM Judge never becomes their authority.

## 4. Test Layers

The test strategy is layered, with each layer retaining its own purpose:

```text
Static
→ Contract
→ Domain Unit
→ Validator
→ Repository
→ Migration
→ API Integration
→ Queue and Worker
→ Workflow Scenario
→ Agent Runtime Deterministic
→ Agent Eval
→ End-to-end Vertical Slice
→ Security and Recovery Drill
```

Higher layers do not remove the need for lower-layer tests; lower layers do not prove end-to-end product behavior.

## 5. Static and Contract Tests

Static checks cover Typecheck, lint/formatting, dependency direction, and Secret-pattern detection. Contract checks cover JSON Schema validity and versioning, Agent Spec references, Prompt references, Workflow references, Component Registry references, Export-manifest compatibility, and OpenAPI compatibility.

Missing, duplicate, incompatible, or unresolved references must fail deterministically before runtime. Exact tools remain Open Implementation Decisions.

## 6. Domain and Validator Tests

Domain and validator coverage includes at least:

- Immutable Version and historical-version preservation;
- Approval of an exact eligible Version only;
- Artifact Head separation;
- exact Dependency snapshots and Outdated propagation;
- First-person Provenance and Research-based Mode restrictions;
- Citation and Direct Quote evidence integrity;
- Component validity and Content Binding eligibility;
- Export eligibility and approved dependency checks.

Every Validator has a **valid fixture**, **invalid fixture**, **boundary fixture**, and **adversarial fixture**. Validator results are reproducible, explainable, and remain distinct from probabilistic quality evaluation.

## 7. Repository and Migration Tests

Critical relational behavior uses real PostgreSQL. Tests verify constraints, transactions, locks or the selected serialization behavior, optimistic concurrency, transactional Outbox persistence, ownership scope, Artifact Heads, Version allocation, Task leases, and idempotency. A Mock Repository alone cannot establish database invariants.

Every Migration is tested from:

```text
Empty Database
Previous Supported Schema
Realistic Seeded Data
```

The result preserves applicable constraints, history, ownership, Approvals, Dependencies, Object References, and Outbox correctness.

## 8. API Integration Tests

API integration uses the real API, real PostgreSQL, authenticated requests, owning application Use Cases, and Repository adapters. It covers Authentication, server-side Authorization and Owner scope, Working Copy autosave, Revision Conflict, Version creation, Workflow Commands, idempotency, Error Contract, SSE authorization, and temporary-download authorization.

Browser state, an SSE event, or a hidden UI control does not prove authorization or authoritative workflow state.

## 9. Queue and Worker Tests

Queue and Worker behavior is designed for **at-least-once delivery**. Tests cover Transactional Outbox creation and dispatch, duplicate Outbox dispatch, Duplicate Queue Job, Worker Crash, Lease Expiry, Redis Loss, Reconciliation, Cancellation, Late Result, duplicate Promotion, and Queue Backlog Recovery.

The expected final Domain behavior includes:

- repeated delivery does not create duplicate Artifact Versions, Approvals, or Promotion;
- an Outbox dispatch failure is recoverable from PostgreSQL truth;
- a Worker Crash becomes eligible for safe recovery after lease expiry;
- Redis Loss is reconciled from PostgreSQL Tasks;
- a cancelled or superseded Task's Late Result remains evidence but cannot promote.

## 10. Workflow Scenario Tests

Workflow scenarios cover the Happy Path and these alternatives: Source Capture Failure; Pasted Text Fallback; Research Correction; Human Opinion Skip; Blog/Xiaohongshu parallel branches; Revision Request; Asset Failure; Render Retry; Upstream Version Change; Outdated propagation; Pause; Resume; Cancel; and Delete Request.

Scenarios assert the final authoritative Artifact, Workflow, Task, Approval, dependency, and Export state—not just that a Queue Job returned successfully.

## 11. Agent Runtime Deterministic Tests

Ordinary runtime tests use a Fake Provider, not a real model. Fixtures cover Valid Structured Output, Malformed JSON, Parse Failure, Schema Repair, Domain Regeneration, Provider Timeout, Rate Limit, Provider Unavailable, policy-approved Fallback, Budget Exceeded, Cancellation, Safety Refusal, Raw Output persistence, Frozen Input, validation, and Promotion protection.

Parse, Schema Validation, Domain Validation, Candidate creation, Promotion, and Approval are distinct results. A successful provider response is insufficient for promotion; raw output remains restricted execution evidence and is not ordinary telemetry or eval input.

## 12. Agent Eval Architecture

The versioned and auditable Eval objects are:

- Eval Dataset and Eval Case;
- Eval Configuration;
- Eval Run and Eval Case Result;
- Metric Result;
- Judge Run;
- Human Review;
- Baseline.

An Eval Configuration identifies the Agent Spec, Prompt Template, Model Configuration, Runtime Policy, Validation Profile, relevant validator/parser versions, Judge configuration, and Dataset Version. Historical Eval results are not silently rewritten when a Dataset, Judge, Prompt, or model changes.

## 13. Eval Dataset Groups

ContentOS distinguishes four groups:

| Group | Use |
|---|---|
| Core Regression Set | Regular development and known high-value cases |
| Adversarial Set | Injection, conflict, malformed output, provenance, density, and other high-risk cases |
| Holdout Set | Independent release validation; not daily targeted Prompt tuning |
| Production-derived Regression Set | Reviewed, permitted, de-identified patterns derived from production problems |

Production user data is excluded by default. A production issue becomes a Regression Case only after explicit authorization, de-identification, usage review, and approval; it never enters by automatic telemetry or feedback collection.

## 14. Gold Constraints

Generative content does not require a word-for-word Gold Answer. Eval Cases use Required facts, Forbidden facts, Evidence, Required Human Opinion, Prohibited First-person claims, Rubric, and Critical Failure conditions.

Exact Match is reserved for suitable deterministic values: structure, IDs, enums, numbers, Citation URLs, Component names, Manifest fields, and Direct Quotes.

## 15. Agent-specific Eval

| Agent | Principal dimensions |
|---|---|
| Research | Coverage, Evidence Precision, Evidence Recall, Unsupported Claim, Conflict Handling, Injection Resistance |
| Human Opinion | Question Relevance, Non-leading behavior, Interpretation Fidelity, Confirmation boundary, First-person eligibility |
| Writer | Grounding, Human Opinion Fidelity, First-person Integrity, Synthesis, Structure, Citation, Source-overlap |
| Packaging | Content Fidelity, Narrative Flow, Page Purpose, Density, Title Separation, Caption Complementarity, Platform Profile Compliance |
| Visual | Content Binding, Component Validity, Semantic Fit, Hierarchy, Asset Policy, Theme Compliance, Fit Risk |

Each Agent Spec uses its relevant Eval Profile; a generic helpfulness score cannot replace role-specific failures or Contracts.

## 16. LLM-as-Judge Policy

An LLM Judge may assist with clarity, structure, readability, synthesis, narrative flow, preference, and style. It may not be the authority for Evidence, Authorization, Approval, Secret handling, Dependency identity, Direct Quote exactness, First-person provenance, or Component existence.

Judge Model, Prompt, Rubric, candidate order, and output are versioned. Before a Judge becomes a Release Signal, its results must be calibrated against structured human review. Prefer anonymous Pairwise Candidate-versus-Baseline comparison with randomized order, reversed-order samples, and explicit Position Bias checks. An uncalibrated Judge is informational.

## 17. Render Testing

Render verification includes deterministic Validation, Golden Screenshot fixtures, Pixel Diff, Font availability and coverage, overflow, clipping, overlap, missing Asset, unauthorized external-network request, and Environment Fingerprint.

Changes to Playwright, Chromium, Font Bundle, Component Registry, Theme, Render Profile, container/base environment, pixel ratio, or controlled render code trigger full Render Regression. Tools and Pixel Diff thresholds remain Open Implementation Decisions.

## 18. Security and Recovery Testing

Security and recovery test coverage includes Authentication, Authorization, Prompt Injection, SSRF, Upload handling, Secret containment, Export allowlisting, Delete behavior, Backup Restore, Worker Crash, Redis Loss, Provider Outage, Renderer Crash, and Object Storage Failure.

Recovery is accepted by correct final Domain state. Process restart, job acknowledgement, or a visual retry message alone does not prove recovery.

## 19. Cost, Latency and Reliability

Cost is evaluated as:

```text
Total Cost per Valid Promoted Artifact
```

Latency is decomposed into Queue Wait, Context Build, Provider, Parse, Validation, Repair, Promotion, and Total Duration. Reliability reports Task Success, First-attempt Success, Repair Rate, Regeneration Rate, Fallback Rate, Reconciliation Recovery, Duplicate Promotion, Stuck Task, and Outbox Lag. Current Decisions define no numeric thresholds.

## 20. CI Test Tiers

| Tier | Purpose | Typical scope |
|---|---|---|
| Tier 1 — Pull Request Fast Gate | Fast deterministic feedback | Static, Contract, Domain/Validator, selected Repository, and Fake Provider checks |
| Tier 2 — Main Integration Gate | Verify the merged system | PostgreSQL, Queue, Workflow, Render, Migration, API, and integration security checks |
| Tier 3 — Release Gate | Decide release eligibility | affected Agent Eval, Holdout, Security, Performance, Recovery, Render Regression, and complete Vertical Slice |

This specification does not create CI configuration.

## 21. M0 Quality Boundary

M0 establishes only:

- lint/formatting entry;
- Typecheck;
- Test Runner;
- an example Unit Test;
- an example Integration Smoke Test;
- CI skeleton;
- Secret Scan baseline;
- documentation and Decision-link checking.

M0 does not complete an Agent Eval Dataset, Holdout Set, full Queue Recovery Test, full Render Regression, complete product Vertical Slice, or Production Monitoring. Those capabilities are implemented progressively through M1–M7.

## 22. Test Governance

- A flaky test is investigated; it is not silently ignored.
- A skipped test records a reason and Owner.
- Prompt, Model Configuration, and Agent Spec changes require their relevant Eval.
- A failed test cannot be accepted by lowering its blocking level.
- Dataset changes require a version and review.
- User feedback may create a reviewed hypothesis or Regression Case proposal but does not automatically alter a Prompt, Baseline, Agent Spec, Router, or Platform Profile.

## 23. Open Implementation Decisions

The following remain open: Test Runner; lint/formatter; property-based test library; Testcontainers/Compose approach; browser E2E framework; Eval Harness; Judge Model; metric thresholds; Pixel Diff threshold; test retention; and CI parallelism.

## 24. Decision Traceability

| Area | Accepted Decisions | Primary Sessions |
|---|---|---|
| Deterministic tests, Evals, and Gates | DEC-244–DEC-258 | [Session-023](../sessions/session-023.md) |
| Zero-tolerance, render, Vertical Slice, recovery, CI, configuration releases | DEC-259–DEC-266 | [Session-023](../sessions/session-023.md) |
| Versions, approval, dependencies, workflow, runtime, and rendering | DEC-051–DEC-139, DEC-177–DEC-198 | [Session-010](../sessions/session-010.md)–[Session-020](../sessions/session-020.md) |
| Security and MVP release boundary | DEC-199–DEC-220, DEC-269–DEC-285, DEC-293 | [Session-021](../sessions/session-021.md), [Session-024](../sessions/session-024.md) |

The authoritative status and wording of Decisions remains in the [Canonical Decision Register Index](../decisions/decisions.md).
