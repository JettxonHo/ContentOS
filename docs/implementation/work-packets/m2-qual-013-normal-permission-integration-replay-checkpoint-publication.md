# M2-QUAL-013 — Normal-Permission Integration Replay and Checkpoint Publication

**Status:** Ready  
**Issue:** [#184](https://github.com/JettxonHo/ContentOS/issues/184) (Open)  
**Related historical Issue:** [#175](https://github.com/JettxonHo/ContentOS/issues/175) (Open)

This Work Item is a new bounded replay and publication plan. It does not alter
the historical M2-QUAL-011 Work Packet or reinterpret its Blocked result.

## Identification

- Task ID: `M2-QUAL-013`
- Title: Normal-Permission Integration Replay and Checkpoint Publication
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Harness Diagnostic Replay and Evidence Publication
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Config File: `~/.codex/agents/luna-worker.toml`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL` when runtime identity is not
  visible; no runtime model is inferred from configuration
- Model Verification Status: `CONFIG_VERIFIED / UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-013-plan-wt`
- Planning Branch: `codex/m2-qual-013-normal-permission-replay-plan`
- Planning Base/HEAD: `cc84dc97ae7d0ef055d783b4afbcb396e69f0eff`
- Planning Initial Status: clean
- Proposed Implementation Thread: `/root/m2_qual_013_implementation`
- Proposed Implementation Branch: `codex/m2-qual-013-normal-permission-replay-impl`
- Proposed Implementation Base: the exact latest `origin/main` SHA after this
  planning packet is published; record it before any implementation edit or
  runtime command
- Preserved Reference Worktree:
  `/private/tmp/contentos-m2-qual-011-final-impl-wt` (read-only factual
  context; do not copy or apply its overall six-file diff)
- Dependencies: M2-QUAL-011 final Blocked evidence; M2-QUAL-012 Completed — Not
  Reproduced through PR #180 and status synchronization through PR #181
- Risk Classification: bounded Integration Harness replay, diff-equivalence,
  and publication evidence
- Issue lifecycle: Issue #184 and Issue #175 remain Open during planning. No
  Issue is created, closed, or otherwise mutated by the implementer.

## Goal

From a clean implementation worktree based on the latest `main`, manually
rebuild only the reviewed four-file M2-QUAL-011 implementation checkpoint under
normal process permissions, verify its behavior and non-persistent,
non-hash diff-equivalence to the preserved reference, and run the required
Integration-to-Worker replay in its fixed order. Publish exactly the permitted
six-file Completed checkpoint, or publish only the two-document Blocked
evidence path. This Work Item attributes a bounded evidence boundary; it does
not diagnose or repair a root cause.

## Context and authority

The final M2-QUAL-011 implementation checkpoint is preserved in
`/private/tmp/contentos-m2-qual-011-final-impl-wt` at implementation commit
`41abc3e9e495120472aabfd1532974c5f200b536`. Its required full Integration gate
returned a normal-permission `RC=1` with the primary sanitized record
`setup=api-launch-failed teardown=clean`; first-red stopping prevented Browser
and Worker replay. Its six-file dirty checkpoint remains unpublished. The
historical packet and Roadmap row retain that **Blocked — Integration setup gate
failure** fact and must not be rewritten by this Work Item.

M2-QUAL-012 is **Completed — Not Reproduced** through PR #180 (squash
`62a246a01658f0c5c7e1a165b01056df4a301c1d`) and status PR #181. Its Browser
setup-record transport is available for the one ordinary Browser gate below;
the historical M2-QUAL-011 Browser failure is not replayed or reinterpreted.

The preserved reference is a source of reviewed facts only. The future
implementation starts from a fresh latest-main worktree and manually rebuilds
the four-file checkpoint. It must not apply, copy, cherry-pick, or otherwise
publish the preserved overall six-file diff. The equivalence check is an
ephemeral comparison only: it writes no repository or persistent diagnostic
artifact and computes no hash.

M2-QUAL-003 and M2-GOV-006 remain **Blocked**; M2 remains **In Progress**; M3
remains **Not Started**. No new DEC is required or proposed.

## In scope

### Planning turn

1. Add this Work Packet with the complete Work Item contract and the bounded
   replay/publication rules below.
2. Add one new `M2-QUAL-013` **Ready** row to
   `docs/implementation/roadmap.md`.
3. Keep the historical M2-QUAL-011 Work Packet and its Roadmap row unchanged.

### Future implementation and replay

4. Start a fresh implementation worktree from the exact latest `origin/main`
   after this packet is published. Before any edit, record the exact base SHA
   and initial clean status. After those read-only records, make the Node.js
   and pnpm version commands the first normal-permission preflight commands.
   Record all remaining preflight evidence before runtime gates.
5. Manually reconstruct only these four preserved checkpoint files, using the
   reference worktree as read-only factual context:

   - `packages/testing/src/integration/harness.ts`
   - `packages/testing/src/harness-cleanup.test.ts`
   - `packages/testing/src/concurrent-smoke.test.ts`
   - `docs/quality/integration-smoke-harness.md`

   The focused test must replace the old Promise-only teardown-independence
   unit with real shared-state teardown evidence; concurrent coverage remains
   parser compatibility and bounded redaction only.

6. Run one non-persistent, non-hash diff-equivalence comparison for those four
   files against the preserved checkpoint. The comparison may use an
   ephemeral process or temporary location outside the repository, but no
   comparison file, hash, or diagnostic artifact may survive the check.
7. Run the normal-permission gates and the exact Worker replay in the required
   order, with the first-red and residue rules defined below.
8. For the **runtime diagnostic payload**, record only fixed setup/teardown
   fields, terminal outcome, gate status, and aggregate task-owned residue
   deltas. Never retain raw child output, a PID, absolute path, credential,
   port, or persistent runtime artifact in that payload. The durable Work
   Packet/evidence must also record the base and clean status, Node/pnpm,
   frozen install, workspace, injection, equivalence, and scope results, exact
   commands and exit results, and independent review and CI metadata; these
   records remain sanitized and contain none of the prohibited runtime fields.

## Out of scope

- Editing, copying, applying, or publishing the old M2-QUAL-011 Work Packet or
  its preserved six-file implementation diff.
- Rebuilding `worker-dispatcher.test.ts`, any M2-QUAL-003 delta, or any file
  outside the four-file checkpoint plus the new packet and Roadmap.
- A whole-diff copy, patch application, cherry-pick, or equivalent bulk
  transfer from `/private/tmp/contentos-m2-qual-011-final-impl-wt`.
- Any persistent or hash-based equivalence artifact; SHA-256 or another new
  hash is not introduced.
- Adding a new setup category, an exhaustive error matrix, a new injection,
  reporter, parser, grammar, ownership signal, or diagnostic sink.
- Rerunning a red gate to obtain green, repairing a root cause, changing
  cleanup, timeout, retry, sleep, signal, process lifecycle, capture,
  ownership, or setup/teardown grammar behavior.
- Any dependency, lockfile, configuration, Schema, migration, database,
  Compose, CI, API, Queue, Product, Web, Worker, Fetcher, Renderer, Agent,
  M3, or deployment change.
- Browser or Worker rerun after its terminal slot is consumed; a full
  Concurrent substitute; or an arbitrary test filter.
- Closing or creating Issues, committing, pushing, opening/merging a PR,
  changing Roadmap status beyond the bounded new M2-QUAL-013 row, or
  self-approval by the implementer.
- Any Git publication, GitHub, runtime, or integration/browser command in this
  planning turn. Read-only `git diff`/status inspection is limited to the
  required static scope check; planning verification otherwise uses only
  Prettier and repository checks.

## Relevant decisions and documents

### Relevant accepted decisions

- DEC-245 and DEC-247 — deterministic behavior and layered testing.
- DEC-261 — required failure paths are executable acceptance evidence.
- DEC-287, DEC-288, DEC-291, and DEC-292 — bounded Work Items, review,
  Definition of Ready/Done, and scope governance.

No new DEC is proposed. A later Accepted DEC governs an actual conflict.

### Relevant Current-truth and governance documents

- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Release Gates](../../quality/release-gates.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-QUAL-011 Work Packet](m2-qual-011-safe-focused-integration-setup-attribution-replay.md)
- [M2-QUAL-012 Work Packet](m2-qual-012-safe-browser-setup-record-transport-replay.md)

## Allowed and prohibited files

### Planning write scope

Only these two files may be changed in this planning worktree:

- `docs/implementation/work-packets/m2-qual-013-normal-permission-integration-replay-checkpoint-publication.md`
- `docs/implementation/roadmap.md`

### Completed implementation allowlist — exact six files

An independently reviewed **Completed** implementation may contain exactly
these six files and no others:

- `packages/testing/src/integration/harness.ts`
- `packages/testing/src/harness-cleanup.test.ts`
- `packages/testing/src/concurrent-smoke.test.ts`
- `docs/quality/integration-smoke-harness.md`
- `docs/implementation/work-packets/m2-qual-013-normal-permission-integration-replay-checkpoint-publication.md`
- `docs/implementation/roadmap.md`

The old M2-QUAL-011 Work Packet is not in this six-file boundary and remains
historical. A **Blocked** publication is limited to the new Work Packet and
Roadmap from a fresh latest-main branch.

### Prohibited modules and files

All other source, tests, applications, packages, manifests, lockfiles,
migrations, Schema, Compose, CI, Decisions, Sessions, Acceptance Records,
README, AGENTS, old Work Packets, generated output, and runtime state are
prohibited. The preserved reference worktree is read-only.

### Generated files policy

No generated file, build output, coverage output, temporary diagnostic record,
comparison file, or hash may be committed or retained. Existing generators
remain unchanged; no regeneration is part of this planning turn.

## Contracts

### Setup-phase and error contract

The four-file checkpoint preserves the nine fixed fallback phase categories:

- `harness-preflight-failed`
- `build-preparation-failed`
- `compose-operation-failed`
- `credential-setup-failed`
- `object-storage-provision-failed`
- `origin-allocation-failed`
- `api-launch-failed`
- `web-launch-failed`
- `ready-state-publication-failed`

Existing message-derived categories retain exact precedence and spelling:
`process-identity-failed`, `docker-unavailable`, `build-failed`,
`compose-start-failed`, `partial-compose-injected`, `port-resolution-failed`,
`bucket-create-failed`, `migration-failed`, `api-start-failed`,
`web-start-failed`, and `ownership-invalid`. A generic failure without a valid
phase remains `setup-failed`. No new category is introduced.

The existing sanitized grammar remains:

```text
contentos smoke setup failed: setup=<safe-category> teardown=<clean|failed> ...
```

Arbitrary Error or non-Error content, including private text, URLs, absolute
paths, credentials, PIDs, and ports, never becomes a category and never
appears in a record.

### Teardown-independence contract

The production helper and its real setup catch retain this strict order:

```text
snapshot supplied phase → await teardown exactly once → classify setup error
```

The clean focused path must call the same production helper, clear shared test
runtime/state during teardown, prove one snapshot and one teardown in that
order, and retain the pre-teardown phase in the exact `teardown=clean` record.
The structured failure path must clear shared state before throwing the
canonical `HarnessCleanupError`, and retain the phase plus exact cleanup,
`physical`, and `capsule` fields. It must not preserve arbitrary teardown text.
Cleanup behavior, deadlines, retries, signals, process ownership, and output
grammar remain unchanged.

### Manual reconstruction and equivalence contract

The implementation agent must inspect the four reference files and manually
recreate the reviewed checkpoint on fresh latest-main. The comparison is
limited to those four files and is non-persistent and non-hash. It must prove
the intended checkpoint is equivalent without writing a manifest, hash, diff
artifact, or other durable evidence. Any additional changed file is a scope
failure and blocks publication.

### Preflight and aggregate-residue contract

Before any runtime gate, all ten M2-QUAL-010 Harness/concurrent injection
variables must be unset and the evidence may report only
`injection-env=unset` (or names of defined variables). The exact variables are:

- `CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE`
- `CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY`
- `CONTENTOS_SMOKE_INJECT_FAILURE`
- `CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE`
- `CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE`
- `CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE`
- `CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE`
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE`

The ordinary Browser gate also requires
`CONTENTOS_BROWSER_INJECT_FAILURE` to be unset; it is not a replay injection.
An active injection stops the task before the affected gate.

Take an entry aggregate snapshot and a post-gate aggregate snapshot for only
task-owned application processes, exact `contentos-smoke-*` Compose
projects/containers, Harness temporary roots, Browser task artifacts, and this
worktree's repository-local `.pnpm-store`. Pre-existing state is retained and
is never a cleanup target. Every gate requires a zero task-owned delta; an
unproven cleanup, missing status, or non-zero delta is Blocked.

### Required gate and replay order

Every spawned gate runs directly with normal process permissions. Do not run a
sandbox attempt first and do not reinterpret a normal-permission result as a
sandbox artifact.

1. **Preflight:** before edits, record the exact base SHA and initial clean
   status. The first normal-permission preflight commands are Node `24.18.0`
   and pnpm `11.17.0` version checks; then verify frozen install, workspace
   resolution, ten injection variables unset, entry aggregate, manual
   four-file reconstruction, non-persistent non-hash equivalence, and the
   allowlist diff after reconstruction.
2. **Full Integration exactly once:**
   `fnm exec --using=24.18.0 corepack pnpm test:integration`.
3. If the prerequisite normal-permission Integration runtime gate is red,
   missing a final status, or leaves any task-owned residue, record **Blocked**
   immediately and do not run focused tests, root `check`, the prerequisite
   `repository:check`, Browser, or Worker runtime gates. After the Blocked
   outcome is written, the final static targeted Prettier,
   `repository:check`, diff, and scope revalidation remains mandatory for the
   two-document publication path.
4. If Integration is green, run focused tests for exactly the two files
   `packages/testing/src/harness-cleanup.test.ts` and
   `packages/testing/src/concurrent-smoke.test.ts`:

   ```text
   fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts packages/testing/src/concurrent-smoke.test.ts
   ```

5. Run the root `check` with normal process permissions.
6. Run the prerequisite `repository:check` with normal process permissions
   before Browser (the first of the two required repository checks). It already
   includes the documentation and Secret checks; do not repeat `check:docs` or
   `check:secrets`.
7. Run `git diff --check` and the exact allowlist/scope check. Any file beyond
   the permitted boundary blocks the task. A focused, root, repository, or
   diff/scope failure, missing status, or non-zero residue also records
   **Blocked** immediately and prevents Browser and Worker entry.
8. Run exactly one ordinary, non-injected Browser gate with normal process
   permissions:
   `fnm exec --using=24.18.0 corepack pnpm test:browser`.
9. Only after Browser is green and its aggregate delta is zero, run the exact
   Worker command sequentially at most three physical times. Each invocation
   consumes a slot; stop on the first red or missing final status and never
   rerun it to green:

   ```text
   fnm exec --using=24.18.0 corepack pnpm exec vitest run --config vitest.integration.config.ts packages/testing/src/integration/worker-dispatcher.test.ts
   ```

Record an aggregate delta after every gate and a final aggregate snapshot after
the replay. No later gate repairs an earlier first red.

### Terminal outcomes

The replay has exactly one terminal outcome:

The eligible-target rule below has precedence over the generic Worker-red
Blocked rule: a qualifying first target is Completed — Attributed, while every
other Worker result is classified as Blocked unless all three attempts are
explicit category-free `RC=0` passes.

1. **Completed — Attributed `<category>`:** after every prerequisite gate is
   green, each Worker slot before the first eligible target must explicitly
   exit `0`, contain no setup category, and have a zero task-owned residue
   delta. The first eligible target is a Worker attempt in slot 1, 2, or 3
   that exits explicitly with `1`, contains exactly one of the nine fixed phase
   categories, has `teardown=clean`, has no competing or second failure
   boundary, and has a zero task-owned residue delta. Stop immediately without
   another or further Worker invocation. This is an evidence boundary, not a
   root-cause or repair claim.
2. **Completed — Not Reproduced:** all three Worker attempts explicitly exit
   `0`, each is category-free, each has zero task-owned residue delta, and no
   category is attributed. This does not prove non-recurrence and does not
   complete M2-QUAL-003.
3. **Blocked:** any preflight failure; the required normal-permission
   Integration or a later **prerequisite** gate is red, missing, signaled,
   generic, malformed, conflicting, non-target, or teardown-failed; any
   Worker slot that is not an explicit `RC=0` category-free zero-delta pass
   before an eligible target; any **other** Worker red/missing/malformed/
   non-target/teardown/conflict/signal result; any defined injection; any
   task-owned residue; or any unproven scope/equivalence result. A Browser
   failure prevents Worker entry. No rerun-to-green, new category, root repair,
   or expanded evidence is permitted.

All outcomes keep the historical M2-QUAL-011 packet **Blocked**, M2-QUAL-003
and M2-GOV-006 **Blocked**, M2 **In Progress**, and M3 **Not Started**. Only the
Orchestrator may create a separate root-diagnostic Work Item after independent
evidence review and a new Definition-of-Ready review.

### Publication contract

The DOR PASS above makes this packet **Ready**. For **Completed — Attributed**
or **Completed — Not Reproduced**, an
independent implementation correctness review and independent scope review
must PASS. The Orchestrator may then create a Draft PR containing exactly the
six allowlisted files; final-head CI must be green with no unresolved finding
before Ready status and squash merge. After that merge, the Orchestrator may
close Issues #184 and #175; the historical M2-QUAL-011 Work Packet remains
Blocked. The M2-QUAL-013 Roadmap row records the selected Completed terminal
outcome; the historical M2-QUAL-011 Roadmap row remains unchanged.

For **Blocked**, independent evidence and scope reviews must PASS. The
Orchestrator may then create a fresh latest-main Draft PR containing only this
new Work Packet and the Roadmap. Green publication CI and no unresolved
record/scope finding are required before Ready status and squash merge. Both
Issues #184 and #175 stay Open, and the M2-QUAL-013 Roadmap row records the
Blocked terminal outcome. Any later root diagnostic is a separate
Orchestrator-created Issue and Ready Work Item; this packet grants no repair
authority.

## Acceptance criteria

1. Planning changes contain exactly the new Work Packet and one new Ready
   Roadmap row; the old M2-QUAL-011 Work Packet and Roadmap row are unchanged.
2. The future implementation starts from fresh latest-main and manually
   reconstructs exactly the four checkpoint files; no whole six-file diff is
   copied or applied.
3. The non-persistent, non-hash four-file equivalence check completes without
   retaining an artifact, hash, or raw output.
4. The nine fixed phase categories, existing precedence, sanitized grammar,
   and real teardown-independence evidence remain as contracted, with no new
   category or cleanup/timeout/retry/signal/ownership/parser change.
5. Preflight records Node/pnpm, frozen install, workspace, ten injection
   variables, entry aggregate, and clean scope before any gate; all spawned
   gates use normal process permissions.
6. Full Integration runs exactly once first; any red, missing status, or
   residue stops the sequence before focused, root, repository, Browser, and
   Worker gates.
7. If Integration is green, focused two-file tests, root `check`, the
   prerequisite `repository:check` before Browser, static diff/scope, and one
   ordinary Browser gate run in the exact order with zero task-owned aggregate
   deltas. After the final outcome is written into the Packet and Roadmap, a
   second `repository:check` is required as final post-outcome revalidation.
8. Worker runs only after all prerequisite gates are green, at most three
   sequential physical times, and obeys the explicit prior-`RC=0`/category-free
   slot rule, eligible-target precedence, and first-red/missing-status rule.
9. The recorded terminal outcome is exactly one permitted Attributed,
   Not-Reproduced, or Blocked result and makes no root-cause, repair, M2, or M3
   claim.
10. A Completed publication diff is exactly six files; a Blocked publication
    diff is exactly the new Work Packet and Roadmap. Issues and Git authority
    follow the publication contract.

## Required tests and evidence

### Planning turn (the only checks permitted now)

- Targeted static Prettier check:

  ```text
  fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-qual-013-normal-permission-integration-replay-checkpoint-publication.md docs/implementation/roadmap.md
  ```

- Planning static validation runs `corepack pnpm repository:check` only; do not
  duplicate `check:docs`/`check:secrets`. Future implementation evidence has
  the distinct prerequisite and final post-outcome checks described below.
- `git diff --check`.
- Exact-two-file scope check showing only the new Work Packet and Roadmap.

No runtime, integration, Browser, Worker, Git publication, or GitHub command is
run in this planning turn.

### Future implementation

- Static: frozen install, workspace check, Prettier/diff/scope, one prerequisite
  `repository:check` before Browser, and one final post-outcome
  `repository:check` after the Packet and Roadmap update. The two checks are
  distinct; neither is replaced by `check:docs` or `check:secrets`.
- Focused unit: exactly the Harness cleanup and concurrent smoke test files.
- Root quality: the normal-permission `check`.
- Integration: one complete `test:integration` invocation first.
- Browser: one ordinary `test:browser` invocation after all preceding gates.
- Worker replay: the exact `worker-dispatcher.test.ts` command, sequentially at
  most three physical times.
- Security/residue: injection preflight, sanitized records, entry/post-gate
  aggregate snapshots, and zero task-owned delta.

After the final terminal outcome is written into the Work Packet and Roadmap,
run the second, final post-outcome `repository:check` together with the
targeted Prettier command above, `git diff --check`, and the exact
allowlist/scope check. Root `check` is a separate prerequisite gate and never
substitutes for the targeted Packet and Roadmap Prettier check. If any final
post-outcome Prettier, `repository:check`, diff, or scope revalidation fails,
Completed publication is prohibited and the evidence must enter the Blocked
publication path; the two-document Blocked publication still requires this
final static revalidation to pass before it may be published.

## Security review

This Work Item handles no user content, credential, provider transmission, or
new network boundary. It adds no Secret, raw-output sink, hash, persistent
artifact, or cleanup authority. Existing Harness and Browser allowlists remain
the only diagnostic transport. Aggregate evidence excludes PIDs, paths,
credentials, ports, and child output; pre-existing processes, containers,
temporary roots, and stores are not cleanup targets.

## Migration and compatibility review

There is no database, Schema, migration, API, Queue payload, Artifact Version,
Agent Spec, dependency, lockfile, configuration, Compose, or compatibility
change. No backfill or migration sequencing is required. A Completed rollback
is a focused six-file revert; a Blocked publication rollback is a two-document
revert. The old M2-QUAL-011 packet remains untouched in either path.

## Observability

No product Log, Metric, Trace, Audit Event, or persistent runtime artifact is
added. The runtime diagnostic payload remains limited to the existing fixed
setup/teardown record, gate status, terminal outcome, and aggregate task-owned
delta. The durable Work Packet/evidence records the approved base/clean,
Node/pnpm, frozen/workspace, injection, equivalence, scope, commands/results,
independent review, and CI metadata. No raw child output, PID, path,
credential, port, or new error matrix is introduced.

## Documentation updates

### Planning change

- This Work Packet.
- `docs/implementation/roadmap.md` (one new `M2-QUAL-013` Ready row).

### Future Completed implementation

- `docs/quality/integration-smoke-harness.md`.
- This Work Packet.
- `docs/implementation/roadmap.md`.

No old M2-QUAL-011 packet, README, AGENTS, DEC, Acceptance Record, API, Schema,
M3, or unrelated document changes are allowed.

## Definition of Ready

**PASS.** Independent Definition-of-Ready reviews completed against the exact
planning base `cc84dc97ae7d0ef055d783b4afbcb396e69f0eff` plus the exact two-file
working-tree/checkpoint diff:

- correctness and executability: `/root/m2_qual_013_dor_correctness`;
- governance, scope, and security: `/root/m2_qual_013_dor_governance`.

Both reviewers used logical role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` / High, and recorded `UNVERIFIED_RUNTIME_MODEL`. They verified
the fresh-main manual reconstruction rule, exact four-file checkpoint, exact
six-file Completed versus two-file Blocked publication boundaries, normal
permission gate order, ten-variable preflight, aggregate ownership, terminal
outcomes, Issue lifecycle, and absence of a Blocking Design Question or new
DEC. Findings are closed. DOR PASS permits the Orchestrator to commit and
publish under the Git authority below; no pre-DOR commit or publication is
authorized.

## Definition of Done and Git authority

The Work Item is not Done until its selected terminal evidence, exact scope,
residue snapshots, independent review, documentation, and publication CI meet
the applicable path. A gate failure or unsafe evidence keeps it Blocked and
does not authorize repair.

The implementer has no Git or GitHub publication authority and cannot approve,
merge, close an Issue, or self-approve. The Orchestrator alone may commit,
push, open a Draft PR, mark it Ready, squash-merge, and perform the Issue
actions allowed by the terminal outcome.

This planning turn authorizes no commit, push, Draft PR, GitHub operation,
runtime command, or test execution beyond the four static checks named above.
Read-only Git diff/status inspection is allowed only to evidence the exact
two-file planning scope. After DOR PASS and publication, the implementer may
modify only the six allowlisted files in a fresh latest-main worktree and must
stop before any Git or Issue operation. A later root diagnostic requires
independent evidence and a separate Ready Work Item; it cannot be hidden in
this replay.
