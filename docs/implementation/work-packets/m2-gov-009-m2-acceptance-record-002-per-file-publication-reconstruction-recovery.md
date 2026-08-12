# M2-GOV-009 — M2 Acceptance Record 002 Per-File Publication Reconstruction Recovery

**Status:** Ready — Dual Definition of Ready PASS; planning publication and
Orchestrator handoff pending

**Issue:** [#276](https://github.com/JettxonHo/ContentOS/issues/276) is Open;
Orchestrator body parity is synchronized to this final planning head.

## Identification

- **Task ID:** `M2-GOV-009`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / per-file documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Definition of Ready reviewers:** `/root/m2_gov_006_dor_correctness` and
  `/root/m2_gov_006_dor_governance`
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model / reasoning:** `gpt-5.6-sol` / High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_006_current_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-009-plan-wt`
- **Planning branch:** `codex/m2-gov-009-record-002-per-file-recovery-plan`
- **Planning base/HEAD:** `469828ad7557b37e4dae68a973c814bb16f6e1a0`
- **Planning shape:** new GOV009 Packet + Roadmap only
- **Relevant DEC:** DEC-244–DEC-266 and DEC-267–DEC-293
- **Risk:** immutable milestone-decision publication integrity

## Goal

Recover M2 Acceptance Record 002 publication after GOV008's sole monolithic
reconstruction patch failed atomically. Use eight independent, ordered,
per-file `apply_patch` writes so a context mismatch is isolated to one file,
while preserving every frozen GOV006 exit/publication fact and prohibiting any
same-head retry. Publish an exact-eight strict Blocked documentation set, then
reconcile it through one fresh-main tracked exact-two publication.

## Immutable predecessor evidence

### M2-GOV-006

- Reviewed Commit remains
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`.
- Gate 3 root `check` ran once and returned exit `1`: format, lint, and
  typecheck passed; the named Fetcher public-transport test timed out at
  5000 ms; 54 files were 53 passed / 1 failed and 580 tests were 579 passed /
  1 failed; build was not reached.
- Gates 4–8 have zero runs. There was no rerun, replacement, diagnosis, repair,
  cause claim, or cleanup.
- Gate 9 current candidate steps 1–3 returned RC 0. Step 4 is immutable first
  red because `git add` lacked an independent invocation/structured status in
  a combined command; step 5 onward is zero/unearned.
- The frozen strict Blocked exact-six content remains the only reconstruction
  source. Record 002 is ineffective and Issue #144 remains Open.

### M2-GOV-008

- Planning merged through PR #275 at squash/current main
  `469828ad7557b37e4dae68a973c814bb16f6e1a0`; Issue #274 remains Open.
- Publication P0–P2 passed: fresh identity/clean/Record001-zero; Node
  `v24.18.0`; pnpm `11.17.0`; eleven injection names unset; frozen install
  materialized 571 ignored packages; workspace resolved five applications and
  six packages; entry observer returned
  `safe-count compiled=72 compose=0 temp=1 repo-store=0`.
- All seven frozen-source predicates passed. Physical source status was `MM`
  for `AGENTS.md`, both READMEs, GOV006 Packet, and Roadmap; `AM` for Record
  002; untracked was empty; Record001-zero and forbidden-zero passed.
- The sole monolithic P3 `apply_patch` returned a context-verification failure
  on `AGENTS.md`. It was atomic and wrote no file. That is the immutable GOV008
  first red. No retry or replacement occurred; P3 postchecks and P4+ have zero
  runs.

M2 remains In Progress, M3 remains Not Started, and Issues #144/#274 remain
Open. GOV009 neither edits nor reclassifies these histories.

## Authority and relevant documents

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ GOV009 Issue
→ this Packet
→ Agent judgment
```

Relevant documents: Canonical Decision Register; Work Item Template; Agent
Collaboration Workflow; Milestone Exit Criteria; Release Gates; Test Strategy;
M2 Acceptance Record 001; GOV006 Packet; merged GOV008 Packet; Roadmap. Later
Accepted DEC govern any conflict.

## Scope

### In scope

1. Planning exact two: this Packet and Roadmap.
2. Fresh latest-main exact-eight Blocked publication.
3. Exactly eight sequential per-file reconstruction writes, one for every
   exact-eight destination document.
4. Five standalone frozen-source byte-equality checks; bounded content checks
   for GOV008 Packet and Roadmap.
5. Exact-eight local integrity, dual review, attempt-1 exact-head three-job CI,
   and merge.
6. Fresh postmerge tracked exact-two GOV009 Packet/Roadmap reconciliation,
   dual review, attempt-1 exact-head three-job CI, merge, then closure of Issues
   #144, #274, and the GOV009 Issue as Completed.

### Out of scope

- any exit/runtime/unit/integration/concurrent/browser/audit/migration rerun;
- code, tests, fixtures, dependencies, lockfile, config, Schema, Compose, CI,
  DEC, product, M3, or Record 001 change;
- GOV006/GOV008 evidence correction, same-head retry, replacement, diagnosis,
  repair, waiver, or Conditional Pass;
- GitHub/Issue action by the Documentation Executor.

## Exact 2 / 8 / 2 lifecycle and files

| Phase       | Exact tracked shape                                                                                           | Meaning                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Planning    | GOV009 Packet + Roadmap                                                                                       | Plan only.                              |
| Publication | `AGENTS.md`, `README.md`, `README.zh-CN.md`, Record 002, GOV006 Packet, GOV008 Packet, GOV009 Packet, Roadmap | Exact-eight strict Blocked publication. |
| Postmerge   | tracked GOV009 Packet + tracked Roadmap                                                                       | Merge/CI/Issue reconciliation only.     |

Every other path is prohibited. Record 001 remains zero-diff.

## Invocation discipline

Every process is one independent literal argv invocation with one fixed cwd
and structured terminal status. `&&`, `||`, pipes, wrappers, heredocs, command
substitution, redirection-based status, and shell-derived status are forbidden.
Only fixed cwd/SHA/PR/Issue/run IDs may first be ledgered and substituted
literally. Any missing/nonexpected status is first red: freeze the actual
shape, do not retry/correct/replace, and transfer continuation to M2-GOV-010.

## Publication ledger

### P0 — fresh latest-main identity

Use fixed repository cwd `/Users/ketchup/Projects/ContentOS`:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-009-record-002-per-file-recovery
test ! -e /private/tmp/contentos-m2-gov-009-publication-wt
git worktree add -b codex/m2-gov-009-record-002-per-file-recovery /private/tmp/contentos-m2-gov-009-publication-wt <RECOVERY_BASE_SHA>
```

Expected statuses: `0`, `0`, branch absence `1`, path absence `0`, add `0`.
Ledger exact latest `origin/main` as `<RECOVERY_BASE_SHA>`; it must include the
merged GOV008 Packet. Then fixed publication cwd is
`/private/tmp/contentos-m2-gov-009-publication-wt`:

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

Require Node `v24.18.0`, pnpm `11.17.0`, exact injection output, successful
install, and exact five applications/six packages.

### P2 — publication entry safe-count

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Expected `0`; ledger exact baseline. It authorizes no cleanup. Safe-count is
publication-only and is not repeated in postmerge docs-only reconciliation.

### P3 — frozen source identity

Fixed source cwd is
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt`. Independently:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git diff --name-status d335d01af7064fa58f5f3aec6c52fa3ba07fb950
git ls-files --others --exclude-standard
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-001.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/roadmap.md'
```

Require GOV006 branch, HEAD `d335...`, physical five `MM` plus Record002 `AM`,
working-tree name-status five `M` plus Record002 `A`, empty untracked,
Record001-zero, and forbidden-zero. Final working-tree bytes—not index—are the
source.

### P4 — exactly eight sequential per-file reconstruction writes

Execute these eight `apply_patch` tool writes in this exact order. Each call
contains only its named destination, returns success independently, and is
never retried:

1. `AGENTS.md`: reconstruct exact frozen source working-tree bytes.
2. `README.md`: reconstruct exact frozen source working-tree bytes.
3. `README.zh-CN.md`: reconstruct exact frozen source working-tree bytes.
4. `docs/implementation/m2-acceptance-record-002.md`: create exact frozen
   source working-tree bytes.
5. GOV006 Packet: reconstruct exact frozen source working-tree bytes.
6. GOV008 Packet: preserve merged planning contract; append only GOV008 actual
   P0–P3 atomic-first-red evidence and transfer to GOV009; status becomes
   `Completed — Publication Reconstruction Blocked` without changing GOV006.
7. Roadmap: preserve current-main GOV008/GOV009 entries; boundedly import only
   GOV006 current strict Blocked/protocol-red facts and update GOV008/GOV009
   recovery statuses.
8. GOV009 Packet: preserve the merged planning contract and update only its
   status to `In Review — exact-eight per-file recovery`, implementation
   identity/handoff metadata, and actual P0–P4 evidence. This final write must
   record recovery base `469828ad7557b37e4dae68a973c814bb16f6e1a0`, exact
   implementer role/runtime/thread, all reached structured statuses, and no
   unearned P5+ claim.

There is no monolithic patch and no ninth reconstruction patch. Before review,
the resulting physical shape must be seven tracked `M` files plus untracked
Record 002.

### P5 — reconstruction predicates

At fixed publication cwd, five independent byte comparisons must return `0`:

```text
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
```

Whole-file equality is prohibited for GOV008 Packet/Roadmap. Run these exact
independent fixed-string predicates, each expected `0`:

```text
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'P0–P2 passed' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'All seven frozen-source predicates passed' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'P3 postchecks and P4+ have zero runs' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'M2-GOV-009' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'M2-GOV-008 — M2 Acceptance Record 002 Publication Protocol Recovery' docs/implementation/roadmap.md
rg -F -q 'Completed — Publication Reconstruction Blocked' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-009 — M2 Acceptance Record 002 Per-File Publication Reconstruction Recovery' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 remains Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144 and #274 remain Open' docs/implementation/roadmap.md
```

### P6 — exact-eight local integrity

Before staging, status must be seven tracked `M` plus untracked Record 002;
working-tree name-status emits seven tracked `M` only and untracked emits only
Record 002. Run independently:

```text
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Every status is `0`; after staging exact eight consists of Record002 `A` plus
seven `M`, with empty untracked/forbidden/Record001 outputs and no positive
safe-count delta.

### P7 — dual review, one metadata patch, final sequence

Two non-author reviewers independently PASS: (1) frozen evidence/Blocked
decision accuracy; (2) eight-write protocol, exact-eight scope, immutable
Record/security/migration/lifecycle correctness. Any finding freezes the head.

After both PASS, exactly one additional `apply_patch` is allowed, limited to
review metadata in Record002, GOV008 Packet, GOV009 Packet, and Roadmap. It may
not reconstruct content, correct evidence, or change the decision. Then run
once and independently at the fixed publication cwd:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require exact-eight, empty-untracked, Record001-zero, forbidden-zero, and no
positive safe-count delta. This complete planned final sequence is not a retry
after red.

### P8 — commit, PR, CI, merge

At fixed publication cwd, after ledgering the GOV009 Issue number:

```text
git commit -m 'docs: reconstruct M2 acceptance record publication per file'
git rev-parse HEAD
git push -u origin codex/m2-gov-009-record-002-per-file-recovery
gh pr create --draft --base main --head codex/m2-gov-009-record-002-per-file-recovery --title 'docs: reconstruct M2 acceptance record publication per file' --body-file /private/tmp/contentos-m2-gov-009-publication-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID> --jq 'if (.head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

The outside-repo body file is created by bounded non-shell text write and
read-only validation. Require every structured status `0`, exact SHA/event,
attempt 1, completed/success, and exactly the three named jobs. Merge makes
Record002 immutable/effective Blocked and GOV006 `Completed — Exit Review
Blocked`; M2 stays In Progress, M3 Not Started, and #144/#274/GOV009 Issue stay
Open.

## Postmerge exact-two reconciliation

From fixed repository cwd, independently:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-009-record-002-per-file-recovery-reconcile
test ! -e /private/tmp/contentos-m2-gov-009-postmerge-wt
git worktree add -b codex/m2-gov-009-record-002-per-file-recovery-reconcile /private/tmp/contentos-m2-gov-009-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Require `0,0,1,0,0` and exact merge SHA. Fixed postmerge cwd is
`/private/tmp/contentos-m2-gov-009-postmerge-wt`. Confirm independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Every status is `0`; branch is the fixed reconciliation branch, both SHA
outputs equal `<PUBLICATION_MERGE_SHA>`, and status/diff/Record001 outputs are
empty. One bounded patch changes only GOV009 Packet/Roadmap with exact PR, CI,
merge, effective decision, and still-Open Issues.

Run independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require Node/pnpm/workspace, exact-two staged/status/name, empty untracked,
Record001/forbidden-zero, and all statuses `0`. No safe-count runs postmerge.
Two fresh independent reviews must PASS. One review-metadata patch limited to
the same exact two is allowed, followed once at fixed postmerge cwd by:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Every command is independent with expected status `0`; require exact-two,
empty untracked, Record001-zero, and forbidden-zero. No postmerge safe-count
observer runs.

Then independently:

```text
git commit -m 'docs: reconcile per-file record publication recovery'
git rev-parse HEAD
git push -u origin codex/m2-gov-009-record-002-per-file-recovery-reconcile
gh pr create --draft --base main --head codex/m2-gov-009-record-002-per-file-recovery-reconcile --title 'docs: reconcile per-file record publication recovery' --body-file /private/tmp/contentos-m2-gov-009-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID> --jq 'if (.head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'Strict Blocked Record 002 publication and tracked reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close 274 --reason completed --comment 'GOV008 atomic reconstruction failure is preserved and recovered by merged GOV009 publication/reconciliation.'
gh issue close <GOV009_ISSUE_NUMBER> --reason completed --comment 'GOV009 exact-eight per-file publication and exact-two reconciliation are merged.'
```

Require exact attempt-1 three-job success and every status `0`. Only after the
exact-two merge may all three Issues close Completed. Issue completion means
publication recovery completed; it does not make M2 Passed.

## Acceptance criteria

1. Planning exact two merges before implementation.
2. GOV006/GOV008 first-red evidence is immutable and no exit evidence reruns.
3. Publication starts fresh latest-main and performs exactly eight ordered,
   per-file reconstruction patches, with no retry.
4. Five standalone destinations equal frozen working-tree bytes; bounded
   predicates validate GOV008 Packet/Roadmap.
5. Exact-eight local integrity, dual reviews, final metadata sync, attempt-1
   three-job CI, and merge pass.
6. Exact-eight merge makes Record002 effective Blocked; M2/M3 and Open-Issue
   boundaries remain correct.
7. Fresh postmerge tracked exact-two passes its own checks, reviews, CI, merge;
   only then all three Issues close Completed.
8. Any red/missing result freezes and transfers to GOV010.

## Security, migration, observability

Documentation-only. No user/external content, Credential, network,
Authentication, Authorization, Object Storage, Secret, Source-safety, logging,
Export, Schema, API, Queue, migration, dependency, configuration, production,
or observability boundary changes. No `db:generate`, migration, audit, runtime,
or exit test runs. Evidence is stable, aggregate, and sanitized.

## Planning verification chronology

Planning preconditions resolved `origin/main` exactly to
`469828ad7557b37e4dae68a973c814bb16f6e1a0`; branch absence returned expected
status `1`, path absence returned `0`, and fresh worktree creation returned
`0`. The initial targeted Node 24 Packet/Roadmap Prettier write returned RC 0
and materialized 571 ignored locked packages in the fresh worktree. Targeted
Prettier check, `repository:check`, `git diff --check`, exact-two
status/tracked/untracked, Record001-zero, and forbidden-zero each returned RC 0. Status was exactly tracked `M` Roadmap plus untracked new GOV009 Packet.

After the initial chronology sync, a targeted Node 24 Packet/Roadmap Prettier
write formatted this Packet and left Roadmap unchanged; every following
targeted check returned RC 0. The three-finding DoR correction then changed
only this Packet and Roadmap. Its final targeted Node 24 Prettier write/check,
`repository:check`, `git diff --check`, exact-two status/tracked/untracked,
Record001-zero, and forbidden-zero each returned RC 0. The formatter reported
both this Packet and Roadmap unchanged; final status was exactly tracked `M`
Roadmap plus untracked GOV009 Packet, with no later edit.
No exit, runtime, test, audit, migration, GitHub, Issue, commit, push, or PR
command ran in planning.

## Definition of Ready

Ready for planning publication. Issue #276 parity and final exact-two checks are
complete. Reviewers `/root/m2_gov_006_dor_correctness` and
`/root/m2_gov_006_dor_governance`, role `DEFINITION_OF_READY_REVIEWER`, requested
`gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`, reviewed base/HEAD
`469828ad7557b37e4dae68a973c814bb16f6e1a0`, corrected exact-two, frozen source,
and #276 parity; both returned PASS/no findings/no BQ/no DEC. Authority is
planning DoR only. Planning merge and explicit Orchestrator handoff remain
required before execution.

## Definition of Done

Only merged exact-eight publication plus merged postmerge exact-two
reconciliation and Orchestrator closure of all three Issues completes GOV009.
Record002 remains Blocked, M2 In Progress, and M3 Not Started.

## Rollback and DEC

Before merge, abandon only the affected branch/PR. After Record002 merge, it is
immutable; later correction uses a new numbered recovery/record. No runtime or
database rollback exists. No new DEC is expected; an actual authority conflict
returns `HUMAN_DECISION_REQUIRED`.
