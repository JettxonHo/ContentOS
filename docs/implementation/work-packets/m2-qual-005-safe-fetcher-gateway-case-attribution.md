# M2-QUAL-005 — Safe Fetcher Gateway Case Attribution

**Status:** Completed

**Issue:** [#153](https://github.com/JettxonHo/ContentOS/issues/153)

## Identification

- Task ID: `M2-QUAL-005`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Diagnostic
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Implementation Thread: `/root/m2_qual_005_implementation`
- Planning Base SHA: `a72aecbaf4505d04fb5f3224ba972f25232383ef`
- Implementation Base SHA: `d1504faa179bf322915dd27eea92199925bad9d4`
- Completion PR: #155, squash merge
  `b212d9713cef35d6181b2864f2d0ae4760c4d13e`
- Completion CI: run `31269730633`; Docker-independent, Integration, and
  Browser jobs all passed
- Completion Issue: #153 closed
- Risk Classification: bounded test diagnostics only

## Goal

Refine a concurrent Integration failure already attributed to
`fetcher-gateway-api.test.ts` into one predefined, non-sensitive case ID,
without exposing test titles, assertions, raw output, user content, Secrets, or
local runtime details and without guessing or implementing the underlying
repair.

## Context

M2-QUAL-003 final revalidation on the completed M2-QUAL-004 safe-attribution
baseline stopped on its first required concurrent run:

```text
child-2 exit=1 signal=none category=test-run-failed
test=fetcher-gateway-api.test.ts captured-bytes=1419
remaining-child=clean owned-cleanup=verified
```

The diagnostic identifies the failed file but not a unique test case or root
cause. The raw child output was intentionally not persisted or exposed. Code
inspection found several plausible timing-sensitive boundaries, including the
20-second Heartbeat cadence and the raw HTTP helper's 10-second timeout, but no
available evidence distinguishes them. A repair is therefore not Ready.

This Work Item improves only the already accepted bounded diagnostic. It does
not alter Fetcher Gateway behavior, Lease semantics, test timeouts, capture
limits, retry policy, or cleanup ownership. M2-QUAL-003 remains preserved and
is In Progress for final revalidation; M2-GOV-006 remains Blocked pending that
revalidation. M2 remains In Progress, and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered tests.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items and focused review.
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-004 Work Packet](m2-qual-004-safe-concurrent-failure-attribution.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Prefix each of the 11 existing test titles in
   `fetcher-gateway-api.test.ts` with exactly one stable, non-semantic marker
   from `[FG-01]` through `[FG-11]`, without changing the test operation or
   assertion.
2. Extend the existing safe concurrent diagnostic to emit one lowercase
   `case=fg-xx` value only when a complete, newline-terminated Vitest `FAIL`
   metadata line anchored to
   `packages/testing/src/integration/fetcher-gateway-api.test.ts` uniquely
   identifies an allowlisted marker on that same line.
3. Emit `case=unclassified` for missing, incomplete, truncated, unknown, or
   multiple different case IDs. Repeated metadata for the same case may be
   deduplicated.
4. Add focused deterministic parser tests for the accepted and rejected
   metadata shapes.
5. Synchronize only the Integration Harness documentation, this Work Packet,
   and the Roadmap status.
6. Run the ordinary quality gates, then at most three sequential concurrent
   attempts with the stopping rules below.

## Out of scope

- any product, API, Fetcher Gateway, Lease, database, Queue, Worker, Web,
  Fetcher, Renderer, or application behavior change;
- changing a test operation, assertion, fixture, timeout, retry, capture size,
  child lifecycle, cleanup ownership, or concurrent run count;
- interpreting a case ID as a root cause or implementing the eventual repair;
- exposing or persisting a test title, assertion, stack, raw child output, URL,
  Candidate body, Claim, Secret, Header, SQL, absolute path, PID, or port;
- dependency, lockfile, Schema, migration, Compose, CI, Accepted DEC,
  Acceptance Record, M2 completion, or M3 work;
- adding a hash, generalized telemetry framework, or defensive matrix for
  unobserved cases.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/fetcher-gateway-api.test.ts`
- `packages/testing/src/integration/run-concurrent-smoke.ts`
- `packages/testing/src/concurrent-smoke.test.ts`
- `docs/quality/integration-smoke-harness.md`
- this Work Packet
- `docs/implementation/roadmap.md`

### Prohibited modules

- all production application and package source;
- other tests and fixtures;
- migrations, Schema, Drizzle metadata, package manifests, lockfile, Compose,
  CI, Decision, Session, README, AGENTS, and Acceptance Record files;
- the M2-QUAL-003 and M2-GOV-006 Work Packets during implementation.

### Generated files policy

No generated or runtime file may be committed. The implementer removes only
task-owned temporary state and must not touch pre-existing processes,
containers, directories, volumes, or package stores.

## Contracts

- Existing `test=<safe-basename>` attribution: unchanged.
- Case attribution appears only when the existing safe `test` field is exactly
  `fetcher-gateway-api.test.ts`. Its fixed diagnostic order is
  `category=test-run-failed test=fetcher-gateway-api.test.ts case=<value> captured-bytes=...`.
- The case value is `fg-xx` only when every complete, newline-terminated,
  same-line Vitest `FAIL` metadata record anchored to the exact Fetcher Gateway
  integration path contains exactly one unique allowlisted marker. Otherwise it
  is `unclassified`. Repeated complete records carrying that same marker remain
  deduplicated.
- Another safe test basename or an unclassified test basename never gains a
  Fetcher Gateway `case` field. The parser never searches assertions, stacks,
  arbitrary output, or adjacent lines for a marker.
- The case ID is diagnostic metadata only. It does not change a test name's
  product meaning and is not a stable public API.
- The bounded output tail, captured-byte count, failure categories, timeout,
  process lifecycle, cleanup, and ownership contracts remain unchanged.
- Product, API, Event, Queue, database, migration, configuration, error, and
  security contracts remain unchanged.

## Acceptance criteria

1. The 11 existing Fetcher Gateway Integration test titles each begin with
   exactly one unique marker from `[FG-01]` through `[FG-11]`, with no test
   behavior change.
2. Complete, uniquely matching failure metadata for
   `fetcher-gateway-api.test.ts` produces the matching lowercase safe case ID.
3. ANSI metadata and repeated complete metadata for the same case remain
   classifiable.
4. With `outputStartsMidLine=true`, the leading fragment is ignored; an
   incomplete trailing line is never parsed; a later complete matching line
   remains classifiable.
5. Missing, incomplete, truncated, unknown, or multiple different markers and
   marker-like text on adjacent non-metadata lines produce
   `case=unclassified`; another test file does not gain a Fetcher Gateway case.
6. Diagnostics never contain the adjacent test title, assertion, stack, raw
   output, URL, Secret, absolute path, PID, or other runtime detail.
7. Capture size, timeout, retry, lifecycle, cleanup, and all 11 test operations
   and assertions remain unchanged.
8. Focused parser tests, root quality, full Integration, Browser, documentation,
   repository, Secret, diff, scope, and cleanup gates pass.
9. Concurrent validation runs sequentially at most three times and stops on the
   first failure without rerun-to-green.
10. A unique case failure completes this diagnostic objective but does not
    repair or complete M2-QUAL-003. Three passes mean only `not reproduced`.
11. The diff contains only the six allowed files and leaves zero task-owned
    process, container, Compose project, temporary directory, or repository
    store residue.

## Required tests and commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm exec vitest run packages/testing/src/concurrent-smoke.test.ts
corepack pnpm check
corepack pnpm test:integration
corepack pnpm test:browser
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
git diff --check
```

After all deterministic and ordinary runtime gates pass, run
`corepack pnpm test:integration:concurrent` sequentially at most three times:

- first failure with one `case=fg-xx`: stop and create a separate bounded
  repair Work Item for that case;
- first `case=unclassified`: stop; M2-QUAL-005 remains Blocked and not Done
  until a bounded diagnostic follow-up resolves the missing attribution;
- a non-`test-run-failed` category: stop; M2-QUAL-005 remains Blocked and follows
  that existing category;
- cleanup not verified: stop; cleanup is the prior blocker and M2-QUAL-005 is
  not Done;
- three consecutive passes: stop and record `not reproduced`; do not claim a
  root cause or continue running.

Before and after runtime commands, record the delta for task-owned processes,
Compose projects, containers, temporary directories, and repository stores.

## Security review

This task handles bounded test-process output that can be adjacent to private
or operational values. The only new emitted value is one static non-semantic
allowlisted ID. It does not introduce a Credential, network request, user-data
path, Authorization change, logging sink, or persistence. No hash or new
security mechanism is added.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, configuration, dependency,
or compatibility change. Rollback is one focused Git revert.

## Observability

Only the existing failure diagnostic gains the conditional safe `case` field.
Raw child output remains bounded in memory and is never persisted or printed.
No product Log, Metric, Trace, or Audit Event changes.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md),
  limited to the safe case diagnostic;
- this Work Packet;
- `docs/implementation/roadmap.md`.

No capability Current-truth, README, AGENTS, DEC, Acceptance Record, or M3
document changes.

## Definition of Ready

PASS. The observed file-level failure, diagnostic-only contract, six-file
boundary, case allowlist, stopping rules, security boundary, tests, cleanup,
and publication gates are specified. A repair remains Not Ready until one safe
case is attributed. No Blocking Design Question or new DEC exists.

- Reviewers:
  - `/root/m2_qual_005_dor_contract` — PASS after bounded contract corrections
  - `/root/m2_qual_005_dor_governance` — PASS after terminal-state clarification
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `a72aecbaf4505d04fb5f3224ba972f25232383ef`

## Completion evidence

The implementation changed only the six files in the allowed boundary. The
focused parser suite passed 31 tests under Node.js `24.18.0` and pnpm
`11.17.0`; frozen install, workspace resolution, and the root `check` also
passed. The 11 Fetcher Gateway test titles now carry the exact `[FG-01]`–
`[FG-11]` markers, and the safe parser emits only an allowlisted lowercase
`case=fg-xx` value for an exact complete Fetcher Gateway `FAIL` metadata line.

The required full Integration command first failed twice sequentially in the
sandboxed ordinary runner from the clean implementation worktree, with no
Vitest filter or test-selection override. Both attempts produced the same
sanitized `setup=setup-failed teardown=clean` result (Vitest also reported no
collected test files after global setup). A normal-permission Orchestrator check
found two exact identity-confirmed, task-owned orphan API processes from the
failed sandbox attempts. Only those two processes received `SIGTERM` and were
confirmed absent, and unrelated historical processes were untouched. The
sandboxed `ps`/`pgrep` checks were denied with `EPERM`, sysmon was absent, and
managed-process identity capture depends on that interface; no underlying setup
cause was classified from the retained run evidence because the harness
sanitized it.

Normal-permission runtime verification then passed the full Integration suite
with 27 files and 184 tests (`RC=0`), the root `check` with 53 files and 504
tests plus all builds (`RC=0`), and Browser with 16/16 tests (`RC=0`). The
task-worktree application process count was zero after normal Integration
teardown. Three sequential concurrent attempts (`#1`, `#2`, `#3`) each exited
`RC=0` with no failure output. This records `not reproduced` only; it does not
claim a root cause or authorize a repair. `M2-QUAL-003` is In Progress for final
revalidation, and `M2-GOV-006` remains Blocked pending that Work Item. M2
remains In Progress and M3 remains Not Started.

## Independent implementation review

PASS. The bounded parser correction, regression evidence, exact six-file scope,
identifier-free cleanup record, security boundary, and status truth have no
remaining finding.

- Reviewers:
  - `/root/m2_qual_005_blocked_review` — PASS after one parser and two
    documentation corrections
  - `/root/m2_qual_005_scope_review` — PASS after identifier and causal-wording
    corrections
- Logical Role: `INDEPENDENT_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `d1504faa179bf322915dd27eea92199925bad9d4`

## Definition of Done

The safe case parser and static IDs pass independent review and all required
ordinary gates. One unique `case=fg-xx` completes this diagnostic objective and
requires a separate repair Work Item. Three consecutive passes may publish only
`not reproduced`; they do not complete M2-QUAL-003, whose later final
revalidation remains required. An unclassified case, non-test failure category,
or cleanup failure leaves this Work Item Blocked and not Done; cleanup failure
always blocks publication. The diff stays within the six-file allowlist and
task-owned runtime residue is zero.

## Git authority

After Definition of Ready passes, the Orchestrator may publish this planning
packet. The implementer may modify only the Ready contract and must stop before
Git publication. After independent implementation review passes, the
Orchestrator may commit, push, and create a Draft PR. Only all-green final-head
CI and no unresolved finding or escalation permit Ready status and squash
merge. A diagnostic case does not authorize its repair. The implementer cannot
approve or merge its own work.
