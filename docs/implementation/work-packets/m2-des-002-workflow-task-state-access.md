# Decision Review — M2-DES-002

- **Title:** Workflow Task Authority and Fetcher State-Access Decision Review
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Human authority approved Option B on 2026-08-01
- **Date:** 2026-08-01
- **Base commit:** `5a10d51e8f43aeb30c544b66f0fc5daf4679f255` (`5a10d51`)
- **Issue:** [#47](https://github.com/JettxonHo/ContentOS/issues/47)
- **Branch:** `codex/m2-des-002-workflow-task-state-access`
- **Allowed change:** this document only; no Workflow, Task, Outbox, Queue, API, Fetcher, Source, migration, configuration, or dependency implementation

This review resolves the open mechanism for the Fetcher to obtain one assigned Task and report a bounded result without becoming a direct Domain writer. It does not select a full Workflow Template Schema, an API route, a database Schema, a queue payload, a service-authentication protocol, timing values, or implementation code.

## Proposed change

Adopt an **API-owned Fetcher Task Gateway** as the future state-access direction:

```text
owner command
  → API transaction: authoritative Task + Outbox + Event
  → Dispatcher: Task identity to BullMQ
  → Fetcher: claim assigned Task through a restricted API-owned Gateway
  → Fetcher: perform bounded public capture and scoped object writes
  → Gateway: validate claim/result and invoke the owning application Use Case
  → API transaction: authoritative Task/result/Event updates
```

The API owns every authoritative Domain, Source, Workflow, Task, and Event mutation. PostgreSQL remains the only Workflow truth. BullMQ carries a minimum delivery envelope and may redeliver. The Fetcher receives neither a general PostgreSQL credential nor a direct general Domain-write path.

## Change category

- [ ] MVP scope
- [ ] Domain semantics
- [x] Workflow
- [x] Security boundary
- [x] Technical architecture
- [ ] Agent responsibility
- [ ] Release Gate

## 1. Authority and evidence

The recommendation preserves these Accepted rules:

| Constraint                                                                                                      | Authority                                            | Consequence for this review                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| deterministic Executor creates Tasks and records Events; Planner cannot mutate state                            | DEC-125, DEC-133                                     | A Fetcher result is not a free-form callback or an authoritative Command.                                |
| Task, Queue Job, Agent Run, and Model Attempt are separate; Task state is PostgreSQL truth                      | DEC-128, DEC-226, DEC-228                            | A BullMQ Job cannot represent Fetcher completion or retry eligibility by itself.                         |
| Command/Task idempotency, conflict detection, leases, and recovery are required                                 | DEC-134, DEC-238, DEC-249                            | The result path must be idempotent, claim-bound, late-result-safe, and reconcilable.                     |
| Domain state, Task creation, and Outbox insertion commit together                                               | DEC-229                                              | Dispatch begins from durable state, never from an API-process memory side effect.                        |
| Fetcher is a separate least-privilege public-egress boundary with only minimum state access                     | DEC-221, DEC-230–DEC-232; Process Topology §6 and §9 | Fetcher cannot own general database or Source/Approval mutation.                                         |
| API owns Domain-state changes; other processes do not bypass Application Use Cases                              | `AGENTS.md` §6; Process Topology §4                  | A restricted Fetcher database adapter is still an impermissible state-write bypass.                      |
| Security, cancellation, stale results, and duplicate promotion fail closed                                      | DEC-245, DEC-259; Workflow Overview §§12–17          | A cancelled, expired, duplicate, or malformed Fetcher result cannot create a Source success.             |
| M2 requires Source, Task, Outbox, Queue, Lease, Reconciliation, SSE, and Source Approval before the first Agent | DEC-280                                              | This review supports a staged M2 foundation; it does not collapse those deliverables into one Work Item. |

Later Accepted DEC governs an actual conflict. No conflict was found. The Process Topology calls the Fetcher state path open; this review chooses a bounded direction compatible with the later repository rule that API owns Domain state changes.

## 2. Problem

Public URL capture is asynchronous and belongs to the isolated Fetcher process, while Source and Workflow truth belong to PostgreSQL-backed Application Use Cases. The architecture therefore needs a route that can do all of the following without violating either boundary:

1. create one durable, owner-scoped Fetch Task and its Outbox entry atomically;
2. deliver only minimum metadata to BullMQ, tolerate duplicate delivery, and recover lost delivery;
3. let Fetcher obtain only its assigned input after a bounded claim;
4. let Fetcher report a classified result without directly mutating Source, Approval, Workflow, or arbitrary Task state;
5. reject cancellation, expired claim, task-kind mismatch, stale/late, duplicate, owner-crossing, or malformed results; and
6. preserve an append-only Event/audit trail without placing URLs, bodies, object keys, credentials, or signed URLs into ordinary Queue payloads or logs.

Neither a default Queue callback nor a least-privilege database role alone makes application semantics authoritative. The architecture must enforce them in one owning Application boundary.

## 3. Options considered

| Option                                                                  | Authority and security                                                                                                                                                                                                | Recovery and testability                                                                                                                                                               | Outcome                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| A. Fetcher writes PostgreSQL through a restricted repository/role       | Even a restricted role bypasses the API-owned Use Case rule and makes Fetcher responsible for Task/Source transition validation. It increases database credentials and schema knowledge in the public-egress process. | Transactional detail can be local, but cancellation, authorization, duplicate and late-result validation would be duplicated or weakened.                                              | Reject.                       |
| B. API-owned Fetcher Task Gateway with Task claim and result operations | API/Application Use Cases remain the sole authoritative state transition boundary. Fetcher has only queue delivery, scoped Object Storage, and a narrow authenticated Gateway capability.                             | Gateway checks claim, task kind, current authoritative state, idempotency, cancellation, lease, integrity references, and result shape. PostgreSQL can reconcile Queue/claim state.    | Accepted.                     |
| C. Queue-only completion event consumed by another process              | Queue-only messages cannot become authoritative state. A Worker consumer still needs an owning state-mutation boundary, and moving that boundary into the Worker conflicts with API ownership.                        | Duplicate completion envelopes, lost consumer delivery, and cancellation require the same durable validation. It adds a second asynchronous channel without removing the core problem. | Reject as the first boundary. |

### Why Option A is not a safe interpretation of “scoped state path”

Process Topology permits a minimum Fetcher state path but not a general Domain write. `AGENTS.md` §6 further clarifies the governing repository interpretation: API owns Domain-state changes, and Worker, Web, and tools do not bypass API/Domain rules by writing state directly. A Fetcher-specific database role could reduce blast radius, but it cannot prove that every transition passes the same authorization, cancellation, idempotency, Event, and Source eligibility checks. It is therefore not the selected implementation of the open state path.

### Why Option C is not a safe shortcut

BullMQ provides at-least-once delivery, not authoritative Workflow history. A Fetcher-produced completion Job would still require a consuming process to decide whether a Task is active, claimed, cancelled, retryable, duplicate, stale, or eligible to create Source evidence. Encoding those decisions in a Queue consumer makes the Queue path a competing authority or merely recreates the proposed Gateway indirectly. The first foundation should have one authoritative result boundary.

## 4. Recommended decision

**Recommend Option B: API-owned Fetcher Task Gateway.**

The Gateway is a bounded application contract owned by the API module. “Gateway” names the authority boundary, not a new service, product, package, provider, or microservice. Its first implementation transport remains a later Work Item detail, but it must authenticate the Fetcher service identity and expose no browser/public-user capability.

### 4.1 Required state flow

1. An authenticated owner submits a structured URL-capture Command to the API. The API authorizes the Content Package and Source role, validates the Command/idempotency context, and invokes the owning Source/Workflow Use Case.
2. One PostgreSQL transaction creates the minimum authoritative Task, Outbox record, and append-only Event. It does not create an Approval or claim a successful Source capture.
3. Dispatcher reads the Outbox and submits a minimum Queue envelope containing Task identity, queue category, delivery/correlation identity, and no Source body, credential, Object Storage key, signed URL, or mutable business state.
4. Fetcher receives the Queue delivery and calls the Gateway to claim the exact Task. The Gateway authenticates the Fetcher identity, verifies Task kind/category and current state, records a bounded lease/attempt, and returns only the input and policy references necessary for that Fetcher Task.
5. Fetcher performs its permitted capture and restricted Object Storage operations. It does not create a Source Version, Approval, Workflow completion, or arbitrary Domain record.
6. Fetcher returns a bounded classified result through the Gateway. The Gateway validates its execution claim, task kind, idempotency, cancellation/late-result eligibility, object integrity evidence, and result Contract; it then invokes the owning application Use Case to commit Task/result/Event changes atomically where applicable.
7. Duplicate Queue deliveries and result submissions return a deterministic existing outcome and do not create another Task, Snapshot, Source, Version, Approval, or Event effect beyond allowed delivery/attempt evidence.
8. A reconciler uses PostgreSQL Task, Outbox, claim/lease, and result state to recreate missing Queue delivery or resolve expired work. It never promotes a late/cancelled result.

### 4.2 Minimal Gateway capabilities

The first contract has only three conceptual operations. Illustrative names are not final REST routes or TypeScript symbols.

| Operation                 | Caller                                               | Allowed effect                                                                          | Must reject                                                                                                |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| create URL-capture Task   | authenticated owner through normal API Command       | create Task + Outbox + Event in one transaction                                         | owner/package/role conflict, invalid Command, duplicate conflict, archived package                         |
| claim assigned Fetch Task | authenticated Fetcher identity after Queue delivery  | issue or renew one bounded execution claim for one active Task                          | unknown/wrong-kind/cancelled/completed Task, unauthorized Fetcher, conflicting active claim                |
| report Fetch Task result  | same Fetcher identity with the exact execution claim | call owning Use Case to record one classified outcome and immutable evidence references | expired/mismatched claim, duplicate/late/cancelled result, invalid result shape, unsafe Snapshot/reference |

The Gateway must not expose generic Task list/update/delete, arbitrary Source create/update/approve, general Workflow transition, broad SQL, raw Object Storage access, or any browser-facing service capability.

### 4.3 Service identity and execution claims

The Fetcher needs a distinct service identity at the Gateway boundary. Its exact transport authentication mechanism, secret-reference names, local-development injection, rotation, and production deployment policy remain open Work Item details and must follow Secret Management and least-privilege rules. The decision fixes these constraints:

- no owner Session, Browser cookie, Model Provider Credential, or shared database credential authenticates Fetcher;
- Queue delivery does not carry a long-lived credential or authoritative Task payload;
- an execution claim is scoped to one Task, one attempt/lease, one Fetcher category, and a bounded validity period;
- a claim does not authorize approval, generic mutation, another owner’s Task, or a result after cancellation/expiry;
- service authentication material, execution claims, full URLs, Source bodies, object keys, signed URLs, and raw headers never enter ordinary logs, telemetry, Queue payloads, Prompts, or browser responses.

The Gateway may be implemented later as an internal API route or a co-located application transport only if it preserves these constraints. Choosing a new public network service, service mesh, proxy, external identity provider, database role as state authority, or provider SDK requires another Decision Review.

### 4.4 Result and evidence boundary

The Gateway receives a versioned, bounded Fetch-result Contract rather than a Source mutation instruction. It can contain the Task/claim identity, classified outcome, safe response metadata, integrity-verified immutable object references, normalized/final URL facts, redirect evidence references, retry eligibility, and redacted diagnostics necessary for audit. It cannot contain an arbitrary SQL action, user-controlled workflow command, Approval assertion, opaque body that the API trusts without validation, or a directive to bypass a security denial.

No success result becomes an Approved Source. The owning Source Use Case must retain the existing Source Reference, Raw Snapshot, Working Copy, Version, Head, review, and human-Approval boundaries. A Security Error, blocked URL, invalid evidence, partial snapshot, cancellation, or stale result is an explicit classified Task result and not a fallback success.

## 5. Impacts and M2 split

### Product and scope

No new user-visible feature is implemented or promised. Public URL capture remains an approved MVP input direction but is not available until a later Ready Fetcher slice is implemented. Pasted Text and file upload remain unchanged.

### Architecture and security

The selected mechanism preserves the modular monolith: Gateway, Dispatcher, and application Use Cases are modules/process responsibilities in one repository and one database authority, not new microservices. Fetcher stays public-egress-limited and receives no general database capability. Queue is transport; PostgreSQL is truth.

### Required implementation split

The implementation must be independently reviewable and ordered as follows:

1. **M2-WF-001 — Durable Workflow Template/Instance and Task/Outbox Foundation:** authoritative identities, fixed Template binding, minimal task and append-only Event persistence, atomic Task/Outbox creation, owner/API Command boundary, and migrations. No Fetcher network retrieval, Queue consumer, SSE, or Agent.
2. **M2-WF-002 — Outbox Dispatch, Fetcher Queue Category, Claim/Lease and Reconciliation Foundation:** minimum Queue envelope, idempotent dispatch, delivery tracking, bounded claim/heartbeat/expiry, duplicate delivery, Redis-loss/worker-crash recovery. No URL fetching, Source mutation, UI timeline, Agent, or SSE contract.
3. **M2-FETCH-001 — Public URL Fetcher:** only after the connection-binding and first-release resource-policy decisions are approved, and the Gateway Task/result Contract plus the two Workflow foundations are Ready. It performs controlled capture through the approved Gateway, never a direct database path.
4. **M2-WF-003 — Progress Projection and SSE/Polling:** separate from Fetcher capture; it derives notifications from authoritative state and does not become another state store.

The exact Work Packet names may be refined, but none may merge the four objectives into one implementation task.

## 6. Required later contracts and tests

Before implementation, the applicable Work Packet must name exact TypeScript/JSON Schema/API/Queue/Migration contracts. At minimum it must prove:

- owner-scoped Task creation plus Outbox insertion is one PostgreSQL transaction and idempotent Commands create no duplicate Task;
- a Queue payload has only the allowed envelope and no secret, URL body, object key, signed URL, or mutable Domain state;
- Fetcher cannot access general PostgreSQL/Source/Approval mutations and can claim/report only an assigned Task;
- a wrong Fetcher identity, Task kind, claim, owner, state, cancelled Task, expired lease, stale/late result, duplicate delivery, duplicate result, or malformed result fails closed;
- Queue loss/redelivery, Dispatcher interruption, Fetcher crash, lease expiry, and reconciliation preserve one authoritative Task outcome;
- Result persistence verifies object integrity and cannot promote partial/unsafe Snapshot data;
- append-only Event/audit records use safe, redacted fields only; and
- no Work Item turns Queue, SSE, browser state, or a model response into Workflow authority.

## 7. Explicit non-goals

This review does not decide or implement:

- the full `content-package-dual-output/v1` Template definition, final Node names/enums, all human gates, skip semantics, or Workflow UI;
- exact Task/Outbox/Event table columns, migration sequence, API route paths, JSON Schema shapes, Queue payload field names, lease duration, heartbeat interval, reconciler cadence, or SSE event Contract;
- internal authentication protocol/credential format, deployment topology, firewall syntax, reverse proxy, service mesh, secret provider, or external IAM product;
- URL normalization, DNS binding, HTTP/TLS handling, response limits, extraction, Safe Display, Source type migration, or public URL API DTO;
- Agent Runtime, Research, Model Provider, Renderer, Export, publishing, or browser automation.

## 8. Accepted outcome

### Recommendation

The Human decision authority approved the API-owned Fetcher Task Gateway direction and rejected direct Fetcher Domain/Task database mutation and Queue-only completion authority. This is the smallest mechanism consistent with the existing API ownership, PostgreSQL authority, Transactional Outbox, Queue, recovery, and least-privilege constraints.

### Whether a new DEC is required

No new DEC is required for the recommendation as written: it selects the open Fetcher state-path mechanism without changing accepted source scope, process topology, data authority, human gates, security invariants, or the approved technical stack. A new DEC is required if a later choice adds a provider, proxy, service mesh, new identity product, independent service/database, changes API ownership, or weakens the Fetcher security boundary.

### Approval boundary

```text
ACCEPTED — Option B: API-owned Fetcher Task Gateway
```

This acceptance authorizes creation of narrow Ready Work Packets only; it does not authorize implementation by itself. `M2-WF-001`, `M2-WF-002`, `M2-FETCH-001`, and `M2-WF-003` remain Not Ready until their own contracts, resource-policy decisions, migrations, fixtures, and acceptance criteria are fixed.

## 9. Verification record

This Decision Review adds no runtime code, dependency, migration, secret, public fetch, Queue, Task, or Source persistence behavior. Before review publication it must pass:

- `corepack pnpm exec prettier --check docs/implementation/work-packets/m2-des-002-workflow-task-state-access.md`;
- `corepack pnpm format:check`;
- `corepack pnpm repository:check`;
- `git diff --check`; and
- exact changed-file/Git status inspection.
