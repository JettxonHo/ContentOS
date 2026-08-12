# M2-GOV-010 — M2 Acceptance Record 002 apply_patch Hunk Recovery

**Status:** Ready — Explicit Orchestrator same-worktree handoff recorded

**Issue:** [#278](https://github.com/JettxonHo/ContentOS/issues/278) is Open;
Orchestrator body parity is synchronized to this planning candidate.

## Identification

- **Task ID:** `M2-GOV-010`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model / reasoning:** `gpt-5.6-sol` / High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_010_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-010-plan-wt`
- **Planning branch:** `codex/m2-gov-010-apply-patch-hunk-recovery-plan`
- **Planning base/HEAD:** `3562b56b865d20b02f6cf50e295f062f5e4da4cd`
- **Planning shape:** new GOV010 Packet + tracked Roadmap only
- **Relevant DEC:** DEC-244–DEC-266 and DEC-267–DEC-293
- **Risk:** immutable milestone-decision publication integrity

## Goal

Recover M2 Acceptance Record 002 publication after GOV009's first per-file
write failed atomically because it supplied a numeric unified-diff hunk that
the `apply_patch` tool does not accept. Start from fresh latest main and use
nine independent per-file `apply_patch` calls with native legal syntax:
literal `@@` plus stable context for existing files, and `*** Add File` for
Record 002. Publish the exact-nine strict Blocked documentation set, then
reconcile the publication through one fresh-main tracked exact-two change.

## Immutable predecessor evidence

### M2-GOV-006

- Reviewed Commit remains
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`.
- Gate 3 root `check` ran exactly once and returned structured exit `1`.
  Format, lint, and typecheck passed; the Fetcher public-transport test
  `rejects decoded content above 8 MiB while the expansion ratio remains below 20:1`
  timed out at 5000 ms. Test files were 54 total, 53 passed, 1 failed; tests
  were 580 total, 579 passed, 1 failed. Build was not reached.
- Gates 4–8 have zero runs. There was no rerun, replacement, diagnosis,
  repair, cause claim, or cleanup.
- Gate 9 steps 1–3 returned RC 0. Step 4 is the immutable publication first
  red because `git add` lacked its own independent invocation and structured
  status inside a combined command; step 5 onward is zero/unearned.
- The final GOV006 working-tree bytes remain the only source for the five
  standalone frozen documents. Record 002 remains ineffective and Issue #144
  remains Open.

### M2-GOV-008

- Planning PR #275 merged at
  `469828ad7557b37e4dae68a973c814bb16f6e1a0`; Issue #274 remains Open.
- P0–P2 and all seven frozen-source predicates passed. The sole monolithic P3
  `apply_patch` returned a context-verification failure on `AGENTS.md`; it was
  atomic and wrote no file. There was no retry or replacement. P3 postchecks
  and P4+ have zero runs.

### M2-GOV-009

- Planning PR #277 merged as
  `3562b56b865d20b02f6cf50e295f062f5e4da4cd`; Issue #276 remains Open.
- Publication P0–P3 passed on fresh branch
  `codex/m2-gov-009-record-002-per-file-recovery` and worktree
  `/private/tmp/contentos-m2-gov-009-publication-wt` at exact base/HEAD
  `3562b56b865d20b02f6cf50e295f062f5e4da4cd`. P0 recorded expected branch
  absence RC 1, path absence RC 0, and worktree-add RC 0; publication branch,
  HEAD, and `origin/main` matched, status/diff were empty, and Record001-zero
  returned RC 0. P1 returned RC 0 for Node `v24.18.0`, pnpm `11.17.0`, exact
  eleven-name `injection-env=unset`, frozen install (571 ignored packages
  materialized), and workspace exact five applications/six packages. P2
  returned RC 0 with exact entry baseline
  `safe-count compiled=72 compose=0 temp=1 repo-store=0`; it authorized no
  cleanup. P3 returned RC 0 for source branch
  `codex/m2-gov-006-exit-review-002-current`, HEAD
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`, exact five
  `MM` plus Record002 `AM`, working-tree name-status five `M` plus Record002
  `A`, empty untracked, Record001-zero, and forbidden-zero.
- P4 write 1 was the first and only reconstruction call. It targeted only
  `AGENTS.md` but incorrectly used numeric unified hunk syntax
  `@@ -1,14 +1,34 @@`. The `apply_patch` tool returned exactly
  `apply_patch verification failed: Failed to find context '-1,14 +1,34 @@' in /private/tmp/contentos-m2-gov-009-publication-wt/AGENTS.md`.
  The failure was atomic with no known write and the publication worktree
  remained clean.
- No P4 write 2–8, P5 predicate, P6 integrity command, P7 review, P8 Git/CI/
  merge command, correction, retry, replacement, or diagnosis ran. GOV009's
  failed head is frozen and is not reused. After red, one read-only
  `sed -n 466,560p` inspected the Packet recovery clause; no governed check,
  write, diagnosis, or retry followed. Executor was `/root`, logical role
  `IMPLEMENTER` / Orchestrator execution, requested inherited system model,
  actual runtime `UNVERIFIED_RUNTIME_MODEL`.

M2 remains In Progress, M3 remains Not Started, Record 002 is ineffective,
and Issues #144/#274/#276/#278 remain Open. This Work Item preserves rather
than reclassifies every predecessor result.

## Authority and relevant documents

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ Issue #278
→ this Packet
→ Agent judgment
```

Relevant documents: Canonical Decision Register; Work Item Template; Agent
Collaboration Workflow; Milestone Exit Criteria; Release Gates; Test Strategy;
M2 Acceptance Record 001; GOV006/GOV008/GOV009 Packets; and Roadmap. Later
Accepted DEC govern an actual conflict.

## Scope

### In scope

1. Planning exact two: this Packet and Roadmap.
2. Fresh latest-main exact-nine strict Blocked publication.
3. Exactly nine ordered per-file `apply_patch` writes using the native grammar
   fixed in this Packet, one call for each exact-nine destination.
4. Five frozen-source byte-equality checks and bounded evidence predicates for
   GOV008/GOV009/this Packet/Roadmap.
5. Exact-nine local integrity, dual independent review, first eligible
   attempt-1 exact-head three-job CI, and squash merge.
6. Fresh postmerge tracked exact-two GOV010 Packet/Roadmap reconciliation,
   dual review, first eligible attempt-1 exact-head three-job CI, merge, then
   Orchestrator closure of Issues #144/#274/#276/#278 as Completed.

### Out of scope

- any direct/local exit, runtime, unit, integration, concurrent, browser,
  audit, or migration replay; the two mandatory documentation-PR three-job CI
  gates are publication eligibility only, not GOV006 exit/runtime evidence;
- code, test, fixture, dependency, lockfile, config, Schema, Compose, CI, DEC,
  product, M3, or Record 001 change;
- changing any GOV006/GOV008/GOV009 first red or evidence total;
- same-head retry, numeric-hunk retry, replacement command/head, diagnosis,
  repair, waiver, Conditional Pass, or inherited runtime result;
- GitHub/Issue mutation by the Documentation Executor.

## Exact 2 / 9 / 2 lifecycle and allowed files

| Phase       | Exact tracked shape                                                                 | Meaning                                   |
| ----------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| Planning    | GOV010 Packet + Roadmap                                                             | Plan only.                                |
| Publication | `AGENTS.md`, both READMEs, Record 002, GOV006/GOV008/GOV009/GOV010 Packets, Roadmap | Exact-nine strict Blocked publication.    |
| Postmerge   | tracked GOV010 Packet + tracked Roadmap                                             | Publication/CI/Issue reconciliation only. |

Every other path is prohibited. Record 001 remains zero-diff. No generated
file is commit-eligible; ignored locked dependencies may materialize but must
not appear in tracked or untracked scope evidence.

## Invocation and first-red discipline

Every process command is one independent literal invocation with fixed cwd
and structured terminal status. `&&`, `||`, pipes, wrappers, heredocs,
command substitution, redirection-derived status, and shell-derived status are
prohibited. Only fixed cwd/SHA/PR/Issue/run IDs may first be ledgered and then
substituted as literal argv. A missing or unexpected status/output is first
red: freeze the actual shape, perform no retry/correction/replacement, and
transfer any continuation to M2-GOV-011.

Each `apply_patch` call is also an independent governed invocation. A failed
tool result is red even when it writes nothing.

## Native apply_patch grammar contract

Every governed documentation write in publication or postmerge—including
reconstruction, status/evidence sync, and review-metadata sync—must satisfy all
of these rules:

1. Tool input begins with `*** Begin Patch` and ends with `*** End Patch`.
2. An existing-file call contains exactly one
   `*** Update File: <allowed-path>` section. Every hunk uses a bare literal
   `@@` locator and stable current-file context lines. Numeric unified-diff
   locators such as `@@ -1,14 +1,34 @@` are forbidden.
3. The one reconstruction call that creates Record 002 contains exactly one
   `*** Add File: docs/implementation/m2-acceptance-record-002.md` section;
   it uses no `@@` hunk marker and every content line has the required `+`
   prefix.
4. No call contains a second file section, absolute destination, shell
   generation, copied `diff -u` header, `---`/`+++` file header, or deletion/
   move instruction.
5. Stable context is read from the fresh current destination immediately
   before constructing that one call. Reading context is not a write and does
   not authorize a retry.
6. Each tool result must explicitly report success before the next numbered
   write. No post-failure write is permitted.

No governed `apply_patch` call may update more than one file. Publication P4
has exactly nine reconstruction calls; P7 has exactly four review-metadata
calls. Postmerge has exactly two fact-reconciliation calls followed, after
dual review, by exactly two review-metadata calls. Each group is ordered and
first-red: the first failed tool result freezes the actual shape and all later
calls in that group have count zero.

The syntax rule is the bounded repair. It does not change document content,
the strict Blocked decision, or any accepted release gate.

## Publication ledger

### P0 — fresh latest-main identity

Use fixed repository cwd `/Users/ketchup/Projects/ContentOS`; run separately:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-010-apply-patch-hunk-recovery
test ! -e /private/tmp/contentos-m2-gov-010-publication-wt
git worktree add -b codex/m2-gov-010-apply-patch-hunk-recovery /private/tmp/contentos-m2-gov-010-publication-wt <RECOVERY_BASE_SHA>
```

Expected statuses are `0`, `0`, branch absence `1`, path absence `0`, and
worktree add `0`. Ledger the exact latest `origin/main` as
`<RECOVERY_BASE_SHA>`; it must include merged GOV009 planning. Fixed
publication cwd then becomes `/private/tmp/contentos-m2-gov-010-publication-wt`:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

All return `0`; identities match, status/diff are empty, Record001-zero passes.

### P1 — Node, pnpm, injection, install, workspace

At fixed publication cwd, independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e 'const names=["CONTENTOS_INTEGRATION_INJECT_CHILD_AFTER_RESOURCE_ALLOCATE","CONTENTOS_INTEGRATION_INJECT_CHILD_BEFORE_TEST_EXECUTION","CONTENTOS_INTEGRATION_INJECT_CHILD_CLEANUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_COMMAND_FAILURE","CONTENTOS_INTEGRATION_INJECT_CONCURRENT_FAILURE","CONTENTOS_INTEGRATION_INJECT_FORBIDDEN_GLOBAL_CLEANUP","CONTENTOS_INTEGRATION_INJECT_HARNESS_PROBE","CONTENTOS_INTEGRATION_INJECT_PROCESS_IDENTITY_FAILURE","CONTENTOS_INTEGRATION_INJECT_SETUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_TEARDOWN_FAILURE","CONTENTOS_INTEGRATION_INJECT_WORKER_FAILURE"];const set=names.filter((name)=>process.env[name]!==undefined);if(set.length)process.exit(1);process.stdout.write("injection-env=unset\n")'
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Require Node `v24.18.0`, pnpm `11.17.0`, exact `injection-env=unset`, frozen
install success, and exactly five applications/six packages.

### P2 — publication entry safe-count

Run once at fixed publication cwd:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Record its literal argv, structured status, and four-field output. Expected
status is `0`. It authorizes no cleanup. The same literal observer runs at the
end of P6 and P7; no positive delta is permitted. It is not run in postmerge.

### P3 — frozen source and predecessor identities

From fixed source cwd
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt`, run independently:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git diff --name-status d335d01af7064fa58f5f3aec6c52fa3ba07fb950
git ls-files --others --exclude-standard
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-001.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/roadmap.md'
```

Require exact GOV006 branch/HEAD, five `MM` plus Record002 `AM`, working-tree
name-status five `M` plus Record002 `A`, empty untracked, Record001-zero, and
forbidden-zero. Final working-tree bytes—not the index—remain authoritative.

From frozen GOV009 publication cwd
`/private/tmp/contentos-m2-gov-009-publication-wt`, independently require:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git diff --exit-code
```

Require exact GOV009 publication branch, HEAD `3562b56b865d20b02f6cf50e295f062f5e4da4cd`,
empty status, and empty diff. These predicates prove the numeric-hunk failure
was atomic; they do not continue that head.

### P4 — exactly nine native per-file reconstruction writes

Execute in this order. Each call follows the native grammar contract, contains
only its named destination, must succeed, and is never retried:

1. `AGENTS.md`: `*** Update File` with bare `@@`/stable context; reconstruct
   exact frozen GOV006 working-tree bytes.
2. `README.md`: same native update form and exact frozen bytes.
3. `README.zh-CN.md`: same native update form and exact frozen bytes.
4. `docs/implementation/m2-acceptance-record-002.md`: `*** Add File` form,
   no hunk marker; create exact frozen bytes.
5. GOV006 Packet: native update form and exact frozen bytes.
6. GOV008 Packet: native update form; preserve its contract and append only
   actual GOV008 failure/recovery evidence through transfer to GOV010.
7. GOV009 Packet: native update form; preserve its merged planning contract,
   record actual P0–P3 PASS, the sole numeric-hunk P4 write-1 atomic first red,
   writes 2–8/P5+ zero, and transfer to GOV010; status becomes
   `Completed — Native Hunk Reconstruction Blocked`.
8. Roadmap: native update form; preserve current-main entries and synchronize
   only GOV006/GOV008/GOV009 history plus GOV010 publication status.
9. GOV010 Packet: native update form; record implementation identity, exact
   recovery base, reached P0–P4 statuses, and status
   `In Review — exact-nine native-hunk recovery`; make no P5+ claim.

There is no monolithic patch, numeric hunk, tenth reconstruction patch, or
same-head syntax experiment. Before review, physical shape is eight tracked
`M` files plus untracked Record 002.

### P5 — reconstruction predicates

Run the five standalone byte comparisons independently; all return `0`:

```text
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
```

Whole-file equality remains prohibited for GOV008/GOV009/GOV010/Roadmap.
Run these fixed-string predicates independently; every status is `0`:

```text
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'P0–P2 passed' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q '3562b56b865d20b02f6cf50e295f062f5e4da4cd' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Publication P0–P3 passed' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '@@ -1,14 +1,34 @@' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q "apply_patch verification failed: Failed to find context '-1,14 +1,34 @@' in /private/tmp/contentos-m2-gov-009-publication-wt/AGENTS.md" docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'P4 writes 2–8 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'M2-GOV-010' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Exact 2 / 9 / 2 lifecycle' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Numeric unified-diff locators such as `@@ -1,14 +1,34 @@` are forbidden' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'M2-GOV-008 — M2 Acceptance Record 002 Publication Protocol Recovery' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-009 — M2 Acceptance Record 002 Per-File Publication Reconstruction Recovery' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-010 — Native apply_patch Hunk Recovery' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/roadmap.md
```

No raw diff or hash output is used as content evidence.

### P6 — exact-nine local integrity

Run independently and in order at fixed publication cwd:

```text
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Every status must be `0`. Before staging, require eight tracked `M` plus
untracked Record 002. After staging, require Record002 `A` plus eight `M`,
empty untracked/forbidden/Record001 outputs, and no positive safe-count delta.
The formatter write is deliberately limited to the four non-frozen governance
documents. The five frozen documents must still byte-equal their authoritative
GOV006 working-tree sources after formatting and before staging. Immediately
after the five `cmp` calls, rerun every literal P5 fixed-string `rg` invocation
above independently in the same order and require RC 0 before `git diff
--check`; this revalidates all four mutable documents after their formatter
write.

### P7 — dual review, metadata sync, final same-head sequence

Two non-author reviewers independently inspect and PASS: (1) frozen evidence
and strict Blocked decision accuracy; (2) native-hunk executability,
exact-nine scope, immutable record, security, migration, and lifecycle.
Any other result freezes the head.

After both PASS, execute exactly four ordered metadata-only `apply_patch`
calls: GOV008 Packet, GOV009 Packet, Roadmap, then GOV010 Packet. Every call
updates exactly its one named file with native bare-`@@` syntax and records
review identities/results only. Record 002 and the other four frozen documents
are not metadata targets. A failed call freezes the shape and prevents every
later call. These calls may not reconstruct content, repair evidence, or
change the decision. Then run once and independently at the same fixed
publication cwd:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'P0–P2 passed' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q '3562b56b865d20b02f6cf50e295f062f5e4da4cd' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Publication P0–P3 passed' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '@@ -1,14 +1,34 @@' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q "apply_patch verification failed: Failed to find context '-1,14 +1,34 @@' in /private/tmp/contentos-m2-gov-009-publication-wt/AGENTS.md" docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'P4 writes 2–8 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'M2-GOV-010' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Exact 2 / 9 / 2 lifecycle' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Numeric unified-diff locators such as `@@ -1,14 +1,34 @@` are forbidden' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'M2-GOV-008 — M2 Acceptance Record 002 Publication Protocol Recovery' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-009 — M2 Acceptance Record 002 Per-File Publication Reconstruction Recovery' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-010 — Native apply_patch Hunk Recovery' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/roadmap.md
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require exact-nine staged shape, empty untracked, Record001-zero,
forbidden-zero, five frozen byte equalities, every metadata-affected fixed
predicate, and no positive safe-count delta. Record 002 remains byte-identical
to the frozen strict Blocked source; current publication-review identities are
stored only in the four mutable governance documents. This is a planned
post-review sequence, not a retry after red.

### P8 — commit, PR, exact-head CI, merge

Only the Orchestrator proceeds after P7 is green. Run independently:

```text
git commit -m 'docs: recover record publication with native patch hunks'
git rev-parse HEAD
git push -u origin codex/m2-gov-010-apply-patch-hunk-recovery
gh pr create --draft --base main --head codex/m2-gov-010-apply-patch-hunk-recovery --title 'docs: recover record publication with native patch hunks' --body-file /private/tmp/contentos-m2-gov-010-publication-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID> --jq 'if (.head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

The outside-repository body file is created by one bounded non-shell text
write and validated read-only. Require exact SHA/event, attempt 1,
completed/success, and exactly the three named jobs. Merge makes Record 002
immutable/effective Blocked and GOV006 `Completed — Exit Review Blocked`; M2
stays In Progress, M3 Not Started, and all four Issues stay Open. These
mandatory documentation-PR jobs are publication eligibility only: they are
not GOV006 exit/runtime evidence, do not make the frozen root check green, and
must not reclassify Record 002 or M2.

## Postmerge tracked exact-two reconciliation

From repository cwd, independently create a fresh tree only when latest
`origin/main` equals the publication merge SHA:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-010-apply-patch-hunk-recovery-reconcile
test ! -e /private/tmp/contentos-m2-gov-010-postmerge-wt
git worktree add -b codex/m2-gov-010-apply-patch-hunk-recovery-reconcile /private/tmp/contentos-m2-gov-010-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Require statuses `0,0,1,0,0`. From fixed postmerge cwd independently require
the entry using these literal invocations:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Every status is `0`; branch equals
`codex/m2-gov-010-apply-patch-hunk-recovery-reconcile`; both SHA outputs equal
`<PUBLICATION_MERGE_SHA>`; status/diff/Record001 outputs are empty.

Execute exactly two ordered native fact-reconciliation `apply_patch` calls:
first GOV010 Packet, then Roadmap. Each uses bare `@@`/stable context and
updates exactly its one named file with the exact publication PR/run/jobs/
merge, effective Blocked decision, M2/M3 status, and all still-Open Issues. If
either call fails, freeze the shape; do not execute or retry the other. Then
run these metadata-affected predicates independently after substituting all
ledgered values literally:

```text
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/roadmap.md
```

Every predicate returns `0`. Then run independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require Node 24.18.0, pnpm 11.17.0, workspace five/six, targeted formatter,
static/repository/Secret checks, exact-two staged/status/name, empty untracked,
Record001-zero, forbidden-zero, and all statuses `0`.

Two fresh independent reviewers must PASS. Then execute exactly two ordered
review-metadata `apply_patch` calls, first GOV010 Packet and then Roadmap. Each
uses native bare-`@@` syntax and updates only its one named file. Any failed
call freezes the shape and prevents the later call. They may record review
identities/results only and may not alter publication facts, Record 002, the
decision, or M2/M3 status. Follow once and independently by:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278 remain Open' docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git diff --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require exact-two, empty untracked, Record001-zero, forbidden-zero, every
publication-fact predicate still true after metadata and formatting, and every
status `0`. Then independently run:

```text
git commit -m 'docs: reconcile native-hunk record publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-010-apply-patch-hunk-recovery-reconcile
gh pr create --draft --base main --head codex/m2-gov-010-apply-patch-hunk-recovery-reconcile --title 'docs: reconcile native-hunk record publication' --body-file /private/tmp/contentos-m2-gov-010-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID> --jq 'if (.head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'Strict Blocked Record 002 publication and tracked reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close 274 --reason completed --comment 'GOV008 publication failure is preserved and recovered by merged GOV010 publication/reconciliation.'
gh issue close 276 --reason completed --comment 'GOV009 numeric-hunk first red is preserved and recovered by merged GOV010 publication/reconciliation.'
gh issue close 278 --reason completed --comment 'GOV010 exact-nine native-hunk publication and exact-two reconciliation are merged.'
```

Require every status `0`, exact attempt-1 three-job success, and verified merge
facts. Only after the exact-two merge may all four Issues close Completed.
Issue completion means publication recovery completed; it does not make M2
Passed or start M3. The reconciliation three-job CI is likewise a mandatory
documentation-publication gate only; it is not a direct/local replay and does
not replace or reinterpret any GOV006 exit/runtime result.

## Acceptance criteria

1. Planning exact two merges before implementation.
2. GOV006/GOV008/GOV009 evidence remains immutable; no exit/runtime evidence
   reruns and no failed head is reused.
3. Publication starts fresh latest-main and performs exactly nine ordered
   per-file native `apply_patch` writes with no numeric hunk or retry.
4. Five standalone destinations byte-equal frozen working-tree sources;
   P6 and final P7 revalidate those five equalities after formatter/metadata,
   while bounded predicates validate GOV008/GOV009/GOV010/Roadmap.
5. Exact-nine local integrity, dual reviews, review metadata sync, first
   eligible attempt-1 three-job CI, and merge all pass.
6. Exact-nine merge makes Record 002 effective Blocked while M2 remains In
   Progress, M3 Not Started, and all four Issues remain Open.
7. Fresh postmerge tracked exact-two passes checks, reviews, CI, and merge;
   only then may all four Issues close Completed.
8. Any red/missing result freezes the actual shape and transfers continuation
   to GOV011 without same-head retry or replacement.

## Required evidence

- Static/docs: targeted Prettier write/check, repository-wide `format:check`,
  `check:docs`, `repository:check`, `check:secrets`, and `git diff --check`.
- Scope: exact tracked/staged/untracked predicates, Record001-zero,
  forbidden-zero, and publication entry/final safe-count comparison.
- Review: two independent PASS results for publication and two fresh PASS
  results for postmerge reconciliation.
- CI: first eligible exact-head attempt-1 three-job success for each
  documentation PR; this is publication eligibility only and cannot be used
  as GOV006 exit/runtime evidence or to reclassify Record 002.
- Direct/local exit/runtime/test/audit/migration replay: Not Run by GOV010.

## Security review

Documentation-only. No user content, external input, Credential, network,
Authentication, Authorization, Object Storage, Secret, Source-safety,
prompt-injection, Renderer isolation, logging, Export, deletion, or production
boundary changes. Existing Secret checks run; no new hash, cleanup authority,
or exception is introduced.

## Migration and compatibility review

No database, Schema, API, Queue Payload, Artifact Version, Agent Spec, Prompt,
dependency, lockfile, configuration, migration, backfill, compatibility, or
rollback change is authorized. `db:generate` and `db:migrate` do not run.

## Observability

No production Log, Metric, Trace, Audit Event, Failure Category, or Correlation
ID changes. Evidence is stable, aggregate, and sanitized; it excludes Secrets,
private content, temporary URLs, raw child output, PIDs, and credentials.

## Documentation updates

- Planning: GOV010 Packet and Roadmap only.
- Publication: exact nine documents listed above.
- Postmerge: tracked GOV010 Packet and Roadmap only.
- Record 001, Accepted DEC, code, configuration, and M3 documents: unchanged.

## Planning verification chronology

Planning began on exact base/HEAD
`3562b56b865d20b02f6cf50e295f062f5e4da4cd` in the fixed branch/worktree above.
The Planning Agent read current AGENTS, Work Item Template, Agent Collaboration
Workflow, complete GOV006/GOV008/GOV009 Packets, and relevant Roadmap sections.
Issue #278 was created Open. No exit, runtime, test, audit, migration, commit,
push, PR, or merge command ran in planning. Node 24.18.0 was confirmed. The
targeted Packet/Roadmap Prettier write returned RC 0 and materialized 571
ignored locked packages. The following targeted Prettier check,
`repository:check`, `git diff --check`, exact-two status/tracked/untracked,
Record001-zero, and forbidden-zero each returned RC 0. Physical status was
exactly tracked `M` Roadmap plus untracked GOV010 Packet. Issue #278 body was
then synchronized from this Packet; final current-head checks are required
after this chronology update.

Dual Definition of Ready review then returned four bounded findings: enforce
single-file patch grammar for publication/postmerge metadata; preserve and
recheck the five frozen byte-equalities after formatter and review metadata;
expand literal postmerge entry/final predicates; and distinguish mandatory
documentation-PR CI from prohibited direct/local exit/runtime replay. The
correction changed only this Packet and Roadmap. It gives P7 four ordered
single-file metadata calls, both postmerge write stages two ordered single-file
calls, mutable-four-only publication formatter writes, P6/P7 frozen-byte and
mutable-predicate rechecks, literal postmerge identity/fact commands, and the
CI classification above. The corrected targeted Node 24 Packet/Roadmap
Prettier write reported both files unchanged and returned RC 0. Its following
targeted Prettier check, `repository:check`, `git diff --check`, exact-two
status/tracked/untracked, Record001-zero, and forbidden-zero each independently
returned RC 0. Physical status remained exactly tracked `M` Roadmap plus
untracked GOV010 Packet. One final current-head check set and Issue #278 body
parity follow this chronology write; no exit/runtime/test/audit/migration,
commit, push, or PR command has run.

## Definition of Ready

Ready. Reviewers `/root/m2_gov_006_dor_correctness` and
`/root/m2_gov_006_dor_governance`, role `DEFINITION_OF_READY_REVIEWER`,
requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`, reviewed base
`3562b56b865d20b02f6cf50e295f062f5e4da4cd`, the corrected physical exact-two,
frozen GOV006/GOV008/GOV009 evidence, and live Issue #278 parity. Both returned
PASS with no findings, no BQ, and no DEC; authority was planning DoR only.
The Orchestrator now records the explicit same-worktree handoff. Publication
P0 remains the first implementation gate; no Planning Agent self-declaration
authorizes any broader action.

## Definition of Done

Only merged exact-nine publication, merged fresh postmerge tracked exact-two
reconciliation, and Orchestrator closure of all four Issues completes GOV010.
Record 002 remains Blocked, M2 In Progress, and M3 Not Started.

## Rollback and possible DEC

Before merge, abandon only the affected fresh branch/PR. After Record 002
merges it is immutable; later correction uses a later numbered recovery or
Acceptance Record. No runtime/database rollback exists. No new DEC is
expected; an actual authority conflict returns `HUMAN_DECISION_REQUIRED`.
