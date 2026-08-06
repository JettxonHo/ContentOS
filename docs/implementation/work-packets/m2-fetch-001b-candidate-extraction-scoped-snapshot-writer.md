# M2-FETCH-001B — Candidate Extraction and Scoped Snapshot Writer

**Status:** Completed

**Issue:** [#94](https://github.com/JettxonHo/ContentOS/issues/94)

**Branch:** `codex/m2-fetch-001b-candidate-snapshot-writer`

**Base commit:** `33b0aeefc238cd8a5a8aae0894f9f855b1984321`

## Identification

- Work Item: `M2-FETCH-001B`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Target Execution Configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `IMPLEMENTATION_AGENT`
- Actual Model: `gpt-5.6-terra`
- Reasoning: `XHigh` actual
- Thread: `/root/fetch001b_implementation`
- Runtime Model Status: `VERIFIED`
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, XHigh Review Agents
- Risk Classification: untrusted content extraction, private Object Storage write, dependency addition

## Goal

Implement one unregistered Fetcher-private preparation boundary that consumes
an already verified `VerifiedFetchResponse`, derives one deterministic
`source/normalized/v1` review Candidate, writes and independently verifies one
immutable Task/Attempt-scoped Raw Snapshot, and returns one exact existing
`fetcher-result/v1` success or failure value. This item does not execute a
Queue Task or submit the Result to the API.

## Canonical sources

- [M2-DES-006 — Deterministic Fetcher Candidate Extraction](m2-des-006-fetcher-candidate-extraction.md)
- [M2-FETCH-001A — Public Transport and Resource Policy](m2-fetch-001a-public-transport-and-resource-policy.md)
- [M2-SRC-003 — URL-capture Result Contract and Source Evidence Boundary](m2-src-003-url-capture-result-source-evidence.md)
- [Source Fetcher Security Boundary](../../security/source-fetcher.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [Secret Management](../../security/secret-management.md)
- [Repository Structure](../../architecture/repository-structure.md)
- [Issue #94](https://github.com/JettxonHo/ContentOS/issues/94)

Relevant Accepted Decisions: DEC-059–DEC-066, DEC-163, DEC-199,
DEC-207–DEC-209, DEC-221, DEC-230–DEC-232, DEC-245, DEC-249, DEC-259,
DEC-268, DEC-280, DEC-284–DEC-285, and DEC-287–DEC-293. Later Accepted DEC
governs an actual conflict.

## Current truth and dependencies

- `M2-FETCH-001A` is Completed and exposes one private, one-shot
  `VerifiedFetchResponse` with distinct encoded and decoded sinks plus one
  non-extendable `CaptureBudget`.
- `M2-SRC-003` already fixes `fetcher-result/v1`, the public-URL storage-key
  family, integrity metadata, Result validation, API-owned object verification,
  and Source evidence promotion.
- The existing Domain `ObjectStore.putImmutable` is deliberately limited to
  pasted/upload Source keys and media types. It must not be widened for the
  Fetcher.
- The Fetcher remains a configuration-only lifecycle skeleton. It has no
  Queue consumer, Gateway client, Snapshot writer registration, public fetch
  execution, or Result submission.
- This Work Item has no database, Schema, migration, API, Queue, Event, Source
  state, or public protocol change.

## In scope

1. A framework-independent Candidate extraction contract in Domain Core,
   without a `parse5`, HTTP, S3, Queue, or framework dependency.
2. A Fetcher-private strict UTF-8 decoder and deterministic Candidate
   extraction adapter for `text/html`, `text/plain`, and `text/markdown`.
3. `parse5@8.0.1` as the only new external production dependency, located in
   the Fetcher application/provider boundary.
4. A separate URL-capture S3-compatible writer in the Object Storage adapter
   package. It uses the existing key family and integrity metadata without
   relaxing the pasted/upload `ObjectStore` port.
5. Fetcher-only Object Storage configuration with no fallback to API
   credentials.
6. One preparation service that consumes exactly one `VerifiedFetchResponse`,
   preserves encoded Raw Snapshot bytes separately from decoded Candidate
   bytes, writes and verifies the object, and returns a validated existing
   Result value.
7. Exact-key compensation for an object confirmed written by the current
   Task/Attempt preparation when later preparation fails.
8. Focused unit, adapter, isolated S3 integration, dependency, documentation,
   and repository verification.

## Out of scope

- BullMQ consumption, Queue contract movement, Claim, Heartbeat, Result HTTP
  submission, Task mutation, lease recovery, or one-active-capture scheduling;
- Fetcher runtime registration or changes to `apps/fetcher/src/main.ts`;
- API, Worker, Web, Renderer, Database, Schema, migration, Source promotion,
  Version, Approval, Research, Agent, or UI behavior;
- DOM simulation, Readability, Safe HTML, HTML rendering, JavaScript, CSS,
  metadata extraction, browser execution, charset detection, MIME sniffing,
  crawler, proxy, subresource loading, authenticated capture, or retries;
- a new Result, Candidate, Queue, Event, API, or object-key version;
- a new generic hash, digest, fingerprint, inventory, garbage collector, or
  object reconciliation mechanism; and
- production provider selection, bucket administration, IAM provisioning, or
  a claim that the local S3 fixture proves production permissions.

## Internal contracts

### Candidate extraction contract

Domain Core owns a small framework-independent seam conceptually equivalent to:

```ts
interface FetcherCandidateExtractor {
  extract(input: { contentType: 'text/html' | 'text/plain' | 'text/markdown'; text: string }): {
    schemaVersion: 'source/normalized/v1';
    text: string;
  };
}
```

Names may be refined during the red-green loop. The observable behavior and
error classification are fixed. Core must not import or expose `parse5`.

### Preparation contract

The Fetcher-private deep module exposes one seam conceptually equivalent to:

```ts
interface FetcherCapturePreparer {
  prepare(input: {
    taskId: string;
    attemptNumber: number;
    response: VerifiedFetchResponse;
  }): Promise<FetcherResultSubmission>;
}
```

The implementation:

1. accepts only an already retrieved response and never accepts a URL to fetch;
2. validates the declared charset before consuming the body;
3. invokes `response.consume` exactly once with distinct encoded and decoded
   sinks;
4. preserves raw encoded bytes in a fixed 2 MiB bounded accumulator and strict
   decoded bytes in the existing 8 MiB bounded path;
5. derives and validates the Candidate before creating an object;
6. generates an opaque UUID `snapshotId` and reconstructs the exact key with
   existing `buildUrlCaptureStorageKey` / `parseUrlCaptureStorageKey` rules;
7. conditionally writes and reads back the object using the same inherited
   AbortSignal;
8. checks the inherited budget before and after every synchronous extraction
   step and asynchronous storage step; and
9. returns a value accepted by `defineFetcherResultSubmission`.

The preparer does not call `PublicUrlTransport.fetch`, dispose the response,
finish or replace its budget, submit a Result, log private evidence, or mutate
authoritative state. `M2-FETCH-001C` owns the outer response `try/finally` and
runtime orchestration.

### Snapshot writer contract

Add a dedicated Fetcher URL-capture writer rather than widening
`ObjectStore.putImmutable`. Its provider-neutral conceptual port is:

```ts
interface FetcherSnapshotStore {
  putImmutable(input: {
    taskId: string;
    attemptNumber: number;
    snapshotId: string;
    bytes: Uint8Array;
    contentType: 'text/html' | 'text/plain' | 'text/markdown';
    signal: AbortSignal;
  }): Promise<StoredObject>;
  readForIntegrity(expected: StoredObject, signal: AbortSignal): Promise<boolean>;
  deleteForCompensation(input: {
    taskId: string;
    attemptNumber: number;
    snapshotId: string;
    signal: AbortSignal;
  }): Promise<void>;
}
```

The S3 adapter:

- derives exactly
  `fetcher/url-capture/<taskId>/<attemptNumber>/raw/<snapshotId>`;
- uses one `PutObject` with `IfNoneMatch: '*'` and never overwrites;
- writes exact media type and the existing lowercase SHA-256, decimal
  `bytesize`, and `immutable=true` metadata;
- reuses only the accepted Raw Snapshot integrity SHA-256; it introduces no
  second digest or fingerprint;
- reads back the entire bounded object and verifies content, digest metadata,
  exact byte size, exact media type, and actual bytes before success;
- passes the inherited AbortSignal to S3 operations and aborts integrity reads
  on cancellation; and
- reconstructs the compensation key from the exact structured Task/Attempt/
  Snapshot fields. It never accepts an arbitrary deletion key or lists a
  bucket.

An `IfNoneMatch` collision is a failed write. It must not delete the pre-existing
object because this invocation did not create it.

## Fixed extraction behavior

### Strict UTF-8 and charset

- `declaredCharset` accepts `null`, `utf-8`, or `utf8`, case-insensitively after
  bounded optional-whitespace normalization. A simple quoted form around one
  accepted token is unquoted; all other declarations are
  `unsupported_content`.
- Decode decoded-sink bytes with one streaming
  `TextDecoder('utf-8', { fatal: true })` and perform the final flush.
- Invalid UTF-8 is `unsupported_content`; replacement characters are never
  fabricated by the decoder.
- One leading UTF-8 BOM is not included in the Candidate. Raw Snapshot bytes
  remain unchanged.

### Plain text and Markdown

- Normalize CRLF and lone CR to LF.
- Preserve all other decoded text exactly.
- Markdown remains literal text. It is not rendered or parsed as HTML.
- A blank or otherwise invalid final Candidate is `extraction_failed`; an
  over-limit Candidate is `too_large`.

### HTML

Use synchronous `parse5.parse` against the already decoded, bounded maximum
8 MiB string. This is an intentionally proportional implementation choice:
the parser runs inside the Fetcher process, no Worker Thread or new process is
introduced, and the inherited budget is checked immediately before and after
the bounded parse. A deadline-crossing parse cannot produce success.

Traverse the parse tree depth-first in document order. Read only text-node
content. Suppress the complete subtrees rooted at:

```text
script style noscript template iframe object embed svg canvas
```

Use a single LF boundary before and after these block elements, and for `br`:

```text
address article aside blockquote body caption dd details dialog div dl dt
fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li
main menu nav ol p pre section summary table tbody td tfoot th thead tr ul
```

For retained HTML text, normalize line endings, collapse ECMAScript whitespace
runs to one ASCII space, remove spaces adjacent to LF, collapse repeated LF
boundaries to one LF, and trim the final Candidate. Do not inspect attributes,
CSS, URLs, metadata, selectors, or site-specific structure.

The final Candidate must be well-formed Unicode, contain no NUL, contain
non-whitespace text, and occupy at most 100,000 UTF-8 bytes. Exact 100,000-byte
Candidates are accepted. Overflow is `too_large`; blank, NUL, or otherwise
invalid extracted text is `extraction_failed`.

## Failure mapping and cleanup

Use only existing Fetcher-supplied Result failures:

| Cause                                                 | Result category       |
| ----------------------------------------------------- | --------------------- |
| unsupported declared charset or invalid strict UTF-8  | `unsupported_content` |
| empty, NUL, or invalid extracted Candidate            | `extraction_failed`   |
| Candidate exceeds 100,000 UTF-8 bytes                 | `too_large`           |
| inherited Capture Budget expires                      | `timeout`             |
| object write, collision, read-back, or integrity fail | `fetch_failed`        |
| exact-key compensation failure before timeout         | `fetch_failed`        |

The preparer never emits the server-derived `object_integrity_failed`; only the
API may derive that after Result submission. No partial success is returned.

Store only after Candidate success so extraction failures create no object. If
write is confirmed and a later verification or Result-construction step fails,
attempt deletion of that exact object using only the remaining inherited
budget. If the budget has expired or compensation fails, do not return success;
return the applicable safe failure. A bounded, Task/Attempt-prefixed orphan is
reported only through a stable safe operational category and is not addressed
by adding bucket listing or a new reconciliation subsystem.

## Configuration contract

Add one unregistered Fetcher-only loader with these exact keys:

```text
CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT
CONTENTOS_FETCHER_OBJECT_STORAGE_REGION
CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET
CONTENTOS_FETCHER_OBJECT_STORAGE_FORCE_PATH_STYLE
CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY
CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY
```

- endpoint, bucket, access key, and secret key are required;
- region defaults to `us-east-1` and force-path-style defaults to `true`,
  matching the local-development adapter convention;
- validation follows the existing bounded S3 endpoint/region/bucket rules;
- no key falls back to `CONTENTOS_OBJECT_STORAGE_*`,
  `OBJECT_STORAGE_ACCESS_KEY`, or `OBJECT_STORAGE_SECRET_KEY`;
- values, endpoints, credentials, and raw errors are never returned in a
  validation message or ordinary log; and
- the loader is not invoked from Fetcher `main.ts` until 001C registers the
  complete runtime.

Production permission intent is limited to Get/Put/Delete beneath the
`fetcher/url-capture/*/raw/*` family, with no List or bucket administration.
The local SeaweedFS fixture verifies authentication and behavior, not a
production IAM policy.

## Allowed files

- `apps/fetcher/package.json`
- `apps/fetcher/src/candidate-capture/**`
- `packages/core/src/source/fetcher-candidate.ts`
- `packages/core/src/source/fetcher-candidate.test.ts`
- `packages/core/src/index.ts`
- `packages/config/src/fetcher-snapshot-config.ts`
- `packages/config/src/fetcher-snapshot-config.test.ts`
- `packages/config/src/index.ts`
- `packages/object-storage/src/fetcher-snapshot-store.ts`
- `packages/object-storage/src/fetcher-snapshot-store.test.ts`
- `packages/object-storage/src/index.ts`
- `packages/object-storage/src/s3-object-store.ts` only for a narrow shared
  integrity helper or optional AbortSignal compatibility needed by both adapters
- `packages/object-storage/src/s3-object-store.test.ts` only for the focused
  companion regression proving that inherited AbortSignal compatibility
  destroys an in-progress integrity body
- `packages/testing/src/integration/fetcher-snapshot-store.test.ts`
- `pnpm-lock.yaml`
- `docs/security/source-fetcher.md`
- `docs/security/secret-management.md`
- `docs/architecture/source-foundation.md`
- `docs/architecture/repository-structure.md`
- `docs/implementation/roadmap.md`
- `docs/implementation/work-packets/m2-fetch-001b-candidate-extraction-scoped-snapshot-writer.md`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`

Generated lockfile changes must be produced only by the pinned pnpm version.
No migration, Drizzle metadata, Schema, generated API contract, or certificate
artifact is expected.

## Prohibited files and modules

- `apps/fetcher/src/main.ts`
- `apps/api/**`, `apps/worker/**`, `apps/web/**`, `apps/renderer/**`
- `packages/contracts/**`, `packages/database/**`
- existing migrations, `migrations/meta/**`, Drizzle Schema, Compose, `.env*`,
  GitHub workflow, Decision, and Session files
- existing Queue, Gateway route, API Result, Source-promotion, and Workflow
  persistence behavior
- any package manifest other than `apps/fetcher/package.json`

## Required tests

### Core and Fetcher unit tests

- UTF-8 sequences split across decoded chunks; final-flush error; absent,
  UTF-8, utf8, simple quoted accepted charset; another charset rejected;
- plain and Markdown CRLF/lone-CR normalization without Markdown rendering;
- representative malformed HTML recovery, document order, fixed subtree
  exclusions, fixed block/LF behavior, whitespace collapse, and inert resource
  elements;
- blank, NUL, exact 100,000-byte, and 100,001-byte Candidate boundaries;
- encoded Snapshot bytes equal the encoded sink while Candidate derives only
  from the decoded sink;
- exact existing success/failure Result values validated through
  `defineFetcherResultSubmission`;
- inherited budget is never replaced and a deadline crossing before/after
  parse, put, or read-back cannot return success; and
- errors contain no URL, body, Candidate, object key, Claim, header, Secret,
  endpoint, raw provider error, or stack.

### Object Storage adapter and isolated integration

- exact canonical key, allowed media types, conditional no-overwrite, existing
  integrity metadata, real read-back hash/size/media verification;
- collision does not overwrite or delete the existing object;
- mismatch, provider failure, and abort fail closed;
- compensation reconstructs and deletes only the exact current Task/Attempt/
  Snapshot object; and
- isolated S3 fixture proves correct credentials succeed and wrong credentials
  fail, while cleanup removes only task-owned test objects and leaves no owned
  bucket/object/container/process/temp-directory residue.

Full Queue-to-Gateway Fetcher execution and end-to-end URL capture remain 001C
evidence. `test:integration:concurrent` and browser tests are not required
because this item adds neither process orchestration nor Web behavior.

## Acceptance criteria

1. A supported already-verified response produces a deterministic,
   non-executing `source/normalized/v1` Candidate using the fixed media-specific
   rules.
2. Unsupported charset, invalid UTF-8, empty/invalid Candidate, Candidate
   overflow, timeout, and storage failures map only to their fixed existing
   Result categories with no partial success.
3. The Raw Snapshot is the exact encoded response body, remains distinct from
   the decoded Candidate, and is bounded by the existing 2 MiB limit.
4. The writer uses the exact current Task/Attempt/Snapshot key, conditional
   no-overwrite, accepted metadata, and independent bounded read-back integrity
   verification before success.
5. Failure cleanup can target only an object confirmed written for the current
   structured Task/Attempt/Snapshot; it never lists storage or deletes a
   collision/non-current key.
6. DNS-through-verification uses one inherited Capture Budget. 001B cannot
   reset, replace, or extend it, and no synchronous or asynchronous
   deadline-crossing path returns success.
7. The returned value is accepted by the existing exact `fetcher-result/v1`
   validator; no Result/API/Event/Schema/key version or new hash protocol is
   introduced.
8. Fetcher Object Storage configuration is independent, fail-closed, redacted,
   unregistered, and has no API credential fallback.
9. `parse5@8.0.1` is the only new external production dependency; its fixed
   version, MIT license, unique lockfile resolution, and official-registry
   audit evidence are verified. The audit must introduce no advisory path
   through `parse5` or `entities`; inherited base-lock findings must be
   attributed and tracked separately, never reported as a clean audit or
   silently ignored.
10. No Queue consumer, Gateway call, Result submission, Source mutation,
    runtime registration, database/migration, browser, or adjacent M2/M3
    capability is introduced.
11. Existing unit, integration, documentation, repository, and Secret checks
    pass, and documentation claims only an internal 001B preparation
    foundation.

## Security review

- The task handles untrusted fetched bytes and introduces a Fetcher-scoped
  private Object Storage write boundary.
- HTML remains inert data. No script, subresource, URL, attribute, or metadata
  field can become Candidate execution authority.
- Credentials remain Fetcher-only configuration and do not enter Core, Result,
  Queue data, URLs, errors, logs, fixtures, or Git.
- Raw bytes, Candidate text, URLs, redirects, object keys, and provider errors
  are private data and absent from ordinary telemetry.
- No Authentication, owner Authorization, public API, Source Approval, Renderer,
  Agent, or production permission change is authorized.
- Tests stay proportional to real parser, storage, budget, and configuration
  boundaries; they must not grow speculative impossible-object matrices or a
  second digest mechanism.

## Migration and compatibility review

- No database, Schema, migration, backfill, API, Queue, Event, Result, Artifact,
  Candidate, or key-format migration exists.
- `apps/fetcher/package.json` and `pnpm-lock.yaml` add the fixed parser and
  explicit workspace dependencies required by the private module.
- The new configuration loader is inactive until 001C and therefore does not
  change existing Fetcher startup requirements in this item.
- Rollback is deletion of the new unregistered modules, dependency entries,
  tests, and documentation. No persisted database state needs rollback.

## Observability

The unregistered module may expose only stable safe local failure categories
needed by 001C. It must not write ordinary runtime logs in 001B. Tests may
inspect safe category values and resource cleanup, not private payloads. Metrics,
traces, Audit Events, and Result submission belong to later runtime work.

## Documentation updates

Synchronize only the allowed Current-truth and repository-status documents.
Mark this Work Item `In Review` only after all required evidence passes. Keep
M2 `In Progress`, parent `M2-FETCH-001` incomplete, 001A Completed, and 001C
Not Started. State explicitly that the production Fetcher still does not
consume Queue jobs, fetch URLs, write snapshots, or submit Results at runtime.

No new DEC is required unless implementation needs a different parser,
charset policy, Result/key/API version, runtime process, provider/service,
credential ownership, security boundary, or Acceptance Criterion.

## Required verification

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm workspace:check`
- targeted Core/Fetcher/Object Storage/Config unit tests
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `corepack pnpm check:secrets`
- `corepack pnpm test:integration`
- `corepack pnpm db:generate` and confirmation of no Schema diff
- official-registry dependency audit with base-delta/path attribution,
  fixed-version and license inspection
- `git diff --check`
- exact file scope, dependency/lockfile, Secret, local-path, generated-artifact,
  `.DS_Store`, process/container/temp-directory, owned-object cleanup, and Git
  status inspection

## Git permissions

- Commit: No
- Push: No
- Draft Pull Request: No
- Mark Pull Request Ready: No
- Merge: No

The Implementation Agent stops with an uncommitted Completion Report. The
Orchestrator performs publication only after independent review returns
`PASS`. The implementer must not independently approve its own work.

## Escalation conditions

Return `HUMAN_DECISION_REQUIRED` before changing an accepted parser/version,
charset/extraction rule, Candidate/Result/key/API contract, public-network or
credential boundary, production permission, technical stack, runtime process
topology, migration behavior, or Acceptance Criterion. Ordinary bounded
implementation corrections and environmental test reruns follow the accepted
autonomous workflow.

## Definition of Ready record

Independent Planning Review returned `READY` against the real packet and
repository state on 2026-08-06.

- Logical Role: `PLANNING_REVIEWER`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: XHigh requested; actual runtime setting was not exposed
- Thread: `/root/fetch001b_ready_review`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`

The review confirmed that authority, dependencies, interfaces, extraction
rules, inherited budget, storage ownership, cleanup, configuration, dependency,
file scope, tests, migration impact, documentation, and escalation are bounded
and testable. No Blocking Design Question remains.

### Planning correction after independent implementation review

Independent Review Correction #1 authorized the focused companion change to
`packages/object-storage/src/s3-object-store.test.ts`; the test covers the same
shared AbortSignal helper already allowed above and does not broaden provider,
API, or storage behavior.

The initial dependency criterion incorrectly implied that a repository-wide
official-registry audit had to be clean even though base commit `33b0aeef`
already contained three unrelated advisories. The governing Human-approved M2
plan requires the new dependency's version, license, uniqueness, lockfile, and
official-registry audit to be checked; it does not authorize misreporting or
silently remediating unrelated dependencies inside 001B. The criterion now
requires exact base-delta attribution: `parse5@8.0.1` and `entities@8.0.0` add
no advisory path, while the inherited `fast-uri` and `brace-expansion`
findings remain visibly non-clean and are tracked by
[Issue #95](https://github.com/JettxonHo/ContentOS/issues/95). This is an
explicit planning correction, not an audit suppression or claim that the
repository audit passed.

## Completion record

Independent implementation review returned `PASS` across correctness,
security/storage/dependency, and tests/documentation/scope. Required local
checks and all three GitHub CI jobs passed. PR
[#96](https://github.com/JettxonHo/ContentOS/pull/96) was squash-merged on
2026-08-06 as
`9b28068eb3ed266973f77bcdffe6c08776b2086c`
(`feat: add candidate extraction and scoped snapshot writer (#96)`). Issue
[#94](https://github.com/JettxonHo/ContentOS/issues/94) is closed.

The implementation remains private and unregistered. `M2-FETCH-001C` is not
started, parent `M2-FETCH-001` is incomplete, M2 remains `In Progress`, and
Fetcher URL execution remains unavailable. Inherited dependency advisories are
tracked separately by
[#95](https://github.com/JettxonHo/ContentOS/issues/95); no maintenance change
was folded into this Work Item.
