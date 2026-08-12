# M2-GOV-012 — M2 Acceptance Record 002 Deterministic Expected-Byte Recovery

**Status:** Ready — Explicit Orchestrator same-worktree handoff recorded

**Issue:** [#282](https://github.com/JettxonHo/ContentOS/issues/282) is Open;
Orchestrator body parity is synchronized to this final planning head.

## Identification

- **Task ID:** `M2-GOV-012`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / deterministic documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model / reasoning:** `gpt-5.6-sol` / High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_012_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-012-plan-wt`
- **Planning branch:** `codex/m2-gov-012-deterministic-packet-recovery-plan`
- **Planning base/HEAD:** `bafef0208a6bed51795217f79b51975064d22974`
- **Planning shape:** new GOV012 Packet + tracked Roadmap only
- **Relevant DEC:** DEC-244–DEC-266 and DEC-267–DEC-293
- **Risk:** immutable milestone-decision publication integrity

## Goal

Recover the strict Blocked M2 Acceptance Record 002 publication after
GOV011's eighth reconstruction write passed its non-error tool-result and
target-status gates but failed a literal marker predicate. Start from fresh
latest main and replace marker-only physical proof for mutable history with
prebuilt, independently validated, outside-repository expected artifacts.
Every repository write must then have its own target-only status and exact
byte equality to the validated expected artifact before the next write.

Publish exactly eleven strict Blocked documents, then reconcile the effective
publication through one fresh-main tracked exact-two Packet/Roadmap change.
This bounded repair does not rerun or reinterpret exit/runtime evidence and
does not change the strict `Blocked` decision.

## Immutable predecessor evidence

### M2-GOV-006

- Reviewed Commit remains
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`.
- Gate 3 root `check` ran exactly once and returned structured exit `1`.
  Format, lint, and typecheck passed. The Fetcher public-transport test
  `rejects decoded content above 8 MiB while the expansion ratio remains below 20:1`
  timed out at 5000 ms. Test files were 54 total, 53 passed, 1 failed; tests
  were 580 total, 579 passed, 1 failed; build was not reached.
- Gates 4–8 have zero runs. No rerun, replacement, diagnosis, repair, cause
  claim, or cleanup occurred.
- Gate 9 steps 1–3 returned RC 0. Step 4 remains the publication first red
  because `git add` lacked an independent invocation and structured status;
  step 5 onward is zero/unearned.
- Final GOV006 working-tree bytes remain the source for the five standalone
  frozen documents. Record 002 remains ineffective and Issue #144 remains
  Open.

### M2-GOV-008 through M2-GOV-010

- GOV008 planning PR #275 merged as
  `469828ad7557b37e4dae68a973c814bb16f6e1a0`. Its monolithic P3 patch failed
  context verification on `AGENTS.md`, was atomic, and wrote no file.
- GOV009 planning PR #277 merged as
  `3562b56b865d20b02f6cf50e295f062f5e4da4cd`. Its first per-file write used
  invalid numeric hunk `@@ -1,14 +1,34 @@`, failed atomically, and left later
  writes/gates at zero.
- GOV010 planning PR #279 used attempt-1 run `31585514462`; all three required
  jobs succeeded, and it squash merged as
  `6acde678ff3a3bba3002ea23bfad310b43551530`. GOV010 P0–P3 passed. Its first
  native patch returned literal `{}` without error and physically modified
  only `AGENTS.md`; the then-contract did not define that result as explicit
  success, so writes 2–9/P5+ remained zero.

### M2-GOV-011

- Planning PR #281, head
  `07dfa5bcf777c6d12e9f40869baedb7576c90506`, used first eligible
  pull-request run `31588518215`, attempt 1. Docker-independent quality,
  Integration smoke, and M1/M2 browser smoke all completed successfully. It
  squash merged at `2026-08-12T10:44:41Z` as
  `bafef0208a6bed51795217f79b51975064d22974`. Issue #280 remains Open.
- GOV011 implementation P0–P3 passed on the fresh publication tree. P2
  returned `safe-count compiled=72 compose=0 temp=1 repo-store=0` and
  authorized no cleanup.
- P4 writes 1–7 each returned the non-error serialized result `{}`. Each
  target-only status returned RC 0 with its expected target state and each
  immediate `cmp` or literal `rg` predicate returned RC 0.
- P4 write 8 targeted only the GOV010 Packet and returned `{}` without a tool
  error. Its immediate target-only status returned RC 0 with exactly one
  modified target. The next literal predicate for
  `Recovery handoff: M2-GOV-011 after the literal empty-object result red.`
  returned RC 1 with empty output. That predicate is the first red.
- P4 writes 9–10 and P5+ have zero runs. No retry, diagnosis, correction,
  document closeout, Git/GitHub/Issue mutation, or cleanup followed.
- No whole-tree shape command ran after the red. A preliminary expected shape
  was derived from reached per-target evidence, but it is not accepted as a
  confirmed whole-tree observation and GOV012 must not retroactively claim
  one.

Every predecessor first red remains immutable. M2 remains In Progress, M3
remains Not Started, Record 002 is ineffective, and Issues
#144/#274/#276/#278/#280/#282 remain Open.

## Authority and relevant documents

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ Issue #282
→ this Packet
→ Agent judgment
```

Relevant documents: Canonical Decision Register; Work Item Template; Agent
Collaboration Workflow; Milestone Exit Criteria; Release Gates; Test Strategy;
M2 Acceptance Record 001; GOV006/GOV008/GOV009/GOV010/GOV011 Packets; and
Roadmap. Later Accepted DEC govern an actual conflict.

## Scope

### In scope

1. Planning exact two: this Packet and Roadmap.
2. Fresh latest-main exact-eleven strict Blocked publication.
3. A fixed task-owned outside-repository expected-artifact directory created
   and validated before any publication write.
4. Five frozen expected artifacts copied byte-for-byte from the authoritative
   GOV006 working tree; six mutable expected artifacts reconstructed from
   fresh-main bytes by bounded non-shell single-file patches and validated by
   independent structured-section proofs.
5. Exactly eleven ordered per-file repository `apply_patch` writes. Every
   non-error candidate is followed immediately by target-only status and byte
   equality to its already validated expected artifact.
6. Exact-eleven local integrity, dual independent review, first eligible
   attempt-1 exact-head three-job CI, and squash merge.
7. Fresh postmerge tracked exact-two GOV012 Packet/Roadmap reconciliation,
   dual review, first eligible attempt-1 exact-head three-job CI, merge, then
   Orchestrator closure of Issues #144/#274/#276/#278/#280/#282 as Completed.

### Out of scope

- any direct/local exit, runtime, unit, Integration, Concurrent, Browser,
  audit, database-generation, or migration replay; documentation-PR CI is
  publication eligibility only and is not GOV006 exit/runtime evidence;
- code, tests, fixtures, dependencies, lockfile, configuration, Schema,
  Compose, CI, DEC, product, M3, or Record 001 change;
- changing a predecessor first red, rerunning its predicate, confirming its
  unobserved whole-tree shape, or reusing a failed head;
- marker-only proof, self-describing marker proof, same-head retry,
  replacement command/head, diagnosis, waiver, Conditional Pass, or inherited
  runtime result;
- GitHub/Issue mutation by the Documentation Executor.

## Exact 2 / 11 / 2 lifecycle and allowed files

| Phase       | Exact tracked shape                                                                               | Meaning                                  |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Planning    | GOV012 Packet + Roadmap                                                                           | Plan only.                               |
| Publication | `AGENTS.md`, both READMEs, Record 002, GOV006/GOV008/GOV009/GOV010/GOV011/GOV012 Packets, Roadmap | Exact-eleven strict Blocked publication. |
| Postmerge   | tracked GOV012 Packet + tracked Roadmap                                                           | Publication reconciliation only.         |

Every other repository path is prohibited. Record 001 remains zero-diff. No
generated expected artifact is commit-eligible; all live under the validated
fixed external directory `/private/tmp/contentos-m2-gov-012-expected`.

## Invocation, tool-result, and first-red discipline

Every process command is one independent literal invocation with fixed cwd and
structured terminal status. `&&`, `||`, pipes, wrappers, heredocs, command
substitution, redirection-derived status, and shell-derived status are
prohibited. Only fixed cwd/SHA/PR/Issue/run IDs may first be ledgered and then
substituted as literal argv.

Every `apply_patch` call is one independent governed tool invocation. A call
that returns control without tool error, exception, transport failure,
explicit error result, or missing result is a non-error candidate; serialized
`{}` is allowed only as that candidate. It never proves content. A tool-level
red stops before post-write verification. After a non-error candidate, the
declared target-only status and byte-equality pair must both return RC 0 before
the next write. Any other result is first red and transfers continuation to
M2-GOV-013 without retry or replacement.

## Deterministic expected-artifact contract

All expected bytes are complete and independently validated before the first
repository write. The fixed directory is
`/private/tmp/contentos-m2-gov-012-expected`. Expected artifacts are never
staged or copied into the repository. Repository files change only through
the eleven governed P5 `apply_patch` calls.

The five frozen artifacts are exact `cp` copies of authoritative GOV006
working-tree bytes. Each of the six mutable artifacts is an exact `cp` of its
fresh-main destination plus exactly one appended block below. No pre-existing
status line is replaced; the appended structured block is the recovery status
source until postmerge reconciliation.

These are the six exact appended blocks. Before execution, every literal
`<RECOVERY_BASE_SHA>` is replaced once with the resolved lowercase 40-hex
fresh-main SHA. No other key, value, whitespace, heading, or content change is
allowed:

````text
## M2-GOV-012 recovery of GOV008

```json
{"task":"M2-GOV-012","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

````text
## M2-GOV-012 recovery of GOV009

```json
{"task":"M2-GOV-012","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

````text
## M2-GOV-012 recovery of GOV010

```json
{"task":"M2-GOV-012","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

````text
## M2-GOV-012 recovery of GOV011

```json
{"task":"M2-GOV-012","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":281,"planningRun":31588518215,"planningSquash":"bafef0208a6bed51795217f79b51975064d22974","passedThrough":"P4-write-8-target-status","firstRed":"P4-write-8-literal-predicate","writesAfterRed":0,"laterGateRuns":0,"wholeTreeShape":"unconfirmed","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

````text
## GOV012 publication implementation evidence

```json
{"task":"M2-GOV-012","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

````text
### M2-GOV-012 roadmap recovery boundary

```json
{"task":"M2-GOV-012","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/11/2","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}
```
````

For each mutable artifact, the exact validator argv is the following command
with only its three quoted literal tokens replaced from the table. The script
requires exactly one heading, one immediately following fenced JSON object,
the exact key order/count, and deep byte-for-byte JSON serialization equality:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block))process.exit(1);const parsed=JSON.parse(j);if(JSON.stringify(parsed)!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '<EXPECTED_PATH>' '<HEADING>' '<EXACT_JSON>'
```

| Expected path                                                 | Heading                                         | Exact JSON                        |
| ------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| `/private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md` | `## M2-GOV-012 recovery of GOV008`              | the exact GOV008 JSON line above  |
| `/private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md` | `## M2-GOV-012 recovery of GOV009`              | the exact GOV009 JSON line above  |
| `/private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md` | `## M2-GOV-012 recovery of GOV010`              | the exact GOV010 JSON line above  |
| `/private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md` | `## M2-GOV-012 recovery of GOV011`              | the exact GOV011 JSON line above  |
| `/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md` | `## GOV012 publication implementation evidence` | the exact GOV012 JSON line above  |
| `/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md`    | `### M2-GOV-012 roadmap recovery boundary`      | the exact Roadmap JSON line above |

Each external and repository patch payload is fixed: exactly one allowed file
section, bare `@@`, current EOF context, and the corresponding exact appended
block above. The executor may read stable context immediately before a call
but may not invent or change content. Whole-file `cmp` against the independently
validated expected artifact is the physical-effect oracle, not a marker
sentence.

Before P5, all eleven expected artifacts must exist and every frozen `cmp` and
six structural validators must have returned RC 0. No hash or digest is used.

## Publication ledger

### P0 — fresh latest-main identity

From `/Users/ketchup/Projects/ContentOS`, independently:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-012-deterministic-expected-byte-recovery
test ! -e /private/tmp/contentos-m2-gov-012-publication-wt
test ! -e /private/tmp/contentos-m2-gov-012-expected
git worktree add -b codex/m2-gov-012-deterministic-expected-byte-recovery /private/tmp/contentos-m2-gov-012-publication-wt <RECOVERY_BASE_SHA>
```

Require statuses `0,0,1,0,0,0`. Ledger latest `origin/main` as
`<RECOVERY_BASE_SHA>`; it must include merged GOV012 planning. From fixed
publication cwd `/private/tmp/contentos-m2-gov-012-publication-wt`, require:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

All return RC 0; identities match, status/diff are empty, Record001-zero passes.

### P1 — Node, pnpm, injection, install, workspace

Run independently at fixed publication cwd:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e 'const names=["CONTENTOS_INTEGRATION_INJECT_CHILD_AFTER_RESOURCE_ALLOCATE","CONTENTOS_INTEGRATION_INJECT_CHILD_BEFORE_TEST_EXECUTION","CONTENTOS_INTEGRATION_INJECT_CHILD_CLEANUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_COMMAND_FAILURE","CONTENTOS_INTEGRATION_INJECT_CONCURRENT_FAILURE","CONTENTOS_INTEGRATION_INJECT_FORBIDDEN_GLOBAL_CLEANUP","CONTENTOS_INTEGRATION_INJECT_HARNESS_PROBE","CONTENTOS_INTEGRATION_INJECT_PROCESS_IDENTITY_FAILURE","CONTENTOS_INTEGRATION_INJECT_SETUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_TEARDOWN_FAILURE","CONTENTOS_INTEGRATION_INJECT_WORKER_FAILURE"];const set=names.filter((name)=>process.env[name]!==undefined);if(set.length)process.exit(1);process.stdout.write("injection-env=unset\n")'
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Require Node `v24.18.0`, pnpm `11.17.0`, exact `injection-env=unset`, frozen
install success, and exactly five applications/six packages.

### P2 — entry safe-count

Run once at fixed publication cwd:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require RC 0 and ledger all four fields. It authorizes no cleanup. This exact
observer runs again only where written literally below.

### P3 — frozen source and failed-head identities

From `/private/tmp/contentos-m2-gov-006-exit-review-current-wt`, independently:

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
forbidden-zero.

From `/private/tmp/contentos-m2-gov-011-publication-wt`, run only:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all -- AGENTS.md
git status --short --untracked-files=all -- README.md
git status --short --untracked-files=all -- README.zh-CN.md
git status --short --untracked-files=all -- docs/implementation/m2-acceptance-record-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
```

Require exact GOV011 publication branch and HEAD
`bafef0208a6bed51795217f79b51975064d22974`. The eight target states must match
their already reached evidence: existing files ` M`, Record002 `??`. These are
target-only observations, not a whole-tree-shape claim. Do not rerun the
historical failed literal predicate.

Still at fixed publication cwd, run these independent read-only Issue
predicates before P4. Require RC 0 and exact output `issue-open=verified` from
each:

```text
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
```

### P4 — build and validate all eleven expected artifacts

Run independently from fixed publication cwd:

```text
mkdir /private/tmp/contentos-m2-gov-012-expected
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,readdirSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-expected"||!s.isDirectory()||s.uid!==process.getuid()||readdirSync(p).length!==0)process.exit(1);process.stdout.write("expected-dir=validated-empty\n")'
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md /private/tmp/contentos-m2-gov-012-expected/01-AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md /private/tmp/contentos-m2-gov-012-expected/01-AGENTS.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md /private/tmp/contentos-m2-gov-012-expected/02-README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md /private/tmp/contentos-m2-gov-012-expected/02-README.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md /private/tmp/contentos-m2-gov-012-expected/03-README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md /private/tmp/contentos-m2-gov-012-expected/03-README.zh-CN.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md /private/tmp/contentos-m2-gov-012-expected/04-m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md /private/tmp/contentos-m2-gov-012-expected/04-m2-acceptance-record-002.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md /private/tmp/contentos-m2-gov-012-expected/05-m2-gov-006.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md /private/tmp/contentos-m2-gov-012-expected/05-m2-gov-006.md
cp docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md /private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md
cp docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md /private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md
cp docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md /private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md
cp docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md /private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md
cp docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md /private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md
cp docs/implementation/roadmap.md /private/tmp/contentos-m2-gov-012-expected/11-roadmap.md
```

Each `cp` requires RC 0. Then execute six ordered external single-file
`apply_patch` calls, paths `06` through `11`, using exactly the payload blocks
and GOV012 status replacement frozen above. Each non-error candidate is
followed immediately by the corresponding independent command below, rendered
once with the literal resolved SHA. Each requires RC 0 and exact output
`expected-structure=verified` before the next external patch:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md' '## M2-GOV-012 recovery of GOV008' '{"task":"M2-GOV-012","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md' '## M2-GOV-012 recovery of GOV009' '{"task":"M2-GOV-012","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md' '## M2-GOV-012 recovery of GOV010' '{"task":"M2-GOV-012","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md' '## M2-GOV-012 recovery of GOV011' '{"task":"M2-GOV-012","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":281,"planningRun":31588518215,"planningSquash":"bafef0208a6bed51795217f79b51975064d22974","passedThrough":"P4-write-8-target-status","firstRed":"P4-write-8-literal-predicate","writesAfterRed":0,"laterGateRuns":0,"wholeTreeShape":"unconfirmed","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md' '## GOV012 publication implementation evidence' '{"task":"M2-GOV-012","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md' '### M2-GOV-012 roadmap recovery boundary' '{"task":"M2-GOV-012","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/11/2","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
```

A red prevents the next patch and all P5 writes.

### P5 — exactly eleven repository writes with expected-byte proof

Execute exactly eleven single-file native `apply_patch` calls in the same
order and with the same content changes as the expected artifacts. After each
non-error result, run its literal target-only status command and then `cmp`
the already validated expected artifact to the repository target. Existing
files must emit exactly one ` M <path>`; Record 002 must emit exactly one
`?? <path>`. Every pair returns RC 0 before the next write:

```text
git status --short --untracked-files=all -- AGENTS.md
cmp /private/tmp/contentos-m2-gov-012-expected/01-AGENTS.md AGENTS.md
git status --short --untracked-files=all -- README.md
cmp /private/tmp/contentos-m2-gov-012-expected/02-README.md README.md
git status --short --untracked-files=all -- README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-012-expected/03-README.zh-CN.md README.zh-CN.md
git status --short --untracked-files=all -- docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-expected/11-roadmap.md docs/implementation/roadmap.md
```

There is no twelfth reconstruction write and no literal marker-only content
predicate. Before review, successful physical shape is ten tracked `M` plus
untracked Record 002.

### P6 — exact-eleven local integrity

Run independently in this literal order:

```text
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-012-expected/01-AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-012-expected/02-README.md README.md
cmp /private/tmp/contentos-m2-gov-012-expected/03-README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-012-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/11-roadmap.md docs/implementation/roadmap.md
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Every RC is 0. Before staging require ten `M` plus Record002 `??`; after
staging require ten `M` plus Record002 `A`, empty untracked, and no positive
safe-count delta. No expected artifact changes between its literal P4
structural validation and this sequence. The eleven full-file comparisons
therefore bind repository bytes to those already validated expected bytes
before `git diff --check`.

### P7 — dual independent publication review

Two non-author reviewers independently inspect and PASS: (1) frozen evidence,
predecessor chronology, expected artifacts, and strict Blocked decision
accuracy; (2) deterministic expected-byte protocol, exact-eleven scope,
Record immutability, security, migration, and lifecycle. Any other result
freezes the head.

### P8 — two metadata expected artifacts, writes, and final sequence

After both reviews PASS, append exactly this block to expected GOV012 and then
expected Roadmap, using two ordered single-file external patches:

````text
### GOV012 publication review evidence

```json
{"evidenceReviewer":"/root/m2_gov_012_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}
```
````

The external patch targets are exactly
`/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md` then
`/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md`. After each external
patch candidate run its literal command below and require RC 0/exact output
`expected-structure=verified` before the next patch:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md' '### GOV012 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_012_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md' '### GOV012 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_012_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
```

Then append the exact displayed review block through exactly two ordered
single-file repository patches: GOV012 Packet, then Roadmap. After each
non-error candidate run target-only status (exact `MM`) and expected-file
`cmp`; both RC 0 are required before proceeding.

The exact two repository physical pairs are:

```text
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-expected/11-roadmap.md docs/implementation/roadmap.md
```

Then run independently in exact order:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-012-expected/01-AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-012-expected/02-README.md README.md
cmp /private/tmp/contentos-m2-gov-012-expected/03-README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-012-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-012-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-expected/11-roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md' '## GOV012 publication implementation evidence' '{"task":"M2-GOV-012","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md' '### M2-GOV-012 roadmap recovery boundary' '{"task":"M2-GOV-012","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/11/2","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282],"nextOnRed":"M2-GOV-013"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/10-m2-gov-012.md' '### GOV012 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_012_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-expected/11-roadmap.md' '### GOV012 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_012_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

All commands are independent, all RCs are 0, exact-eleven remains Record002
`A` plus ten `M`, untracked is empty, and safe-count has no positive delta.

Finally run independently:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);process.stdout.write("expected-dir=validated-owned\n")'
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,rmSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);rmSync(p,{recursive:true})'
test ! -e /private/tmp/contentos-m2-gov-012-expected
```

Require `0,0,0` and exact first output. This is bounded task-owned hygiene.
If identity validation or removal/absence is red, the publication freezes and
GOV013 owns both recovery and any still-present expected directory; no broader
cleanup is authorized. After any earlier red, these same three commands remain
the only permitted hygiene and cannot restore eligibility.

### P9 — commit, PR, exact-head CI, and merge

Only the Orchestrator proceeds after P8 is green. Run independently:

```text
git commit -m 'docs: recover record publication with expected bytes'
git rev-parse HEAD
git push -u origin codex/m2-gov-012-deterministic-expected-byte-recovery
gh pr create --draft --base main --head codex/m2-gov-012-deterministic-expected-byte-recovery --title 'docs: recover record publication with expected bytes' --body-file /private/tmp/contentos-m2-gov-012-publication-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID> --jq 'if (.head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

Require every RC 0, exact SHA/event, attempt 1, completed/success, and exactly
the three named jobs. Merge makes Record 002 immutable/effective `Blocked` and
GOV006 `Completed — Exit Review Blocked`; M2 stays In Progress, M3 Not Started,
and all six Issues stay Open. CI is publication eligibility only.

## Postmerge tracked exact-two reconciliation

Create a fresh tree only when latest `origin/main` equals the publication
merge SHA:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-012-deterministic-expected-byte-reconcile
test ! -e /private/tmp/contentos-m2-gov-012-postmerge-wt
test ! -e /private/tmp/contentos-m2-gov-012-postmerge-expected
git worktree add -b codex/m2-gov-012-deterministic-expected-byte-reconcile /private/tmp/contentos-m2-gov-012-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Require `0,0,1,0,0,0`. From fixed postmerge cwd require, independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
mkdir /private/tmp/contentos-m2-gov-012-postmerge-expected
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,readdirSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid()||readdirSync(p).length!==0)process.exit(1);process.stdout.write("postmerge-expected-dir=validated-empty\n")'
cp docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md /private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md
cp docs/implementation/roadmap.md /private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="OPEN" and .stateReason==null) then "issue-open=verified" else error("issue-state-invalid") end'
```

Require exact branch/SHA identities, empty status/diff, Record001-zero, exact
directory output, and every RC 0. Append exactly this block to both expected
files by two ordered external single-file patches, rendering placeholders
from the immutable publication ledger:

````text
## GOV012 postmerge publication facts

```json
{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}
```
````

For Roadmap the heading is exactly
`### M2-GOV-012 postmerge publication facts`; its JSON bytes are the exact JSON
line displayed above. Immediately after the two ordered external patches run:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md' '## GOV012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md' '### M2-GOV-012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
```

Require both RC 0/exact output before exactly two repository fact patches,
GOV012 Packet then Roadmap, append their displayed blocks. After each
non-error result run target-only status (exact
` M`) and `cmp` to its expected file; both RC 0 precede the next patch. The
literal pairs are:

```text
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md docs/implementation/roadmap.md
```

Run independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md' '## GOV012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md' '### M2-GOV-012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

All RCs are 0. Require exact-two staged scope, empty untracked,
Record001-zero, and forbidden-zero.

Two fresh reviewers `/root/m2_gov_012_postmerge_evidence_review` and
`/root/m2_gov_012_postmerge_governance_review` must PASS. Append exactly this
block to both expected files with ordered external single-file patches:

````text
### GOV012 postmerge review evidence

```json
{"evidenceReviewer":"/root/m2_gov_012_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}
```
````

Immediately run these two expected validators and require RC 0/exact output:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md' '### GOV012 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_012_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md' '### GOV012 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_012_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
```

Then append the exact displayed review block to GOV012 Packet then Roadmap
through exactly two repository patches. Each non-error result is followed by
target-only `MM` status and expected-file `cmp`, both RC 0. The exact physical
pairs are:

```text
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md docs/implementation/roadmap.md
```

Then run independently in this literal order:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md' '## GOV012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md' '### M2-GOV-012 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/GOV012.md' '### GOV012 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_012_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split(h).length!==2||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-012-postmerge-expected/roadmap.md' '### GOV012 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_012_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_012_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Every RC is 0; exact-two scope, empty untracked, Record001-zero, and
forbidden-zero all pass.

Finally run independently:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);process.stdout.write("postmerge-expected-dir=validated-owned\n")'
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,rmSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-012-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-012-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);rmSync(p,{recursive:true})'
test ! -e /private/tmp/contentos-m2-gov-012-postmerge-expected
```

Require `0,0,0` and exact first output. A cleanup red freezes reconciliation
and transfers both publication reconciliation and exact-path hygiene to
GOV013; no broader cleanup is authorized.

Only then run independently:

```text
git commit -m 'docs: reconcile expected-byte record publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-012-deterministic-expected-byte-reconcile
gh pr create --draft --base main --head codex/m2-gov-012-deterministic-expected-byte-reconcile --title 'docs: reconcile expected-byte record publication' --body-file /private/tmp/contentos-m2-gov-012-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID> --jq 'if (.head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'Strict Blocked Record 002 publication and tracked reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close 274 --reason completed --comment 'GOV008 publication first red is preserved and recovered by merged GOV012 publication/reconciliation.'
gh issue close 276 --reason completed --comment 'GOV009 numeric-hunk first red is preserved and recovered by merged GOV012 publication/reconciliation.'
gh issue close 278 --reason completed --comment 'GOV010 result-contract first red is preserved and recovered by merged GOV012 publication/reconciliation.'
gh issue close 280 --reason completed --comment 'GOV011 literal-predicate first red is preserved and recovered by merged GOV012 publication/reconciliation.'
gh issue close 282 --reason completed --comment 'GOV012 exact-eleven expected-byte publication and exact-two reconciliation are merged.'
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-closed=verified" else error("issue-state-invalid") end'
```

Require exact attempt-1 three-job success and every RC 0. Only after the
exact-two merge may all six Issues close Completed. Issue completion does not
make M2 Passed or start M3.

## Acceptance criteria

1. Planning exact two merges before implementation.
2. GOV006/GOV008/GOV009/GOV010/GOV011 evidence remains immutable; no
   direct/local exit/runtime evidence reruns and no failed head is reused.
3. Every expected artifact is constructed outside the repository and
   independently validated before its corresponding repository write.
4. Fresh publication performs exactly eleven ordered per-file writes; each
   non-error candidate has immediate target-only status and exact expected-byte
   equality before the next write.
5. Mutable-document proof uses parsed, schema-checked structured sections and
   whole-file expected equality, never a single literal marker.
6. Exact-eleven integrity, dual reviews, review metadata, attempt-1 three-job
   CI, and merge all pass.
7. Exact-eleven merge makes Record 002 effective Blocked while M2 remains In
   Progress, M3 Not Started, and all six Issues remain Open.
8. Fresh postmerge tracked exact-two passes expected-byte checks, reviews, CI,
   and merge; only then may all six Issues close Completed.
9. Any red/missing result freezes actual shape and transfers continuation to
   GOV013 without same-head retry or replacement.

## Required evidence

- Static/docs: targeted Prettier write/check, repository-wide `format:check`,
  `check:docs`, `repository:check`, `check:secrets`, and `git diff --check`.
- Scope/effect: validated external expected artifacts; per-write target
  status/byte pairs; exact tracked/staged/untracked predicates;
  Record001-zero; forbidden-zero; entry/final safe-count.
- Review: two independent PASS results for publication and two fresh PASS
  results for postmerge reconciliation.
- CI: first eligible exact-head attempt-1 exact three-job success for each docs
  PR; publication eligibility only, never GOV006 exit/runtime evidence.
- Direct/local exit/runtime/test/audit/migration replay: Not Run by GOV012.

## Security review

Documentation-only. No user content, external input, Credential, network,
Authentication, Authorization, Object Storage, Secret, Source-safety,
prompt-injection, Renderer isolation, logging, Export, deletion, or production
boundary changes. Expected artifacts are task-owned outside-repository files;
their exact directory is identity/ownership validated and removed by bounded
hygiene. Existing Secret checks run. No hash, broad cleanup authority, or
exception is introduced.

## Migration and compatibility review

No database, Schema, API, Queue Payload, Artifact Version, Agent Spec, Prompt,
dependency, lockfile, configuration, migration, backfill, compatibility, or
rollback change is authorized. `db:generate` and `db:migrate` do not run.

## Observability

No production Log, Metric, Trace, Audit Event, Failure Category, or Correlation
ID changes. Evidence is stable, aggregate, and sanitized; it excludes Secrets,
private content, temporary URLs, raw child output, PIDs, and credentials.

## Documentation updates

- Planning: GOV012 Packet and Roadmap only.
- Publication: exact eleven documents listed above.
- Postmerge: tracked GOV012 Packet and Roadmap only.
- Record 001, Accepted DEC, code, configuration, and M3 documents: unchanged.

## Planning verification chronology

Planning began at exact base/HEAD
`bafef0208a6bed51795217f79b51975064d22974` in the fixed branch/worktree above.
Read-only verification confirmed PR #281 merged as that squash and run
`31588518215` was attempt-1 exact-three-job success. Issue #282 was created
Open. The Planning Agent read current AGENTS, Work Item Template, Agent
Collaboration Workflow, complete GOV006/GOV008/GOV009/GOV010/GOV011 Packets,
and relevant Roadmap. No exit, runtime, test, audit, migration, commit, push,
PR, merge, or implementation command ran in planning.

Initial targeted Packet/Roadmap formatting, static/scope verification, and
Issue #282 body parity passed. Dual Definition of Ready review then returned
six bounded executable-ledger findings: incomplete literal command expansion;
an executor-chosen expected-byte oracle; incomplete external/repository write
payload/effect ledgers; asserted rather than observed Issue lifecycle; missing
exact expected-directory hygiene; and missing cleanup-red disposition. The
correction changed only this Packet and Roadmap. It freezes six exact mutable
JSON objects and status change, literal validators, exact append payloads,
every P2/P3/P4/P5/P6/P8/postmerge process ledger, every immediate target
status/`cmp`, six Open-Issue queries, six post-close queries, and fixed-path
realpath/type/UID/remove/absence commands. A hygiene red transfers to GOV013
without broader cleanup. No exit/runtime/test/audit/migration/Git action ran.

Final corrected-head exact-two checks and Issue #282 parity passed. Correctness
reviewer `/root/m2_gov_012_planning/gov012_dor_correctness` and governance
reviewer `/root/m2_gov_012_planning/gov012_dor_governance`, role
`DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
`UNVERIFIED_RUNTIME_MODEL`, both returned PASS with no findings, no BQ, and no
DEC. Their authority is planning DoR only.

## Definition of Ready

Ready for planning publication only. Final exact-two static/scope checks and
full Issue #282 body parity passed. Both independent corrected-head reviewers
returned PASS/no findings/no BQ/no DEC. Their authority is planning DoR only.
The Orchestrator records explicit same-worktree handoff. Planning
commit/PR/first-eligible CI/merge remain required before P0. No Planning Agent self-declaration authorizes
implementation, Issue transition, M2 completion, or M3 work.

## Definition of Done

Only merged exact-eleven publication, merged fresh postmerge tracked exact-two
reconciliation, and Orchestrator closure of all six Issues completes GOV012.
Record 002 remains Blocked, M2 In Progress, and M3 Not Started.

## Rollback and possible DEC

Before merge, abandon only the affected fresh branch/PR and remove only the
validated task-owned expected directory. After Record 002 merges it is
immutable; later correction uses a later numbered recovery or Acceptance
Record. No runtime/database rollback exists. No new DEC is expected; an actual
authority conflict returns `HUMAN_DECISION_REQUIRED`.
