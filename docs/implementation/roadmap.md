# ContentOS Implementation Roadmap

**Status:** Current Truth
**Scope:** Implementation order, milestone boundaries, demonstrable increments, and scope governance
**Last Updated:** 2026-08-12

This roadmap turns the accepted product and architecture direction into an ordered implementation path. It does not create a calendar plan, engineering tickets, code, CI configuration, or an alternative architecture.

Related documents: [MVP Scope](../product/mvp-scope.md), [Technical Architecture](../architecture/technical-architecture.md), [Repository Structure](../architecture/repository-structure.md), [Test Strategy](../quality/test-strategy.md), [Vertical Slice Acceptance](../quality/vertical-slice-acceptance.md), [Release Gates](../quality/release-gates.md), [Milestone Exit Criteria](milestone-exit-criteria.md), and [Agent Collaboration Workflow](agent-collaboration-workflow.md).

---

## 1. Roadmap Purpose

The roadmap manages dependency order, constrains Scope, and makes each increment demonstrable. It guides bounded Work Items and Pull Requests so that architecture is converted into a reliable product without attempting to implement the complete system in one pass.

It answers what each stage delivers, verifies, and deliberately does not do. Completion is governed by evidence and Exit Criteria, not by code volume or elapsed time.

## 2. Implementation Principles

- **Thin Vertical Slice:** deliver the smallest useful cross-layer capability where UI, API, Domain, persistence, validation, tests, and documentation are relevant.
- **Limited Architecture Runway:** build only the enabling infrastructure required by the next Slice.
- **One Bounded Objective per Pull Request:** one independently reviewable and reversible capability; it may cross technical layers.
- **Documentation Sync:** update Current-truth, Contracts, runbooks, and governance when the accepted behavior requires it.
- **Security and Quality from the First Relevant Milestone:** introduce controls and tests with the capability that creates the risk; M7 consolidates hardening.
- **No Time-based Milestone Completion:** a Milestone advances only after its formal evidence and Exit Criteria are accepted.
- **Current Status, Not Execution Log:** keep command chronology, review metadata, and failed-attempt detail in CI, Acceptance Records, Work Packets, and Git history rather than duplicating them here.

## 3. Milestone Structure

The formal implementation sequence is:

```text
M0 — 开工基线
M1 — 产品骨架与领域基础
M2 — Source 与 Workflow 基础
M3 — Research
M4 — Human Opinion 与 Blog
M5 — Xiaohongshu Text 与 Text-first MVP Acceptance
M6 — Post-MVP Design、Render 与 Rich Export
M7 — Post-MVP Production Hardening
M8 — Private Production Release
```

DEC-295 rebaselines the first formal MVP to the text-first dual-output loop, completed at M5. M6–M8 remain ordered post-MVP work; they do not block the first product validation.

## 4. M0 Internal Execution Structure

The following is the Current-truth explanation of execution _inside_ formal M0. It does not create new formal Milestones or change DEC-276.

```text
M0-A — Documentation Runway
    → M0-B — Engineering Baseline
        → M0-C — M0 Integration Gate
```

M0-A completes before M0-B begins because developers and Codex need a usable authority set before creating an engineering skeleton. M0-C integrates and accepts the baseline; it does not develop new business behavior.

## 5. M0-A — Documentation Runway

### Goal

Establish the Current-truth and governance entry points from which Codex and developers can implement bounded Work Items without reopening Accepted Decisions.

### Deliverables

The complete M0-A documentation runway comprises:

- Canonical Decision Register;
- Product Current-truth;
- Domain and Versioning;
- Technical Architecture;
- Process Topology;
- Repository Structure;
- Workflow;
- Agent Runtime;
- Rendering;
- Security;
- Quality;
- Roadmap;
- Milestone Exit Criteria;
- Work Item Template;
- `AGENTS.md`;
- `README.md`;
- `CONTRIBUTING.md`;
- Pull Request and Issue templates.

### Out of Scope

M0-A does not create business code, application skeletons, dependencies, a database, Docker implementation, or CI implementation.

### Current Status

**Completed.** The M0-A Exit Review record at [m0-a-exit-review.md](m0-a-exit-review.md) records a Passed decision for the Canonical Decision Register, Product, Domain and Versioning, Technical and Repository Architecture, Workflow/Runtime/Rendering, Security, Quality, implementation governance, repository-entry rules, and GitHub intake templates.

M0-A enabled the now-completed M0-B Engineering Baseline. Its completion does not authorize an implementation task to invent governance rules beyond the Current-truth set.

## 6. M0-B — Engineering Baseline

M0-B creates a reproducible engineering runway only after M0-A has passed. It contains separate Work Items rather than one broad bootstrap task:

**Current status: Completed.** All seven planned M0-B engineering Work Items are merged, including `M0-CI-001 — CI Skeleton`. [M0-B Exit Review 001](m0-b-exit-review-001.md) remains the immutable historical Blocked record for the earlier dependency findings. The bounded remediation sequence recorded through PR #22, PR #24, and PR #26 cleared those findings; [M0-B Exit Review 002](m0-b-exit-review-002.md) records passing local, remote CI, Secret, and official-registry audit evidence with no unresolved Blocking Defect. M0-C is also completed through the acceptance records below.

| Planned Work Item                                | High-level goal                                                                                                | Depends on                                  | Boundary                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `M0-ENG-001 — Workspace and TypeScript Baseline` | Establish the approved Node.js 24, pnpm Workspace, lockfile, TypeScript strict, and root engineering baseline. | M0-A                                        | **Completed.** No Domain or product behavior.                                              |
| `M0-ENG-002 — Application Skeletons`             | Create bounded entry-point skeletons for web, API, worker, fetcher, and renderer.                              | `M0-ENG-001`                                | **Completed.** No Source, Workflow, Agent, Render, or product implementation.              |
| `M0-ENG-003 — Web Skeleton Loopback Binding`     | Bind the web skeleton's dev/start server to IPv4 loopback only.                                                | `M0-ENG-002`                                | **Completed.** No product behavior; a network-boundary fix only.                           |
| `M0-INFRA-001 — Local State Services`            | Define local Compose services for PostgreSQL, Redis, and S3-compatible Object Storage.                         | `M0-ENG-002`                                | **Completed.** No production vendor selection, application connection, or business schema. |
| `M0-QUAL-001 — Local Quality Toolchain`          | Make format, lint, typecheck, and baseline tests executable locally.                                           | `M0-ENG-001`                                | **Completed.** Local-only tooling; no remote CI, browser, infrastructure, or product test. |
| `M0-QUAL-002 — Integration Smoke Harness`        | Verify application skeletons can use local state dependencies through a minimal non-business smoke path.       | `M0-ENG-002`, `M0-INFRA-001`, `M0-QUAL-001` | **Completed.** No product E2E, Agent Eval, or recovery drill.                              |
| `M0-CI-001 — CI Skeleton`                        | Run the M0 command suite and basic secret/documentation checks in CI.                                          | `M0-QUAL-001`, `M0-QUAL-002`                | **Completed.** No release platform, production deployment, or full release gate.           |

The list is a plan, not permission to merge its tasks or select an unapproved stack. Exact packages, commands, service images, and CI product remain Open Implementation Decisions for bounded Work Items.

## 7. M0-C — M0 Integration Gate

**Current status: Completed.** [M0 Acceptance Record 001](m0-acceptance-record-001.md) remains the immutable historical Blocked record for the task-created demo-volume residue. The exact Human-authorized cleanup and independent re-review are recorded in [M0 Acceptance Record 002](m0-acceptance-record-002.md), which records a Passed decision with no remaining Blocking Defect. M0 is completed; M1 is now in progress.

`M0-GATE-001 — M0 Demo and Exit Audit` was the sole planned M0-C delivery Work Item. `M0-GATE-001A — Gate Demo Cleanup Verification and Acceptance Re-review` was added only as the bounded remediation required by its immutable Blocked record. Together they verify that the assembled baseline is usable:

- clean install and runtime pinning;
- typecheck, lint, formatting, unit test, and integration smoke;
- web and API startup;
- PostgreSQL, Redis, and Object Storage health;
- worker, fetcher, and renderer skeleton behavior;
- CI execution;
- Secret scan and documentation links;
- usable `README.md` and `AGENTS.md`;
- no business implementation.

M0-C records integration evidence and evaluates M0 exit conditions. It did not add a Content Package, Source, Workflow, or Agent feature merely to make the demo appear more complete; M1 has since completed and M2 is in progress.

## 8. M1 — Product Skeleton and Domain Foundation

**Current status: Completed.** `M1-SEC-001`, `M1-CP-001`, and `M1-WEB-001` are completed. [M1 Acceptance Record 001](m1-acceptance-record-001.md) records the Passed decision for the private Login → Dashboard → Content Package Workspace loop and all M1 Exit Criteria. M2 is now in progress.

| Work Item                                                            | Goal                                                             | Depends on   | Status boundary                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------ | ------------------------------------------------------ |
| `M1-SEC-001 — Single-user Session and API Foundation`                | Establish the secure owner Session and protected API boundary.   | M0 Passed    | **Completed.** No Content Package or Web product UI.   |
| `M1-CP-001 — Content Package Domain, Persistence, and Protected API` | Add the first owner-scoped Content Package domain and API slice. | `M1-SEC-001` | **Completed.** No Web product UI, Source, or Workflow. |
| `M1-WEB-001 — Login, Dashboard, and Workspace Thin Slice`            | Connect the Web UI to the protected Content Package API.         | `M1-CP-001`  | **Completed.** No Source, Workflow, or M2 behavior.    |

### Goal

Validate the first UI → API → Domain → Database → UI Thin Slice.

### Primary deliverable

Content Package creation and Workspace Shell.

### Scope

- authentication foundation and owner semantics;
- Content Package, Artifact / Working Copy / Version foundation, and persistence;
- error contract;
- Dashboard empty state, New Package, Workspace shell, metadata editing and refresh;
- Archive foundation, distinct from Delete.

### Explicit out of scope

Source Capture, Workflow Engine, Agent Runtime, Research, publishing content, and Renderer are not implemented in M1.

### Demo

```text
Login
→ Create Package
→ Open Workspace
→ Edit metadata
→ Refresh
→ Persist state
→ Archive
```

## 9. M2 — Source and Workflow Foundation

**Current status: In Progress. M3 is Not Started.**

### Goal

Deliver the private Source intake, review, Approval, Workflow, and Fetcher foundation that M3 Research can consume without giving an Agent authority over human Approval or authoritative state.

### Delivered capability

| Capability group           | Current result                                                                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source evidence and review | Pasted text, `.md`/`.txt` upload, bounded public-URL capture, immutable Source Versions, Working Copy review, exact Review Candidate Approval, and failure visibility are implemented.                                                                  |
| Workflow and delivery      | Workflow catalog/instance/task/event persistence, transactional Outbox delivery, generation-bound Claim/Heartbeat/Result, expired-lease reconciliation, authoritative REST projection, and notification-only SSE with Polling fallback are implemented. |
| Fetcher                    | Public-resource policy, bounded transport, Candidate extraction, scoped Snapshot storage, Queue-to-Gateway orchestration, and API-owned Source promotion are implemented.                                                                               |
| Workspace                  | Active Package Source intake, review, Version history, Approval, and bounded Timeline UI are implemented. Archived review commands remain unavailable.                                                                                                  |
| Quality evidence           | Deterministic, integration, browser, concurrent-harness, dependency-remediation, and Worker-observation improvements have been merged through the M2 quality sequence. Detailed results remain in the linked Work Packets, CI, and Git history.         |

The active Workspace does not transition `source_review` or append an Approval Timeline Event. Research, Agent, Render, Export, and public publishing remain outside M2.

### Current acceptance boundary

[M2 Acceptance Record 001](m2-acceptance-record-001.md) is the immutable historical Blocked exit record. Its original dependency advisory was remediated, and later merged quality work repaired the Worker observation and Concurrent final-success evidence paths.

At this roadmap snapshot, a new effective M2 exit decision has not been published. Current `main` contains the M2-GOV-006 exit-review plan and documentation-recovery planning through `M2-GOV-011`; M2 Acceptance Record 002 is not present/effective on this base. Those Work Packets preserve execution history, but they do not advance M2 or start M3.

Issue #144 remains the M2 exit-review authority. M2 may advance only after one bounded current-main exit review satisfies the [Milestone Exit Criteria](milestone-exit-criteria.md), publishes its Acceptance Record, passes the required affected checks and independent review, and merges. Ordinary documentation, formatting, or tool-contract corrections stay within that Work Item; they do not require a recursively numbered recovery chain.

### Security and quality boundary for M2

The security gates that remain material to M2 are:

- private authenticated owner scope;
- upload and public-URL input bounds, including SSRF/redirect/TLS protections;
- least-privilege Fetcher/Object Storage identities;
- API-owned authoritative mutations and immutable Source evidence;
- Secret and sensitive-error redaction; and
- verified owned-runtime cleanup for integration/browser evidence.

Agent tools, external Model Providers, active Renderer execution, Export delivery, Delete/Restore, backup/restore, and production deployment controls are introduced only with the milestone that implements those capabilities. Their future requirements do not block M2.

### Next step

1. Reuse the existing M2 acceptance harness and current merged implementation; do not rebuild already accepted feature evidence.
2. Run one fresh, bounded exit review from current `main`, recording only the commands, outcomes, blockers, and decision needed by the milestone criteria.
3. If a product/runtime gate fails, fix the underlying defect in one ordinary bounded Work Item and rerun the affected evidence. If only reversible documentation or tooling fails, correct it on the same branch.
4. After M2 acceptance, execute [GOAL.md](../../GOAL.md) from M3 through the M5 text-first MVP. Keep the Roadmap to current status and dependency order; use Acceptance Records, Work Packets, CI, and Git history for chronology.

### M2-GOV-012 — Deterministic Expected-Byte Publication Recovery

| Work Item                                                                                                                                                                | Goal                                                                                                                                     | Depends on                                                                                                                                                                                                                                                | Status boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`M2-GOV-012 — M2 Acceptance Record 002 Deterministic Expected-Byte Recovery`](work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md) | Recover strict Blocked Record 002 publication with prevalidated outside-repository expected artifacts and immediate whole-file equality. | GOV011 planning PR #281/run `31588518215` attempt-1 exact-three-job success and squash `bafef0208a6bed51795217f79b51975064d22974`; frozen GOV006 exact-six source; GOV011 writes 1–7 successful and write-8 literal-predicate first red; Issue #282 Open. | **Ready — Explicit Orchestrator same-worktree handoff recorded.** GOV006/GOV008/GOV009/GOV010/GOV011 first reds remain immutable. GOV011 P0–P3 passed with `safe-count compiled=72 compose=0 temp=1 repo-store=0`; P4 writes 1–7 each had a non-error `{}` result, exact target-only status RC 0, and immediate `cmp`/`rg` RC 0. Write 8 had non-error `{}` plus exact target-only status RC 0, then its sole literal handoff predicate returned RC 1/empty and froze writes 9–10/P5+ at zero. No post-red whole-tree shape command ran, so no exact whole-tree shape is claimed. GOV012 fixes a 2/11/2 lifecycle: all expected artifacts are constructed and independently validated outside the repository before any repository write; every non-error write candidate must then pass target-only status plus exact byte equality. Mutable proof uses parsed fenced JSON sections rather than self-describing markers. Initial DoR findings were closed by frozen JSON/payload/validator contracts, complete literal ledgers, Open/Closed Issue predicates, and bounded hygiene. Correctness and governance reviewers both returned PASS/no findings/no BQ/no DEC; final exact-two checks and #282 parity pass. Record 002 is ineffective; M2 remains In Progress, M3 remains Not Started, and Issues #144/#274/#276/#278/#280/#282 remain Open. |

The successful exact-eleven shape is ten tracked modifications plus new Record
002: five byte-frozen standalone documents, the GOV008/GOV009/GOV010/GOV011/
GOV012 Packets, and Roadmap. A fixed task-owned external directory holds the
prevalidated expected bytes and is never staged or copied into the repository.
Each repository patch has an immediate target-only status and full-file `cmp`
against its expected artifact. Six mutable expected artifacts also pass an
independent Node 24 parser that requires one document-specific heading and one
schema-checked fenced JSON object with exact predecessor/result/status fields;
a marker sentence is never accepted as physical proof.

Publication merge makes Record 002 effective Blocked while M2 remains In
Progress and M3 Not Started. Only a later merged tracked GOV012 Packet/Roadmap
exact-two reconciliation permits all six Issues to close Completed. This
recovery runs no direct/local exit, runtime, unit, Integration, Concurrent,
Browser, audit, database-generation, or migration replay. Mandatory docs-PR
three-job CI is publication eligibility only and cannot reclassify Record 002,
M2, or M3.

## 10. M3 — Research

M3 introduces the first formal Agent Vertical Slice:

- Agent Runtime foundation and Research Agent;
- Fake Provider and one separately authorized real Provider Adapter;
- Frozen Input, validation, evidence, and controlled Candidate handling;
- Research Review, Approval, and Research Version;
- a small deterministic/Eval baseline covering the active Research contract.

Writer, Packaging, and Visual Agents do not precede Approved Research.

## 11. M4 — Human Opinion and Blog

M4 implements:

- Question Cards, Raw Human Response, AI Interpretation, and Confirmed Opinion;
- Creator-led Mode and Research-based Mode;
- Writer Agent, Blog Plan, Blog Working Copy, Revision Proposal, Citation, Approval, and Blog Export.

M4 is an internal milestone: it validates Human Opinion, Citation, Provenance, editing, Approval, and portable Blog Markdown before the independent Xiaohongshu branch.

## 12. M5 — Xiaohongshu Text and Text-first MVP Acceptance

M5 adds the independent Xiaohongshu text branch:

- Packaging Agent and Packaging Plan;
- Platform Profile;
- 6–10 pages with the default 8-page path;
- Platform Title, Cover Title, Caption, CTA, and Hashtags as separate fields;
- page editing and reordering;
- Xiaohongshu Approval;
- portable Markdown/JSON text export; and
- one current-main Source → Research → Opinion/Research-based Mode → approved Blog + approved Xiaohongshu text acceptance run.

It does not treat a Blog shortening operation as Xiaohongshu generation.

**M5 completes the formal text-first private MVP defined by DEC-295.** It does not require Design Specification, image generation, PNG rendering, asset packaging, production deployment, backup/restore, or automatic publishing.

## 13. M6 — Post-MVP Design、Render and Rich Export

M6 consumes an Approved Xiaohongshu Version and adds:

- Visual Agent, Design Specification, Component Registry, Brand Theme;
- Asset Request and Review;
- Preview, Design Approval, and deterministic Final Render;
- Blog Export and Xiaohongshu Export.

M6 enriches the already-validated text product with visual output. The Visual layer cannot edit canonical Xiaohongshu text, and manual publishing remains outside the product. M6 is not required for text-first MVP completion.

## 14. M7 — Post-MVP Production Hardening

M7 consolidates the release evidence that cannot be deferred:

- Worker Crash, Redis Loss, Lease Recovery, Duplicate Promotion, Provider Outage, and Object Storage Failure;
- Security Gate, Delete and Purge, Backup Restore, and Deletion Restore;
- Agent Holdout and Render Regression;
- complete failure-path Vertical Slice;
- Release Evaluation Record and rollback validation.

These gates are required before production use of the corresponding capabilities, not before the local/private text-first MVP. Active authentication, owner, input, Secret, Approval, and affected recovery controls remain mandatory earlier.

## 15. M8 — Private Production Release

M8 deploys the private, single-user, desktop-first product with no public registration and manual publishing. It requires production containers, TLS, Secret injection, backup, monitoring, health checks, runbooks, rollback, known limitations, and a user guide. This is a production-readiness milestone after MVP validation; it does not promise high availability or turn into a public SaaS.

## 16. Cross-cutting Work

Security, testing, observability, documentation, migration safety, accessibility, and failure handling start with the first Milestone that introduces their relevant capability. M7 gathers production hardening; it is not a reason to implement controls for capabilities that do not yet exist.

## 17. Milestone Dependency Map

```text
M0
→ M1
→ M2
→ M3
→ M4
→ M5 (text-first MVP)
→ M6 (post-MVP visual)
→ M7 (production hardening)
→ M8 (private production release)
```

After the Content Foundation, Blog and Xiaohongshu branches have limited technical parallelism. The current plan nevertheless finishes M4 before M5 to establish Human Opinion, Citation, Provenance, and Writer behavior first. Limited parallelism never bypasses a dependency, Gate, or the planned sequence.

## 18. Deferred Backlog

| Priority          | Current classification                                                                                                                                                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must**          | Only the bounded formal MVP capabilities and release requirements stated in Current-truth.                                                                                                                                                                                                                                                    |
| **Should**        | No additional capability is accepted as a roadmap commitment; future candidates need their own evidence and scope review.                                                                                                                                                                                                                     |
| **Could**         | No unapproved feature is scheduled here. Current Open Implementation Decisions are not features.                                                                                                                                                                                                                                              |
| **Won’t for MVP** | Multi-user collaboration, organizations, public registration/share, automatic publishing/scheduling, Analytics dashboard, Workflow Builder, Agent Marketplace, Plugin Platform, Template Marketplace, free-form design canvas, unsupported file/media inputs, autonomous web search, unrestricted tool calling, and Agent-created sub-agents. |

## 19. Scope Change Governance

| Change class                 | Governance path                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bug                          | Defect flow: restore already accepted behavior.                                                                                                                                          |
| Implementation Detail        | Normal bounded Work Item when it does not alter an Accepted boundary.                                                                                                                    |
| Scope or Architecture Change | New DEC before implementation when it affects MVP scope, Domain, Workflow, Version semantics, Security, Agent responsibility, technical architecture, deployment model, or Release Gate. |

## 20. Roadmap Status Rules

Permitted roadmap and Work Item statuses are **Planned**, **Ready**, **In Progress**, **Blocked**, **In Review**, and **Completed**. A status must reflect evidence; this roadmap does not mark unexecuted Milestones as Ready or Completed.

Milestone and Work Item status are governance labels. They are wholly distinct from Artifact, Workflow, Node, Task, Agent Run, Approval, or Render state and must not be stored or interpreted as a substitute for those domain lifecycles.

## 21. No Schedule Commitment

This roadmap defines sequence and Gates, not dates or fixed release windows. It does not advance by calendar, and estimates may be considered separately only after a Work Item is Ready. Schedule pressure never lowers a quality, Security, or release Gate.

## 22. Decision Traceability

This roadmap principally applies DEC-221–DEC-243 (technical and process baseline), DEC-244–DEC-266 (quality and release governance), DEC-267–DEC-294 (historical MVP/implementation baseline), and DEC-295 (text-first MVP rebaseline). [Session-024](../sessions/session-024.md) is the primary historical source for M0–M8; the [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
