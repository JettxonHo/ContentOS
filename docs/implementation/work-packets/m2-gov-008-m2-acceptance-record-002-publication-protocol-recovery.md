# M2-GOV-008 — M2 Acceptance Record 002 Publication Protocol Recovery

**Status:** Ready — Dual Definition of Ready PASS; planning publication and
explicit same-worktree handoff pending

**Issue:** [#274](https://github.com/JettxonHo/ContentOS/issues/274) is Open;
Orchestrator body parity is synchronized to this final planning head.

## Identification

- **Task ID:** `M2-GOV-008`
- **Title:** M2 Acceptance Record 002 Publication Protocol Recovery
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Definition of Ready reviewers:** `/root/m2_gov_006_dor_correctness` and
  `/root/m2_gov_006_dor_governance`
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model:** `gpt-5.6-sol`
- **Reasoning:** High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_006_current_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-008-plan-wt`
- **Planning branch:**
  `codex/m2-gov-008-record-002-publication-recovery-plan`
- **Planning base/HEAD:**
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`
- **Planning shape:** new tracked Packet + tracked Roadmap only
- **Relevant DEC:** DEC-244–DEC-266, DEC-267–DEC-293
- **Risk classification:** milestone-decision publication integrity;
  immutable evidence preservation; repository governance

## Goal

Recover the failed M2-GOV-006 publication protocol without rerunning,
replacing, repairing, or reclassifying its frozen exit evidence. Reconstruct
the already reviewed strict Blocked decision as one exact-seven documentation
publication, validate it with independent literal invocations and two
independent reviews, merge it, then reconcile the merge through one fresh-main
tracked exact-two publication before either Issue may close.

The recovery publishes no product capability. It makes the immutable Blocked
M2 Acceptance Record 002 effective while keeping M2 In Progress and M3 Not
Started.

## Context and immutable predecessor evidence

The recovery planning base is current `origin/main`
`d335d01af7064fa58f5f3aec6c52fa3ba07fb950`. M2-GOV-006 ran its exit evidence
against that exact Reviewed Commit. The following facts are immutable inputs;
M2-GOV-008 may reproduce them in documentation but may not execute or reinterpret
them:

- GOV006 Gate 0 and Gate 1 passed, and the Gate 2 entry observer returned
  `safe-count compiled=72 compose=0 temp=1 repo-store=0`.
- GOV006 Gate 3 invoked
  `fnm exec --using=24.18.0 corepack pnpm check` exactly once. It returned
  structured exit status `1`. Format, lint, and typecheck passed before the
  first red:
  `apps/fetcher/src/public-url-transport/index.test.ts > PublicUrlTransport > rejects decoded content above 8 MiB while the expansion ratio remains below 20:1`
  timed out at 5000 ms. Test files were 54 total, 53 passed, 1 failed; tests
  were 580 total, 579 passed, 1 failed. Build was not reached and no five-build
  claim exists.
- GOV006 Gates 4–8 each have command count zero and remain
  `Not Run — stopped at first red`.
- No GOV006 same-head rerun, replacement command, diagnosis, root-cause claim,
  repair, or cleanup occurred.

The GOV006 strict six-document content was subsequently constructed and
reviewed as docs-only Blocked evidence. That content is frozen as the source
for this reconstruction. Its candidate publication protocol stopped as
follows:

1. Gate 9 step 1 returned RC 0.
2. Gate 9 step 2 returned RC 0.
3. Gate 9 step 3 returned RC 0.
4. Gate 9 step 4 used a combined command and could not supply the required
   independent structured status; this is the first publication-protocol red.
5. Gate 9 step 5 and every later publication step have count zero.

The exact-six docs-only content and its independent content reviews remain
valid frozen source evidence, but they do not make the publication eligible,
effective, or merged. The step-4 red must not be washed out by splitting and
rerunning the old candidate on the same head. This new numbered Work Item owns
one fresh-main reconstruction under a new 2/7/2 lifecycle.

The sole frozen reconstruction source is the final **working-tree bytes** in
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt`, not that worktree's
index. Its physical final working-tree allowlist is exactly:

- `AGENTS.md`;
- `README.md`;
- `README.zh-CN.md`;
- `docs/implementation/m2-acceptance-record-002.md`;
- `docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md`;
- `docs/implementation/roadmap.md`.

The staged/index state in that tree is only a prior representation of the
failed candidate and must not be copied, read as the source of truth, or used
to fill a missing working-tree path. No new hash or digest is introduced.

## Authority and relevant documents

Authority follows:

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ M2-GOV-008 Issue
→ this Work Packet
→ Agent judgment
```

- DEC-244–DEC-266 — deterministic evidence, recovery, CI, and release gates.
- DEC-267–DEC-286 — milestone scope, order, and completion boundary.
- DEC-287, DEC-288, DEC-291–DEC-293 — bounded Work Items, focused PRs,
  Definition of Ready/Done, and completion governance.
- [Canonical Decision Register](../../decisions/decisions.md)
- [Roadmap](../roadmap.md)
- [Milestone Exit Criteria](../milestone-exit-criteria.md)
- [Work Item Template](../work-item-template.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [Release Gates](../../quality/release-gates.md)
- [Test Strategy](../../quality/test-strategy.md)
- [M2 Acceptance Record 001](../m2-acceptance-record-001.md)
- [M2-GOV-006 Packet](m2-gov-006-m2-exit-review-002.md)

Later Accepted DEC govern any actual conflict.

## Dependencies and prerequisites

- This planning exact-two change must pass independent Definition of Ready
  review and merge before publication recovery begins.
- The Orchestrator must create the M2-GOV-008 Issue, synchronize exact Packet
  parity, and replace the Issue placeholder before implementation handoff.
- Recovery starts from a fresh worktree at the then-latest exact
  `origin/main`; it never reuses or edits the frozen GOV006 worktree/candidate.
- Record 001 must remain byte-for-byte and diff-for-diff unchanged.
- The frozen exact-six content must be available read-only to reconstruct, not
  to continue, the failed candidate.
- No Blocking Design Question may remain.

## In scope

1. Publish this planning Packet and Roadmap as exact two files.
2. On a fresh latest-main recovery worktree, reconstruct the frozen GOV006
   Blocked content into the exact-seven publication defined below.
3. Preserve Reviewed Commit
   `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`, the exact Gate 3 first red,
   Gate 4–8 zero counts, and the failed predecessor publication chronology.
4. Validate the exact-seven documentation change with independent literal
   invocations, structured status, fixed cwd, exact scope predicates, two
   independent reviews, and the first eligible exact-head three-job CI.
5. After merge, use a second fresh latest-main worktree to reconcile only the
   GOV008 Packet and Roadmap with publication facts, review/CI/merge evidence,
   and Issue lifecycle.
6. Permit the Orchestrator to close Issue #144 and the M2-GOV-008 Issue only
   after the postmerge tracked exact-two reconciliation itself merges.

## Out of scope

- any GOV006 exit, runtime, unit, integration, concurrent, browser, audit,
  migration, database-generation, or exact-reviewed-SHA evidence rerun;
- editing, deleting, replacing, or reclassifying Acceptance Record 001;
- changing the frozen GOV006 first red, command counts, test totals, decision,
  or independent review result;
- code, tests, fixtures, dependencies, lockfile, configuration, Schema,
  migration, Compose, CI workflow, product behavior, or runtime changes;
- diagnosing the Fetcher timeout or prescribing/implementing a repair;
- same-head retry, command replacement, combined-command status laundering,
  waiver, Conditional Pass, alternate registry, or inherited result;
- M3, Research, Agent, Render, Export, deployment, or production work;
- Issue/GitHub mutation by the Documentation Executor; those actions remain
  Orchestrator-only after their gates pass.

## Allowed and prohibited files

### Planning exact two

- `docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md`
- `docs/implementation/roadmap.md`

### Successful publication exact seven

- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/implementation/m2-acceptance-record-002.md`
- `docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md`
- `docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md`
- `docs/implementation/roadmap.md`

### Successful postmerge tracked exact two

- `docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md`
- `docs/implementation/roadmap.md`

### Prohibited modules and generated files

Every other path is prohibited. No generated file is commit-eligible. Ignored
dependency materialization may exist after the frozen install but must not
appear in tracked/untracked scope evidence. The frozen GOV006 worktree is
read-only and must not be modified.

## Contracts

- **Decision contract:** Record 002 remains strictly `Blocked`; M2 remains In
  Progress and M3 remains Not Started.
- **Evidence contract:** Reviewed Commit and all GOV006 exit results remain
  immutable; recovery records publication protocol only.
- **Record contract:** Record 002 contains the milestone fields required by
  Milestone Exit Criteria, including `Demo Result`, and identifies all
  unearned gates as `Not Run — stopped at first red`.
- **Publication contract:** no effective Record 002 exists until the exact-seven
  PR is independently reviewed, first-eligible three-job CI is green, and the
  PR is squash merged.
- **Issue contract:** #144 stays Open through exact-seven merge. Both #144 and
  the new M2-GOV-008 Issue close as Completed only after the postmerge tracked
  exact-two reconciliation passes review, first-eligible three-job CI, and
  merge.
- **Recovery contract:** any missing or red local command, review, CI result,
  scope predicate, or merge result freezes the actual candidate shape without
  rerun or replacement; M2-GOV-009 owns a new fresh-main recovery.
- **Security boundary:** documentation-only; no Credential, external input,
  network, provider, Authentication, Authorization, Object Storage, Secret,
  Source-safety, or production change.

## The exact 2 / 7 / 2 lifecycle

| Phase                    | Exact tracked shape                                                                    | Terminal meaning                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning                 | GOV008 Packet + Roadmap                                                                | Plan only; no publication or status transition.                                                                                                                        |
| Blocked publication      | `AGENTS.md`, English/Chinese README, Record 002, GOV006 Packet, GOV008 Packet, Roadmap | After review, first eligible three-job CI, and merge, Record 002 becomes immutable/effective Blocked; M2 stays In Progress, M3 stays Not Started, and #144 stays Open. |
| Postmerge reconciliation | tracked GOV008 Packet + tracked Roadmap                                                | After review, first eligible three-job CI, and merge, publication facts become current and the Orchestrator may close #144 and the GOV008 Issue as Completed.          |

No phase borrows another phase's allowance.

## Execution identity and ledger rules

The Orchestrator creates a fresh recovery tree only after planning merge. The
fixed intended identities are:

- publication worktree:
  `/private/tmp/contentos-m2-gov-008-publication-wt`;
- publication branch:
  `codex/m2-gov-008-record-002-publication-recovery`;
- postmerge worktree:
  `/private/tmp/contentos-m2-gov-008-postmerge-wt`;
- postmerge branch:
  `codex/m2-gov-008-record-002-publication-recovery-reconcile`.

Before either worktree creation, branch and path absence are separate read-only
preconditions. A non-absent branch/path stops the phase; nothing is deleted,
renamed, reused, reset, or cleaned.

Every process call below is one independent literal argv invocation with one
fixed `cwd` and one structured terminal status. `&&`, `||`, pipes, wrappers,
heredocs, command substitution, and shell-derived status are prohibited. The
executor may first resolve and ledger only the fixed cwd, branch, exact base
SHA, exact publication SHA, exact CI run ID, and Issue/PR IDs. Each placeholder
below is replaced before execution with that exact ledgered literal value; the
rendered argv and structured status are recorded. A missing status is red.
There is no rerun or replacement after any red.

Before reconstruction, use the frozen source cwd
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt` for these independent
pure-Git/read-only predicates, each expected status `0`:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git diff --name-status d335d01af7064fa58f5f3aec6c52fa3ba07fb950
git ls-files --others --exclude-standard
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code d335d01af7064fa58f5f3aec6c52fa3ba07fb950 -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/roadmap.md'
```

Require branch `codex/m2-gov-006-exit-review-002-current`, HEAD exactly
`d335d01af7064fa58f5f3aec6c52fa3ba07fb950`, and the actual physical source
shape: `MM` for `AGENTS.md`, `README.md`, `README.zh-CN.md`, the GOV006 Packet,
and Roadmap; `AM` for Record 002; and no untracked file. Working-tree
`git diff --name-status d335...` must emit those five paths as `M` and Record
002 as `A`. `git ls-files --others --exclude-standard` must be empty.
Record001-zero and forbidden-zero must pass. The index may be observed only to
prove it is not being used; its staged representation is not accepted as
source identity. Final working-tree bytes remain authoritative.

After the reconstruction patch and before formatting, compare each of the five
standalone source/destination working-tree files with separate read-only
byte-equality predicates from the publication cwd; each must return status
`0`:

```text
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
```

These equality checks pin the five standalone final working-tree byte sources
without inventing a hash. Whole-file Roadmap comparison is prohibited because
current main already contains the merged GOV008 planning entry that must be
preserved. The one P3 reconstruction patch imports/reproduces from the frozen
Roadmap only bounded GOV006 current-status, strict Blocked, and protocol-red
content while preserving the current-main GOV008 planning entry and updating
that entry's publication-recovery status.

After that one patch, run these independent non-mutating bounded content
predicates from the publication cwd; each expected status is `0` and raw diff
or hash output is prohibited:

```text
rg -F -q 'M2-GOV-006' docs/implementation/roadmap.md
rg -F -q 'Completed — Exit Review Blocked' docs/implementation/roadmap.md
rg -F -q 'step 4' docs/implementation/roadmap.md
rg -F -q 'combined-command independent-status red' docs/implementation/roadmap.md
rg -F -q 'M2-GOV-008' docs/implementation/roadmap.md
rg -F -q 'M2 Acceptance Record 002 Publication Protocol Recovery' docs/implementation/roadmap.md
rg -F -q 'exact-seven publication recovery' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 remains Not Started' docs/implementation/roadmap.md
```

P3 is exactly one reconstruction `apply_patch` covering all seven allowed
files. P6 is separately and solely one review-metadata `apply_patch`; it must
not reconstruct source content, correct evidence, or alter the decision. Any
other publication patch is red.

## Publication recovery gate ledger

All publication commands use fixed cwd
`/private/tmp/contentos-m2-gov-008-publication-wt` after the worktree exists.
Expected status is `0` unless a different expected status is stated.

### Gate P0 — fresh-main identity and clean entry

Run these as separate invocations from fixed literal repository cwd
`/Users/ketchup/Projects/ContentOS` before tree creation:

```text
git fetch origin main
git show-ref --verify --quiet refs/heads/codex/m2-gov-008-record-002-publication-recovery
test ! -e /private/tmp/contentos-m2-gov-008-publication-wt
```

The branch query must return expected status `1`; path absence must return `0`.
After ledgering the exact fetched `origin/main` SHA as `<RECOVERY_BASE_SHA>`,
create the tree with one literal invocation:

```text
git worktree add -b codex/m2-gov-008-record-002-publication-recovery /private/tmp/contentos-m2-gov-008-publication-wt <RECOVERY_BASE_SHA>
```

Then run independently at the fixed publication cwd:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require the literal branch, HEAD, and `origin/main` identities to match the
ledger; require empty status/diff and Record001-zero.

### Gate P1 — Node, pnpm, injection, install, and workspace

Run each independently at the fixed publication cwd:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e 'const names=["CONTENTOS_INTEGRATION_INJECT_CHILD_AFTER_RESOURCE_ALLOCATE","CONTENTOS_INTEGRATION_INJECT_CHILD_BEFORE_TEST_EXECUTION","CONTENTOS_INTEGRATION_INJECT_CHILD_CLEANUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_COMMAND_FAILURE","CONTENTOS_INTEGRATION_INJECT_CONCURRENT_FAILURE","CONTENTOS_INTEGRATION_INJECT_FORBIDDEN_GLOBAL_CLEANUP","CONTENTOS_INTEGRATION_INJECT_HARNESS_PROBE","CONTENTOS_INTEGRATION_INJECT_PROCESS_IDENTITY_FAILURE","CONTENTOS_INTEGRATION_INJECT_SETUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_TEARDOWN_FAILURE","CONTENTOS_INTEGRATION_INJECT_WORKER_FAILURE"];const set=names.filter((name)=>process.env[name]!==undefined);if(set.length)process.exit(1);process.stdout.write("injection-env=unset\n")'
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Require exact Node `v24.18.0`, pnpm `11.17.0`, exact
`injection-env=unset`, a successful frozen install, and exactly five
applications/six packages. This is environment/documentation preflight only;
it is not inherited GOV006 exit evidence.

### Gate P2 — entry observer

Run once at the fixed publication cwd:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Ledger the exact baseline. This docs-only task starts no application runtime and
has no authority to terminate or delete pre-existing state.

### Gate P3 — one exact-seven reconstruction

The Documentation Executor performs exactly one bounded `apply_patch`
reconstruction using the frozen reviewed exact-six content plus this GOV008
Packet. The patch may modify only the seven publication paths. It must:

- keep Record 002's Reviewed Commit at
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950` and Decision `Blocked`;
- preserve the exact Gate 3 failure and Gate 4–8 zero counts;
- record the predecessor Gate 9 steps 1–3 RC 0, step 4 protocol red, and step
  5+ zero without converting them into success;
- mark GOV006 `Completed — Exit Review Blocked` only as the frozen execution
  outcome, with publication becoming effective only after this PR merges;
- mark GOV008 `In Review — exact-seven publication recovery` until its
  postmerge reconciliation merges;
- keep M2 In Progress, M3 Not Started, #144 Open, and the GOV008 Issue Open;
- leave Record 001 and every non-seven path unchanged.

The `apply_patch` tool result must be successful. A partial, missing, or failed
patch freezes the actual shape and stops.

### Gate P4 — first exact-seven local sequence

Run each line independently at the fixed publication cwd, in this order:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

All statuses must be `0`. Before `git add`, status must contain exactly six
tracked `M` entries plus `?? docs/implementation/m2-acceptance-record-002.md`;
`git diff --name-status <RECOVERY_BASE_SHA>` must emit only the six tracked
`M` paths, and the independent untracked command must emit exactly Record 002.
After the independent `git add`, cached name-status/name-only and status must
contain exactly all seven allowed paths: Record 002 is `A`; the other six are
`M`. The later untracked output, Record001-zero, and forbidden-diff outputs
must be empty. The final safe-count applies only to this exact-seven
publication phase and must have no positive delta from its entry observation.
A lower count does not authorize cleanup or attribution.

### Gate P5 — independent publication review

Two reviewers who did not author the reconstruction independently inspect the
real exact-seven diff, frozen exact-six source, GOV006 evidence chronology,
Record 001 immutability, security/migration boundaries, exact scope, and all
local statuses:

1. evidence accuracy and strict Blocked decision correctness;
2. executable publication protocol, exact scope, immutable record boundary,
   security, migration, and lifecycle correctness.

Each returns `PASS`, `NEEDS CHANGES`, or `BLOCKED` with logical role, requested
model/reasoning, thread, actual runtime status, reviewed base/shape, and
findings. Only two `PASS` results proceed. A finding, missing review, or other
result freezes the candidate; no correction or re-review occurs on that
candidate.

### Gate P6 — review metadata sync and final same-head sequence

After both reviews pass, perform one bounded metadata-only `apply_patch` on the
allowed exact-seven documents to record the two review identities/results and
close no other gap. This is not a second reconstruction. No code, Record 001,
decision, test count, or frozen evidence may change.

Then run the following final sequence once, independently and in order, at the
same fixed cwd:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Apply the same exact-seven, empty-untracked, Record001-zero,
forbidden-zero, diff-check, and no-positive-safe-count-delta predicates. This
is the planned post-review final sequence, not permission to repeat a red
earlier command.

### Gate P7 — commit, PR, exact-head CI, and merge

Only the Orchestrator may proceed after Gate P6 is green. From fixed
publication cwd, first ledger `<GOV008_ISSUE_NUMBER>` from the already-created
Issue and substitute it literally into every later argv. Then run these
independent literal invocations, each expected status `0`:

```text
git commit -m 'docs: recover M2 acceptance record 002 publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-008-record-002-publication-recovery
gh pr create --draft --base main --head codex/m2-gov-008-record-002-publication-recovery --title 'docs: recover M2 acceptance record 002 publication' --body-file /private/tmp/contentos-m2-gov-008-publication-pr-body.md
```

The PR-body file must be created earlier by one bounded non-shell text write
outside the repository and validated read-only; it is not created by wrapper,
redirection, heredoc, or command substitution. Ledger the exact `git rev-parse
HEAD` output as `<PUBLICATION_SHA>` and the exact returned PR number as
`<PUBLICATION_PR_NUMBER>`. Perform no further source edit.

The first eligible CI run for `<PUBLICATION_SHA>` must be push/PR attempt 1,
completed/success, with exactly these three completed/success jobs and no
missing or extra job:

- `Docker-independent quality`;
- `Integration smoke (Docker)`;
- `M1/M2 browser smoke (Chromium)`.

Read-only queries must use the exact ledgered SHA and run ID as literal argv.
No dispatch, rerun, replacement head, or other-SHA evidence is permitted.
After both reviews and the first eligible three-job CI are green, the
Orchestrator may squash merge.

After substituting the ledgered values literally, run the first-eligible CI
queries independently from the fixed publication cwd:

```text
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_CI_RUN_ID> --jq 'if (.id==<PUBLICATION_CI_RUN_ID> and .head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_CI_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

The first query must return one six-field line with the exact SHA, event
`pull_request`, attempt `1`, completed/success; ledger its first field as
`<PUBLICATION_CI_RUN_ID>`. Predicate outputs must be exactly
`publication-ci=verified` and `publication-ci-jobs=verified`. `gh pr ready` and
merge each require status `0`; final view must report `MERGED`, a nonempty merge
timestamp, and one exact merge SHA, ledgered as `<PUBLICATION_MERGE_SHA>`.

That merge makes Record 002 immutable and effective as `Blocked`, makes
M2-GOV-006 `Completed — Exit Review Blocked`, leaves M2 In Progress and M3 Not
Started, and leaves Issue #144 and the M2-GOV-008 Issue Open. It does not
authorize any exit-evidence rerun or M3 work.

## Postmerge tracked exact-two reconciliation

After the exact-seven merge, use fixed repository cwd
`/Users/ketchup/Projects/ContentOS` and run each literal invocation separately:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-008-record-002-publication-recovery-reconcile
test ! -e /private/tmp/contentos-m2-gov-008-postmerge-wt
git worktree add -b codex/m2-gov-008-record-002-publication-recovery-reconcile /private/tmp/contentos-m2-gov-008-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Expected statuses are `0`, `0`, expected absence `1`, `0`, and `0`. Require
`origin/main` exactly `<PUBLICATION_MERGE_SHA>` before tree creation; otherwise
stop. All later commands use fixed cwd
`/private/tmp/contentos-m2-gov-008-postmerge-wt`. Confirm entry independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require the fixed branch and exact SHA identities, empty status/diff, and
Record001-zero.

One bounded `apply_patch` updates only the GOV008 Packet and Roadmap with the
exact publication PR, first eligible CI run/jobs, squash SHA, effective
Record002 Blocked decision, M2/M3 state, and both still-Open Issues. Then run
each independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require Node 24.18.0, pnpm 11.17.0, workspace exact five/six, every status 0,
exactly two staged tracked paths, empty untracked/Record001/forbidden outputs,
and no other path. Two fresh independent reviewers must return PASS on the
real exact-two diff and publication-fact accuracy. After one bounded
review-metadata `apply_patch`, run the full final sequence below independently
at the same fixed postmerge cwd:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

This planned final stage is not a retry after red. The postmerge phase is
docs-only and does not repeat the publication safe-count/runtime observer.

Only then may the Orchestrator substitute the already-ledgered
`<GOV008_ISSUE_NUMBER>` and execute from the fixed postmerge cwd:

```text
git commit -m 'docs: reconcile M2 acceptance record 002 publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-008-record-002-publication-recovery-reconcile
gh pr create --draft --base main --head codex/m2-gov-008-record-002-publication-recovery-reconcile --title 'docs: reconcile M2 acceptance record 002 publication' --body-file /private/tmp/contentos-m2-gov-008-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_CI_RUN_ID> --jq 'if (.id==<RECONCILIATION_CI_RUN_ID> and .head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_CI_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'M2 Acceptance Record 002 strict Blocked publication and tracked postmerge reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close <GOV008_ISSUE_NUMBER> --reason completed --comment 'M2-GOV-008 exact-seven publication recovery and tracked exact-two reconciliation are merged.'
```

The outside-repository postmerge PR-body file follows the same non-shell
creation/read-only-validation rule. Ledger `git rev-parse HEAD` as
`<RECONCILIATION_SHA>`, PR creation output as `<RECONCILIATION_PR_NUMBER>`, and
the first CI query's run ID as `<RECONCILIATION_CI_RUN_ID>`. Require the exact
SHA, pull-request event, attempt 1, completed/success, and exact three jobs;
predicate outputs must be `reconciliation-ci=verified` and
`reconciliation-ci-jobs=verified`. Every ready/merge/view/Issue command must
return structured status `0`; merge view must report `MERGED` with one exact
merge SHA. After that exact-two merge—and not before—the Orchestrator may close
Issue #144 and the M2-GOV-008 Issue as Completed. The
closure means the strict Blocked decision was published and reconciled; it
does not make M2 Passed. M2 remains In Progress and M3 remains Not Started.

## First-red recovery rule

Any missing or red local command, structured terminal status, exact-scope
predicate, independent review, first eligible CI job/run, or required merge
freezes the actual candidate shape and chronology. Do not rerun unchanged,
replace the command, repair that head, create a replacement head, weaken the
criterion, or borrow evidence. Close any created PR unmerged. M2-GOV-009 must
start from a new fresh latest-main base and explicitly recover the frozen
publication or reconciliation boundary.

If the red occurs after the exact-seven merge, Record 002 remains immutable and
effective Blocked. M2 remains In Progress, M3 Not Started, and both Issues stay
Open until a later numbered exact-two recovery merges.

## Acceptance criteria

1. Planning publishes exactly the GOV008 Packet and Roadmap from base
   `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`.
2. The GOV006 exit and failed-publication chronologies are preserved exactly;
   no exit evidence is rerun, repaired, inherited, or reclassified.
3. Publication recovery begins only from a fresh latest-main worktree after
   planning merge and reconstructs exactly seven authorized documents with one
   bounded reconstruction patch.
4. Every local process call is an independent literal invocation with fixed
   cwd and structured status; no combined command, pipe, wrapper, heredoc,
   rerun, or replacement is used.
5. Exact-seven formatter, static, repository, Secret, status, diff,
   Record001-zero, forbidden-zero, and safe-count evidence is green before and
   after dual review metadata sync.
6. Two independent reviewers PASS the real exact-seven diff; the first
   eligible exact-head CI has exactly the three required successful jobs.
7. Exact-seven merge makes Record 002 effective Blocked while M2 remains In
   Progress, M3 Not Started, and #144/new GOV008 Issue remain Open.
8. Fresh postmerge reconciliation changes exactly the tracked GOV008 Packet
   and Roadmap, passes Node 24/static/scope checks, dual review, first eligible
   three-job CI, and merge.
9. Only the merged exact-two reconciliation permits both Issues to close
   Completed. No result in this Work Item completes M2 or starts M3.
10. Any red/missing result freezes the actual shape and transfers recovery to
    M2-GOV-009 without same-head retry or replacement.

## Required tests and evidence

- **Static/documentation:** targeted Prettier write/check, repository-wide
  `format:check`, `check:docs`, `repository:check`, `check:secrets`, and
  `git diff --check`.
- **Scope/integrity:** exact staged/name/status evidence, empty untracked set,
  Record001-zero, forbidden-diff-zero, exact entry/final safe-count comparison.
- **Review:** two independent PASS results for exact-seven publication and two
  fresh independent PASS results for postmerge exact-two reconciliation.
- **CI:** first eligible exact-head attempt-1 three-job CI for each PR.
- **Exit/runtime/unit/integration/browser/audit/migration:** Not Run by
  M2-GOV-008; frozen GOV006 evidence is cited, never rerun.
- **Manual demo:** Not applicable; no product behavior changes. Record 002's
  frozen `Demo Result` remains Blocked/Not Run because GOV006 stopped at the
  earlier root red.

## Security review

Documentation-only. The task handles no user content or external input and
introduces no Credential, provider transmission, network access,
Authentication, Authorization, Object Storage, logging, Export, deletion,
Source-safety, prompt-injection, Renderer-isolation, or Secret boundary. It
runs the existing Secret checks and records aggregate/sanitized evidence only.
No new security technology, hash, cleanup authority, or exception is allowed.

## Migration and compatibility review

No database, Schema, API, Queue Payload, Artifact Version, Agent Spec, Prompt,
dependency, lockfile, configuration, migration, backfill, compatibility, or
rollback change is authorized. No `db:generate` or `db:migrate` command runs.
Any such diff is forbidden and red.

## Observability

No production Log, Metric, Trace, Audit Event, Failure Category, or Correlation
ID changes. The Packet records only stable Git/GitHub identifiers, aggregate
test counts already frozen by GOV006, structured process statuses, review
metadata, and safe-count summaries. It excludes Secrets, private content,
temporary URLs, raw child output, process IDs, and local credentials.

## Documentation updates

- Planning: new GOV008 Packet + Roadmap only.
- Blocked publication: the exact seven authorized documents.
- Postmerge reconciliation: tracked GOV008 Packet + Roadmap only.
- Record 001, Accepted DEC, code, configuration, and M3 documents: unchanged.
- Issue creation/parity and later status transitions: Orchestrator-only.

## Planning verification chronology

The precondition checks were run from the repository root as separate read-only
invocations. Local `main` resolved to
`4d641d9224a6ab54306b71bc32ea9e5e924e7a05`, so it was not used or moved;
`origin/main` resolved exactly to the authorized planning base
`d335d01af7064fa58f5f3aec6c52fa3ba07fb950`. The target branch query returned
the expected absence status `1`, and the target worktree-path absence check
returned RC 0. One literal `git worktree add -b` invocation returned RC 0 and
created this fresh branch/worktree at the exact authorized SHA.

After the initial exact-two write, targeted Node 24 Packet/Roadmap Prettier
write returned RC 0. Because the fresh worktree had no materialized workspace
dependencies, it materialized 571 ignored locked packages; no extra tracked or
untracked publication path appeared. Targeted Prettier check,
`repository:check`, `git diff --check`, Record001-zero, and the forbidden-diff
predicate each independently returned RC 0. Status was exactly tracked `M`
Roadmap plus untracked new GOV008 Packet. The ordinary tracked
`git diff --name-only` emitted only Roadmap, while the new Packet was correctly
represented by the independent untracked/status evidence.

No exit, runtime, test, audit, migration, commit, push, or PR command ran in
planning. The Planning Agent made no GitHub or Issue mutation; the Orchestrator
created Issue #274 and synchronized its body after the Packet was complete.
After this bounded Issue wording correction, final current-head targeted
Packet/Roadmap Prettier write/check, `repository:check`, `git diff --check`,
exact-two status/name/untracked, Record001-zero, and forbidden-diff predicates
each ran independently once and returned RC 0/PASS. No later document edit
occurred before Definition of Ready review.

The first dual-DoR correction changed only this Packet and Roadmap to pin the
frozen source and make the publication/postmerge protocol executable. A second
bounded correction records the actual frozen `MM`/`AM`/empty-untracked shape
and replaces Roadmap whole-file equality with five standalone byte comparisons
plus bounded fixed-string predicates. It also makes the exactly-one P3
reconstruction patch and metadata-only P6 patch disjoint. Final targeted Node
24 Packet/Roadmap Prettier write/check, `repository:check`, `git diff --check`,
exact-two status/tracked/untracked, Record001-zero, and forbidden-zero each
returned RC 0. The formatter reported both documents unchanged; final status
was exactly tracked `M` Roadmap plus untracked GOV008 Packet, with no later
edit.

## Definition of Ready

Ready for planning publication only. Both `/root/m2_gov_006_dor_correctness`
and `/root/m2_gov_006_dor_governance`, role `DEFINITION_OF_READY_REVIEWER`,
requested `gpt-5.6-sol` High, actual `UNVERIFIED_RUNTIME_MODEL`, reviewed base/
HEAD `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`, the corrected physical exact-two
Packet/Roadmap, frozen GOV006 source contract, and live Issue #274 parity. Both
returned PASS/no findings; no BQ and no DEC. Their authority is planning DoR
only. Planning PR/CI/merge and a later explicit same-worktree handoff remain
required before Gate P0. No Planning Agent self-declaration authorizes
execution.

## Definition of Done

M2-GOV-008 is Completed only after the exact-seven Blocked publication and the
fresh postmerge tracked exact-two reconciliation are both independently
reviewed, pass their own first eligible exact-head three-job CI, and merge; the
Orchestrator then closes Issue #144 and the M2-GOV-008 Issue as Completed.
Record 002 remains immutable Blocked, M2 remains In Progress, and M3 remains
Not Started.

## Rollback

Before exact-seven merge, abandon only the affected recovery branch/PR; never
edit the frozen GOV006 worktree. After exact-seven merge, Record 002 is
immutable and must not be edited or deleted; only a later numbered docs-recovery
Work Item may reconcile publication facts. No runtime/database rollback exists.

## Completion report requirements

Report: Summary; design choices; exact files changed; commands and structured
statuses; test/static/scope results; Acceptance Criteria evidence; security and
migration impact; review identities/results; CI/PR/merge facts; known
limitations; incomplete items; documentation updates; possible DEC; and Git
status. Never claim an unrun check passed.

## Possible new DEC

None expected. An actual conflict that changes accepted scope, architecture,
security, workflow, agent responsibility, or a release gate stops work and
returns `HUMAN_DECISION_REQUIRED`.
