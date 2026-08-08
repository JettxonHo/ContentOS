# M2-QUAL-004 — Safe Concurrent Failure Attribution

**Status:** Ready

**Issue:** [#149](https://github.com/JettxonHo/ContentOS/issues/149)

## Identification

- Task ID: `M2-QUAL-004`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Defect
- Owner: Implementation Agent
- Reviewer: Independent Review Agent
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Implementation Thread: assigned after Definition of Ready passes
- Planning Base SHA: `8dceb8789cb2bc308839934b376a35bc9e4fedd6`
- Risk Classification: test-harness diagnostic disclosure and failure attribution

## Goal

Let the concurrent Integration coordinator report the failing repository
Integration test file in a minimal safe diagnostic, without exposing raw child
output, assertion details, user content, credentials, runtime identities, or
local paths.

## Context

M2-QUAL-003 repaired two known Worker test observation races. Its focused tests
passed three consecutive runs; root, full Integration, and browser gates also
passed. Repeated `test:integration:concurrent` execution nevertheless alternated
between pass and a child `test-run-failed`. The coordinator captured 1,415–1,416
bytes of child output but emitted only the generic category, so the failing test
could not be classified. Rerun-only validation stopped after the second
unclassified failure.

The coordinator already retains a bounded tail of child stdout/stderr in memory.
This Work Item extracts only a strictly validated Integration test basename from
that existing data. It does not persist or expose raw output and does not try to
fix an unattributed test.

M2-QUAL-003 and M2-GOV-006 are blocked. Issues #147 and #144 remain open. M2
remains In Progress and M3 remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered tests.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items and focused review.
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No conflict or Blocking Design
Question is currently identified.

## In scope

1. Parse only complete recognized Vitest failure-metadata lines in the existing
   bounded in-memory child-output tail for one strictly validated repository
   Integration test basename.
2. Add `test=<safe-basename>` to a `test-run-failed` child diagnostic when the
   basename is reliably present; otherwise add `test=unclassified`.
3. Strip terminal formatting before parsing, while never returning the stripped
   text itself.
4. Preserve existing child index, exit code, signal, category, captured-byte
   count, remaining-child state, and owned-cleanup state.
5. Add deterministic unit tests for valid Vitest failure metadata, repeated
   identical and multiple distinct failures, ANSI formatting, passing-module and
   stack/path noise, sensitive adjacent content, malformed/unknown output, and
   existing failure categories.
6. Update the Integration Smoke Harness documentation with the safe diagnostic
   boundary.
7. After local gates pass, run at most three real concurrent diagnostics and stop
   at the first failure. Record only the new safe attribution and cleanup result.
   Three passes do not close M2-QUAL-003; they only show the diagnostic path did
   not reproduce during the bounded window.

## Out of scope

- raw stdout/stderr, assertion message/diff, test title, stack, user content,
  URL, Header, SQL, environment value, Secret, local path, PID, claim token,
  Compose project, or process command output;
- increasing the existing child-output capture bound, changing timeouts,
  retries, cleanup ownership, or CI behavior;
- JSON reporters, external logging, persistent diagnostic files, or a new hash;
- Worker, Dispatcher, Repository, Queue, product, API, Web, Fetcher, Schema,
  migration, dependency, lockfile, Compose, CI, DEC, or Acceptance Record change;
- fixing any candidate test before safe attribution identifies it;
- M2 completion or M3 work.

## Allowed and prohibited files

### Allowed implementation files

- `packages/testing/src/integration/run-concurrent-smoke.ts`
- `packages/testing/src/concurrent-smoke.test.ts`
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-004-safe-concurrent-failure-attribution.md`
- `docs/implementation/roadmap.md`

### Planning-only status files

- `docs/implementation/work-packets/m2-qual-003-worker-dispatcher-observation-stability.md`
- `docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md`

The planning-only files must not be changed by the implementation Agent.

### Prohibited modules

- all production application and package source;
- migrations, Schema, Drizzle metadata, package manifests, lockfile, Compose,
  CI, Decisions, Sessions, READMEs, AGENTS, and Acceptance Records.

### Generated files policy

No generated or runtime file may be committed. Diagnostic output remains in
memory and is not written to a repository or long-lived external file. The
implementer removes only task-owned temporary state and does not touch
pre-existing local resources.

## Safe diagnostic contract

For `category=test-run-failed`, the emitted child fragment is:

```text
child-<index> exit=<code> signal=<signal> category=test-run-failed test=<basename-or-unclassified> captured-bytes=<bounded-count>
```

The basename parser must:

- remove terminal formatting, split the bounded tail into complete lines, and
  inspect only recognized Vitest failed-module and `FAIL` summary metadata lines;
- accept only a path segment under
  `packages/testing/src/integration/<basename>.test.ts` on those lines;
- return only `<basename>.test.ts`, never the prefix or an absolute path;
- allow the repository's existing lowercase letters, digits, and hyphens;
- deduplicate repeated occurrences of one identical basename;
- emit the basename only when exactly one distinct validated basename remains;
- ignore passing-module lines, assertion/stack text, incomplete lines, and
  standalone embedded paths;
- return `unclassified` for zero or multiple distinct validated basenames and
  for malformed or non-Integration failure metadata; and
- never include surrounding or unmatched output.

All non-test failure classifications preserve their existing message shape.
The coordinator does not output or persist the raw captured text.

## Acceptance criteria

1. Known plain and ANSI-formatted Vitest failure-metadata lines identify the
   exact safe Integration test basename; repeated occurrences of that same file
   are deduplicated.
2. Output containing a credential-shaped value, URL, absolute local path,
   assertion values, or private text emits none of those values.
3. Multiple distinct failures, passing-module lines, standalone stack/assertion
   paths, incomplete lines, and missing, malformed, or unrelated paths yield
   `test=unclassified`.
4. Setup, build, migration, cleanup, and unclassified classification behavior
   remains unchanged.
5. The exact existing `MAX_CAPTURED_OUTPUT = 8192` tail behavior implemented by
   JavaScript `slice(-MAX_CAPTURED_OUTPUT)`, the separately capped
   `captured-bytes` count, process lifecycle, timeouts, cleanup, and ownership
   contract remain unchanged.
6. Unit, root quality, full Integration, browser, documentation, repository,
   Secret, and diff gates pass.
7. A bounded real concurrent diagnostic stops at the first failure and reports
   only the safe attribution with verified cleanup; if all three attempts pass,
   that non-reproduction is recorded without treating M2-QUAL-003 as complete.
8. The diff stays within the five implementation files and leaves no task-owned
   process, container, temporary directory, or repository-local store.
9. Final-head Docker-independent, Integration, and Browser CI all pass before
   merge.

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

After those pass, run `corepack pnpm test:integration:concurrent` at most three
times, sequentially. Stop immediately on the first failure and record its safe
`test=` field plus owned-cleanup result. Do not run additional attempts to turn
a failure green.

Before and after runtime commands, record task-owned process, Compose project,
container, temporary-directory, and repository-store state. Current-run residue
blocks completion until safely cleaned.

## Security review

This task changes only test-harness failure metadata. It deliberately reduces
diagnostic disclosure by allowlisting one basename and rejecting everything
else. It does not handle product credentials, user content, authorization,
network policy, Object Storage, or production logging, and adds no hash.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, lockfile,
configuration, or compatibility change. Existing diagnostic fields remain;
`test=` is additive only for `test-run-failed`. Rollback is one focused Git
revert.

## Observability

No product observability changes. Test harness diagnostics gain only the bounded
safe test basename or `unclassified`.

## Documentation updates

- this Work Packet;
- `docs/quality/integration-smoke-harness.md`;
- `docs/implementation/roadmap.md`.

The M2-QUAL-003 and M2-GOV-006 Work Packets receive planning-only dependency
status updates. No capability Current Truth, Acceptance Record, README, AGENTS,
DEC, or M3 document changes.

## Definition of Ready

PASS. Goal, parser contract, disclosure allowlist, file boundary, tests,
bounded real diagnostic, cleanup, and publication gates are defined. No
Blocking Design Question or new DEC exists.

- Reviewers:
  - `/root/m2_qual_004_dor_contract` — PASS after three bounded contract
    corrections
  - `/root/m2_qual_004_dor_governance` — PASS
- Logical Role: `DEFINITION_OF_READY_REVIEWER`
- Requested Model: `gpt-5.6-sol`
- Reasoning: High
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Reviewed Base: `8dceb8789cb2bc308839934b376a35bc9e4fedd6`

## Definition of Done

The safe attribution tests and all required local/final-head gates pass,
independent review finds no unresolved issue, the diff stays within the five
implementation files, and task-owned runtime residue is zero. This Work Item
does not require or claim the downstream flaky test root cause is fixed.

## Git authority

After Definition of Ready passes, the Orchestrator may publish this planning
packet. The implementation Agent must stop before Git publication. After
independent implementation review passes, the Orchestrator may commit, push, and
create a Draft PR. Only all-green final-head CI and no unresolved finding or
escalation permit Ready status and squash merge. The implementer cannot approve
or merge its own work.
