# ContentOS Implementation Roadmap

**Status:** Current Truth
**Scope:** Implementation order, milestone boundaries, demonstrable increments, and scope governance
**Last Updated:** 2026-08-13

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

M0-C records integration evidence and evaluates M0 exit conditions. It did not add a Content Package, Source, Workflow, or Agent feature merely to make the demo appear more complete; M1 and M2 have since completed.

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

**Current status: Completed. G1/M3 Research is in review under Issue #289.**

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

[M2 Acceptance Record 001](m2-acceptance-record-001.md) remains the immutable historical Blocked record. [M2 Acceptance Record 002](m2-acceptance-record-002.md) records the fresh current-main Passed decision after root quality, Integration, Concurrent Integration, Browser, repository integrity, and official-registry High audit evidence passed. M2 is Completed; M3 may now begin through one bounded Ready Work Item under [GOAL.md](../../GOAL.md).

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

G1/M3 Research is implemented as the bounded Issue #289 candidate. Real Provider credentials, paid calls, or external effects remain separately authorized; the current slice uses only the deterministic Fake Provider.

### Superseded M2 publication-recovery chain

`M2-GOV-008` through `M2-GOV-014` preserve historical attempts to publish the frozen GOV006 Blocked record through exact-file and literal-command protocols. GOV012 and GOV013 planning merged, but their implementations stopped at their documented first red; GOV014 planning never merged. None produced an effective Acceptance Record 002.

DEC-295 and `GOAL-MVP-TEXT-001` replaced that recursive publication approach with one fresh current-main G0 exit review. The old Work Packets remain immutable historical evidence and are not executable dependencies. PR #288 merged the Passed M2 Acceptance Record 002 and Issue #144 closed Completed. Issues #274, #276, #278, #280, #282, #284, and #287 closed as `not planned`, with comments that their objectives were not completed. No historical first red is reclassified as success.

## 10. M3 — Research

**Current status: In Review.** [G1 — Approved Sources to Approved Research Thin Slice](work-packets/g1-research-thin-slice.md) implements the bounded candidate under Issue #289; it is not effective until independent review, required CI, and squash merge pass.

The G1 candidate provides:

- a deterministic Fake Provider behind a project-owned `ResearchProvider` interface, without a generic Agent platform;
- exact Approved Source Version input snapshots, validated structured output, and restricted Raw Output persistence;
- owner-scoped Research Working Copy review, immutable Versions, exact human Approval, and Outdated propagation;
- protected REST/OpenAPI routes and an active Workspace Research panel; and
- deterministic unit, real-database Integration, and Browser evidence.

One real Provider Adapter remains separately gated by credentials and cost authorization. G2 does not start before this G1 candidate is reviewed and merged.

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
