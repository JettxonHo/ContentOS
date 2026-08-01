# Decision Review — M2-DES-004

- **Title:** Workflow/Task Foundation and URL-capture Bootstrap
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED — Option B approved by the project authority on 2026-08-01`
- **Date:** 2026-08-01
- **Base commit:** `9704af5fb16e91cbb86afc35beffdad08fbecb53` (`9704af5`)
- **Issue:** [#51](https://github.com/JettxonHo/ContentOS/issues/51)
- **Branch:** `codex/m2-des-004-workflow-task-foundation`
- **Allowed change:** this review document only. It does not implement a Workflow, Task, Outbox, Queue, API route, Fetcher, Source URL capture, migration, configuration, dependency, or UI.

This review decides the smallest durable starting boundary for the first M2
Workflow and Fetch Task. It fixes the complete logical
`content-package-dual-output/v1` Template definition, but deliberately makes
only its Source-capture segment executable in M2 and does not make a URL fetch
available.

## 1. Authority and problem

The following Accepted Decisions and Current-truth requirements already apply:

| Constraint                                                                                                                           | Authority                                                                                                              | Consequence                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| The MVP uses the fixed, versioned `content-package-dual-output/v1` Template; an Instance binds one exact immutable Template Version. | DEC-126; [Workflow Overview §§3–4](../../architecture/workflow-overview.md)                                            | M2 cannot create an unversioned generic task graph or reinterpret an existing Instance later.                                           |
| Artifact, Node, Task, and Workflow states are separate; Task state is PostgreSQL truth.                                              | DEC-127–DEC-128, DEC-226, DEC-228                                                                                      | A Source capture request, Task, Queue delivery, and Source Version cannot be collapsed into one mutable status.                         |
| All state transitions are typed Commands with idempotency and concurrency protection; important Events are append-only.              | DEC-133–DEC-135, DEC-172–DEC-173                                                                                       | A browser click or Queue delivery cannot create a second Task or silently mutate workflow state.                                        |
| Task plus Outbox must commit atomically, and Queue/Worker recovery is required.                                                      | DEC-176, DEC-229, DEC-238, DEC-249                                                                                     | The initial foundation must leave a precise boundary for later dispatch, claim, lease, and reconciliation work.                         |
| API-owned Fetcher Gateway is the selected state-access direction.                                                                    | [M2-DES-002](m2-des-002-workflow-task-state-access.md)                                                                 | Fetcher gets no direct PostgreSQL/Source mutation path; it eventually claims and reports one assigned Task through API-owned Use Cases. |
| Public URL connection binding and first-release resource limits are already decided, but no Fetcher exists.                          | [M2-DES-001](m2-des-001-public-url-fetcher-connection-binding.md), [M2-DES-003](m2-des-003-fetcher-resource-policy.md) | The foundation must not weaken their security constraints or embed fetching behavior before its own Ready Work Item.                    |
| A Source Reference preserves submitted origin separately from immutable evidence, review copies, Versions, and Approval.             | DEC-059–DEC-063, DEC-169, DEC-207, DEC-271–DEC-272; [Source Fetcher](../../security/source-fetcher.md) §§6–9           | A submitted URL may create its immutable Source Reference, but is never itself a Raw Snapshot, Source Version, or Approval.             |

M1 and the two completed M2 Source slices can create Packages and manually
captured Sources, but they deliberately created no Workflow Instance, Task,
Outbox, Queue, or Timeline. A public URL capture needs a durable, owner-scoped
request before an isolated Fetcher can run. Without a bootstrap rule, later
implementation would have to guess whether a Package already has an Instance,
whether a failed capture is a Source, and whether an existing M1 Package needs
invented historical workflow records.

## 2. Decision questions

This review resolves only these coupled questions:

1. Where does the first durable Workflow Instance come from for existing and
   future Content Packages?
2. What is persisted before a public URL Fetch Task has safely captured any
   source bytes?
3. How is the initial Source-capture segment bounded without pretending that
   the full Template, its later Gates, or automatic advancement already exist?

It does not select table columns, route paths, enum spellings, JSON Schema
shapes, queue field names, lease timings, task retry limits, object-key format,
or the Fetcher authentication transport.

## 3. Options considered

| Option                                                                 | Description                                                                                                                                                                                                                                                                                                                                                    | Consequence                                                                                                                                                                                        | Outcome       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| A. Eager Instance creation and historical backfill                     | Create an Instance for every Package at Package creation and synthesize Instances/events for existing Packages.                                                                                                                                                                                                                                                | Couples M1 Package creation to unfinished M2 semantics and fabricates history that never occurred. It also creates dormant state for Packages that never start a Workflow.                         | Reject.       |
| B. Fixed catalog, lazy Instance, Source Reference plus Capture Request | Keep the fixed Template catalog server-owned and immutable. The first authorized Workflow Command creates exactly one initial Instance, its enabled Source-capture Node, an immutable URL Source Reference and Capture Request, Task, Outbox, and Event atomically. A Raw Snapshot and reviewable Source content appear only after a verified Fetcher success. | Preserves one precise template binding and submitted-origin history without inventing legacy history or treating a URL as captured evidence. It gives later work a small, testable entry boundary. | **Accepted.** |
| C. Task-only URL payload                                               | Put the submitted URL and role only in a Task/Queue payload; create no Instance or durable request until Fetcher result.                                                                                                                                                                                                                                       | Weakens submission audit/history, leaves no durable owner-scoped request for a failed capture, and lets queue payload become an implicit source of business truth.                                 | Reject.       |
| D. Generic workflow engine or user-managed Template registry           | Build arbitrary template/node APIs and template management before Source capture.                                                                                                                                                                                                                                                                              | Conflicts with the fixed-template MVP and expands M2 into an automation platform.                                                                                                                  | Reject.       |

## 4. Accepted decision — Option B

Adopt the following constrained Workflow/Task foundation direction.

### 4.1 Immutable server-owned Template catalog

- The initial catalog contains the Accepted identity
  `content-package-dual-output/v1`.
- Its definitions are deployed/seeded as immutable application-owned records;
  no browser, owner, Fetcher, Agent, or generic admin API may create, edit, or
  delete a Template or Template Version.
- A Workflow Instance stores the exact Template identity and version, plus a
  stable definition identity/hash sufficient to detect an invalid or
  mismatched binding. A later template change creates a new Version; it never
  rewrites an Instance or Event history.
- The first persisted `v1` definition contains the complete immutable logical
  coordination skeleton below. It is complete as a Template definition even
  though M2 activates only its Source-capture segment. A later Work Item may
  implement a defined node; it may not add, remove, rename, or change an
  existing `v1` node or dependency.

  | Logical segment  | Immutable `v1` definition                                                                                              | Execution availability in M2                                                                                          |
  | ---------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
  | Source           | Source capture → Source Review human gate                                                                              | Only URL Source capture is activated by this decision; existing Pasted Text/upload behavior remains outside Workflow. |
  | Research         | Research → Research Review human gate                                                                                  | Defined but inactive.                                                                                                 |
  | Human opinion    | Human Opinion → Human Opinion Confirmation, with the already-accepted research-based mode path                         | Defined but inactive.                                                                                                 |
  | Content branches | Content Foundation prerequisite → independent Blog and Xiaohongshu branches, each with its human Approval gate         | Defined but inactive.                                                                                                 |
  | Visual/output    | Approved Xiaohongshu → Design → Design Approval → Render; approved Blog and eligible Render → Final Export Eligibility | Defined but inactive.                                                                                                 |

  The catalog records only the fixed node/dependency/gate skeleton required to
  preserve this identity. It does not preselect implementation-time task
  types, retry values, detailed payload Schemas, UI labels, or framework
  symbols. Instance node records can be materialized only when their defined
  segment first becomes executable; absence of an inactive node record does
  not alter the `v1` definition.

- M2 does not provide Template selection, migration, upgrade, or a Workflow
  Builder. The precise catalog storage representation and hash algorithm are
  Work Item details, provided the immutable binding is enforceable and tested.

The Template identity already describes the required dual-output direction.
Implementing its first Source-capture segment does not claim that future
Research, Human Opinion, Blog, Xiaohongshu, Design, Render, Export, or their
Human Gates are executable in M2.

### 4.2 Lazy, one-time bootstrap for an active Package

- The first eligible structured Workflow Command for an active, owner-scoped
  Content Package lazily creates its initial Workflow Instance.
- The same transaction creates only the Template-defined Source-capture Node
  needed for the command, records the command result/Event, and binds the
  exact Template. It does not fabricate earlier Events for Pasted Text or
  uploaded Sources.
- The bootstrap Command is idempotent. Concurrent duplicate requests yield
  one Instance and one intended capture effect, or a deterministic existing
  result/conflict; they never create parallel initial Instances.
- Existing M1/M2 Packages remain eligible for lazy bootstrap. No bulk backfill
  or synthetic Timeline is authorized.
- M2 does not expose Pause, Resume, Cancel, Skip, Template upgrade, later
  branch activation, or complete-Workflow evaluation in this foundation. Any
  later command must re-evaluate the authoritative Instance/Node/Task state
  rather than infer it from Package state or a Queue Job.

### 4.3 Source Reference and URL Capture Request precede evidence

The owner command first creates an immutable **URL Source Reference**. It is
the stable owner-, Package-, role-, and submitted-origin identity required by
the Source pipeline. A distinct immutable **URL Capture Request** is the
execution input bound to that Source Reference, one Workflow Node, and one
Task. Together they preserve the submitted URL and Source-role intent through
redacted/private handling. Neither is a Raw Snapshot, Normalized Source
Working Copy, Source Version, Approval, or an assertion that retrieval
succeeded.

- The Source Reference, Capture Request, initial Task, Outbox record, and
  append-only Workflow Event are created in the same PostgreSQL transaction
  after owner authorization, command validation, idempotency, and
  expected-revision checks.
- A validation/security block or Fetcher failure remains a classified Task and
  Event outcome. It must not create a fake successful capture, empty Source
  body, Snapshot, Version, Approval, or automatic retry. The Source Reference
  remains durable submitted-origin history with its explicit capture outcome.
- Only a valid, non-cancelled, non-stale Fetcher result accepted through the
  API-owned Gateway may invoke the owning Source Use Case to attach the formal
  Source evidence/review objects to that Source Reference. Human Approval
  stays separate and explicit.
- Submission URL, final URL, redirect evidence, headers, raw body, Object key,
  temporary URL, credential, execution claim, and service authentication
  material are not Queue payloads, browser DTOs, ordinary logs, or normal
  telemetry. The later Contract defines the minimum retained redacted evidence.

This distinction preserves the existing Source pipeline's stable reference and
submitted-origin facts, while ensuring that capture evidence and reviewable
content remain absent until safe retrieval succeeds.

### 4.4 First executable segment and state authority

The M2 foundation activates only this bounded path:

```text
owner URL-capture Command
  → lazy Template/Instance bootstrap (if absent)
  → Source-capture Node + URL Source Reference + immutable URL Capture Request
  → authoritative Task + Outbox + Workflow Event
  → later Dispatcher / Queue / Fetcher Gateway
  → classified result
  → Source Use Case attaches evidence only on valid success
```

The following remain separate authorities:

| Record                                                                                | Authority                                          | Not an authority for                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Workflow Instance / Node / Task / Event / Outbox / Source Reference / Capture Request | PostgreSQL through API-owned Application Use Cases | Queue delivery, browser state, Agent output, or Fetcher process memory  |
| Queue Job                                                                             | BullMQ delivery envelope                           | Task completion, retry eligibility, Source creation, or Workflow truth  |
| Fetcher result                                                                        | Gateway input requiring claim/result validation    | direct Source/Approval/Workflow mutation                                |
| Raw Snapshot, reviewable Source content, and Approval                                 | owning Source Use Case and existing human gate     | a submitted URL, Source Reference, or successful network response alone |

No automatic transition beyond the Source-capture result is authorized here.
The later fixed Template segments and their legal automatic advancement remain
inactive until their own Ready Work Items and accepted policies exist.

## 5. Required Work Item split after acceptance

These are intentionally separate, reviewable implementation objectives. They
are **not Ready until this decision is accepted** and each packet names its
exact contracts, file boundaries, migrations, fixtures, and failure evidence.

| Order | Conditional Work Item                                                    | Goal                                                                                                                                                                                                 | In scope                                                                                                                                                                                                                | Explicitly out of scope                                                                                                                                         | Ready dependency                                       |
| ----- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1     | `M2-WF-001 — Template, Instance, Node, and Event Persistence Foundation` | Persist the complete immutable `v1` logical skeleton and neutral Workflow Instance/Node/Event persistence primitives.                                                                                | Core types/ports, immutable Template catalog seed/validation, PostgreSQL migration/repository, exact binding/definition-mismatch/concurrency tests, migration evidence.                                                 | Any callable bootstrap/owner Command, Node or Event mutation, Source Reference/Capture Request, Task/Outbox, Queue, Fetcher, UI, Agent, SSE.                    | This decision accepted.                                |
| 2     | `M2-WF-002 — Atomic URL-capture Command, Task, and Transactional Outbox` | Accept one owner-scoped structured URL-capture Command that atomically creates the initial Instance/Source-capture Node when absent, URL Source Reference, Capture Request, Task, Outbox, and Event. | API DTO/OpenAPI, Core command/use case, URL Source Reference/Capture Request/Task/Outbox persistence and migrations, owner/idempotency/revision enforcement, first-node materialization, queue-envelope Contract only.  | Dispatcher, Redis/BullMQ execution, Fetcher, Raw Snapshot/review-content creation, approval, UI/SSE.                                                            | `M2-WF-001` completed.                                 |
| 3     | `M2-WF-003 — Outbox Dispatch, Fetcher Claim, Lease, and Reconciliation`  | Reliably deliver the minimum Task envelope and establish the API-owned Gateway claim/lease/recovery foundation.                                                                                      | Dispatcher, BullMQ category/envelope, service-identity boundary, claim/heartbeat/expiry, duplicate delivery, reconciliation/fault tests.                                                                                | Public URL retrieval, Source result mutation, general Task APIs, browser progress UI, Agent.                                                                    | `M2-WF-002` completed; M2-DES-002 accepted.            |
| 4     | `M2-SRC-003 — URL-capture Result Contract and Source Evidence Boundary`  | Define the bounded Gateway result Contract and Source Use Case handoff so only verified success may attach formal evidence to the existing Source Reference.                                         | Result Schema/validator, classification mapping, Source evidence/snapshot and review-content migration where required, integrity-reference validation, snapshot/review-content creation compensation and failure tests. | Initial URL Source Reference/Capture Request schema, socket/DNS/TLS/HTTP implementation, direct Fetcher database access, Source approval automation, web UI.    | `M2-WF-003` completed; M2-DES-001/002/003 accepted.    |
| 5     | `M2-FETCH-001 — Public URL Fetcher`                                      | Implement the isolated Fetcher only through the Claim/Result Gateway and the approved connection/resource policies.                                                                                  | Node 24 controlled public capture, per-hop validation, bounded response processing, scoped Object writes, result submission, security/recovery tests.                                                                   | Direct PostgreSQL mutation, browser automation, arbitrary headers/methods, proxy bypass, extraction library selection beyond a bounded contract, Agent, UI/SSE. | `M2-SRC-003` completed; all M2-DES-001–004 accepted.   |
| 6     | `M2-WF-004 — Progress Projection, SSE, and Polling Recovery`             | Project redacted authoritative progress to the Workspace with polling recovery.                                                                                                                      | API query/projection, SSE event Contract, polling fallback, authorization/redaction/disconnect tests.                                                                                                                   | New state authority, Task mutation, Fetcher, Agent, Web workflow designer.                                                                                      | `M2-WF-002` completed; real Task/Event data available. |

`M2-FETCH-001` is deliberately not a large all-in-one implementation: all
Workflow persistence, dispatch/claim recovery, and Source result/promotion
contracts must be independently accepted before public-network code begins.

## 6. Consequences and safeguards

### Positive consequences

- Existing Packages can enter M2 without false history or a migration of M1
  creation semantics.
- A failed URL capture keeps its durable submitted Source Reference, workflow
  intent, and classified execution history without creating Source evidence,
  review content, or Approval state.
- The first Queue path starts from a transactionally durable Task/Outbox pair
  and leaves one API-owned result boundary for Fetcher.
- Each next Work Item can be reviewed against a narrow authority boundary,
  deterministic state invariants, and explicit fault scenarios.

### Costs and deliberate deferrals

- M2 introduces several small foundational migrations rather than one generic
  workflow engine.
- Template catalog storage, Task/Capture Request result Schemas, retry/lease
  values, service-auth transport, detailed transition policies, cancellation
  commands, and UI presentation still require bounded Work Item contracts.
- A user cannot yet view, pause, cancel, retry, or manage a Workflow in the
  product UI merely because the persistence foundation exists.

### Security and correctness invariants

- Every owner command is authenticated, owner-scoped, typed, idempotent, and
  revision-aware where state-sensitive.
- Only PostgreSQL transactions through API-owned Use Cases mutate authoritative
  Workflow, Task, Event, Outbox, Capture Request, and Source state.
- Queue redelivery and Fetcher retries cannot create a second initial Instance,
  Source Reference, Capture Request, Task, Snapshot, Version, Approval, or
  promotion.
- Cancelled, expired, mismatched, malformed, duplicate, or stale results fail
  closed and cannot create formal Source success.
- No Secret, execution claim, Source body, Object key, temporary URL, raw
  headers, or full URL is exposed outside its approved private boundary.
- No new service, database, Provider, queue product, generic workflow engine,
  public endpoint, or MVP scope expansion is selected.

## 7. Required evidence for the conditional Work Packets

Before each packet becomes Ready, it must contain at least:

1. exact affected contracts (Core, JSON Schema/Ajv where cross-boundary, API,
   database, Queue, and service identity as applicable), including additive
   compatibility and redaction rules;
2. exact allowlist/forbidden-file list, one migration plan, and no change to
   Accepted DEC or completed Source behavior without a new Decision Review;
3. unit, repository/migration, API integration, queue/recovery, and
   security/authorization tests appropriate to its boundary;
4. duplicate command/delivery/result, failure, cancellation/late-result,
   cleanup, and no-Secret/no-residue evidence when that capability is present;
5. documentation synchronization targets and a truthful M2/M3 status boundary.

## 8. Human decision record

The project authority approved **Option B — fixed immutable Template catalog,
lazy one-time Instance bootstrap, an immutable URL Source Reference plus
Capture Request, and Source evidence created only through a valid Gateway
result** on 2026-08-01.

This approval authorizes creation of the six narrow Work Packets in §5. It
does not by itself authorize implementation: a Work Item becomes Ready only
when its own contract meets the repository Definition of Ready. This decision
does not change an Accepted DEC, select a new technical stack, grant direct
Fetcher database access, or automate Source Approval.
