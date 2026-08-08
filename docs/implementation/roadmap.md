# ContentOS Implementation Roadmap

**Status:** Current Truth
**Scope:** Implementation order, milestone boundaries, demonstrable increments, and scope governance
**Last Updated:** 2026-08-02

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

## 3. Milestone Structure

The formal implementation sequence is:

```text
M0 — 开工基线
M1 — 产品骨架与领域基础
M2 — Source 与 Workflow 基础
M3 — Research
M4 — Human Opinion 与 Blog
M5 — Xiaohongshu Content
M6 — Design、Render 与 Export
M7 — Hardening 与 Release Gate
M8 — Private MVP Release
```

Only M8 completes the formal MVP. M4's Blog path and M6's functional happy path are internal milestones; neither is the release claim.

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

**Current status: In Progress.** The M2 Source, Workflow, delivery, Gateway, recovery, Result, public-transport, Candidate/Snapshot, Queue-to-Gateway Fetcher, current-Approved Source input projection, authoritative Workflow query, notification-only SSE, Source Intake Workspace, and Source Review and Approval Workspace foundations through `M2-WEB-001B` are completed. `M2-FETCH-001` is **Completed** through PR #100, squash merge `4fe20a48a02b83ec68886bae68b86f5e65ba3895` (`feat: add queue-to-gateway Fetcher orchestration (#100)`); `M2-SRC-004` is **Completed** through PR #104, squash merge `d2ec063743681b64f0406b4903805700bd9866e3` (`feat: add approved Source input projection (#104)`); `M2-WF-004A` is **Completed** through PR #108, squash merge `acdb971ffd8a1c8898666182ac017817f095e1b7` (`feat: add workflow projection and timeline queries (#108)`); `M2-WF-004B` is **Completed** through PR #112, squash merge `d9460747c530797dc11c341374183ad57e7fa85e` (`feat: add workflow SSE recovery (#112)`); `M2-WEB-001A` is **Completed** through PR #118, squash merge `58d2e8ca1f80d0ea03ef991aa22f40c3b058c25c` (`feat: add Source intake workspace (#118)`); `M2-WEB-001B` is **Completed** through PR #122, squash merge `9af5f68b8846ab172bff7599657c9409faed85c4` (`feat: add Source review and approval workspace (#122)`); `M2-QUAL-001` is **Completed** through PR #126, squash merge `4ee1911c69d9ad55bbb34a3729be3cd3d9625f23` (`test: add M2 acceptance harness (#126)`); `M2-QUAL-002` is **Completed** through PR #130, squash merge `cc0445159a210e2d60c6abdda132480383b38d82` (`test: stabilize Source status recovery evidence (#130)`); `M2-MAINT-001` is **Completed** through PR #131, squash merge `fea08d03eb1c4303f5ae65e6e3fea6c289a44023` (`fix: remediate inherited dependency advisories (#131)`). `M2-GOV-005` is **Completed — Exit Review Blocked** through [M2 Acceptance Record 001](m2-acceptance-record-001.md) on reviewed commit `c64fe74ab27513b07a2eb95e86c8f55b90245923`; the High `nanoid@3.3.16` advisory is tracked by [Issue #139](https://github.com/JettxonHo/ContentOS/issues/139). M2 remains In Progress; M3 remains Not Started.

The active Workspace now provides Source intake, explicit Working Copy review and save, immutable Version history, exact current Review Candidate human Approval, and bounded safe Timeline UI through the existing SSE/Polling recovery controller. It does not transition `source_review`, append an Approval Timeline Event, expose archived review commands, or implement Research, Agent, Render, or Export behavior.

M2 establishes formal input and orchestration before any Agent:

- Public URL, Pasted Text, `.md`, and `.txt` input paths;
- Raw Snapshot and Normalized Source Version;
- Source Approval and visible Capture Failure;
- Workflow Template v1, Workflow Instance, Task, and Timeline;
- Transactional Outbox, BullMQ delivery, Worker Lease, and Reconciliation;
- SSE progress with Polling fallback.

The first Agent is not implemented in M2. It consumes only Approved Source Versions in M3.

| Work Item                                                                | Goal                                                                                                                                                                                  | Depends on                                                 | Status boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `M2-SRC-001 — Pasted-text Source Capture and Approval Foundation`        | Establish private pasted-text capture, immutable Source evidence, review, Version, and human Approval.                                                                                | M1 Passed                                                  | **Completed.** PR #40 (`1a50d2d`). No URL Fetcher, Workflow, Queue, Agent, or Web Source UI.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `M2-SRC-002 — .md/.txt File-upload Source Capture and Upload Quarantine` | Add the two allowed uploaded-text inputs through a protected, side-effect-free-on-denial quarantine path.                                                                             | `M2-SRC-001`                                               | **Completed.** PR #42 (`3f418bf`). No URL Fetcher, persistent malware quarantine, Workflow, Queue, Agent, or Web Source UI.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `M2-WF-001 — Template, Instance, Node, and Event Persistence Foundation` | Persist the fixed immutable `content-package-dual-output/v1` catalog and neutral owner-scoped Workflow primitives.                                                                    | `M2-DES-004` accepted                                      | **Completed.** PR #55 (`8ec67ae`). Core/Drizzle/migration/repository-test foundation only. No Command, bootstrap, Task, Outbox, Queue, URL Source, Fetcher, UI, SSE, or Agent.                                                                                                                                                                                                                                                                                                                                              |
| `M2-WF-002 — Atomic URL-capture Command, Task, and Transactional Outbox` | Atomically accept one owner URL-capture request and create the lazy initial Workflow primitives, Task, Outbox, and Event.                                                             | `M2-WF-001` completed                                      | **Completed.** PR #60 (`3928b55`). Core, Contracts, additive `0005`, atomic repository, protected API, rollback/concurrency/migration tests, and OpenAPI only. No Dispatcher, BullMQ execution, Fetcher, Source evidence, Source Approval, UI, SSE, Agent, or M3 behavior.                                                                                                                                                                                                                                                  |
| `M2-WF-003A — Transactional Outbox Dispatcher`                           | Deliver the existing minimum Fetcher Task envelope from PostgreSQL Outbox state to BullMQ with current-generation delivery recovery.                                                  | `M2-WF-002`, `M2-DES-005` accepted                         | **Completed.** PR #69, squash-merged as `3211c29ef8e6a934e6473a4f92caf36d8593abc3`. Queue delivery only: Worker Dispatcher, BullMQ transport, and Outbox-ledger recovery. No Fetcher consumer, service identity, claim/lease, result, Source evidence, public URL retrieval, UI/SSE, Agent, or M3 behavior.                                                                                                                                                                                                                 |
| `M2-WF-003B — Fetcher Gateway Claim and Bounded Lease`                   | Add the private API-owned Fetcher service Claim/Heartbeat contract and durable bounded Task lease.                                                                                    | `M2-WF-003A`, `M2-DES-005` accepted                        | **Completed.** Issue #71. PR #73, merged as `c9c92b70a0ccd99be944107120f03dd3a1776da3` (`feat: add fetcher gateway claim lease (#73)`). API/Core/Contracts/Database boundaries, additive `0007`, Fetcher configuration-validated skeleton, migration/concurrency/API/process/browser evidence, and no Queue consumer, Fetcher public request, result, Source evidence, Object Storage writes for fetched results, lease recovery, UI/SSE, Agent, or M3 behavior.                                                            |
| `M2-WF-003C — Lease and Delivery Reconciliation`                         | Recover one expired Fetcher lease into its next bounded delivery generation without creating a Task or accepting a result.                                                            | `M2-WF-003A`, `M2-WF-003B`, `M2-DES-005` accepted          | **Completed.** PR #77, `ed428b1c12eb6e2ce01d964d56c05a09a3ba87d1`. [Work Packet](work-packets/m2-wf-003c-lease-delivery-reconciliation.md), Issue #75. Worker-owned PostgreSQL reconciliation, one safe recovery Event, and existing Queue delivery only. No Fetcher consumer/public request/result/Source evidence/Object Storage/API/UI/Agent behavior, migration, or dependency change. Independent review passed; published through PR #77.                                                                             |
| `M2-SRC-003 — URL-capture Result Contract and Source Evidence Boundary`  | Define the API-owned versioned Fetcher Result contract and attach verified URL Source evidence (Raw Snapshot, Working Copy, Head) to the existing URL Source Reference.               | `M2-WF-003C` completed, `M2-DES-004`/`M2-DES-005` accepted | **Completed.** [Work Packet](work-packets/m2-src-003-url-capture-result-source-evidence.md), Issue #80, PR #82, squash merge `6b6e4a0f2c180093db6e76090ab14b831e5631f6`. Private Result route, exact `fetcher-result/v1` contract, Task terminal states, idempotent/late-result fencing, object integrity, Source success/failure graph, additive `0008` migration, and tests. No URL fetching, Queue consumer, public network, Source Approval, Source Version, UI/SSE, Agent, or M2-FETCH-001.                            |
| `M2-FETCH-001A — Public Transport and Resource Policy`                   | Implement the unregistered Fetcher-private public transport: URL/address policy, numeric connection binding, TLS identity, manual redirects, and bounded streaming response handling. | `M2-SRC-003` Completed, M2-DES-001/003/006 accepted        | **Completed.** [Work Packet](work-packets/m2-fetch-001a-public-transport-and-resource-policy.md), Issue #91, PR #92, squash merge `551217c130f6717f4b8891ce76de1fa124bf8ee0` (`feat: add public URL transport policy (#92)`). No Queue consumer, Gateway call, Object Storage write, Candidate extraction, Result submission, Source mutation, or runtime registration.                                                                                                                                                     |
| `M2-FETCH-001B — Candidate Extraction and Scoped Snapshot Writer`        | Extract the bounded Candidate, write and verify the immutable Snapshot, and construct the exact Result value.                                                                         | `M2-FETCH-001A` completed                                  | **Completed.** [Work Packet](work-packets/m2-fetch-001b-candidate-extraction-scoped-snapshot-writer.md), Issue #94, PR #96, squash merge `9b28068eb3ed266973f77bcdffe6c08776b2086c` (`feat: add candidate extraction and scoped snapshot writer (#96)`). Private unregistered Candidate extraction, scoped Fetcher snapshot writer, and existing Result construction only. No Queue consumer, Task lifecycle orchestration, runtime registration, API, or Source mutation.                                                  |
| `M2-FETCH-001C — Queue-to-Gateway Fetcher Orchestration`                 | Consume the queued Task, coordinate Claim/Heartbeat/Result, and enforce one-active-capture process scheduling.                                                                        | `M2-FETCH-001A` and `M2-FETCH-001B` completed              | **Completed.** [Work Packet](work-packets/m2-fetch-001c-queue-gateway-fetcher-orchestration.md), Issue #98, PR #100, squash merge `4fe20a48a02b83ec68886bae68b86f5e65ba3895` (`feat: add queue-to-gateway Fetcher orchestration (#100)`). Shared Queue contract, generation-bound Claim, one active Fetcher consumer, Gateway client, scoped Snapshot composition, Result submission, and lifecycle evidence. No schema, new transport/extraction semantics, Source/Workflow mutation authority, UI, Agent, or M3 behavior. |
| `M2-SRC-004 — Approved Source Input Projection`                          | Add one internal owner-scoped read Port that projects only each Source's current exact Approved Version for one active Package.                                                       | `M2-SRC-001`–`M2-SRC-003` completed                        | **Completed.** [Work Packet](work-packets/m2-src-004-approved-source-input-projection.md), Issue #102, PR #104, squash merge `d2ec063743681b64f0406b4903805700bd9866e3` (`feat: add approved Source input projection (#104)`). Core Port and one PostgreSQL read adapter only. No Research readiness, Frozen Input, API/UI, mutation, schema, migration, or M3 behavior.                                                                                                                                                    |
| `M2-WF-004A — Workflow Projection and Timeline Query`                    | Add authenticated owner-scoped authoritative Workflow projection and bounded Timeline REST reads.                                                                                     | `M2-WF-003C`, `M2-SRC-004` completed                       | **Completed.** [Work Packet](work-packets/m2-wf-004a-workflow-projection-timeline-query.md), Issue #106, PR #108, squash merge `acdb971ffd8a1c8898666182ac017817f095e1b7` (`feat: add workflow projection and timeline queries (#108)`). Core read Port, explicit PostgreSQL projection, exact Contracts, and two GET routes only. No SSE, polling timer, UI, write command, schema, migration, Queue, Agent, Research, or M3 behavior.                                                                                     |
| `M2-WF-004B — SSE Notification and Polling Recovery`                     | Add owner-scoped Workflow change-notification SSE and a reusable REST-recovery controller.                                                                                            | `M2-WF-004A` completed                                     | **Completed.** [Work Packet](work-packets/m2-wf-004b-sse-notification-polling-recovery.md), Issue #110, PR #112, squash merge `d9460747c530797dc11c341374183ad57e7fa85e` (`feat: add workflow SSE recovery (#112)`). Exact notification Contract, API-only observation/keepalive/lifecycle, authoritative REST refresh, and five-second browser Polling fallback. No visible Workspace composition, Workflow write, schema, migration, dependency, Queue, Agent, Research, or M3 behavior.                                  |

| `M2-WEB-001A — Source Intake Workspace` | Compose existing Source commands and one durable URL-intake read into the active Package Workspace. | `M2-WF-004B` completed, M2-DES-007 accepted | **Completed.** [Work Packet](work-packets/m2-web-001a-source-intake-workspace.md), Issue #116, PR #118, squash merge `58d2e8ca1f80d0ea03ef991aa22f40c3b058c25c` (`feat: add Source intake workspace (#118)`). Owner-visible formal Source cards, Pasted Text, `.md`/`.txt` upload, one URL capture, safe failure fallback, and REST refresh after existing recovery notifications. No Source Working Copy/Version/Approval UI, Timeline UI, Research, Agent, schema, migration, or dependency change. |
| `M2-WEB-001B — Source Review and Approval Workspace` | Compose existing Source review/Version/Approval and Timeline reads into the active Package Workspace. | `M2-WEB-001A`, `M2-WF-004B`, `M2-SRC-004` completed | **Completed.** [Work Packet](work-packets/m2-web-001b-source-review-approval-workspace.md), Issue #120, PR #122, squash merge `9af5f68b8846ab172bff7599657c9409faed85c4` (`feat: add Source review and approval workspace (#122)`). Active-only explicit save, checkpoint-aware immutable Version history, exact current-candidate human Approval, safe bounded Timeline REST presentation, and existing SSE/Polling recovery composition. No schema, migration, Workflow write, Source-review transition, Approval Timeline Event, Research, Agent, Render, Export, or archived review commands. |
| `M2-QUAL-001 — M2 Acceptance Harness and Evidence Matrix` | Add reproducible M2 acceptance evidence and its quality documentation using the existing integration and browser harnesses. | M2 Source, Workflow, Fetcher, and Workspace foundations completed | **Completed.** [Work Packet](work-packets/m2-qual-001-m2-acceptance-harness.md), Issue #124, PR #126, squash merge `4ee1911c69d9ad55bbb34a3729be3cd3d9625f23` (`test: add M2 acceptance harness (#126)`). Acceptance tests and evidence matrix only; no product behavior, dependency, Schema, migration, Compose, or acceptance-record change. M2 remains In Progress; M2-GOV-005 is Completed — Exit Review Blocked. |

| `M2-QUAL-002 — Source Status Recovery Browser Stability` | Stabilize the Source-status recovery browser evidence around an accepted background-refresh/reload-affordance race. | `M2-QUAL-001` completed | **Completed.** [Work Packet](work-packets/m2-qual-002-source-status-recovery-browser-stability.md), Issue #129, PR #130, squash merge `cc0445159a210e2d60c6abdda132480383b38d82` (`test: stabilize Source status recovery evidence (#130)`). Test-only single-DOM-evaluation repair scoped to the detached `Reload Source status` race; all three required CI jobs passed. |

| `M2-MAINT-001 — Inherited Dependency Audit Remediation` | Remove the inherited Critical/High dependency-audit blocker with the smallest compatible patched transitive versions. | `M2-QUAL-001` completed | **Completed.** [Work Packet](work-packets/m2-maint-001-inherited-dependency-audit-remediation.md), Issue #95, PR #131, squash merge `fea08d03eb1c4303f5ae65e6e3fea6c289a44023` (`fix: remediate inherited dependency advisories (#131)`). Both official-registry audits reported zero known vulnerabilities and all three required CI jobs passed. M2 remains In Progress; M2-GOV-005 is Completed — Exit Review Blocked; M3 remains Not Started. |

| `M2-DOC-001 — Current-truth Runtime Status Normalization` | Normalize six stale implementation-status and runtime-configuration passages in the bounded M2 Current-truth documents. | `M2-FETCH-001B`, `M2-FETCH-001C`, and `M2-WEB-001B` completed | **Completed.** [Work Packet](work-packets/m2-doc-001-current-truth-runtime-status-normalization.md), Issue #133, PR #135, squash merge `9546010bd030b08e1ce56048c5dd151ec5b4e06c` (`docs: normalize M2 runtime status (#135)`). All three required GitHub CI jobs passed. Documentation-only status normalization with no product, architecture, security-policy, Schema, migration, dependency, CI, or runtime change. M2 remains In Progress; M2-GOV-005 is Completed — Exit Review Blocked; M3 remains Not Started. |

## 10. M3 — Research

M3 introduces the first formal Agent Vertical Slice:

- Agent Runtime foundation and Research Agent;
- Fake Provider and the first real Provider Adapter;
- Frozen Input, validation, evidence, and controlled Candidate handling;
- Research Review, Approval, and Research Version;
- Research Eval baseline.

Writer, Packaging, and Visual Agents do not precede Approved Research.

## 11. M4 — Human Opinion and Blog

M4 implements:

- Question Cards, Raw Human Response, AI Interpretation, and Confirmed Opinion;
- Creator-led Mode and Research-based Mode;
- Writer Agent, Blog Plan, Blog Working Copy, Revision Proposal, Citation, Approval, and Blog Export.

M4 is not the formal MVP: it validates one branch while preserving the later Xiaohongshu requirement.

## 12. M5 — Xiaohongshu Content

M5 adds the independent Xiaohongshu branch:

- Packaging Agent and Packaging Plan;
- Platform Profile;
- 6–10 pages with the default 8-page path;
- Platform Title, Cover Title, Caption, CTA, and Hashtags as separate fields;
- page editing and reordering;
- Xiaohongshu Approval.

It does not treat a Blog shortening operation as Xiaohongshu generation.

## 13. M6 — Design、Render 与 Export

M6 consumes an Approved Xiaohongshu Version and adds:

- Visual Agent, Design Specification, Component Registry, Brand Theme;
- Asset Request and Review;
- Preview, Design Approval, and deterministic Final Render;
- Blog Export and Xiaohongshu Export.

M6 completes the functional dual-output loop, but not formal Release Hardening. The Visual layer cannot edit canonical Xiaohongshu text, and manual publishing remains outside the product.

## 14. M7 — Hardening and Release Gate

M7 consolidates the release evidence that cannot be deferred:

- Worker Crash, Redis Loss, Lease Recovery, Duplicate Promotion, Provider Outage, and Object Storage Failure;
- Security Gate, Delete and Purge, Backup Restore, and Deletion Restore;
- Agent Holdout and Render Regression;
- complete failure-path Vertical Slice;
- Release Evaluation Record and rollback validation.

M6 cannot be released directly without M7.

## 15. M8 — Private MVP Release

M8 releases a private, single-user, desktop-first product with no public registration and manual publishing. It requires production containers, TLS, Secret injection, backup, monitoring, health checks, runbooks, rollback, known limitations, and a user guide. The release remains a controlled single-user deployment; it does not promise high availability or turn into a public SaaS.

## 16. Cross-cutting Work

Security, testing, observability, documentation, migration safety, accessibility, and failure handling start with the first Milestone that introduces their relevant capability. M7 gathers hardening and release proof; it is not a reason to postpone these concerns until late in delivery.

## 17. Milestone Dependency Map

```text
M0
→ M1
→ M2
→ M3
→ M4
→ M5
→ M6
→ M7
→ M8
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

This roadmap principally applies DEC-221–DEC-243 (technical and process baseline), DEC-244–DEC-266 (quality and release governance), and DEC-267–DEC-294 (MVP boundary, implementation sequence, Work Item governance, and completion). [Session-024](../sessions/session-024.md) is the primary historical source for M0–M8; the [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
