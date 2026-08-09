# M2-QUAL-018 — Worker Observation Repair Publication and Final Replay

**Status:** Ready
**Issue:** [#204](https://github.com/JettxonHo/ContentOS/issues/204) (Open)
**Linked Issues:** [#196](https://github.com/JettxonHo/ContentOS/issues/196) and [#147](https://github.com/JettxonHo/ContentOS/issues/147) (Open)

This Work Item is the independently governed successor that may publish the
preserved M2-QUAL-003 Worker observation repair. It does not reinterpret the
historical M2-QUAL-016 Browser red or use M2-QUAL-017's Browser evidence as a
substitute for its own gates.

## Identification

- Task ID: `M2-QUAL-018`
- Milestone: M2 — Source and Workflow Foundation
- Type: Quality Test Repair Reconstruction and Verification
- Owner: Implementation Agent
- Reviewer: Independent Review Agents
- Executor Profile: `BACKEND_GENERAL_EXECUTOR`
- Logical Role: `IMPLEMENTER`
- Requested Custom Agent: `luna-worker`
- Configured Model: `gpt-5.6-luna`
- Reasoning: Max
- Actual Runtime Model: record when visible; otherwise `UNVERIFIED_RUNTIME_MODEL`
- Planning Thread: `/root`
- Planning Worktree: `/private/tmp/contentos-m2-qual-018-plan-wt`
- Planning Branch: `codex/m2-qual-018-worker-repair-plan`
- Planning Base/HEAD: `78bcac18ae4ca008fa25a00df1f1b5a7643f9aba`
- Planning Initial Status: clean
- Proposed Implementation Thread: assigned only after the Ready planning PR merges
- Risk Classification: bounded deterministic integration-test repair replay

## Goal

From fresh latest main, manually reconstruct the already reviewed local exact
Outbox-ID capture and three bounded Worker observation waits, then validate and
publish that repair through its own normal-permission focused, root,
Integration, Browser, and Concurrent gates. A successful merge completes
M2-QUAL-003 through this successor while preserving every historical Blocked
record.

## Context and authority

M2-QUAL-003 identified a test-observation race: a matching current Redis/BullMQ
Job is only the transport observation that triggers the next assertion. The
authoritative acknowledgement is the exact owning PostgreSQL Outbox row reaching
`dispatched`. The preserved repair captures `fixture.outboxId` in one local
binding and uses the existing bounded `waitFor` helper at the initial and two
repaired-Job observation points. It changes no production behavior, assertion,
timeout, retry, cleanup, or Queue contract.

M2-QUAL-016 reconstructed the same delta but stopped on a required Browser red;
its Worker diff remained unpublished. M2-QUAL-017 later completed a separate
three-slot Browser recurrence replay through PR #202. Its post-merge status-sync
PR #203 was stopped without rerun when final-head Integration failed `1/185` in
the expired-lease generation-N+1 Job-visibility `waitFor`. That failure is in
the same test file but outside this repair's one local binding and three
PostgreSQL Outbox-acknowledgement waits. It does not show that this repair would
fix PR #203 and is not a Worker root-cause conclusion. If the same failure
appears in QUAL018 full Integration, it is a non-target required-gate red:
immediately stop Blocked before Browser or Concurrent.

The fixed read-only reference is `/private/tmp/contentos-m2-qual-005-wt`, branch
`codex/m2-qual-003-worker-dispatcher-observation-final-v2`, HEAD
`eac0561ea5e020d7f1d712e0aefff100567fc78a`, expected exact-three dirty
(Roadmap, M2-QUAL-003 Packet, Worker test), no untracked files, and clean diff
check. This successor grants only read-only Git branch/HEAD/status/diff checks
and silent byte comparisons in that reference. Runtime, edits, cleanup,
checkout/reset, staging, commit, and every other mutation there remain
prohibited.

Issues #204, #196, and #147 remain Open through planning, implementation,
review, and CI. Only a successful exact-four merge may authorize the Orchestrator
to close all three. M2-GOV-006 remains Blocked and requires its own renewed Ready
process afterward. M2 remains In Progress; M3 remains Not Started.

## In scope

### Planning

1. Keep Issue #204 at exact parity with this Packet and linked to #196/#147.
2. Add this Packet and one Roadmap row only.
3. Obtain independent correctness/executability and governance/scope/security
   Definition of Ready reviews against the exact base, exact-two checkpoint, and
   live Issue.

### Implementation and replay

4. Start from fresh latest main only after the Ready planning PR merges with all
   required final-head CI green.
5. Verify the fixed reference identity and state, silently compare the fresh
   Worker test to the reference committed file, manually reconstruct exactly:
   - `const outboxId = fixture.outboxId;`;
   - the initial Job observation followed by the exact initial Outbox wait;
   - the first repaired Job observation followed by its exact Outbox wait;
   - the fairness repaired Job observation followed by its exact Outbox wait.
6. Preserve the existing 15-second `waitFor` bound and all existing final
   assertions. Add no helper, new assertion, sleep, timeout, retry, or production
   change.
7. Silently compare the result to the reference working-copy Worker file. Record
   only pass/fail; persist no diff, copy, hash, manifest, or raw comparison
   output.
8. Execute the exact ordered gates below with normal process permission from
   every governed command's first physical invocation and stop on first red.
9. On local success, synchronize the exact-four In Review candidate. On failure,
   freeze evidence and publish only a fresh-main exact-two Blocked record after
   independent review.

## Out of scope

- Copying, applying, cherry-picking, or publishing the preserved worktree or a
  stored version of its diff.
- Any production, API, Web, Domain, database, Schema, migration, dependency,
  lockfile, Compose, CI, Current-truth, Accepted DEC, Acceptance Record, README,
  or AGENTS change.
- Any timeout, retry, sleep, assertion, test-filter, parser, category, lifecycle,
  logging, process ownership, signal, or cleanup change.
- Any Browser test/config/runner change or using QUAL017's 3/3 evidence as a
  substitute for QUAL018's one required Browser gate.
- Opening child logs/streams or artifact contents; retaining or publishing raw
  child/Browser output, stack, runtime path, entry names, PID/PGID, command line,
  port, URL, credential, Secret, environment value, timestamp, or content hash.
- A replacement gate, rerun-to-green, fourth focused/Concurrent slot, or
  arbitrary subset/full-gate substitute.
- Rewriting or deleting historical M2-QUAL-003, M2-QUAL-016, or M2-QUAL-017
  evidence.
- Starting M2-GOV-006, completing M2, starting M3, or Git/GitHub mutation by
  implementation/review agents.

## Relevant decisions and documents

- DEC-245 and DEC-247 — deterministic behavior and layered testing.
- DEC-261 — executable failure-path acceptance evidence.
- DEC-287, DEC-288, DEC-291, and DEC-292 — bounded Work Items, PR scope,
  Definition of Ready/Done, and scope governance.
- [Test Strategy](../../quality/test-strategy.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Release Gates](../../quality/release-gates.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [M2-QUAL-003 Packet](m2-qual-003-worker-dispatcher-observation-stability.md)
- [M2-QUAL-016 Packet](m2-qual-016-worker-dispatcher-observation-repair-final-replay.md)
- [M2-QUAL-017 Packet](m2-qual-017-correct-tempdir-browser-recurrence-artifact-baseline-replay.md)

A later Accepted DEC governs an actual conflict. No new DEC is proposed.

## Allowed files and publication phases

### Planning — exact two

- `docs/implementation/work-packets/m2-qual-018-worker-observation-repair-publication-final-replay.md`
- `docs/implementation/roadmap.md`

### Successful implementation candidate — exact four

- `packages/testing/src/integration/worker-dispatcher.test.ts`
- `docs/implementation/work-packets/m2-qual-018-worker-observation-repair-publication-final-replay.md`
- `docs/implementation/work-packets/m2-qual-003-worker-dispatcher-observation-stability.md`
- `docs/implementation/roadmap.md`

At candidate time, the original M2-QUAL-003 Packet may only change its top-level
status to `In Review — successor repair replay passed; independent review,
final-head CI, and merge pending` and append one successor-evidence section.
Except for that status line, every historical line remains intact. It must not
say Completed before merge.

### Blocked publication — exact two

Only the new M2-QUAL-018 Packet and Roadmap from a fresh latest-main status
branch. The Worker test and original M2-QUAL-003 Packet must not publish.

### Post-merge completion sync — exact three

- the new M2-QUAL-018 Packet;
- the original M2-QUAL-003 Packet; and
- Roadmap.

Only this post-merge sync may mark both Work Items `Completed — Repair Verified`
and record Issue closure while preserving the original Packet's historical
Blocked evidence.

If a post-merge exact-three status-sync head has any required CI red, that head
must not merge and must not be rerun unchanged. Freeze and close it while
retaining the bounded red evidence. The already merged `Completed — Repair
Verified` terminal and closed Issues are not retroactively reversed. A later
fresh-main exact-three evidence-correction branch is allowed only when it
materially records the prior red, receives new independent exact-three review,
and passes its own three final-head CI jobs before merge. That recovery branch
runs or modifies no Worker code and changes no terminal predicate.

No generated or runtime artifact is commit-eligible. `node_modules` and ordinary
ignored build output are not scope changes; no repository-local `.pnpm-store`,
test results, Browser output, runtime log, hash, manifest, or comparison artifact
may be retained.

## Security and evidence contract

- The first governed Node call verifies exactly eleven fixed injection names are
  unset without retaining values.
- Task-owned residue covers worktree-matching app processes, exact smoke Compose
  projects/containers, run-unique Harness roots, and the repository-local
  `.pnpm-store`; durable evidence keeps counts/deltas only.
- The fixed Playwright output is observed with the already reviewed QUAL017
  platform-`tmpdir()` bounded `lstat`/direct-entry predicate. It is shared,
  non-owned, never manually cleaned, and never counted as task-owned residue.
- Ephemeral inspection of required top-level gate output is allowed only to
  establish final RC/test counts and existing sanitized classifications.
  Child logs/streams and artifact contents are not opened.
- Durable evidence may contain approved gate names/results, RC/test counts,
  existing sanitized fields, aggregate counts/deltas, and governance metadata.

The snapshot matrix is fixed: task-owned residue is checked after install,
after every focused, root, Integration, Browser, and Concurrent process gate,
and finally. Shared Playwright output is checked only at entry, post-install,
post-Browser, and final. Any required snapshot that is unsafe or indeterminate
is Blocked.

## Exact gate order and counts

Every fnm/Node/pnpm/Vitest/repository/Docker/process-enumeration/residue command
must use normal process permission from its first physical invocation. Pure
read-only Git identity and silent comparison commands are not runtime gates and
must not be used as sandbox capability probes. Any sandbox-first governed call,
red, signal, missing final status, defined injection, reference/scope
uncertainty, unsafe shared-output predicate, or task-owned residue is immediately
Blocked. Stop later runtime; no rerun-to-green.

1. Pure Git: fresh branch/base/clean/no-untracked/diff-check.
2. Before install or other runtime: the first normal-permission Node 24.18.0
   call verifies Node, eleven injections unset, task-owned entry identity sets,
   and the bounded config-derived shared-output state.
3. Verify pnpm 11.17.0; run frozen install and workspace check once; immediately
   require zero task-owned delta and safe shared-output state.
4. Verify fixed reference branch/HEAD/exact-three/no-untracked/diff-check; silent
   pre-edit comparison; manual reconstruction; silent post-edit comparison;
   preliminary Worker-only scope and no-untracked check.
5. Run the exact focused Worker command sequentially in three predetermined
   slots. Each must return `RC=0`, `1 file / 7 tests`, with post-slot task-owned
   delta zero. No fourth slot.
6. Run root `check` exactly once; expected current shape is `54 files / 578
tests` plus five application builds; then task-owned delta zero.
7. Run full Integration exactly once; expected current shape is `27 files / 185
tests`; then task-owned delta zero.
8. Run targeted Prettier, prerequisite `repository:check`, `git diff --check`,
   preliminary Worker-only scope, and no-untracked checks.
9. Run full Browser exactly once; expected `RC=0`, `16/16`; then task-owned delta
   zero and a determinate shared-output observation.
10. Run `fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent` in
    three predetermined sequential slots. Each successful slot requires explicit
    coordinator `RC=0`, two complete child successes, verified isolation/owned
    cleanup, and task-owned delta zero. Stop on first red; no fourth slot.
11. Write the authorized exact-four In Review evidence or exact-two Blocked
    evidence. Run final targeted Prettier, `repository:check`, diff/exact scope,
    no-untracked/artifact, task-owned residue, and shared-output checks.

## Outcome predicates

### Local In Review — successor repair replay passed

Requires reference identity/equivalence, every gate in the exact order/count at
explicit green status, every task-owned delta zero, shared-output evidence safe,
the exact-four candidate, and final static checks green. This local state is not
Completed and authorizes no Issue closure.

### Completed — Repair Verified

Available only after the local predicate, two new independent exact-four
implementation reviews PASS, all three final-head CI jobs green on the reviewed
head, and Orchestrator squash merge. The Orchestrator may then close Issue #204,
#196, and #147 and publish the independently reviewed exact-three completion
sync. M2-GOV-006 remains separately Blocked until renewed.

### Blocked

Any reference/equivalence/scope uncertainty, sandbox-first governed call,
defined injection, red/signal/missing gate result, unexpected test shape,
ambiguous Concurrent evidence, unsafe shared-output state, task-owned residue,
static failure, or unresolved review finding is Blocked. First-red stops every
later runtime gate. A Blocked outcome uses only the fresh-main exact-two
publication path, keeps all three Issues Open, and does not publish the Worker
repair or alter the original M2-QUAL-003 Packet.

## Acceptance Criteria

1. Issue #204, this Packet, and the 2/4/2/3 publication boundaries have exact
   parity and link #196/#147.
2. The fixed reference identity/state and both silent byte comparisons pass;
   the reconstructed Worker file contains exactly the local outbox-ID binding
   and three preserved wait conversions with no other change.
3. Every governed command is normal-permission-first; eleven injections are
   unset; task-owned residue is checked post-install, after every process gate,
   and final, while shared output is checked at entry, post-install,
   post-Browser, and final; every required snapshot satisfies its contract.
4. Focused Worker 3/3, root 1/1, Integration 1/1, Browser 1/1, and full
   Concurrent 3/3 complete in order with expected explicit green shapes and no
   replacement invocation.
5. Successful candidate scope is exact four; Blocked scope exact two; post-merge
   status scope exact three; no prohibited file or artifact appears.
6. The original M2-QUAL-003 historical evidence is preserved exactly except the
   authorized candidate status line and appended successor section.
7. Two independent implementation reviews and all final-head CI jobs pass
   before merge; Issues close only after merge.
8. No root-cause, alternate repair, timeout/retry/cleanup/product, M2-GOV-006,
   M2-completion, or M3-start claim is made.

## Definition of Ready

**PASS.** Independent review completed against planning base
`78bcac18ae4ca008fa25a00df1f1b5a7643f9aba`, this exact-two Packet/Roadmap
checkpoint, and live Issue #204 parity:

- `/root/m2_qual_014_dor_correctness` — correctness/executability: PASS;
- `/root/m2_qual_012_browser_setup_diagnosis` —
  governance/scope/security: PASS;
- Logical Role: `DEFINITION_OF_READY_REVIEWER`;
- Requested Model: `gpt-5.6-sol`;
- Requested Reasoning: High;
- Actual Runtime Model: `UNVERIFIED_RUNTIME_MODEL`.

All Required findings were corrected and narrowly re-reviewed. The PASS covers
the non-target PR #203 boundary, fixed eac reference and one-binding/three-wait
delta, 2/4/2/3 publication phases, normal-permission gate order/counts, fixed
snapshot matrix, post-merge status-sync red recovery, security disclosure,
Issue lifecycle, and Orchestrator authority. There is no Blocking Design
Question, unresolved finding, or new DEC.

Only the Orchestrator may commit/push/open
the exact-two planning PR, and squash merge it after all three final-head CI jobs
are green. Implementation starts only from the resulting fresh latest main.

## Definition of Done and authority

Done requires the Completed predicate, exact scope, complete evidence, two
independent implementation PASS reviews, three green final-head CI jobs, and
Orchestrator squash merge. Implementation/review agents may not stage, commit,
push, create/ready/merge PRs, mutate Issues, or approve themselves. A Blocked
record uses its separate exact-two publication authority and never publishes the
Worker repair.

## Documentation updates

- New M2-QUAL-018 Packet: planning, reconstruction, gate evidence, review, CI,
  merge, and final status.
- Roadmap: add and synchronize M2-QUAL-018.
- Original M2-QUAL-003 Packet: candidate and final successor evidence only on
  the successful path, preserving all historical Blocked evidence.

No Current-truth or DEC update is authorized.
