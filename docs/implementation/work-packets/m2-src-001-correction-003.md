# CORRECTION PACKET 003 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-002.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed implementation base:** committed handoff `4743aea4579da6c0ed6c5b30f689e933c04656b3` plus the uncommitted M2-SRC-001 implementation

**Independent review:** two read-only GPT-5.6-sol high review axes plus main-control review

**Review date:** 2026-07-29

## Outcome

The implementation remains uncommitted and is not approved for publication. The normal quality and serial integration checks pass, but independent review found merge-blocking idempotency, lifecycle-race, post-commit reporting, harness-isolation, compensation, evidence, and cleanup defects.

No new DEC is required. All corrections remain within M2-SRC-001 and its existing allowlist.

## Required corrections

### 1. Prevent duplicate Version checkpoints

- The same Working Copy revision and unchanged body must not create multiple immutable Versions through sequential or concurrent retries.
- Consume a checkpoint identity transactionally. Either advance a revision/checkpoint token atomically or reject when the current Working Copy already points at a Version with the same content hash and no intervening edit.
- Preserve immutable Version history and exact Review Candidate movement.
- Add sequential and concurrent duplicate-command tests that assert one authoritative Version and truthful stable errors for rejected retries.

### 2. Make archived-Package behavior atomic and consistent

- Source mutations must lock and re-check the owned Content Package lifecycle in the same database transaction as the edit, Version, or Approval write.
- An owned archived Package must use the stable `PACKAGE_ARCHIVED` conflict path; unknown and other-owner Packages remain undisclosed as not found.
- Define and implement the already-documented archived-Package behavior consistently for Source reads and writes; do not allow a pre-check/archive race to commit a mutation.
- Add route coverage and archive/write race evidence for edit, Version creation, and Approval.

### 3. Remove remaining post-commit false-failure paths

- Working Copy edit must not commit and then depend on a separate read to construct the required response.
- Return all required Working Copy and immutable Snapshot response data from the mutation transaction, or acquire the immutable response data before the commit without a required post-commit read.
- Add fault-injection evidence proving a committed edit cannot be reported as an ordinary failure because a later lookup failed.

### 4. Make integration runs uniquely isolated

- Replace the shared fixed smoke directory, state file, and env file with a unique run-owned directory created with `mkdtemp` or an equivalent safe primitive.
- Pass the exact run-owned state path to the test process; integration and browser runs must not discover or delete another run's state.
- Teardown may delete only its own verified run directory.
- Add a deterministic concurrent-run regression test or equivalent executable evidence proving two smoke runs cannot overwrite credentials, ports, Compose state, or cleanup ownership.

### 5. Make capture compensation safe under an uncertain commit result

- Do not delete the immutable object on every `repository.capture` rejection.
- Distinguish a transaction known not to have committed from a lost acknowledgement or otherwise uncertain commit result.
- Reconcile by exact owner/package/source/snapshot identity: if authoritative rows exist, return the committed state; if absence is confirmed, compensate; if state cannot be determined, retain the object and return a bounded reconciliation error rather than destroying evidence.
- Add unit/repository fault-injection tests for known rollback, post-commit lost acknowledgement, confirmed committed state, confirmed absence, and unresolved state.

### 6. Complete executable PostgreSQL and concurrency evidence

- Add disposable-database negative tests for cross-package-owner Source, cross-owner children, cross-Source base/parent/raw/head/approval pointers, missing base Version, duplicate Snapshot/storage key, UTF-8 byte bounds, exact normalized JSON structure/schema version, and `approved_by_id = owner_user_id`.
- Add transaction rollback evidence for capture, Version creation, and Approval.
- Add real concurrency evidence for Primary/Supporting limits, duplicate Version checkpoint prevention, Approval uniqueness, and authoritative Head movement.
- Assert final database rows and history, not only HTTP statuses or table existence.

### 7. Test and harden the real S3 adapter and cleanup

- Exercise `S3ObjectStore.putImmutable` twice with identical generated identity; the second call must fail and stored bytes/hash/metadata must remain unchanged.
- Exercise the real adapter with correct and incorrect credentials against a task-owned object; anonymous access must also fail.
- `readForIntegrity` must verify expected hash, object metadata hash, actual byte hash, byte size, and fixed content type, or Current Truth must be narrowed only if accepted behavior does not require those checks.
- Cleanup must catch and collect thrown fetch/body/XML errors per list/object-delete/bucket-delete step while continuing all later cleanup steps.
- Continuation-token signing must encode each query value exactly once.
- Add a real non-2xx or thrown-cleanup failure injection proving a non-zero command while Compose/process/temp cleanup still completes.

### 8. Complete API, schema, scope, and documentation truthfulness

- Enforce exact normalized JSON structure in PostgreSQL: object type, exact key set, string `text`, byte bounds, and approved schema version. Rehydrate boundaries must fail safely on invalid persisted data.
- Add declared 400 malformed-JSON behavior, 403 Origin rejection for mutations, and the real bounded 500 capture response to OpenAPI where applicable.
- Strict-compile every exported Source response/error schema and validate representative mapper output plus real HTTP responses, including list pagination.
- Complete owner/package/source negative matrices across list, detail, Working Copy read/edit, Version create/list/detail, and Approval.
- Remove the unnecessary `skipLibCheck: true` override from Object Storage; independent review proved the package passes with strict library checking.
- Synchronize README, AGENTS, Roadmap, Source Foundation, workspace/package counts, Source availability, smoke scope, and M2 status without claiming completion before merge.

## Required verification

After correction, run and report the full parent and Correction 002 verification plus:

- sequential and concurrent duplicate Version tests;
- archive/write transaction-race tests;
- post-commit edit and capture lost-ack tests;
- two concurrent isolated smoke runs;
- the full PostgreSQL negative constraint/rollback/concurrency matrix;
- real S3 adapter collision, wrong-credential, anonymous, metadata-integrity, and cleanup-failure tests;
- strict compilation and runtime validation of every Source response/error schema;
- OpenAPI exact operation/status inspection;
- `tsc` for Object Storage with `skipLibCheck: false`;
- zero residue and unchanged identities for the pre-existing `contentos-local` named volumes.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required success/failure-path check passes.
