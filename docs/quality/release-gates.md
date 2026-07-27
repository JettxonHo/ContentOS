# ContentOS Release Gates

**Status:** Current Truth  
**Scope:** Release governance, Gate categories, release units, evaluation, and rollback boundaries  
**Last Updated:** 2026-07-27

This document defines what must be evaluated before ContentOS application and versioned operational configuration may advance or release. It establishes governance, not CI configuration, a feature-flag system, approver implementation, release storage Schema, or numeric thresholds.

Related current-truth documents: [Test Strategy](test-strategy.md), [Vertical Slice Acceptance](vertical-slice-acceptance.md), [Workflow Overview](../architecture/workflow-overview.md), [Agent Runtime](../architecture/agent-runtime.md), [Rendering](../architecture/rendering.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Release Governance Purpose

Release Gates prevent Critical Regression, preserve auditable release reasoning, distinguish Blocking/Conditional/Informational results, enable independent configuration rollback, and prevent Prompt or model changes from bypassing ordinary release control.

Tests, Evals, security checks, recovery evidence, and human approval remain inputs to a Gate decision; no one score, Judge output, or successful deployment replaces the record.

## 2. Release Unit Types

ContentOS evaluates these independently versioned Release Units:

- Application Release;
- Prompt Template Release;
- Model Configuration Release;
- Agent Spec Release;
- Workflow Template Release;
- Component Registry / Theme Release;
- Renderer Environment Release.

Different Release Units may have different affected checks, decisions, and rollback targets. Independent release does not permit a change to alter an Accepted product, workflow, security, or architecture boundary without Decision governance.

## 3. Gate Categories

| Category          | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Blocking**      | Failure prevents progression or release.                                                                               |
| **Conditional**   | Release requires explicit human approval, documented risk, monitoring, a review/expiry point, and rollback condition.  |
| **Informational** | Recorded for learning and optimization; it does not determine deterministic correctness or override a Blocking result. |

## 4. Zero-tolerance Blocking Conditions

The following conditions are always Blocking and cannot be accepted through an average score or Conditional Release:

- Unauthorized access;
- Owner data crossover;
- Secret leakage;
- Approval bypass;
- Historical Version overwrite;
- Blocking Error bypass;
- Direct Quote without Evidence;
- fabricated first-person experience;
- illegal Dependency Promotion;
- cancelled Late Result Promotion;
- stale Final Export;
- duplicate Promotion;
- Renderer unauthorized network access;
- Export internal-data leakage;
- deleted data restored into the active system.

## 5. Application Release Gates

An Application Release evaluates Typecheck, Contract validity, Migration validity, Domain Unit Tests, Repository Tests, critical Workflow scenarios, Authorization Tests, Security Scan, Render Validation, Vertical Slice evidence, and Recovery Checks appropriate to the affected behavior.

The M0 boundary limits this to baseline tooling and smoke coverage; the full Release Gate applies only when the relevant product capabilities exist.

## 6. Prompt Release Gates

A production Prompt Template change requires a new Prompt Version, relevant Core Regression Eval, relevant Adversarial Eval, Baseline Pairwise Comparison, Critical Failure check, Cost comparison, Rollback target, and human review when policy requires it. Production Prompts may not be hot-edited without versioning.

## 7. Model Configuration Release Gates

A Model Configuration change evaluates Structured Output, Context Capacity, Provider Error behavior, Safety Refusal, Chinese quality, Cost, Latency, Repair Rate, Fallback Rate, full affected Agent Eval, and a Rollback Configuration.

“The new model is stronger” is not release evidence; it does not replace ContentOS-specific evaluation.

## 8. Agent Spec Release Gates

An Agent Spec release evaluates Input Contract, Output Contract, Prompt reference, Validator compatibility, Workflow compatibility, stored Artifact compatibility, Eval Profile, Candidate Promotion behavior, required Human Review, and documentation. A breaking behavioral change requires a new Agent Spec Version.

## 9. Workflow Template Release Gates

A Workflow Template release evaluates Allowed Transitions, Human Gates, Skip Policy, Retry Policy, branch dependencies, historical Instance compatibility, Workflow Scenario Tests, and a migration or versioning plan. It must not silently rewrite the behavior or Event history of an active or historical Workflow Instance.

## 10. Renderer and Component Release Gates

Renderer, Component Registry, Theme, Font, or render-environment releases evaluate Component Contract, Render Regression, Golden Screenshots, Pixel Diff, Font behavior, Chromium, Container Image, network isolation, Export compatibility, and a Rollback Environment.

Any relevant renderer change triggers full Render Regression; a Preview is not a substitute for a controlled Final Render result.

## 11. Conditional Gates

Possible Conditional results include a moderate Cost increase, moderate Latency increase, non-critical style decrease, small Repair Rate increase, or non-core Snapshot difference.

Every Conditional Release records Risk, Reason, Owner, Monitoring, Follow-up, Expiry or review point, and Rollback condition. A Conditional record cannot waive a zero-tolerance condition.

## 12. Informational Metrics

Examples include Title preference, Caption length, edit distance, Approval time, token distribution, and non-critical style metrics. Informational data guides review but is never treated as deterministic correctness, authorization, evidence, or approval.

## 13. CI and Release Tiers

| Tier                           | Usual Gate role                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Tier 1 — Pull Request Gate     | fast deterministic static, Contract, Domain, Validator, and Fake Provider checks                         |
| Tier 2 — Main Integration Gate | database, Queue, API, Workflow, Render, Migration, and security integration evidence                     |
| Tier 3 — Release Gate          | affected Evals, Holdout, security, performance, recovery, Render Regression, and Vertical Slice evidence |

The tier design describes governance only and does not create a CI configuration.

## 14. Release Evaluation Record

Every formal release has immutable, auditable evaluation evidence containing at least:

- Release Identity;
- Release Unit Type;
- Candidate Version;
- Baseline Version;
- Blocking Gate Results;
- Conditional Gate Results;
- Eval Runs;
- Security Results;
- Performance Results;
- Human Approver;
- Risk;
- Rollback Conditions;
- Decision;
- Timestamp.

This is a conceptual record, not a database Schema.

## 15. Approval Authority

An Agent does not approve a Release. An LLM Judge does not approve a Release. Deterministic Gates automatically provide their results; a Conditional Release requires explicit human approval. Formal Private MVP Release requires a human-approved Release Evaluation Record.

## 16. Rollback

Release governance identifies an Application rollback, Prompt rollback, Model Configuration disable, Agent Spec rollback, Workflow Template rollback boundary, Renderer Environment rollback, and Feature disable path as applicable.

In-flight Run handling during rollback remains an Open Implementation Decision. Rollback does not rewrite historical Artifacts, Workflow Instances, Eval results, or their approval history.

## 17. Production Monitoring and Rollback Triggers

Release monitoring watches Schema Failure spike, Domain Validation spike, Unsupported Claim increase, First-person violation, Duplicate Promotion, Queue Stuck Tasks, Outbox Lag, Render Failure spike, Provider Refusal spike, Cost runaway, Authorization incident, and Deletion failure.

These signals trigger investigation, rollback, or feature disablement according to the recorded release conditions. They are not a mechanism to automatically change a Prompt, model, Agent Spec, or Baseline.

## 18. M0 Release Gate Boundary

M0 completion requires only that:

- the Repository can install;
- approved runtime versions are pinned;
- Typecheck, lint, format, and tests can run;
- example Unit and Integration Tests pass;
- local services can start;
- a CI skeleton runs;
- documentation and Decision links are valid;
- no Secret is committed; and
- README and `AGENTS.md` are usable.

M0 does not require a full Agent Eval, complete product Vertical Slice, full Security Release Gate, full Recovery Drills, or Production Deployment.

## 19. Release Invariants

- A Blocking Gate is not bypassed through ordinary approval.
- Prompt, Model Configuration, and Agent Spec are versioned.
- A Release Decision is auditable.
- A Rollback Target is explicit.
- Judge assistance does not replace a deterministic Gate.
- User feedback does not automatically change a Baseline.
- A Critical Security Failure blocks release.
- A new Judge does not silently rewrite historical Eval results.

## 20. Open Implementation Decisions

The following remain open: Release Evaluation storage location; approver model; Conditional Release expiry; CI platform; feature-flag implementation; rollback automation; production alert thresholds; and release naming convention.

## 21. Decision Traceability

| Area                                                             | Accepted Decisions               | Primary Sessions                                                                    |
| ---------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| Tests, Evals, Hard Gates, CI, and release records                | DEC-244–DEC-266                  | [Session-023](../sessions/session-023.md)                                           |
| Agent Runtime, Workflow, Render, and security release boundaries | DEC-125–DEC-139, DEC-177–DEC-243 | [Session-017](../sessions/session-017.md)–[Session-022](../sessions/session-022.md) |
| M0, M7, M8, and formal MVP completion                            | DEC-275–DEC-285, DEC-291–DEC-293 | [Session-024](../sessions/session-024.md)                                           |

The authoritative status and wording of Decisions remains in the [Canonical Decision Register Index](../decisions/decisions.md).
