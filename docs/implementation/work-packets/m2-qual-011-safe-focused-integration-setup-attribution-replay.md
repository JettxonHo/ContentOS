# M2-QUAL-011 — Safe Focused Integration Setup Failure Attribution and Replay

**Status:** Ready

**Issue:** [#175](https://github.com/JettxonHo/ContentOS/issues/175)

## Identification

- Task ID: `M2-QUAL-011`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Defect
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Branch: `codex/m2-qual-011-safe-setup-attribution-plan`
- Planning Base SHA: `6a9149be368a9b826c2c13b095ac2459362f2fde`
- Implementation Thread: assigned after this packet becomes Ready
- Implementation Branch: `codex/m2-qual-011-safe-setup-attribution-impl`
- Implementation Base SHA: latest `origin/main` after this Ready packet merges;
  record the exact SHA before any edit or runtime command
- Dependencies: M2-QUAL-006 and M2-QUAL-009 completed; M2-QUAL-003
  Blocked record merged through PR #174
- Risk Classification: bounded Integration Harness diagnostic and cleanup
  evidence

## Goal

Replace only the Integration Harness's generic `setup=setup-failed` fallback
with one fixed, safe setup-phase category, then replay the exact focused Worker
Integration command under a bounded first-red rule. This Work Item attributes a
failure boundary; it does not diagnose or repair its root cause.

## Context

The final M2-QUAL-003 replay started from clean base
`2297bad3415157a7f84ff60e6a9a39dc9985adc6`. Its first focused Worker attempt
exited `1` with only `setup=setup-failed teardown=clean`; task-owned entry and
post-attempt aggregate state were zero, and first-red stopping prevented every
later gate. The Worker test body did not run. PR #174 published only that
Blocked evidence; its Worker test delta remains unpublished and Issue #147
remains open.

The Integration Harness already emits stable specific setup categories for
managed-process identity, Docker, application build, Compose startup, host-port
resolution, bucket HTTP rejection, migration, API/Web readiness, and ownership
validation. Other credible setup boundaries still fall through to the generic
category. `teardown=clean` proves only that teardown did not reject; it does not
identify whether failure occurred before runtime construction or after a
partially initialized runtime was cleaned.

This Work Item adds only an in-memory phase snapshot for that final fallback.
It preserves the existing record grammar and all existing category precedence.
M2-QUAL-003 and M2-GOV-006 remain Blocked, M2 remains In Progress, and M3
remains Not Started.

## Relevant decisions and documents

- DEC-245, DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, DEC-292 — bounded Work Items, review, Definition
  of Ready/Done, and scope governance.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Release Gates](../../quality/release-gates.md)
- [M2-QUAL-003 Work Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-006 Work Packet](m2-qual-006-managed-process-capture-cleanup.md)
- [M2-QUAL-009 Work Packet](m2-qual-009-explicit-child-teardown-record-emission.md)
- [M2-QUAL-010 Work Packet](m2-qual-010-real-fg07-evidence-replay.md)
- [M2-GOV-006 Work Packet](m2-gov-006-m2-exit-review-002.md)

A later Accepted DEC governs an actual conflict. No Blocking Design Question or
new DEC is currently identified.

## In scope

1. Start implementation from a clean latest-`origin/main` worktree after this
   Ready packet merges; record branch, base SHA, Node, pnpm, and initial status.
2. Add a task-local, in-memory setup-phase tracker to the Integration Harness.
   Set the phase immediately before each currently generic fallible setup
   boundary and snapshot it before teardown begins.
3. Preserve all existing message-derived specific setup classifications and
   their precedence. Use the phase only when the existing classifier would
   otherwise return `setup-failed`.
4. Emit only one fixed allowlisted category in the existing
   `setup=<category>` field. Never retain the source error, message, cause, or
   stack.
5. Add focused unit evidence for phase mapping, existing-category precedence,
   redaction, teardown independence, and compatibility with the existing
   concurrent diagnostic parser.
6. Synchronize the Integration Harness Current-truth, this Work Packet, and
   Roadmap.
7. After deterministic and ordinary gates pass, run the exact focused Worker
   Integration command sequentially at most three times. Every physical
   invocation consumes one slot; stop on the first red or missing exit status.
8. Record only the bounded setup/teardown result and task-owned aggregate
   residue evidence. A later phase-specific repair requires a separate Ready
   Work Item and Issue created by the Orchestrator after independent evidence
   review.

## Out of scope

- changing `worker-dispatcher.test.ts` or publishing any preserved M2-QUAL-003
  implementation delta;
- changing `global-setup.ts`, `run-concurrent-smoke.ts`,
  `process-identity.ts`, setup/teardown record grammar, capture size, cleanup,
  ownership, timeout, retry, sleep, signal, or process behavior;
- adding a failure-injection switch, reporter, persistent diagnostic artifact,
  raw-output sink, hash, dependency, package, or configuration;
- changing product, API, Fetcher Gateway, database, Worker, Queue, Web,
  Fetcher, Renderer, Schema, migration, Compose, CI, Accepted DEC, Acceptance
  Record, README, AGENTS, or another Work Packet;
- treating a setup phase as a root cause or fixing an attributed phase in this
  Work Item;
- completing Issue #147, M2-QUAL-003, M2-GOV-006, M2, or starting M3.

## Allowed and prohibited files

### Allowed files

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `packages/testing/src/concurrent-smoke.test.ts`, only for compatibility and
  redaction evidence using the existing parser
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-011-safe-focused-integration-setup-attribution-replay.md`
- `docs/implementation/roadmap.md`

### Prohibited files

- `packages/testing/src/integration/worker-dispatcher.test.ts`,
  `global-setup.ts`, `run-concurrent-smoke.ts`, and `process-identity.ts`;
- all `apps/**`, product packages, manifests, lockfiles, migrations, Schema,
  Drizzle metadata, Compose, CI, Decisions, Sessions, README, AGENTS, and
  Acceptance Records;
- every existing M2 Work Packet other than this new packet.

No generated or runtime file may be committed. Remove only state proven
task-owned. Pre-existing processes, containers, worktrees, volumes,
directories, and package stores are not cleanup targets.

## Contracts

### Safe setup-phase contract

The phase tracker is local to one `setup()` invocation and is not persisted.
The exact new fallback categories are:

- `harness-preflight-failed`
- `build-preparation-failed`
- `compose-operation-failed`
- `credential-setup-failed`
- `object-storage-provision-failed`
- `origin-allocation-failed`
- `api-launch-failed`
- `web-launch-failed`
- `ready-state-publication-failed`

The phase is set immediately before its real fallible boundary. Existing
specific classifications, including `process-identity-failed`,
`docker-unavailable`, `build-failed`, `compose-start-failed`,
`partial-compose-injected`, `port-resolution-failed`, `bucket-create-failed`,
`migration-failed`, `api-start-failed`, `web-start-failed`, and
`ownership-invalid`, retain precedence and exact spelling.

The existing output grammar remains unchanged:

```text
contentos smoke setup failed: setup=<safe-category> teardown=<clean|failed> ...
```

Unknown calls without a valid phase still return `setup-failed`. The classifier
never derives a phase from arbitrary exception text and never emits that text.
The phase means only “the current setup boundary when an otherwise generic
failure was caught.”

### Replay command and attempt bound

After all deterministic and ordinary gates pass, the only task-specific replay
command is:

```text
fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
```

Run it sequentially at most three times. Every physical invocation consumes one
slot. Stop on the first non-zero result; never rerun that failure to green. A
missing final exit status is Blocked and stops without replacement.

Before replay, confirm the ten M2-QUAL-010 concurrent/Harness injection
variables are unset and emit only `injection-env=unset`; if any is defined,
print names only and stop Blocked before the first attempt. Record aggregate
counts only for application processes belonging to this worktree, exact
`contentos-smoke-*` Compose projects/containers, coordinator temporary roots,
and this worktree's repository-local `.pnpm-store`. Require zero new task-owned
delta after every attempt. Do not output or persist PID, command, absolute path,
credential, port, or raw child output.

### Terminal outcomes

1. **Completed — Attributed `<category>`:** the first red has explicit exit
   `1`, exactly one of the nine new phase categories, `teardown=clean`, no
   second failure boundary, and zero task-owned residue. The diagnostic change
   may be published after independent review and green final-head CI. The
   Orchestrator creates a separate repair Issue only after review; no repair is
   made here.
2. **Completed — Not Reproduced:** all three attempts explicitly exit `0` with
   zero task-owned residue. Publish only `not reproduced`; M2-QUAL-003 remains
   Blocked pending its own final replay.
3. **Blocked:** generic/unclassified output, an existing unrelated setup
   category, teardown failure, conflicting/missing fields, unexpected signal,
   defined injection, missing exit status, task-owned residue, or any required
   deterministic/ordinary gate failure stops the Work Item. Do not broaden
   instrumentation or make a speculative repair in place.

No outcome publishes the preserved Worker delta or completes M2-QUAL-003,
M2-GOV-006, M2, or M3 entry.

## Acceptance criteria

1. Every currently generic setup boundary is assigned exactly one of the nine
   fixed phases immediately before its fallible operation.
2. Existing recognized categories retain precedence and exact output shape.
3. Arbitrary Error and non-Error values, including a representative input with
   private text, an absolute path, URL, or Secret-like value, emit only a fixed
   category; none of the input appears. This is one bounded redaction
   regression, not a generalized exception matrix.
4. The phase snapshot remains available while teardown runs and after clean
   teardown removes runtime state.
5. Teardown classification, cleanup behavior, ownership, process signals, and
   runtime record transport remain unchanged.
6. The existing concurrent parser accepts a new phase category through its
   existing safe setup-category path without parser or capture changes.
7. Focused unit tests cover all nine phase mappings, existing-specific
   precedence, the bounded sensitive-input regression, teardown independence,
   and parser compatibility.
8. Frozen install, workspace, root quality, full Integration, Browser,
   documentation, repository, Secret, diff, scope, artifact, and residue gates
   pass before replay.
9. The replay obeys the three-physical-invocation cap and first-red rule, and
   reaches exactly one terminal outcome without exceeding its evidence.
10. The final diff is limited to the six allowed files; no dependency,
    lockfile, Schema, migration, Compose, CI, production, or unrelated
    documentation change occurs.

## Required commands and evidence

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts packages/testing/src/concurrent-smoke.test.ts
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration
fnm exec --using=24.18.0 corepack pnpm test:browser
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
```

After these pass, run the exact replay command one attempt at a time under the
terminal contract. Final-head GitHub CI must pass before a Completed
implementation PR may merge.

## Security review

This Work Item handles no user content, credential, provider transmission, or
new network boundary. Categories come only from a static internal phase. It
does not retain source errors or add a new sink, hash, Secret path, or cleanup
authority. One representative redaction regression is sufficient; do not add
an exhaustive impossible-case matrix.

## Migration and compatibility review

No database, Schema, migration, API, Queue payload, dependency, configuration,
or compatibility change. `pnpm-lock.yaml` must remain unchanged. Rollback is a
focused Git revert of the diagnostic implementation and documentation.

## Observability

No product Log, Metric, Trace, Audit Event, or persistent artifact changes. The
only new evidence is one fixed setup category in the existing sanitized Harness
record.

## Documentation updates

- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- this Work Packet
- `docs/implementation/roadmap.md`

No README, AGENTS, DEC, Acceptance Record, API, Schema, or M3 documentation
changes.

## Definition of Ready

**PASS.** Independent Definition of Ready review completed against planning
base `6a9149be368a9b826c2c13b095ac2459362f2fde`:

- correctness and executability: `/root/m2_qual_011_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_011_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, and recorded runtime model `UNVERIFIED_RUNTIME_MODEL`. They
validated the nine fixed phases, existing-category precedence, six-file scope,
bounded tests and replay, mutually exclusive terminal outcomes, cleanup
ownership, and planning/Completed/Blocked publication sequencing. No Blocking
Design Question or new DEC is present.

## Definition of Done

The six-file implementation stays within this contract; deterministic and
ordinary gates pass; replay reaches one permitted terminal outcome; task-owned
residue is zero; independent implementation review finds no unresolved issue;
and documentation, final-head CI, and Git status match the claimed outcome.

For **Completed**, independent implementation review PASS permits the
Orchestrator to commit, push, and open a Draft PR containing the six-file
implementation. Green final-head CI and no unresolved finding or escalation are
then required before Ready status and squash merge.

For **Blocked**, the combined code branch is not published. After independent
evidence/scope review PASS, the Orchestrator may create a separate latest-main
branch, commit only this Work Packet and Roadmap, push, and open a Draft PR.
Green final-head publication CI and no record-accuracy, scope, or unrelated CI
finding are required before that two-document record may become Ready and
squash-merge. The Work Item remains Blocked; publication does not authorize a
repair.

## Git authority

After Definition of Ready passes, the Orchestrator may commit, push, and open a
Draft PR for the planning packet. Green final-head CI and no unresolved finding
or escalation are required before Ready status and squash merge. The
implementation Agent may modify only the six allowlisted files in a fresh
implementation worktree and must stop before Git publication or Issue mutation.

After independent implementation review, the Orchestrator may commit, push,
and create a Draft PR only for a permitted Completed outcome. All required
final-head CI must be green and no finding or escalation may remain before
Ready status and squash merge. For a Blocked outcome, only the separate
two-document Draft-PR path in Definition of Done is authorized. The implementer
cannot approve or merge its own work.
