# Decision Review — M2-DES-005

- **Title:** Fetcher Execution Gateway, Lease, and Delivery-Recovery Contract
- **Status:** Accepted Decision Review
- **Review outcome:** `ACCEPTED` — Human authority approved Option B on 2026-08-02
- **Date:** 2026-08-02
- **Base commit:** `740459be57147ce8fa1c27bac4db912f4fb255d0` (`740459b`)
- **Issue:** [#63](https://github.com/JettxonHo/ContentOS/issues/63)
- **Branch:** `codex/m2-des-005-fetcher-execution-gateway`
- **Allowed change:** this document only. It does not implement BullMQ, Redis access, Dispatcher, Fetcher, API gateway routes, lease persistence, migrations, configuration, dependencies, URL retrieval, Source evidence, or UI.

This review resolves the remaining high-impact contracts that prevent
`M2-WF-003` from becoming Ready. It preserves the accepted API-owned Fetcher
Task Gateway direction and separates a small delivery/claim foundation from
later result handling and public-network code.

## 1. Authority and gap

| Existing authority                                                                                                      | Consequence for this decision                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-128, DEC-133–DEC-135, DEC-176, DEC-226, DEC-228–DEC-229, DEC-238, and DEC-249                                       | PostgreSQL remains Task truth; Task and Outbox commit atomically; Queue delivery may repeat; leases, recovery, idempotency, and append-only Events must fail closed.                  |
| DEC-221 and DEC-230–DEC-232                                                                                             | Fetcher is a separately identified, least-privilege public-egress process. It has no general PostgreSQL credential or Domain write authority.                                         |
| [M2-DES-002](m2-des-002-workflow-task-state-access.md)                                                                  | The API owns the Fetcher claim/result boundary. Its exact service authentication, lease timings, Dispatcher mechanism, and reconciliation remain intentionally open.                  |
| [M2-DES-003](m2-des-003-fetcher-resource-policy.md)                                                                     | Queue redelivery, Fetcher restart, and lease expiry are recovery mechanisms, not owner Retry. They must not turn a terminal Task into another public request.                         |
| [M2-DES-004](m2-des-004-workflow-task-foundation.md)                                                                    | `M2-WF-003` must remain separate from URL retrieval, Source evidence, Source approval, UI, and SSE.                                                                                   |
| [Secret Management](../../security/secret-management.md) and [Process Topology](../../architecture/process-topology.md) | Service identity material, execution claims, URLs, bodies, object keys, and credentials cannot enter Queue payloads, ordinary logs, Events, browser DTOs, or general database access. |

`M2-WF-002` now creates only a `queued` `url_capture` Task and a `pending`
Outbox record. It deliberately has no BullMQ delivery, service identity,
claim, heartbeat, expiry, or recovery behavior. These mechanisms need one
coherent contract before an implementation Work Item can safely change the
existing one-value Task and Outbox state checks.

## 2. Invariants for every option

- The Worker owns Outbox dispatch and reconciliation; it is not a new process
  or microservice. It may use PostgreSQL and the approved Redis/BullMQ
  transport, but PostgreSQL is still authoritative.
- The Fetcher authenticates to one API-owned, non-browser Gateway. It gets no
  PostgreSQL credential, owner Session, browser Cookie, Model credential, or
  general Source/Workflow mutation route.
- Every Queue Job carries only the existing immutable `fetcher-task/v1`
  envelope: `taskId`, `taskKind`, and `envelopeVersion`. Queue identity,
  service credentials, execution claims, URL text, object references, and
  mutable task state are excluded.
- Claim and heartbeat are the only M2-WF-003 Fetcher operations. A Fetcher
  result, Raw Snapshot, Source evidence, Source Version, approval, URL
  retrieval, or public network access remains out of scope until
  `M2-SRC-003` and `M2-FETCH-001`.
- A stale, cancelled, wrong-kind, duplicate, expired, malformed, or
  unauthenticated operation has no Task, Source, or Event success effect.
- Recovery can re-deliver a nonterminal queued Task, but it cannot re-open a
  terminal Task. The later result Contract must set the terminal states before
  any public-fetch result is accepted.

## 3. Service-identity options

| Option                                                      | Description                                                                                                                                                                           | Consequence                                                                                                                                    | Outcome          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| A. Network location only                                    | Trust loopback, container network, Queue delivery, or a non-secret header as Fetcher identity.                                                                                        | Network position is not a service identity and cannot enforce the least-privilege Gateway boundary.                                            | Reject.          |
| B. Scoped shared Gateway secret plus opaque execution claim | API and Fetcher receive one Fetcher-only injected Secret. Every Gateway call authenticates that service; successful claim returns a one-task opaque claim whose hash alone is stored. | Adds one process-scoped Secret and private API contract, but uses the approved stack and keeps all authoritative transitions in API Use Cases. | **Recommended.** |
| C. mTLS or external workload identity provider              | Authenticate Fetcher through certificates, a mesh, or external identity infrastructure.                                                                                               | Adds unselected certificate, deployment, rotation, and/or identity-provider architecture before the MVP has a Fetcher vertical slice.          | Reject for M2.   |

## 4. Recommended decision — Option B

If approved, M2 uses one narrow API-owned Gateway contract and no new runtime
service:

```text
Worker Dispatcher
  → BullMQ Job (minimal existing envelope)
  → Fetcher authenticated with its scoped service Secret
  → API Gateway claim (one Task, one attempt, one lease)
  → Fetcher heartbeat (same claim only)
  → PostgreSQL authoritative lease/recovery state
```

### 4.1 Service authentication

- API and Fetcher each receive the same injected, high-entropy
  `CONTENTOS_FETCHER_GATEWAY_SECRET`; it is a Secret value, not Domain data or
  a Queue value. Its local-development and deployment injection must follow
  Secret Management. No committed example contains a real value.
- The Fetcher sends that Secret only in a dedicated private Gateway
  authorization header over the configured API origin. The Gateway uses a
  constant-time comparison and returns one generic unauthorized response for
  absent, malformed, or wrong values.
- The route is private service transport: it has no Session/Cookie path, no
  browser capability, no OpenAPI advertisement, no owner-scoped list/query
  surface, and no generic Task mutation endpoint.
- The exact API origin is non-secret Fetcher configuration. M2's existing
  loopback development boundary remains valid; future external ingress or
  deployment topology must separately preserve this service-only route.

The static service Secret authenticates the Fetcher process, not individual
execution. It cannot by itself authorise a result: later result handling must
also verify the task-bound opaque claim below.

### 4.2 Opaque claim and lease model

A successful claim atomically changes one current `url_capture` Task from
`queued` to `leased` and returns only the Task's private capture input, the
fixed policy identifiers, a monotonically increasing attempt number, the
lease expiry, and an opaque random claim value. PostgreSQL stores only a
SHA-256 claim hash, never the opaque value.

| Field / rule                        | Required meaning                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attemptNumber`                     | Starts at 1 and increments only for a successfully issued claim. Queue redelivery without a successful claim does not increment it.                                                             |
| `claimedBy`                         | The literal Fetcher service category, not an owner identity or arbitrary process string.                                                                                                        |
| `leaseStartedAt` / `leaseExpiresAt` | Set atomically with claim. An initial lease lasts **60 seconds**.                                                                                                                               |
| `leaseHeartbeatAt`                  | Updated only by the same authenticated Fetcher with the current unexpired claim.                                                                                                                |
| renewal                             | A heartbeat extends expiry to the earlier of `now + 60 seconds` and `leaseStartedAt + 120 seconds`; it may not extend a claim indefinitely.                                                     |
| heartbeat cadence                   | Fetcher sends at most one heartbeat every **20 seconds**. An early or duplicate heartbeat is idempotent and does not extend expiry.                                                             |
| claim secrecy                       | The opaque claim is returned once, used only in a private request header, stored only as a hash, and excluded from Queue data, Events, logs, traces, errors, browser DTOs, and object metadata. |

The two-minute cap is deliberately longer than the accepted 30-second public
capture deadline, leaving bounded time for startup, object-write verification,
and result submission without allowing an abandoned process to hold work
forever. It does not permit a later Fetcher to lengthen the M2-DES-003
public-network deadline.

### 4.3 Delivery and reconciliation model

The initial Outbox record evolves into the delivery ledger for the one Task.
It retains one current delivery generation; it does not become Queue truth.

```text
Task:       queued ──claim──> leased ──lease expiry──> queued
Outbox:     pending ──BullMQ acknowledged──> dispatched
                       reconciliation / requeue
                         └──────────────────> pending (next generation)
```

- Dispatcher selects eligible `pending` Outbox records from PostgreSQL with
  bounded concurrent ownership, submits a BullMQ Job whose stable internal
  `jobId` is `fetcher:<taskId>:<deliveryGeneration>`, and records
  `dispatched` only after BullMQ acknowledges the add.
- The Queue payload remains the existing three-field `fetcher-task/v1`
  object. `deliveryGeneration` is queue metadata, not payload data.
- A crash after Queue add but before PostgreSQL acknowledgement is safe:
  the same deterministic Job ID makes redelivery idempotent in a surviving
  Redis instance. A Redis reset is safe because PostgreSQL reconciliation can
  recreate the current-generation Job.
- Lease expiry atomically returns a still-nonterminal `leased` Task to
  `queued`, clears the claim hash and lease fields, increments the delivery
  generation, returns Outbox to `pending`, and records one safe append-only
  recovery Event. It never accepts a late claim/heartbeat or creates Source
  success.
- Reconciliation scans only PostgreSQL-authoritative queued/leased/outbox
  conditions. It re-enqueues missing current-generation work or expires a
  stale lease; it cannot infer Task success from BullMQ, create a second Task,
  or turn a terminal result into a retry.
- `dispatched` describes the most recently acknowledged delivery attempt, not
  completion. A later M2 result transition will make a Task terminal and
  permanently ineligible for delivery/claim/reconciliation.

### 4.4 Gateway surface

The first private contract consists only of these non-browser operations;
final HTTP path names and TypeScript symbols are Work Item details.

| Operation | Preconditions                                                                                           | Effect                                                                | Must reject without effect                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Claim     | Valid Fetcher service Secret; known `url_capture` Task; `queued` state; current Queue envelope category | One transaction issues the claim and lease and returns private input. | Wrong identity, absent/wrong kind, active lease, terminal state, unknown task, stale delivery, invalid shape. |
| Heartbeat | Valid Fetcher service Secret; same unexpired opaque claim; current leased attempt                       | Records bounded liveness and may make one bounded renewal.            | Wrong/expired claim, wrong service, non-leased task, renewal cap reached, malformed input.                    |

`M2-WF-003` intentionally exposes no result operation. `M2-SRC-003` must
define one versioned classified result Contract, its exact idempotency/late
result semantics, object-integrity proof, and Source evidence handoff before
`M2-FETCH-001` can make an HTTP request.

## 5. Work Item split after approval

These are sequential, independently auditable implementation items. They are
not authorised by this decision alone; each must receive a Ready Work Packet
with exact file limits, package version selection, migration plan, fixtures,
and tests.

| Order | Work Item                                              | Goal                                                                                                                          | In scope                                                                                                                                                                 | Explicitly out of scope                                                                                      |
| ----- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1     | `M2-WF-003A — Transactional Outbox Dispatcher`         | Deliver the existing minimum Fetcher envelope from PostgreSQL to BullMQ and record durable current-generation delivery state. | Approved BullMQ dependency, Worker dispatcher, Outbox delivery migration/repository, deterministic Job IDs, Redis-loss/duplicate/crash reconciliation tests.             | Fetcher process behavior, service Secret, claim/lease, results, URL fetching, Source mutation, UI/SSE.       |
| 2     | `M2-WF-003B — Fetcher Gateway Claim and Bounded Lease` | Implement the service-only API claim/heartbeat boundary and durable Task lease state.                                         | API/Fetcher typed config and Secret validation, private Gateway guard/controller/use case, task lease migration, opaque claims, owner/state/kind/duplicate/expiry tests. | Fetcher network retrieval, Result endpoint, Source evidence, approval, generic Task API, UI/SSE.             |
| 3     | `M2-WF-003C — Lease and Delivery Reconciliation`       | Recover durable queued/leased work after Worker/Fetcher/Redis failure without creating a second Task or terminal retry.       | Worker reconciliation loop, current-generation requeue, lease expiry, safe Event evidence, crash/Redis-loss/duplicate/late operation tests.                              | Result success/failure classification, Source evidence, public URL retrieval, automatic owner Retry, UI/SSE. |

`M2-SRC-003`, `M2-FETCH-001`, and `M2-WF-004` retain their existing order
after these three items. No item may combine public URL retrieval with queue,
claim, result, and Source-promotion implementation.

## 6. Required Ready evidence for each implementation item

- Additive migration evidence from the existing `0005` state and an empty
  database; no backfill or invented history.
- Unit and PostgreSQL integration proof for all legal and rejected state
  transitions, owner isolation, duplicate Queue delivery, Worker restart,
  Redis loss, expired lease, stale claim, and no-side-effect rejection.
- Queue payload, Event payload, error, log, trace, and OpenAPI scans proving
  they contain no Secret, claim, full URL, raw body, header, signed URL, or
  Object key.
- Isolated runtime fixtures that leave no Queue Jobs, temporary credentials,
  application processes, containers, or ContentOS local volumes changed.
- A completed Item must preserve existing Source capture behavior and the
  owner URL-capture Command's idempotent replay.

## 7. Explicit non-goals

This review does not select or implement a production Secret Store, TLS/mTLS,
an identity provider, proxy/service mesh, a new database, a new process,
browser progress UI, SSE, Owner Retry command, any Fetcher HTTP/DNS/TLS code,
an extraction library, Object Storage write policy, result classification,
Source evidence mutation, or Source Approval. It does not alter an Accepted
DEC, MVP scope, or the modular-monolith boundary.

## 8. Human approval boundary

The project authority approved **Option B — a scoped shared Fetcher Gateway
Secret, opaque one-task claims hashed at rest, bounded 60/20/120-second
leases, and Worker-owned deterministic Outbox delivery/reconciliation** on
2026-08-02.

This approval permits preparation of the three small Ready Work Packets in
§5. It does not authorize implementation until the applicable Work Packet
defines its exact dependency version, file boundaries, migration, fixtures,
and acceptance evidence.
