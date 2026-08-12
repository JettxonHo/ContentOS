# M2-QUAL-042 — Concurrent Terminal-Status Transport Recovery and Publication

**Status:** In Review — Runtime and Exact-Five Evidence PASS; Publication Pending

**Issue:** [#267](https://github.com/JettxonHo/ContentOS/issues/267) is Open and
Orchestrator body parity is synchronized to this planning head.

## Identification

- **Task ID:** `M2-QUAL-042`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Quality / execution-evidence transport recovery
- **Owner/planning executor:** `/root`, logical roles `ORCHESTRATOR` and
  `PLANNING_AGENT`; requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.
- **DoR reviewers:** `/root/m2_qual_014_dor_correctness` and
  `/root/m2_qual_012_browser_setup_diagnosis`, role
  `DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`; authority planning DoR only.
- **Implementation executor:** `/root`, role `IMPLEMENTER`, requested
  `luna-worker` / configured `gpt-5.6-luna` Max; actual runtime identity is
  `UNVERIFIED_RUNTIME_MODEL`; same worktree/branch/base handoff is recorded.
- **Planning worktree:** `/private/tmp/contentos-m2-qual-042-plan-wt`
- **Planning branch:** `codex/m2-qual-042-terminal-status-recovery-plan`
- **Base/HEAD:** `33a4b49ed2f8a8176d9e66764a4ee61c79b46e61`
- **Shape:** exact `2/5/2`: planning Packet + Roadmap; successful local runner
  - concurrent test + Harness Current-truth + Packet + Roadmap; postmerge
    tracked Packet + Roadmap.

## Goal

Reconstruct the already reviewed QUAL041 runner/test/Harness bytes on fresh
main and obtain unambiguous structured terminal status for the root and real
Concurrent gates. QUAL041 remains immutable Blocked: its root command was
invoked once, but the execution channel supplied no structured terminal
`exit_code` or output. The cause and whether an unexposed result object existed
are unknown, so no PASS was earned and no rerun occurs in that epoch.

## Scope and fixed reference

The sole implementation reference is the frozen reviewed QUAL041 exact-five
worktree `/private/tmp/contentos-m2-qual-041-plan-wt`, branch
`codex/m2-qual-041-concurrent-predicate-recovery-plan`, base/HEAD `33a4b49...`.
Only these bytes may be reconstructed in one `apply_patch`:

1. `packages/testing/src/integration/run-concurrent-smoke.ts`
2. `packages/testing/src/concurrent-smoke.test.ts`
3. `docs/quality/integration-smoke-harness.md`

The only other allowed paths are this Packet and
`docs/implementation/roadmap.md`. No other code, fixture, script, dependency,
schema, API, migration, Current-truth, DEC, Acceptance Record, or README may
change.

## Relevant authority and documents

- Later Accepted DEC → Current-truth → Work Item → implementation.
- `AGENTS.md`, Work Item template, Agent Collaboration Workflow, Roadmap,
  Integration Smoke Harness, frozen QUAL041 Packet/Completion, and Issue #266.
- Relevant DEC: DEC-244–DEC-266, DEC-277–DEC-278, DEC-284, DEC-287–DEC-292.
  No new DEC or BQ.

## Terminal-status contract

Every governed command is one independent literal invocation from its fixed
worktree. The execution result must supply a structured `exit_code`, which is
recorded directly as the terminal verdict. Blank output or process
disappearance cannot substitute for it.
If the initial call returns only a live session, poll that same session with
empty input at intervals no longer than 60 seconds for at most five cumulative
minutes. Same-session polling is continuation, not rerun. Nonzero, missing,
signal, transport loss, timeout, wrong shape, or unexpected content is first
red. No `&&`, `||`, pipe, loop, heredoc, marker, status file, second command,
rerun, replacement, diagnosis, cleanup, or raw-output retention.

## Governed order

### Gate 1 — pure Git identity/reference

Run separately in the QUAL042 worktree: `git branch --show-current`,
`git rev-parse HEAD`, `git status --short --untracked-files=all`, and
`git diff --check`. Require the pinned branch/base and exact `M Roadmap + ??
Packet`. In frozen QUAL041 run the same four literals and require its reviewed
exact five (`M` runner/test/Harness/Roadmap + `??` Packet), branch/base, and
clean diff-check.

### Gate 2 — Node24/workspace/non-injected

Run separately, once:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e "const names=['CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY','CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE','CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE','CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE','CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE']; if(names.some((name)=>Object.hasOwn(process.env,name))) process.exit(1); process.stdout.write('injection-env=unset\\n')"
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
git status --short --untracked-files=all
```

Require Node `v24.18.0`, pnpm `11.17.0`, sanitized `injection-env=unset`, five
apps/six packages, RC0, and unchanged exact two.

### Gate 3 — one patch and fixed-byte equality

Use one `apply_patch` over only runner/test/Harness, reconstructing frozen
QUAL041 bytes. Then run once each:

```text
git diff --no-index --quiet packages/testing/src/integration/run-concurrent-smoke.ts /private/tmp/contentos-m2-qual-041-plan-wt/packages/testing/src/integration/run-concurrent-smoke.ts
git diff --no-index --quiet packages/testing/src/concurrent-smoke.test.ts /private/tmp/contentos-m2-qual-041-plan-wt/packages/testing/src/concurrent-smoke.test.ts
git diff --no-index --quiet docs/quality/integration-smoke-harness.md /private/tmp/contentos-m2-qual-041-plan-wt/docs/quality/integration-smoke-harness.md
```

All three must be RC0; no raw diff or second patch.

### Gate 4 — preliminary exact five

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --check packages/testing/src/integration/run-concurrent-smoke.ts packages/testing/src/concurrent-smoke.test.ts docs/quality/integration-smoke-harness.md docs/implementation/work-packets/m2-qual-042-concurrent-terminal-status-transport-recovery-publication.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
git status --short --untracked-files=all
```

Require RC0 and exact five only.

### Gate 5 — runtime, once each

```text
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/concurrent-smoke.test.ts
fnm exec --using=24.18.0 corepack pnpm check
fnm exec --using=24.18.0 corepack pnpm test:integration:concurrent
```

Require focused 1 file/56 tests, root 54 files/580 tests plus five builds, and
Concurrent outer RC0 with exactly one fixed LF success record. Each returned
structured exit status must be exposed; local invocation counts are exactly
one, with no fallback or rerun.

### Gate 6 — final evidence/publication

After runtime green, sync Packet/Roadmap only. Run these independent literals
once; no write may touch runner/test/Harness after runtime evidence:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-qual-042-concurrent-terminal-status-transport-recovery-publication.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check packages/testing/src/integration/run-concurrent-smoke.ts packages/testing/src/concurrent-smoke.test.ts docs/quality/integration-smoke-harness.md docs/implementation/work-packets/m2-qual-042-concurrent-terminal-status-transport-recovery-publication.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
git status --short --untracked-files=all
git diff --no-index --quiet packages/testing/src/integration/run-concurrent-smoke.ts /private/tmp/contentos-m2-qual-041-plan-wt/packages/testing/src/integration/run-concurrent-smoke.ts
git diff --no-index --quiet packages/testing/src/concurrent-smoke.test.ts /private/tmp/contentos-m2-qual-041-plan-wt/packages/testing/src/concurrent-smoke.test.ts
git diff --no-index --quiet docs/quality/integration-smoke-harness.md /private/tmp/contentos-m2-qual-041-plan-wt/docs/quality/integration-smoke-harness.md
```

All must return RC0 and status must be exact five. Dual exact-five reviews must
PASS before first eligible quality/Integration/Browser CI and
Orchestrator-only squash merge. Any CI red or missing terminal status closes
the candidate PR unmerged; no same-head rerun, replacement, or new head is
allowed, and only separately numbered QUAL043 may recover.

### Gate 7 — postmerge tracked exact two

In a fresh merged-head worktree, one Packet/Roadmap facts/status `apply_patch`
records PR/files/3CI/squash/merge/Issue/milestone truth. From that worktree run
each literal once:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-qual-042-concurrent-terminal-status-transport-recovery-publication.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-qual-042-concurrent-terminal-status-transport-recovery-publication.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm repository:check
git diff --check
git status --short --untracked-files=all
```

All must return RC0 with exact tracked `M Packet + M Roadmap` and
runner/test/Harness/code zero. Dual audit reviews, first eligible 3CI, and
Orchestrator merge publish the reconciliation. Audit red transfers to QUAL043
without reversing code merge.

## Lifecycle, tests, and acceptance

- Any local first red freezes reached exact 2/3/4/5 with evidence-only docs
  sync and dual actual-shape review; only a separate fresh-main exact-two
  Blocked record may publish. Recovery is QUAL043.
- Acceptance requires three reference RC0 equalities; preliminary/final exact
  five; focused 1/56; root 54/580+5; Concurrent outer RC0/one fixed line; dual
  reviews; first eligible 3CI; merge; and tracked exact-two audit.
- Successful exact-five merge makes code/Harness/status effective and permits
  Orchestrator closure of #267, #266, #265, #215, #218, #222, and #226. #229
  may close only as explicitly superseded, not completed. #175/#184/#144 stay
  Open; M2 stays In Progress, M3 Not Started, no exit review.

## Security, migration, documentation

No product data, secret, auth, network, API, schema, database, migration,
dependency, queue, or production boundary changes. The fixed line contains no
dynamic child output, path, PID, credential, URL, timestamp, or log. Only the
Harness page is Current-truth; no other Current-truth or DEC changes.

## Definition of Ready

- [x] Issue #267 is Open and body parity is synchronized.
- [x] Dual DoR PASS/no findings/no BQ/no DEC by the two reviewers named above
      on the corrected exact-two/live #267 head.
- [x] Explicit same-worktree handoff and START recorded; Gate 1 is next.
- [x] Fixed reference, exact 2/5/2, terminal transport, commands/counts,
      first-red/QUAL043, Issue/M2/M3 boundaries defined.

## Completion report (§18)

- **Summary:** Reconstructed frozen QUAL041 runner/test/Harness bytes and
  obtained explicit terminal RC0 for focused, root, and Concurrent gates.
- **Files changed:** runner, concurrent test, Harness Current-truth, Packet,
  and Roadmap only; exact five.
- **Commands/tests:** Gate1 8/8 and Gate2 6/6 PASS. The first patch composition
  failed atomically on a Harness anchor with no write; one effective patch then
  changed exactly runner/test/Harness, followed by three quiet equality RC0.
  Preliminary Prettier/repository/diff/exact-five PASS. Focused returned RC0
  with 1 file/56 tests. Root used one invocation/session, empty-input
  same-session polling only, and returned terminal RC0 with 54 files/580 tests
  plus five builds. Concurrent used one invocation/session, empty-input
  same-session polling only, and returned terminal RC0 with exactly one fixed
  LF success record. No rerun, replacement, transform, diagnosis, or raw child
  output retention occurred.
- **Acceptance:** local identity/equality/preliminary/runtime criteria PASS;
  final exact-five Gate 6 completed 8/8 RC0 with exact-five scope and all three
  equalities preserved. Both independent implementation reviews found the code
  and evidence sound; current-head docs/static/equality closeout follows this
  review metadata/parity sync. First eligible 3CI, merge, closures, and
  postmerge audit remain pending.
- **Security impact:** none.
- **Known limitation:** QUAL041 root result remains unknown and is not reused;
  QUAL042 evidence is a distinct successful invocation sequence.
- **Incomplete:** current-head post-review docs/static/equality closeout, CI,
  merge, closures, and postmerge audit.
- **Documentation:** Harness, Packet, and Roadmap are locally changed; none is
  effective until merge.
- **Possible DEC:** none.
- **Git status:** exact `M` runner + `M` test + `M` Harness + `M` Roadmap +
  `??` Packet; no other path.

Gate 6 final results: one Packet/Roadmap-only formatter write returned RC0;
five-path Prettier, Node24 `repository:check`, `git diff --check`, exact-five
status, and the three final fixed-reference quiet comparisons each returned
RC0 (8/8). No runner/test/Harness write followed runtime evidence. Independent
reviewers `/root/m2_qual_014_dor_correctness` and
`/root/m2_qual_012_browser_setup_diagnosis`, role `INDEPENDENT_REVIEWER`,
requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`, reviewed the
corrected physical exact five and supplied Completion facts. Code, scope,
security, and runtime evidence PASSed; their authority is publication
eligibility only. The Orchestrator synchronizes live Open #267 to this final
evidence head before the current-head closeout.
