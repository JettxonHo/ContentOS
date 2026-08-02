# WORK PACKET — M2-SRC-003

**Status:** Ready for implementation

**Purpose:** Durable planning-to-implementation handoff for the API-owned,
versioned, Claim-bound Fetcher Result boundary and the URL Source evidence
handoff that follows a verified successful capture.

**Created:** 2026-08-03

## 1. Identification

- **Task ID:** `M2-SRC-003`
- **Title:** URL-capture Result Contract and Source Evidence Boundary
- **Milestone:** M2 — Source and Workflow Foundation
- **Issue:** [#80](https://github.com/JettxonHo/ContentOS/issues/80)
- **Planning branch:** `codex/m2-src-003-url-result-source-evidence`
- **Planning base:** `c8045a959ed034c779c3676d8e4a6ef468d7c0f1`
- **Status:** Ready for implementation
- **Executor profile:** `BACKEND_GENERAL_EXECUTOR`
- **Owner:** one implementation agent as the only repository writer
- **Reviewer:** independent review agent before Ready/Merge
- **Dependencies:** `M2-SRC-001`, `M2-SRC-002`, `M2-WF-001`, `M2-WF-002`,
  `M2-WF-003A`, `M2-WF-003B`, `M2-WF-003C` completed; `M2-DES-001`–`M2-DES-005`
  accepted
- **Risk classification:** authoritative Task terminal state, Claim/Attempt/
  Lease fencing, idempotent and late-result semantics, immutable object
  integrity, Source evidence handoff, transactional compensation and
  commit-unknown reconciliation

### Implementation entry condition

- Implementation is allowed only after this planning Work Packet PR is merged.
- The Implementation branch must be re-created from the then-latest `main`
  (which contains this merged Work Packet); this planning branch is **not** a
  code-implementation baseline.
- `M2-FETCH-001 — Public URL Fetcher` remains **Not Started** and stays blocked
  until this Work Item is Completed.
- One Work Item → one Issue → one Implementation branch → one PR.

## 2. Goal

On top of the existing Claim/Heartbeat/Reconciliation boundary, add an
API-owned Fetch Result operation. Only a current, Claim-bound, unexpired
Attempt can first produce one terminal Result. A failure records only
Task/Result/Event; a success must additionally verify one Task/Attempt-bound
immutable object and, in one authoritative Source transaction, attach the Raw
Snapshot, Working Copy, Head, and Source Review boundary to the existing URL
Source Reference.

Fixed exclusions:

- does not initiate any network request;
- does not consume a BullMQ Job;
- does not implement the Fetcher;
- does not create an Approval;
- does not create a Source Version;
- a success only forms a Working Copy available for human Review;
- PostgreSQL is always the state truth.

## 3. Fixed private Gateway route

```text
POST /internal/fetcher/tasks/:taskId/result
```

The route continues to use the existing private Gateway headers:

```text
x-contentos-fetcher-gateway-secret
x-contentos-fetcher-claim
```

Requirements:

- `ApiExcludeController`;
- no Cookie/Session fallback;
- not exposed in OpenAPI;
- exact Content-Type;
- exact-shape JSON body;
- exactly one Secret header and one Claim header are allowed (duplicated or
  missing headers are rejected);
- errors must not echo the Claim, URL, object key, or Payload.

## 4. Exact versioned result contract

```text
resultVersion: fetcher-result/v1
```

### Success variant

```json
{
  "resultVersion": "fetcher-result/v1",
  "attemptNumber": 1,
  "outcome": "succeeded",
  "snapshot": {
    "snapshotId": "uuid",
    "storageKey": "fetcher/url-capture/<taskId>/<attemptNumber>/raw/<snapshotId>",
    "sha256": "64 lowercase hex",
    "byteSize": 1234,
    "contentType": "text/html",
    "contentEncoding": "identity"
  },
  "capture": {
    "finalUrl": "https://example.com/final",
    "redirects": [],
    "responseStatus": 200,
    "encodedByteSize": 1234,
    "decodedByteSize": 5678
  },
  "candidate": {
    "schemaVersion": "source/normalized/v1",
    "text": "reviewable normalized text"
  }
}
```

Fixed rules:

- `attemptNumber` must equal the current leased Task attempt;
- `snapshotId` must be a UUID;
- `storageKey` must bind exactly the current `taskId`, `attemptNumber`, and
  `snapshotId`;
- the key must not contain `..`, backslashes, repeated separators, control
  characters, or extra path segments;
- `sha256` is 64 lowercase hex characters;
- `byteSize` is 1–2,097,152;
- `contentType` is only one of: `text/html`, `text/plain`, `text/markdown`;
- `contentEncoding` is only one of: `identity`, `gzip`, `deflate`, `br`;
- `responseStatus` must be 200;
- `redirects` has at most five items;
- each redirect item is exactly: `status` (301, 302, 303, 307, or 308) and
  `url` (absolute `http`/`https` URL, at most 2048 UTF-8 bytes);
- `finalUrl` is an absolute `http`/`https` URL, at most 2048 UTF-8 bytes;
- URLs are private evidence and may only enter dedicated persistence fields;
- `encodedByteSize` must equal the Snapshot byte size;
- `decodedByteSize` is 1–8,388,608;
- the Candidate schema is fixed to `source/normalized/v1`;
- the Candidate text continues to obey the existing Normalized Source rules
  (100,000 UTF-8 bytes, non-empty, no NUL, valid Unicode scalars);
- extra fields, Symbols, Accessors, Class instances, or Proxy trap leakage are
  not accepted;
- getters must not be executed.

### Failure variant

```json
{
  "resultVersion": "fetcher-result/v1",
  "attemptNumber": 1,
  "outcome": "failed",
  "category": "fetch_failed",
  "code": "SAFE_STABLE_CODE"
}
```

Allowed Fetcher-supplied `category`:

```text
fetch_failed
validation_blocked
unsupported_content
too_large
timeout
redirect_blocked
extraction_failed
```

`code`:

- 1–64 characters;
- only `[A-Z0-9_]+`;
- must not contain a URL, host, IP, header, path, object key, or raw error
  text.

The Failure variant:

- must not contain a Snapshot;
- must not contain a Candidate;
- does not create a Source;
- does not create a Working Copy, Head, Version, or Approval.

## 5. Result state and idempotency

Add one URL-capture-specific durable Result record. The table name is fixed:

```text
url_capture_results
```

It must bind uniquely:

```text
task_id
url_capture_request_id
source_reference_id
content_package_id
owner_user_id
```

Persist at least:

```text
id
task_id
url_capture_request_id
source_reference_id
content_package_id
owner_user_id
attempt_number
claim_hash
result_version
submitted_payload_sha256
recorded_outcome
recorded_category
safe_code
source_id nullable
snapshot_id nullable
accepted_at
```

Successful private evidence is stored either in strict columns or exact-shape
JSONB, but must:

- carry database exact-shape/type constraints;
- never enter ordinary Events, logs, or browser DTOs;
- keep FK bindings to Task, Request, Source Reference, Owner, and Package.

Fixed semantics:

1. A first submission is allowed only with: the correct Fetcher service
   identity; the current leased Task; the current Claim hash; the current
   Attempt; a Lease that has not expired; and a Task that has no Result yet.
2. After a first success the Task enters `succeeded`.
3. After a first failure the Task enters `failed`.
4. A terminal Task clears its active claim/lease fields.
5. A terminal Task is never again dispatched, claimed, heartbeated, or
   recovered.
6. A duplicate submission with the same Claim, same Attempt, and same
   canonical Payload returns the existing result.
7. A duplicate submission adds no new Event, Source, Snapshot, Working Copy,
   Head, or Result.
8. The same Claim but a different Payload must fail with no side effect.
9. An old Claim, old Attempt, expired Lease, or pre-Recovery generation result
   fails with no side effect.
10. Two concurrent Result submissions produce at most one first effect.

The canonical Payload fingerprint uses a Core-owned, deterministic, exact JSON
serialization followed by lowercase SHA-256.

## 6. Source evidence success boundary

A successful result must:

- use the existing `url_source_references.id` as the formal `sources.id`;
- extend `source_type` and `capture_type` with `public_url`;
- inherit from the URL Source Reference: owner, Content Package, and role;
- initialize `label` to `null`;
- create one Raw Snapshot metadata row;
- create one revision-1 Working Copy;
- create one Source Head;
- not create a Source Version;
- not create a Source Approval;
- not treat network success as Approval.

Existing pasted/upload Source behavior must remain unchanged. The database Raw
Snapshot byte bound may be extended to 2 MiB, but:

- pasted/upload Application validation remains 100,000 bytes;
- the business limits of the existing upload and pasted-text entry points must
  not be widened.

## 7. Workflow transition

Success transaction:

```text
Task:                 leased → succeeded
source_capture Node:  running/ready → completed
source_review Node:   materialize once → awaiting_human
Workflow Instance:    remain active
```

Failure transaction:

```text
Task:                 leased → failed
source_capture Node:  → failed
source_review Node:   not created
Workflow Instance:    remain active
```

Must not:

- automatically complete Source Review;
- automatically create an Approval;
- automatically activate Research;
- create an M3 Node;
- complete the whole Workflow.

## 8. Capacity and lifecycle recheck

On successful promotion, recheck inside the PostgreSQL transaction:

- Package ownership/binding;
- Package lifecycle is active;
- URL Source Reference role;
- current formal Source role capacity;
- the Source has not already been created;
- exact Task/Request/Node/Instance binding.

If the Package is archived or the role capacity is full:

- do not create a Source;
- terminalize the Task to `failed`;
- record a server-derived safe category: `package_archived` or
  `source_role_limit`;
- record a safe Event;
- perform compensating deletion of the task-scoped object;
- do not allow Lease expiry to trigger a new public execution;
- do not automatically create an Owner Retry.

## 9. Object integrity and compensation

Before any Source promotion, a successful Payload must call
`ObjectStore.readForIntegrity` to verify:

```text
storageKey
sha256
byteSize
contentType
```

It must also verify the storage key is bound to the current
Task/Attempt/Snapshot. On integrity failure:

- do not create a Source;
- terminalize the Task to `failed`;
- record server-derived `object_integrity_failed`;
- do not record the object key in an Event or ordinary log;
- perform bounded compensation of the current task-scoped object;
- do not automatically network-Retry.

On database write failure:

- `NOT_COMMITTED`: delete the current task-scoped object; return a stable
  internal failure.
- `COMMIT_UNKNOWN`: first perform full identity reconciliation across Result,
  Source, Snapshot, Working Copy, Head, Task, and Event; if committed, return
  the existing result; if definitively absent, compensate the object; if
  undetermined, retain the immutable object, return reconciliation-required,
  and do not claim success.

Unknown or non-current-Task/Attempt-bound objects must never be deleted.

## 10. Safe Events

Define at least:

```text
url_capture_succeeded.v1
url_capture_failed.v1
```

Success Event exact payload:

```json
{
  "taskId": "uuid",
  "sourceReferenceId": "uuid",
  "sourceId": "uuid",
  "snapshotId": "uuid",
  "attemptNumber": 1
}
```

Failure Event exact payload:

```json
{
  "taskId": "uuid",
  "sourceReferenceId": "uuid",
  "attemptNumber": 1,
  "category": "fetch_failed",
  "code": "SAFE_STABLE_CODE"
}
```

Events must not contain:

```text
submittedUrl
finalUrl
redirect URL
host
IP
response body
candidate text
storageKey
claim
claimHash
Gateway Secret
header
signed URL
raw error
```

## 11. Gateway response and errors

Success and duplicate submissions return a safe DTO:

```json
{
  "data": {
    "taskId": "uuid",
    "attemptNumber": 1,
    "taskState": "succeeded",
    "resultCategory": "success",
    "sourceId": "uuid",
    "duplicate": false
  }
}
```

When a failure result is recorded successfully:

```json
{
  "data": {
    "taskId": "uuid",
    "attemptNumber": 1,
    "taskState": "failed",
    "resultCategory": "fetch_failed",
    "sourceId": null,
    "duplicate": false
  }
}
```

One new stable private error is allowed:

```text
FETCHER_RESULT_UNAVAILABLE
```

The following all have no successful effect:

- wrong service identity;
- wrong/missing Claim;
- wrong attempt;
- expired Lease;
- non-leased or terminal Task;
- mismatched payload replay;
- unknown Task;
- malformed body;
- object-reference binding failure.

Error responses must not reveal whether a Task exists, whether a Claim is close
to correct, or any URL or object key.

## 12. Additive migration boundary

The implementation must:

- generate one additive `0008_*` from the current latest migration `0007`;
- not hand-write a second migration beyond that single numbered migration;
- migrate an empty database completely;
- upgrade from the `0007` state;
- run `db:generate` twice with no drift;
- perform no Backfill;
- not fabricate Results for existing URL requests;
- keep existing queued/leased Tasks valid;
- extend the Task state to: `queued`, `leased`, `succeeded`, `failed`;
- ensure a terminal Task holds no active Lease fields;
- add `public_url` to the `sources` types;
- extend the Raw Snapshot DB byte upper bound to 2 MiB;
- add the three canonical URL media types to the Raw Snapshot content types;
- not widen the pasted/upload entry-point limits.

## 13. Implementation file boundary

The maximum file range allowed during implementation is:

```text
apps/api/src/app.module.ts
apps/api/src/database.service.ts
apps/api/src/fetcher-gateway/fetcher-gateway.controller.ts
apps/api/src/http/api-exception.filter.ts
apps/api/src/runtime.tokens.ts

packages/contracts/src/api/fetcher-gateway-contracts.ts
packages/contracts/src/api/fetcher-gateway-contracts.test.ts
packages/contracts/src/index.ts

packages/core/src/index.ts
packages/core/src/source/object-store.ts
packages/core/src/source/source-service.ts
packages/core/src/source/source-values.ts
packages/core/src/source/source.ts
packages/core/src/source/source-service.test.ts
packages/core/src/workflow/fetcher-gateway.ts
packages/core/src/workflow/fetcher-gateway.test.ts

packages/database/src/index.ts
packages/database/src/runtime.ts
packages/database/src/schema.ts
packages/database/src/source-repository.ts
packages/database/src/source-repository-testing.ts
packages/database/src/workflow-fetcher-gateway-repository.ts
packages/database/src/workflow-repository-testing.ts
packages/database/src/url-capture-result-repository.ts

packages/testing/src/integration/api.test.ts
packages/testing/src/integration/fetcher-gateway-api.test.ts
packages/testing/src/integration/fetcher-gateway-repository.test.ts
packages/testing/src/integration/source-repository.test.ts
packages/testing/src/integration/source.test.ts
packages/testing/src/integration/url-capture-result.test.ts
packages/testing/src/integration/url-capture-migration.test.ts
packages/testing/src/integration/workflow-dispatch.test.ts
packages/testing/src/integration/harness.ts

migrations/0008_*.sql
migrations/meta/0008_snapshot.json
migrations/meta/_journal.json

AGENTS.md
README.md
README.zh-CN.md
docs/architecture/source-foundation.md
docs/architecture/workflow-overview.md
docs/architecture/process-topology.md
docs/architecture/repository-structure.md
docs/implementation/roadmap.md
docs/implementation/work-packets/m2-src-003-url-capture-result-source-evidence.md
docs/security/source-fetcher.md
```

New files are allowed only:

```text
packages/database/src/url-capture-result-repository.ts
packages/testing/src/integration/url-capture-result.test.ts
the generated 0008 migration/meta
```

If implementation requires any of the following, stop and report; do not
self-expand:

- a Fetcher runtime change;
- a new dependency;
- a new configuration key;
- Presigned URLs;
- a new Object Storage credential;
- an HTTP client;
- a Queue consumer;
- a second migration;
- a new DEC.

## 14. Explicit out of scope

```text
apps/fetcher production behavior
BullMQ consumer
DNS
TCP
TLS
HTTP
Redirect execution
Compression/stream implementation
real Extraction
Proxy handling
automatic Network Retry
Fetcher Object Storage credential/config
Presigned transfer
automatic Source Version creation
Source Approval
Owner Retry
Cancel Command
Web UI
SSE/Polling
Agent
Research/M3
Render/Export
```

## 15. Required tests

### Contract tests

- success exact shape;
- failure exact shape;
- missing/extra/string/symbol/accessor/class/array/null rejection;
- getter not executed;
- Proxy reflection failure stable rejection;
- content type, encoding, redirect, size, URL, and candidate text bounds;
- canonical fingerprint stability.

### Core tests

- current Claim success;
- each failure category;
- wrong Claim;
- expired Claim;
- wrong Attempt;
- terminal Task;
- identical duplicate;
- mismatched duplicate;
- object integrity mismatch;
- source role conflict;
- archived Package;
- safe Event exact shape.

### PostgreSQL tests

- one atomic success graph;
- one atomic failure graph;
- Task terminal state and cleared Lease;
- source ID equals the existing URL Source Reference ID;
- Source/Raw Snapshot/Working Copy/Head exact bindings;
- source_review materialized once;
- no Version/Approval;
- two independent-connection concurrent result submission;
- old Attempt after recovery has no effect;
- terminal Task excluded from Dispatcher and Recovery;
- role capacity race;
- package archive race;
- rollback at each transaction stage;
- commit-unknown reconciliation;
- compensation deletion;
- migration from `0007` and from an empty database.

### API tests

- private route only;
- no Session/Cookie fallback;
- wrong/missing Secret;
- duplicate Secret/Claim headers;
- malformed path/body;
- exact DTO;
- no sensitive values in errors/logs/OpenAPI;
- claim/heartbeat existing behavior unchanged.

### Regression tests

- pasted text capture unchanged;
- uploaded text capture unchanged;
- existing Source Version/Approval unchanged;
- M2-WF-003A/B/C unchanged;
- Queue envelope unchanged;
- Browser M1 thin slice unchanged.

## 16. Verification gates

The implementation stage must run:

```text
install --frozen-lockfile
workspace:check
format:check
lint
typecheck
test
test:integration
test:integration:concurrent
test:browser
check
check:docs
check:decisions
repository:check
check:secrets
db:generate ×2
git diff --check
```

Require no residue of:

- Secret;
- Claim;
- full URL;
- raw body;
- object key;
- signed URL;
- local absolute path;
- temporary object;
- Queue Job;
- Container/Network;
- Worker/Fetcher process;
- credential residue;
- migration drift.

Do not touch the `contentos-local` volumes.

## 17. Definition of Ready

This Work Item is Ready only when all of the following are fixed:

- Result route;
- exact Result Contract;
- Task terminal state;
- idempotent duplicate;
- late/expired Claim rejection;
- object-key binding;
- integrity proof;
- Source success graph;
- failure graph;
- capacity/lifecycle conflict;
- compensation/reconciliation;
- Event payload;
- migration;
- allowed files;
- forbidden files;
- fixtures;
- test matrix;
- cleanup;
- independent review boundary.
