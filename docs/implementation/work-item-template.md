# ContentOS Work Item Template

**Status:** Current Truth
**Scope:** Required information, readiness, completion evidence, and review boundary for one implementation task
**Last Updated:** 2026-07-27

This template governs an independently reviewable ContentOS implementation task. It does not create a tracking system, Owner/Reviewer workflow, Pull Request provider integration, or task Schema.

Related documents: [Roadmap](roadmap.md), [Milestone Exit Criteria](milestone-exit-criteria.md), [Canonical Decision Register](../decisions/decisions.md), [Test Strategy](../quality/test-strategy.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Work Item Purpose

A Work Item is the smallest independently reviewable implementation objective. It is not a conversationally vague request, an entire Milestone, or a single file. It must be capable of independent testing, Review, and rollback.

## 2. Work Item Size Principle

```text
One Work Item
→ One bounded objective
→ One independently reviewable change
```

A Thin Slice may cross UI, API, Domain, Persistence, and Tests when that is necessary to deliver one capability. It must not absorb unrelated refactoring or adjacent future features.

## 3. Required Metadata

Every Work Item starts with this metadata:

```markdown
- Task ID:
- Title:
- Milestone:
- Status: Planned | Ready | In Progress | Blocked | In Review | Completed
- Owner:
- Reviewer:
- Relevant DEC:
- Relevant Documents:
- Dependencies:
- Risk Classification:
```

The mechanism for assigning Owner and Reviewer remains open. Empty or unknown values are explicit planning gaps, not permission to omit the field.

## 4. Goal

State one clear resulting user or system capability in a short paragraph. Do not use phrases such as “complete backend,” “finish ContentOS,” or “make it work.” The Goal describes the result, not an unbounded technical activity.

## 5. Context

State the current problem, why it is needed now, relevant existing implementation, and the Accepted Decisions that must not be reopened. Include only historical Session material needed to resolve the task; a Work Item never defaults to reading all 24 Sessions.

## 6. In Scope

List explicit allowed behavior and modifications. Each item should say what is implemented, changed, or verified. In Scope may not be blank and may not implicitly include all related modules.

## 7. Out of Scope

List adjacent features, future extensions, architecture changes, and historical or authoritative documents that are not changed. Out of Scope may not be blank. A future-looking abstraction, unrelated cleanup, or new product capability is out of scope unless explicitly authorized.

## 8. Relevant Decisions and Specifications

List concrete DEC IDs and applicable Current-truth paths. State that a later Accepted DEC governs an actual conflict. Reference Sessions only when necessary for unresolved reasoning; do not require Codex to read the whole Session archive by default.

## 9. Allowed and Prohibited Files or Modules

Specify:

```markdown
### Allowed Modules
-

### Allowed Files
-

### Prohibited Modules
-

### Generated Files Policy
-
```

Generated files must name their generator, ownership, regeneration check, and whether they may be committed. A Work Item must not silently spread across module boundaries.

## 10. Contracts

For every applicable boundary, name the existing Contract or the bounded Contract work:

- Domain Contract;
- API Contract;
- JSON Schema;
- Queue Payload;
- Event;
- Migration;
- Configuration;
- Error Contract; and
- Security Boundary.

Absence of a required Contract is a readiness issue, not an invitation to infer it from prose. Contract work must preserve the distinction among Domain models, API DTOs, database rows, and minimal Queue envelopes.

## 11. Acceptance Criteria

Write behavior- and result-based criteria that can be verified. Cover the success path and necessary failure paths. Given / When / Then is recommended but not required. “Code quality is good” or “feature works” cannot be the only acceptance criterion.

## 12. Required Tests

Select relevant layers rather than automatically requiring every one:

- Static;
- Unit;
- Validator;
- Repository;
- Migration;
- Integration;
- Workflow Scenario;
- Security;
- Eval;
- Render; and
- Manual Demo.

The selected layers and expected evidence must be named. A missing required test is a Blocking Defect unless the applicable governance explicitly permits a different outcome.

## 13. Security Review

Answer these questions where applicable:

- Does the task handle user content or external input?
- Does it introduce a Credential, network access, or Provider transmission?
- Does it change Authentication, Authorization, Object Storage, logging, Export, or deletion range?
- Does it affect Source safety, prompt-injection containment, Renderer isolation, or Secret boundaries?

The review records impact and required controls; it does not select an unapproved security technology.

## 14. Migration and Compatibility Review

Answer whether the task changes a database, Schema, API, Queue Payload, Artifact Version, Agent Spec, Prompt, or configuration. State whether Backfill, compatibility sequencing, and Rollback are needed. Any migration must use the accepted reviewed SQL-migration and expand-and-contract boundaries where applicable.

## 15. Observability

When applicable, specify the required Log, Metric, Trace, Audit Event, Failure Category, and Correlation ID. Logs and telemetry must not capture private content bodies, Full Prompts, Raw Model Output, temporary URLs, or Secrets.

## 16. Documentation Updates

List the documentation that changes, if any:

- Current-truth;
- API;
- Schema;
- `README.md`;
- `AGENTS.md`;
- Runbook;
- Decision Register; and
- Milestone Status.

Ordinary implementation detail does not automatically require a new DEC. A change to accepted Scope, architecture, security, workflow, agent responsibility, or release gate does.

## 17. Definition of Ready

A Work Item is Ready only when:

- Goal is clear;
- Scope is bounded;
- Out of Scope is clear;
- Accepted DEC is available;
- dependencies are satisfied;
- Contract is known;
- Acceptance is testable;
- Fixtures are available;
- Security impact is identified;
- Migration impact is identified;
- documentation target is known; and
- No Blocking Design Question remains.

## 18. Definition of Done

A completed Work Item has implementation complete, Typecheck, required tests, Migration work where applicable, Authorization, failure handling, Observability, documentation, and every Acceptance Criterion verified. It has no unrelated changes, no skipped test without a recorded reason, no Secret, and a reviewable diff.

An Agent Task additionally includes a Fake Provider Fixture, Eval Case, Baseline comparison, Cost data, Failure data, and validation results—but only when the relevant Milestone has introduced Agent Eval. M0 engineering skeleton work does not prematurely implement full Agent Eval.

## 19. Implementation Instructions for Codex

Codex must:

1. Read `AGENTS.md`.
2. Read the listed Current-truth documents.
3. Inspect the existing repository before changing files.
4. Produce a plan before multi-file implementation work.
5. Not expand Scope.
6. Not change an Accepted DEC.
7. Not create a Commit unless explicitly requested.
8. Run the required verification.
9. Report incomplete or failed checks honestly.
10. Flag a possible Scope or Architecture Change.

## 20. Completion Report Template

Use this structure when reporting a completed Work Item:

```markdown
## Summary

## Design choices

## Files changed

## Migration

## Commands run

## Test results

## Acceptance Criteria
| Criterion | Evidence | Result |
|---|---|---|

## Security impact

## Known limitations

## Incomplete items

## Documentation updates

## Possible new DEC

## Git status
```

## 21. Work Item Types

The high-level task types are Documentation, Governance, Engineering Baseline, Domain Feature, Infrastructure, Agent, Rendering, Security, Quality, Migration, Recovery Drill, and Release. Type helps select appropriate Contracts and evidence; it does not change the Definition of Ready or Done.

## 22. Example Work Item

```markdown
Task ID: M1-CP-001
Title: Content Package Creation Thin Slice
Milestone: M1
Status: Planned
Relevant DEC: DEC-272, DEC-275, DEC-279, DEC-287, DEC-291
Relevant Documents: docs/product/mvp-scope.md; docs/architecture/domain-overview.md; docs/architecture/artifact-versioning.md
Dependencies: M0 accepted
Risk Classification: Domain, persistence, authorization

Goal: Let the owner create a Content Package and reopen its persisted Workspace shell.

In Scope: one bounded create/read persistence path, owner checks, expected version foundation, tests, and documentation required by the change.
Out of Scope: Source capture, Workflow, Agent Runtime, Research, publishing content, Renderer, and unrelated refactoring.

Acceptance Criteria: an authorized owner creates, refreshes, reopens, edits permitted metadata, and archives one Package; an unauthorized principal cannot access it.
Tests: static, domain/validator, repository/migration, API integration, authorization, and manual demo as applicable.
```

This illustrates template use only. It does not create a new DEC, select a technology, or authorize implementation.

## 23. Anti-patterns

Do not create tasks such as:

- “Implement ContentOS”;
- “Build all backend”;
- “Choose any stack”;
- “Refactor everything”;
- “Fix tests by skipping them”;
- “Add a future-proof abstraction”;
- “One PR for unrelated objectives”;
- “Silent scope expansion”;
- “Natural-language approval”; or
- “Hidden production configuration changes.”

## 24. Pull Request Boundary

One Pull Request focuses on one Work Item or an indivisible shared objective. It may cross technical layers, but it does not include unrelated cleanup and must be reviewable and reversible. The exact long-term Work Item-to-PR mapping may be refined later; the default follows DEC-288.

## 25. Decision Traceability

This template directly applies DEC-275 (Thin Vertical Slice), DEC-277 (demonstrable exit), DEC-287–DEC-292 (bounded Work Items, Pull Request boundary, agent guidance, truth hierarchy, Definition of Ready / Done, and scope governance), and [Session-024](../sessions/session-024.md). The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
