# CORRECTION PACKET 002 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior Correction:** `docs/implementation/work-packets/m2-src-001-correction-001.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed implementation base:** `e71024c383b032b59b09f655376592fa1d580479` with the uncommitted Claude implementation

**Independent reviewer:** Codex, GPT-5.6-sol high, assisted by two independent read-only review agents

**Review date:** 2026-07-29

## Outcome

The implementation remains uncommitted and is not approved for publication. Non-Docker quality checks pass, but executable success does not override the semantic, relational-integrity, approval, and cleanup findings below.

No new DEC is required. All corrections stay within the accepted M2-SRC-001 scope and existing file allowlist.

## Required corrections

### 1. Make the persisted Normalized Source Body match its versioned schema

- The persisted Working Copy and Version body must use the declared `NormalizedSourceBody` shape (`{ "text": string }`), not a raw string that bypasses the JSON Schema contract.
- Use a truthful PostgreSQL representation such as `jsonb` and keep Domain, repository, API request/response, hash computation, migration, and tests aligned.
- Capture may still accept the bounded `text` field, but it must construct the normalized body explicitly.
- Working Copy edits must validate the real normalized body at the HTTP seam and re-enforce the bounded text invariant in Core.
- Before Version creation and before Approval, validate the exact persisted body with the approved JSON Schema 2020-12 + Ajv path. A fixture-only schema test is insufficient.
- Keep Core free of Ajv and transport dependencies. Introduce a small Core-owned validator interface and inject the approved Ajv adapter from composition, or use an equivalently clean seam without creating a dependency cycle.
- Keep the schema file and TypeScript type synchronized through executable positive and negative tests against actual persisted/request body shapes.

### 2. Bind Approval evidence to the exact validated Version

- Do not hash `versionId` to create `validationSummary`.
- Load the exact owner/package/source-scoped immutable Version, validate its persisted body and schema version, and bind the bounded summary to that Version's real `contentHash` and validation result.
- A truthful deterministic form such as `schema=<version>;valid=true;contentHash=<full hash>` is acceptable if it is generated only after the exact body passes the versioned validator.
- Approval remains human-only, append-only, current-Review-Candidate-only, and transactional. Validation success must not itself create Approval.
- Add unit and integration evidence that the summary matches the approved Version content hash and that an invalid or mismatched persisted body cannot be approved.

### 3. Enforce cross-Source and cross-owner relational integrity in PostgreSQL

- Add composite unique keys and composite foreign keys, or an equivalent database-enforced design, so these relationships cannot cross Source or owner scope:
  - Source → Content Package;
  - Raw Snapshot → Source;
  - Working Copy → Source and optional base Version;
  - Version → Source, parent Version, and Raw Snapshot;
  - Head → Source, Working Copy, Latest Version, Review Candidate Version, and Approved Version;
  - Approval → Source and approved Version.
- Enforce one Raw Snapshot per Source for this slice and unique immutable `storage_key` identity.
- Enforce `approved_by_id = owner_user_id` where the current single-owner model requires it.
- Preserve no-delete/no-rewrite semantics and existing rows. This is still the unmerged additive migration 0002, so regenerate its SQL and Drizzle snapshot from the corrected schema rather than adding a second corrective migration.
- Keep the typed self-referencing Version FK; do not reintroduce `TS7022` or delete the relation.
- Add executable negative database tests for cross-package-owner Source creation, cross-owner child rows, cross-Source parent/raw/head/approval pointers, missing base-Version integrity, duplicate Snapshot/storage key, and byte-length constraints.

### 4. Remove the post-commit false-failure path in capture

- After successful `repository.capture`, do not perform a separate read that can return null and report `SOURCE_CAPTURE_FAILED` after durable state already committed.
- Return the committed state from the transaction or return the exact already-constructed state after the repository confirms success.
- Preserve compensation only for an initial database creation that did not commit.
- Add a unit test proving a successful commit cannot be turned into a failure by a later lookup.

### 5. Make task-owned S3 cleanup fail truthfully

- Check every bucket-list, object-delete, and bucket-delete HTTP result. A rejected or unexpected response must be collected as a teardown error while later cleanup steps are still attempted.
- Correctly URL-encode object keys and XML-decode listed keys. Handle list pagination or explicitly prove the bounded test bucket cannot exceed one page; robust pagination is preferred.
- Preserve the existing no-secret/no-body/no-object-key error policy.
- Add deterministic failure evidence showing a real non-2xx cleanup response makes `test:integration` non-zero without suppressing Compose/process/temp-directory cleanup.

### 6. Expose the exact immutable Review Candidate body for human review

- Add an owner/package/source-scoped exact Version query, preferably `GET /v1/content-packages/:packageId/sources/:sourceId/versions/:versionId`.
- The detail response must include the safe normalized Version body and its immutable metadata. The list endpoint may remain metadata-only and bounded.
- A caller must be able to retrieve the exact body after the Working Copy changes and before approving that Version.
- Unknown, other-owner, other-package, and cross-Source Version IDs must fail closed without disclosure.

### 7. Remove or implement the ignored list role filter

- The current public contract accepts `role` but silently ignores it.
- Because role filtering is not required by this Work Item, remove it from the public query contract unless implementing it is demonstrably simpler and fully tested.
- Never accept a query field whose observable behavior is ignored.
- Compile and validate the actual list response schema in contract tests.

### 8. Complete route and OpenAPI truthfulness

- Declare every actual 401/404/409/422 response on each Source operation, including list, ID validation, Version creation, exact Version query, and Approval body validation.
- Add OpenAPI evidence for all Source routes and their shared error shapes.
- Do not emit placeholder values such as an empty Approved Version ID; enforce the non-null postcondition after successful Approval.
- Keep storage keys, credentials, URLs, raw object responses, and unrequested raw evidence out of every response.

### 9. Complete runtime and repository evidence

- Exercise the real `S3ObjectStore.putImmutable` twice with identical generated IDs and prove the adapter rejects the second write without changing bytes.
- Prove correct credentials succeed, wrong credentials fail, and anonymous access fails.
- Expand package-path and owner-scope tests across list, detail, Working Copy read/edit, Version create/list/detail, and Approval.
- Add concurrency evidence for Primary/Supporting role limits and Approval uniqueness/head movement.
- Add repository transaction rollback and database-constraint tests; table-existence checks alone are insufficient.
- Re-run fresh and repeat migration evidence after regenerating migration 0002.

### 10. Synchronize Current Truth with the corrected implementation

- Correct `docs/architecture/source-foundation.md` to name the real migration file and conditional `If-None-Match: *` implementation.
- Describe the actual persisted body representation, production validation seam, exact Version review route, Approval summary, and composite relational constraints.
- Resolve the current archived-Package contradiction: an owned archived Package must follow the documented stable state-conflict path, while unknown or other-owner Packages remain undisclosed as not found. Reuse the existing `PACKAGE_ARCHIVED` application error; do not invent a new status model.
- Keep M2 `In Progress`, M2-SRC-001 `In Review` only after all correction evidence is complete, and M3 not started.
- Do not modify Accepted Decisions, Sessions, M1 acceptance records, or any forbidden module.

## Allowed files

Only files already allowed by the parent Work Packet may change. This correction specifically permits the existing Source Core/contracts/database/object-storage/API files, migration 0002 and its generated metadata, Source/integration/repository tests, isolated harness helpers, approved root workspace wiring, and the already-authorized Source Current-truth/status documents.

No Web product behavior, Worker, Fetcher, Renderer, Workflow, Queue, Research, Agent, Compose baseline, GitHub workflow, Decision, Session, or M1 acceptance-record change is allowed.

## Required verification

After correction, the Implementation Agent must run and report:

- `corepack pnpm install --frozen-lockfile`;
- `corepack pnpm workspace:check`;
- `corepack pnpm check`;
- `corepack pnpm test:integration`;
- assertion-failure injection, teardown-failure injection, and invalid-Docker injection, each non-zero with zero residue;
- `corepack pnpm test:browser`;
- fresh and repeated migration runs plus `corepack pnpm db:generate` showing schema/migration/snapshot alignment;
- official-registry `pnpm audit --audit-level high`;
- `corepack pnpm repository:check` and `git diff --check`;
- OpenAPI Source route/schema inspection;
- exact changed-file/forbidden-path, Secret, local-path, `.DS_Store`, artifact, Markdown-link, process/container/temp-directory, bucket/object, and named-volume checks.

The final Completion Report must map each correction and each parent Acceptance Criterion to executable evidence. It must not contain credentials, private Source bodies, object keys, or temporary local paths.

## Git boundary

The Implementation Agent must not commit, push, create a Pull Request, merge, switch branches, or self-approve. Codex may publish only after a fresh independent review returns no P0/P1/P2 findings and all required verification passes.
