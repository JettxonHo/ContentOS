# CORRECTION PACKET 001 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed implementation base:** `ef84986d8fab4963ac389d4280a1234c44d86738` with the uncommitted Claude implementation

**Independent reviewer:** Codex, GPT-5.6-sol high

**Review date:** 2026-07-28

## Failed evidence

Independent execution of `corepack pnpm test:integration` returned non-zero before test collection because the API did not become ready. The M2 object-storage configuration was not passed by the isolated Harness. The Implementation Completion Report correctly said Docker-dependent tests were not run, so its recommended `PASS` is not accepted.

## Required corrections

### 1. Restore executable isolated runtime verification

- Pass the new object-storage endpoint, region, bucket, path-style flag, access key, and secret key to the isolated API process without logging any value.
- Create a unique task-owned private bucket before API startup and clean its objects/bucket during teardown, while still attempting all other cleanup steps.
- Do not depend on test-file ordering or an existing local bucket.
- Preserve tmpfs isolation, ephemeral loopback ports, zero named-volume access, non-zero teardown failure propagation, and zero residue.

### 2. Enforce the Package path scope on every nested Source route

- `packageId` must be part of every Source Query and mutation lookup, not merely UUID-validated and then ignored.
- An unknown Package, a Package owned by another owner, or a Source belonging to a different Package must return the stable not-found response without disclosure or mutation.
- The list route must verify Package ownership/existence. Returning `200` with an empty list for another owner's Package contradicts Acceptance Criterion 8 and must not be retained in tests.

### 3. Replace invalid list placeholders with a truthful Contract

- Do not return `revision: 0`, empty schema version, empty timestamp, empty hash, or zero byte size in a `SourceResource` that declares real state.
- Either return full valid Source summary state from the Query or define a smaller dedicated list-item Contract that contains only real Source Reference fields.
- Add response-schema validation evidence for the actual list response.

### 4. Correct append-only Approval lifecycle

- Repeating Approval for the already-approved exact Version must be idempotently rejected and must not create another record.
- A later current Review Candidate Version must be approvable through a new append-only Approval record; the historical record remains unchanged and the Approved head moves transactionally.
- A non-current/historical Version that is not the current Review Candidate must fail as ineligible.
- Approval lookup must deterministically return the record corresponding to the current Approved head or an explicitly ordered history; never an arbitrary first row.
- Persist the bounded validation result/summary needed to prove the approved Normalized Source Version passed its deterministic body validation. Do not infer human Approval from validation success.

### 5. Make Raw Snapshot metadata complete and immutable

- Add and preserve `contentType` (`text/plain; charset=utf-8` for this Pasted Text slice) in Domain state, PostgreSQL metadata, safe API metadata where appropriate, and tests.
- Replace the race-prone `HeadObject` then unconditional `PutObject` sequence with a single conditional immutable creation (`If-None-Match: *` or the S3-compatible equivalent verified against SeaweedFS). A collision must not overwrite an existing object.
- Keep the generated opaque object identity and private access boundary.

### 6. Add relational integrity to migration 0002

- Add reviewed foreign keys and required uniqueness/check constraints among Content Package, Source, Raw Snapshot, Working Copy, Version lineage/dependency, Head pointers, and Approval target.
- Preserve historical records and use deletion actions consistent with existing no-delete M2 scope.
- Use byte-length (`octet_length`) rather than character count wherever the database enforces the 100,000-byte body limit.
- Regenerate the Drizzle snapshot from the corrected schema; do not hand-edit generated metadata inconsistently.
- Add executable migration/repository evidence for the critical constraints, including cross-Source/cross-owner pointer denial where the schema can enforce it.

### 7. Validate all opaque IDs at the HTTP boundary

- `versionId` in the Approval body must be an accepted UUID before it reaches a PostgreSQL UUID comparison.
- Contract tests must reject values such as `abc-123` rather than accepting them and risking a database/internal error.

### 8. Cover storage and compensation failure paths

- Add SourceService tests with fakes proving: object write failure creates no database state; repository failure after object write invokes the exact scoped compensation delete; compensation deletion failure surfaces `SOURCE_COMPENSATION_FAILED`.
- In isolated integration, retrieve the task-created object's bytes through an authenticated S3 request and prove SHA-256, byte size, content type, and original content match without printing the body or object key.
- Prove wrong/anonymous S3 access remains denied for the task-owned bucket/object.
- Prove the conditional immutable write rejects an existing exact key without changing its bytes.

## Allowed correction files

Only files already permitted by the parent Work Packet, plus this Correction Packet. `packages/testing/src/integration/harness.ts`, `packages/testing/src/integration/env.ts`, and bounded shared S3 test helpers are explicitly permitted for the isolated bucket lifecycle and verification.

## Forbidden correction scope

- No Web product behavior, Multipart upload, URL Fetcher, SSRF, generic Workflow, Queue, SSE, Research, Agent, Render, Export, or M3 implementation.
- No change to Accepted Decisions, Sessions, M1 Acceptance Record, `compose.yaml`, or `.github/**`.
- No destructive local-volume, image, or user-data operation.
- No commit, push, Pull Request, merge, or branch switch by the Claude Implementation Agent.

## Required re-verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- `corepack pnpm check`
- `corepack pnpm test:integration`
- integration assertion-failure injection, teardown-failure injection, and invalid-Docker failure with zero residue
- `corepack pnpm test:browser`
- fresh migration and repeat migration evidence
- official-registry high-severity audit
- `corepack pnpm repository:check`
- `git diff --check`
- exact file-scope, Secret, local-path, artifact, container/process/temp-directory, named-volume, and task-bucket residue checks

Do not report `PASS` while any required runtime check remains unrun or failed. Return a revised Completion Report with criterion-by-criterion correction evidence and actual Git status.
