# M2-QUAL-033 — Build-Lock Success-Path Test Timeout Stabilization and QUAL032 Publication Recovery

**Status:** In Review — Exact-three evidence/reviews/static PASS; publication pending

## Identification

- Task ID: `M2-QUAL-033`; milestone M2 — Source and Workflow Foundation;
  Work Item type: Quality / bounded test stabilization and publication recovery.
- Owner: `/root/m2_qual_030_planning`, logical role `PLANNING_AGENT`, requested
  `luna-worker`, configured `gpt-5.6-luna` Max, actual
  `UNVERIFIED_RUNTIME_MODEL`.
- Planning worktree: `/private/tmp/contentos-m2-qual-033-plan-wt`; branch
  `codex/m2-qual-033-build-lock-test-stability-plan`; base/HEAD
  `9188f9bca2bdb37cd964590ec8642d275867706b`.
- Implementation handoff: same thread `/root/m2_qual_030_planning`, role
  `IMPLEMENTER`, requested `luna-worker`, configured `gpt-5.6-luna` Max, actual
  `UNVERIFIED_RUNTIME_MODEL`; same worktree and branch as above.
- Planning shape is exact two: this Packet and the Roadmap row. The eventual
  successful implementation shape is exact three: Packet, Roadmap, and the
  one allowed test file. A local implementation red freezes its actual shape;
  only then may a fresh Blocked exact-two publication candidate be prepared.
- Issue #250 is Open, titled `M2-QUAL-033 — Build-Lock Success-Path Test Timeout
Stabilization and QUAL032 Publication Recovery`, and links #248 and #229.
  No Issue, Git, GitHub, commit, or runtime mutation is authorized by planning.
- Relevant DEC: none; no Blocking Design Question. A later Accepted DEC governs
  a real conflict.

## Context and PR249 evidence

QUAL032's fresh exact-two publication PR #249 (`docs: record reproduced
M2-QUAL-032 replay`) is CLOSED and unmerged. It used base `9188f9b...`, head
`334a5c2...`, and run `31494958813`; the Docker-independent quality job failed
while Integration and Browser jobs succeeded. The quality run reached 53 passed
files and one failed file (`54` total), with `577` passed tests and one failed
test (`578` total). The failure was in the combined
`harness-cleanup.test.ts` title `reclaims malformed and dead-owner locks but
preserves a live lock`: the malformed-lock success `acquireBuildLock` at line
202 timed out, so the subsequent dead-owner and live-lock assertions were not
executed. No rerun, replacement head, inferred cause, or code publication
followed. QUAL032's bounded RC20 attribution and publication review remain
historical evidence; this Work Item does not reopen or pre-fix replay it.

## Goal and minimum correction

Stabilize only the two success-path lock-reclamation calls that use the shared
build lock during the deterministic test. Change their `timeoutMs: 100` values
to `timeoutMs: 1_000` in `packages/testing/src/harness-cleanup.test.ts`:

- the malformed-lock reclamation call; and
- the dead-owner-lock reclamation call.

The production `acquireBuildLock` default `timeoutMs: 300_000`, polling and
malformed grace defaults, live-lock negative assertion `timeoutMs: 20`, and
write-failure negative assertion `timeoutMs: 20` remain unchanged.

## In scope

- One two-line test-only timeout correction, with no new case, helper, probe,
  cleanup, assertion, fixture, dependency, or behavior.
- Gate order is pure-Git identity/status, then the first governed
  non-Git/process-spawning normal-permission Node 24 and pnpm
  version/install/workspace sequence, the two-literal `apply_patch`, targeted
  static/scope checks, and named/full/root tests.
- Required shapes are named `1 passed / 13 skipped`, full test-file `14`, and
  root `54 files / 578 tests` plus five application builds.
- A bounded implementation Completion Report, then exact-three review evidence
  and a separate fresh Blocked exact-two Packet/Roadmap candidate if local
  implementation is red.

## Out of scope

- Any production `harness.ts` or `acquireBuildLock` change; default `300_000`,
  poll/grace behavior, and all negative `20ms` assertions stay unchanged.
- Integration, Browser, observer, Worker, Concurrent, Docker, or publication
  runtime commands in the local implementation epoch.
- New fixtures, probes, cases, helpers, cleanup, hashes/SHA, dependency or
  lockfile changes, matrix/rubric expansion, or CI configuration.
- Reopening or rerunning PR249/run `31494958813`, QUAL032 implementation
  evidence, or its publication reviews.
- No Product, API, Schema, migration, security boundary, Current-truth, DEC,
  or M2 exit-review mutation is in scope. The planner, implementer, and
  reviewers have no Issue, Git, or GitHub mutation authority; the sole bounded
  exception is Orchestrator-only terminal publication, squash merge, and
  permitted Issue closures after the required evidence chain.

## Relevant documents and authority

- `AGENTS.md`, `docs/implementation/work-item-template.md`,
  `docs/implementation/agent-collaboration-workflow.md`, and the Roadmap.
- `packages/testing/src/harness-cleanup.test.ts` and
  `packages/testing/src/integration/harness.ts` (read-only planning reference).
- QUAL032 Packet/Roadmap candidate and its frozen exact4/Completion evidence;
  PR249 and run `31494958813` are the publication-gate history.
- Issue #250 body is the parity source; planning does not edit it.

## File boundary

### Planning exact two

- `docs/implementation/work-packets/m2-qual-033-build-lock-success-path-test-timeout-stabilization-qual032-publication-recovery.md`
- `docs/implementation/roadmap.md`

### Eventual implementation exact three

- `packages/testing/src/harness-cleanup.test.ts` (the two timeout literals only)
- This Packet
- `docs/implementation/roadmap.md`

Observer, Worker, production harness, manifests, lockfiles, generated output,
CI, and all other code remain zero diff. No generated file is commit-eligible.

## Contracts, security, migration, and observability

- Domain/API/Queue/Event/Schema/Migration contracts: none.
- Error behavior and `acquireBuildLock` production semantics are unchanged;
  only deterministic test success-path waiting is extended.
- No user content, credential, network, storage, authentication,
  authorization, migration, compatibility, or production configuration impact.
- Governance evidence may record source/worktree paths, approved top-level
  command names, exit codes, aggregate counts, test titles, and timeout values.
  Raw runtime temporary or lock paths, lock payloads, PIDs, environment dumps,
  credentials, and other raw runtime evidence are prohibited.

## Governed gate order

1. Pure-Git identity and status are checked first; no process-spawning command
   precedes this boundary.
2. Run the first governed non-Git/process-spawning normal-permission Node 24
   and pnpm version, frozen install, and workspace sequence once.
3. Apply exactly the two timeout-literal edits with `apply_patch`, then inspect
   the exact test diff; no production helper diff is allowed.
4. Run targeted code Prettier, repository, and diff checks once, then the exact
   three-path scope predicate once.
5. Run the named test once, requiring `1 passed / 13 skipped`; run the full
   `harness-cleanup.test.ts` once, requiring `14` tests; run root `check` once,
   requiring `54 files / 578 tests` and five builds.
6. Do not run local Integration, Browser, observer, or Worker commands. Any
   first red freezes actual shape and forbids rerun, replacement, or diagnosis.
7. A green local implementation reaches exact three and proceeds to independent
   review. A local red permits only a fresh Blocked exact-two Packet/Roadmap
   candidate. A first eligible publication CI red or missing result transfers
   recovery to **M2-QUAL-034** without rerun.

## Implementation epoch and exact commands

The implementation epoch begins only after an explicit same-worktree handoff.
The first governed identity/scope commands are:

```text
git status --short --untracked-files=all
git branch --show-current
```

The first governed non-Git/process-spawning command is the normal-permission
Node 24 preflight below; no sandbox probe, permission probe, or alternate
preflight is allowed.

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Then use `apply_patch` for only the two test literals, followed by these exact
commands in order:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --check packages/testing/src/harness-cleanup.test.ts
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
```

The exact three-path scope predicate must allow only the Packet, Roadmap, and
`packages/testing/src/harness-cleanup.test.ts`:

```text
changed_paths=$(git status --short --untracked-files=all | sed -E 's/^.. //' | sort)
expected_paths=$(printf '%s\n' \
  'docs/implementation/roadmap.md' \
  'docs/implementation/work-packets/m2-qual-033-build-lock-success-path-test-timeout-stabilization-qual032-publication-recovery.md' \
  'packages/testing/src/harness-cleanup.test.ts' | sort)
if [ "$changed_paths" = "$expected_paths" ]; then
  printf '%s\n' 'QUAL033_IMPLEMENTATION_EXACT_THREE verified'
else
  printf '%s\n' 'QUAL033_IMPLEMENTATION_EXACT_THREE mismatch'
  exit 1
fi
```

A wrong shape or any nonzero command stops the epoch immediately. The named,
full-file, and root commands are:

```text
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts -t "reclaims malformed and dead-owner locks but preserves a live lock"
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-cleanup.test.ts
fnm exec --using=24.18.0 corepack pnpm check
```

The named result must be `1 passed / 13 skipped`, the full file must be `14`,
and root must be `54 files / 578 tests` plus five builds. PR249's red result is
not a pre-fix replay: it is historical evidence only and is never rerun.

## Acceptance criteria

1. Only the two malformed/dead-owner success-path `timeoutMs: 100` literals
   become `1_000`; live-lock/write-failure `20`, production default `300_000`,
   poll/grace, and all other bytes remain unchanged.
2. Static/diff checks pass; named test is `1 passed / 13 skipped`; full file is
   `14`; root is `54 files / 578 tests` plus five builds.
3. No local Integration, Browser, observer, Worker, Concurrent, Docker, or
   publication runtime command is run; first-red evidence is frozen honestly.
4. Successful implementation evidence is exact three; local red can publish
   only a fresh Blocked exact two; no code is published in that candidate.
5. Completed closes #250, #248, #245, #241, #238, #235, and #232. Issue #229
   and Worker chain #226/#222/#218/#215/#208/#204/#196/#147 remain Open. A
   successful result only hands off the Worker successor and never starts an
   M2 exit review; M2 remains In Progress and M3 remains Not Started.

## Terminal and authority boundaries

- A local green exact-three implementation requires its Completion Report,
  two independent reviews, exact-head static checks, first eligible quality /
  Integration / Browser CI all green, and an Orchestrator-only squash merge
  before Completed and the permitted Issue closures. The implementer and
  reviewers have no Git, GitHub, or Issue mutation authority.
- A local red permits only bounded Packet/Roadmap read-only/docs closeout and a
  fresh exact-two Blocked candidate. The test file is not published in that
  candidate; its reviews, static checks, first eligible three-job CI, and merge
  are separate publication evidence.
- A first eligible publication CI red or missing result closes unmerged with
  no same-head rerun or replacement and transfers recovery to M2-QUAL-034.

## Definition of Ready review evidence

Two independent Definition-of-Ready reviews PASSed with no findings, no
Blocking Design Question, no DEC, and all corrections closed:

- `/root/m2_qual_014_dor_correctness`, role
  `DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.
- `/root/m2_qual_012_browser_setup_diagnosis`, role
  `DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base/HEAD `9188f9bca2bdb37cd964590ec8642d275867706b`, the current
exact-two Packet/Roadmap, and live Issue #250 parity. Their authority is
limited to planning Definition of Ready; it does not authorize implementation,
runtime/test execution, code publication, or Git/GitHub/Issue mutation.

## Definition of Ready gaps

- [x] Two independent Definition-of-Ready reviewers PASSed this Packet's exact
      scope, acceptance, and PR249 evidence boundary with no findings.
- [x] Orchestrator Ready status and explicit same-worktree implementation
      handoff are recorded.
- [x] The two-line test correction is applied exactly; local exact-three
      Completion Report and independent evidence review are PASS; exact-head
      publication static (if required), CI, and merge remain pending.
- [x] Issue #250 is Open, links #248/#229, and body parity is synchronized by
      the Orchestrator.
- [x] PR249/run `31494958813` are read-only verified as closed-unmerged with
      quality red, Integration/Browser success, and no rerun.

## Completion Report (planning)

- Summary: bounded QUAL033 planning only; no implementation, test, runtime,
  Git, GitHub, or Issue mutation occurred.
- Files: this new Packet and the Roadmap row only.
- Planning checks: targeted Packet/Roadmap docs Prettier **PASS**,
  `repository:check` **PASS**, `git diff --check` **PASS**, and
  `QUAL033_PLANNING_EXACT_TWO verified` **PASS**. These were the only
  permitted local checks.
- DoR: Ready and explicit same-worktree handoff are recorded; local exact-three
  implementation, independent review, and static checks are PASS. Exact-head
  publication static (if required), CI, and merge remain pending.
- Issue parity: Issue #250 remains Open, links #248/#229, and body parity is
  synchronized with this Packet by the Orchestrator.
- Security/migration/compatibility/DEC: none.
- Recovery: local red freezes actual shape and permits fresh Blocked exact2;
  publication CI red/missing transfers to M2-QUAL-034.

### Planning formatting chronology

The initial targeted Packet/Roadmap Prettier check returned `RC1` on the
Packet. One standard formatter write was then explicitly authorized for these
two planning documents; it was planning-only and outside the implementation
epoch, changed no implementation facts or code, and was not a runtime/CI red,
rerun, waiver, or evidence laundering.

## Implementation Completion Report (local exact three)

- Summary: the explicit same-worktree handoff above started the implementation
  epoch. Exactly two success-path timeout literals changed from `100` to
  `1_000`; production `acquireBuildLock` and all negative `20ms` assertions did
  not change.
- Files changed: this Packet, the Roadmap, and
  `packages/testing/src/harness-cleanup.test.ts`; no other path changed.
- Commands: pure Git identity/status; Node/pnpm version, frozen install, and
  workspace; one test-only `apply_patch`; exact diff/static/scope; named/full
  Vitest; root `check`; and the final docs closeout checks recorded below.
- First governed sequence: pure Git identity/status passed; normal-permission
  Node `v24.18.0`, pnpm `11.17.0`, frozen install, and workspace checks passed
  once with no sandbox probe.
- Static/scope: exact test diff, targeted code Prettier, `repository:check`,
  `git diff --check`, and `QUAL033_IMPLEMENTATION_EXACT_THREE verified` passed
  once.
- Docs closeout: the first targeted Packet/Roadmap Prettier check after the
  evidence sync returned `RC1` for formatting only; one docs-only `apply_patch`
  correction fixed the Packet indentation and Roadmap blank line. Final docs
  Prettier, `repository:check`, `git diff --check`, and exact-three scope all
  passed. This remained within the implementation task/epoch but outside the
  governed runtime/test gate sequence; it was not a runtime/CI red, rerun, or
  evidence laundering event.
- Distinct second chronology: after the AGENTS §18 report-field sync, a
  targeted Packet/Roadmap Prettier check returned `RC1` for one Packet
  continuation indent; one docs-only `apply_patch` corrected it. Final
  Prettier, `repository:check`, `git diff --check`, and exact-three scope then
  passed. This also remained within the implementation task/epoch but outside
  the governed runtime/test gate sequence.
- Tests: named test passed `1 passed / 13 skipped`; full
  `harness-cleanup.test.ts` passed `14`; root `check` passed `54 files / 578
tests` and five application builds.
- Acceptance criteria: the two permitted literals changed, all required local
  static/test/root shapes passed, and exact-three scope is verified. The
  prohibited runtime suites and publication steps remain unrun.
- Security impact: none; no production behavior, dependency, credential,
  secret, raw runtime path/payload, PID, or environment evidence changed.
- Known limitations: this is local exact-three evidence only; Integration,
  Browser, observer, Worker, Concurrent, Docker, exact-head publication static
  (if still required by contract), three-job CI, and merge evidence are not
  established.
- Incomplete items: exact-head publication static (if still required by
  contract), first eligible three-job CI, and Orchestrator-only squash merge.
- Documentation updates: Packet Completion Report and Roadmap status/summary
  now record the handoff, local green gates, and publication boundary.
- Possible new DEC: none; this remains a bounded test-only correction.
- Prohibited suites were not run: Integration, Browser, observer, Worker,
  Concurrent, and Docker. No rerun, replacement, production timeout change,
  Git/GitHub/Issue mutation, or commit occurred.
- Terminal boundary: local exact-three evidence, independent reviews, and local
  static checks are PASS. The work now awaits exact-head publication static (if
  still required by contract), first eligible three-job CI, and Orchestrator-
  only squash merge. The implementation agent has no publication or
  Issue-closure authority.
- Git status: exact three paths are present (Packet, Roadmap, and the test);
  no commit, push, PR, merge, or Issue transition was performed.

## Independent implementation review evidence

Two independent implementation-evidence reviews PASSed with no findings and
all documentation findings closed:

- `/root/m2_qual_014_dor_correctness`, role `INDEPENDENT_REVIEWER`, requested
  `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`.
- `/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`,
  requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base/HEAD `9188f9bca2bdb37cd964590ec8642d275867706b`, the
corrected physical exact-three Packet/Roadmap/test, this Completion Report,
and live Issue #250 parity. Their authority is limited to implementation-
evidence and exact-three publication eligibility review; it does not authorize
Git, GitHub, Issue mutation, merge, or Completed status.
