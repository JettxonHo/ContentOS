# M2-GOV-013 — M2 Acceptance Record 002 Issue-State Schema Recovery

**Status:** Ready — Dual corrected-head Definition of Ready PASS; planning
publication and explicit Orchestrator handoff pending

**Issue:** [#284](https://github.com/JettxonHo/ContentOS/issues/284) is Open;
full Packet-body parity follows corrected-head Definition of Ready review.

## Identification

- **Task ID:** `M2-GOV-013`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / deterministic documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Definition of Ready reviewers:**
  `/root/m2_gov_013_planning/gov013_dor_corrected` and
  `/root/m2_gov_013_planning/gov013_dor_governance`
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model / reasoning:** inherited system model / High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_013_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-013-plan-wt`
- **Planning branch:** `codex/m2-gov-013-issue-state-schema-recovery-plan`
- **Planning base/HEAD:** `053548d462bd3eb7bb21591c0005f856269cad08`
- **Planning shape:** new GOV013 Packet + tracked Roadmap only
- **Relevant DEC:** DEC-244–DEC-266 and DEC-267–DEC-293
- **Risk:** immutable milestone-decision publication integrity

## Goal

Recover the strict Blocked M2 Acceptance Record 002 publication after
GOV012's first live Issue predicate assumed that an Open Issue exposes
`stateReason: null`, while the current authenticated `gh issue view --json`
schema exposes Open as `state: "OPEN"` plus `stateReason: ""`.

Start from fresh latest main, calibrate and freeze the actual Issue-state
triples before any expected-artifact or repository write, preserve GOV012's
deterministic expected-byte contract, publish exactly twelve strict Blocked
documents, and reconcile the effective publication through one fresh-main
tracked exact-two Packet/Roadmap change. This repair changes only the Issue
schema predicates. It does not rerun or reinterpret exit/runtime evidence and
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
  frozen documents. Record 002 remains ineffective and Issue #144 remains Open.

### M2-GOV-008 through M2-GOV-011

- GOV008 planning PR #275 merged as
  `469828ad7557b37e4dae68a973c814bb16f6e1a0`; its monolithic P3 patch failed
  context verification atomically on `AGENTS.md` and wrote no file.
- GOV009 planning PR #277 merged as
  `3562b56b865d20b02f6cf50e295f062f5e4da4cd`; its first per-file patch used
  invalid numeric hunk syntax, failed atomically, and left later writes zero.
- GOV010 planning PR #279/run `31585514462` passed the exact three jobs and
  merged as `6acde678ff3a3bba3002ea23bfad310b43551530`; its first native patch
  returned non-error `{}` and modified `AGENTS.md`, but the then-contract did
  not define the empty result as success.
- GOV011 planning PR #281/run `31588518215` passed the exact three jobs and
  merged as `bafef0208a6bed51795217f79b51975064d22974`. GOV011 writes 1–7 passed
  their non-error/status/content pairs. Write 8 passed non-error and target
  status, then its literal marker predicate returned RC 1. Writes 9–10 and
  P5+ remained zero. No whole-tree post-red observation was claimed.

### M2-GOV-012

- Planning PR #283, first eligible pull-request run `31592395469`, completed
  all three required jobs successfully and squash merged as
  `053548d462bd3eb7bb21591c0005f856269cad08`.
- GOV012 implementation P0–P2 passed. P3 GOV006 source predicates and all
  declared GOV011 failed-head target-only predicates passed.
- The next and first live Issue predicate targeted #144 and required
  `.number==144`, `.state=="OPEN"`, and `.stateReason==null`. It returned
  RC 1 with `error: issue-state-invalid`. That schema mismatch is the sole
  GOV012 first red.
- The later Issue predicates and every P4+ command/write have count zero.
  The expected-artifact directory was not created; no repository write,
  GitHub/Issue mutation, diagnosis, retry, replacement, or cleanup followed.
- The GOV012 publication head remains frozen and is never reused.

Every predecessor first red remains immutable. M2 remains In Progress, M3
remains Not Started, Record 002 is ineffective, and Issues
#144/#274/#276/#278/#280/#282/#284 remain Open.

## Issue-state schema evidence and frozen contract

In this new planning epoch, independent authenticated read-only queries
observed these exact current triples before this Packet froze any predicate:

| Issues                             | Observed API triple                 | Contract meaning                   |
| ---------------------------------- | ----------------------------------- | ---------------------------------- |
| #144/#274/#276/#278/#280/#282/#284 | `number`, `OPEN`, empty string `""` | Relevant work remains open.        |
| #139/#267/#269/#271                | `number`, `CLOSED`, `COMPLETED`     | Closed because the work completed. |
| #175/#184                          | `number`, `CLOSED`, `NOT_PLANNED`   | Closed without completion.         |

The schema contract is therefore exact and state-dependent:

- an expected Open Issue must expose `state=="OPEN"` and
  `stateReason==""`;
- an Issue closed as completed must expose `state=="CLOSED"` and
  `stateReason=="COMPLETED"`;
- an Issue closed as not planned must expose `state=="CLOSED"` and
  `stateReason=="NOT_PLANNED"`.

`null` is not accepted for the currently observed CLI/API representation.
No relevant GOV013 Issue is expected to close as Not Planned; after successful
postmerge reconciliation, all seven relevant Issues must be
`CLOSED + COMPLETED`. A different tuple is red and cannot be normalized,
coerced, or treated as equivalent.

## Authority and relevant documents

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ Issue #284
→ this Packet
→ Agent judgment
```

Relevant documents: Canonical Decision Register; Work Item Template; Agent
Collaboration Workflow; Milestone Exit Criteria; Release Gates; Test Strategy;
M2 Acceptance Record 001; GOV006/GOV008/GOV009/GOV010/GOV011/GOV012 Packets;
and Roadmap. Later Accepted DEC govern an actual conflict.

## Scope

### In scope

1. Planning exact two: this Packet and Roadmap.
2. Fresh latest-main exact-twelve strict Blocked publication.
3. Read-only Issue schema calibration for every relevant Issue and fixed
   completed/not-planned sentinels before expected-artifact creation.
4. A fixed task-owned outside-repository expected directory created and
   validated only after every P3 predicate passes.
5. Five frozen expected artifacts copied byte-for-byte from the authoritative
   GOV006 working tree; seven mutable expected artifacts reconstructed from
   fresh-main bytes by exact single-file patches and structured validation.
6. Exactly twelve ordered per-file repository patches, each followed by
   target-only status and exact expected-byte equality.
7. Exact-twelve local integrity, dual independent review, attempt-1 exact-head
   three-job CI, and squash merge.
8. Fresh postmerge tracked exact-two GOV013 Packet/Roadmap reconciliation,
   dual review, attempt-1 exact-head three-job CI, merge, and only then closure
   and verification of Issues #144/#274/#276/#278/#280/#282/#284 as Completed.

### Out of scope

- any direct/local exit, runtime, unit, Integration, Concurrent, Browser,
  audit, database-generation, or migration replay; documentation-PR CI is
  publication eligibility only and is not GOV006 exit/runtime evidence;
- code, tests, fixtures, dependencies, lockfile, configuration, Schema,
  Compose, CI, DEC, product, M3, or Record 001 change;
- changing a predecessor first red, rerunning GOV012's failed predicate,
  reusing a failed head, or retroactively claiming unobserved evidence;
- accepting `null` for Open, accepting empty string for Closed, closing a
  relevant Issue as Not Planned, marker-only proof, same-head retry,
  replacement, diagnosis, waiver, Conditional Pass, or inherited evidence;
- GitHub/Issue mutation by the Documentation Executor.

## Exact 2 / 12 / 2 lifecycle and allowed files

| Phase       | Exact tracked shape                                                                                      | Meaning                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Planning    | GOV013 Packet + Roadmap                                                                                  | Plan only.                               |
| Publication | `AGENTS.md`, both READMEs, Record 002, GOV006/GOV008/GOV009/GOV010/GOV011/GOV012/GOV013 Packets, Roadmap | Exact-twelve strict Blocked publication. |
| Postmerge   | tracked GOV013 Packet + tracked Roadmap                                                                  | Publication reconciliation only.         |

Every other repository path is prohibited. Record 001 remains zero-diff. No
expected artifact is commit-eligible. Publication artifacts live only under
`/private/tmp/contentos-m2-gov-013-expected`; postmerge artifacts live only
under `/private/tmp/contentos-m2-gov-013-postmerge-expected`.

## Invocation, result, and first-red discipline

Every process is one independent literal invocation with fixed cwd and a
structured terminal status. `&&`, `||`, pipes, wrappers, heredocs, command
substitution, redirection-derived status, and shell-derived status are
prohibited. Only fixed cwd/SHA/PR/Issue/run IDs may first be ledgered and then
substituted literally.

Every `apply_patch` is one independent governed tool invocation. Non-error
`{}` is only an invocation candidate and never content proof. Each repository
candidate must immediately pass its exact target-only status and `cmp` pair
before the next write. Every expected-artifact patch must immediately pass its
exact structural validator. Any missing/unexpected result is first red: freeze
the actual shape, run only explicitly authorized exact-path hygiene when its
ownership was already proven, do not retry/correct/replace, and transfer to
M2-GOV-014.

## Deterministic expected-artifact contract

The first five expected artifacts are exact authoritative GOV006 copies. The
seven mutable expected artifacts begin as exact fresh-main copies of GOV008,
GOV009, GOV010, GOV011, GOV012, GOV013, and Roadmap. Each receives exactly one
document-specific appended fenced-JSON block. `<RECOVERY_BASE_SHA>` is replaced
once by the resolved lowercase 40-hex base; no other byte is executor-chosen.

The exact objects are canonical one-line JSON. Prettier must not expand these
`text` fences, and the validator below requires that every rendered JSON argv
is byte-identical to `JSON.stringify(JSON.parse(j))`:

```text
{"task":"M2-GOV-013","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"literal-predicate-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":283,"planningRun":31592395469,"planningSquash":"053548d462bd3eb7bb21591c0005f856269cad08","passedThrough":"P3-GOV011-targets","firstRed":"P3-issue-144-stateReason-null-predicate","firstRedRc":1,"firstRedError":"issue-state-invalid","laterIssuePredicates":0,"p4PlusRuns":0,"expectedDirCreated":false,"repositoryWrites":0,"githubMutations":0,"diagnosis":false,"retry":false,"cleanup":false,"record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"M2-GOV-013","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

```text
{"task":"M2-GOV-013","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/12/2","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}
```

Their headings are respectively `## M2-GOV-013 recovery of GOV008` through
`## M2-GOV-013 recovery of GOV012`, `## GOV013 publication implementation
evidence`, and `### M2-GOV-013 roadmap recovery boundary`. For every mutable
artifact, run this validator with its exact path/heading/JSON literals:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '<EXPECTED_PATH>' '<HEADING>' '<EXACT_JSON>'
```

Exactly one standalone Markdown heading line and its immediately following
exact serialized JSON are required. Inline prose and validator argv cannot
satisfy or duplicate that anchored line predicate. All twelve expected
artifacts must exist and validate before the first repository write. No hash
or digest is introduced.

## Publication ledger

### P0 — fresh latest-main identity

From `/Users/ketchup/Projects/ContentOS`, independently:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-013-issue-state-schema-recovery
test ! -e /private/tmp/contentos-m2-gov-013-publication-wt
test ! -e /private/tmp/contentos-m2-gov-013-expected
git worktree add -b codex/m2-gov-013-issue-state-schema-recovery /private/tmp/contentos-m2-gov-013-publication-wt <RECOVERY_BASE_SHA>
```

Require statuses `0,0,1,0,0,0`. Ledger exact latest `origin/main`; it must
include merged GOV013 planning. From fixed publication cwd
`/private/tmp/contentos-m2-gov-013-publication-wt`, independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require all RC 0, exact identities, empty status/diff, and Record001-zero.

### P1 — pinned planning/publication environment

Run independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 node -e 'const names=["CONTENTOS_INTEGRATION_INJECT_CHILD_AFTER_RESOURCE_ALLOCATE","CONTENTOS_INTEGRATION_INJECT_CHILD_BEFORE_TEST_EXECUTION","CONTENTOS_INTEGRATION_INJECT_CHILD_CLEANUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_COMMAND_FAILURE","CONTENTOS_INTEGRATION_INJECT_CONCURRENT_FAILURE","CONTENTOS_INTEGRATION_INJECT_FORBIDDEN_GLOBAL_CLEANUP","CONTENTOS_INTEGRATION_INJECT_HARNESS_PROBE","CONTENTOS_INTEGRATION_INJECT_PROCESS_IDENTITY_FAILURE","CONTENTOS_INTEGRATION_INJECT_SETUP_FAILURE","CONTENTOS_INTEGRATION_INJECT_TEARDOWN_FAILURE","CONTENTOS_INTEGRATION_INJECT_WORKER_FAILURE"];const set=names.filter((name)=>process.env[name]!==undefined);if(set.length)process.exit(1);process.stdout.write("injection-env=unset\n")'
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
```

Require Node `v24.18.0`, pnpm `11.17.0`, exact `injection-env=unset`, install
success, and exactly five applications/six packages.

### P2 — publication entry safe-count

Run once:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require RC 0 and ledger all four fields. It authorizes no cleanup. The exact
observer runs only where written later.

### P3 — frozen sources, failed head, and calibrated Issue state

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
five `M` plus Record002 `A`, empty untracked, Record001-zero, forbidden-zero.

From frozen `/private/tmp/contentos-m2-gov-011-publication-wt`, run the same
eight target-only observations GOV012 declared: branch, HEAD, and one status
query for each of AGENTS, both READMEs, Record002, GOV006, GOV008, GOV009, and
GOV010. Require exact GOV011 branch/HEAD
`bafef0208a6bed51795217f79b51975064d22974`, existing targets ` M`, and
Record002 `??`. These are target-only, not a whole-tree-shape claim.

Then, from fixed GOV013 publication cwd, run all live schema predicates in
this exact order before P4. Each is independent and must return RC 0:

```text
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 284 --json number,state,stateReason --jq 'if (.number==284 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 139 --json number,state,stateReason --jq 'if (.number==139 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 175 --json number,state,stateReason --jq 'if (.number==175 and .state=="CLOSED" and .stateReason=="NOT_PLANNED") then "issue-not-planned=verified" else error("issue-state-invalid") end'
```

The first seven outputs are `issue-open=verified`; the last two are
`issue-completed=verified` and `issue-not-planned=verified`. Any mismatch stops
before expected-directory creation. No predicate accepts `null`.

### P4 — construct and validate all twelve expected artifacts

Run independently:

```text
mkdir /private/tmp/contentos-m2-gov-013-expected
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,readdirSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-expected"||!s.isDirectory()||s.uid!==process.getuid()||readdirSync(p).length!==0)process.exit(1);process.stdout.write("expected-dir=validated-empty\n")'
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md /private/tmp/contentos-m2-gov-013-expected/01-AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md /private/tmp/contentos-m2-gov-013-expected/01-AGENTS.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md /private/tmp/contentos-m2-gov-013-expected/02-README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md /private/tmp/contentos-m2-gov-013-expected/02-README.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md /private/tmp/contentos-m2-gov-013-expected/03-README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md /private/tmp/contentos-m2-gov-013-expected/03-README.zh-CN.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md /private/tmp/contentos-m2-gov-013-expected/04-m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md /private/tmp/contentos-m2-gov-013-expected/04-m2-acceptance-record-002.md
cp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md /private/tmp/contentos-m2-gov-013-expected/05-m2-gov-006.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md /private/tmp/contentos-m2-gov-013-expected/05-m2-gov-006.md
cp docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md /private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md
cp docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md /private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md
cp docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md /private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md
cp docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md /private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md
cp docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md /private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md
cp docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md /private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md
cp docs/implementation/roadmap.md /private/tmp/contentos-m2-gov-013-expected/12-roadmap.md
```

Every RC is 0. Execute seven ordered single-file external patches, files 06
through 12, appending the exact heading/JSON blocks frozen above. After each
non-error candidate, run the literal structural validator with that artifact's
exact path, heading, resolved JSON. Require RC 0 and exact
`expected-structure=verified` before the next patch. A red prevents P5.

The seven post-patch validator invocations are fixed below; replace only each
`<RECOVERY_BASE_SHA>` with the one ledgered SHA before rendering:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md' '## M2-GOV-013 recovery of GOV008' '{"task":"M2-GOV-013","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md' '## M2-GOV-013 recovery of GOV009' '{"task":"M2-GOV-013","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md' '## M2-GOV-013 recovery of GOV010' '{"task":"M2-GOV-013","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md' '## M2-GOV-013 recovery of GOV011' '{"task":"M2-GOV-013","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"literal-predicate-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md' '## M2-GOV-013 recovery of GOV012' '{"task":"M2-GOV-013","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":283,"planningRun":31592395469,"planningSquash":"053548d462bd3eb7bb21591c0005f856269cad08","passedThrough":"P3-GOV011-targets","firstRed":"P3-issue-144-stateReason-null-predicate","firstRedRc":1,"firstRedError":"issue-state-invalid","laterIssuePredicates":0,"p4PlusRuns":0,"expectedDirCreated":false,"repositoryWrites":0,"githubMutations":0,"diagnosis":false,"retry":false,"cleanup":false,"record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md' '## GOV013 publication implementation evidence' '{"task":"M2-GOV-013","document":"M2-GOV-013","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/12-roadmap.md' '### M2-GOV-013 roadmap recovery boundary' '{"task":"M2-GOV-013","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/12/2","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
```

### P5 — exactly twelve repository writes with byte proof

Execute twelve ordered single-file native patches matching the validated
expected artifacts. After each non-error candidate run its target-only status
and `cmp`, independently and before the next write:

```text
git status --short --untracked-files=all -- AGENTS.md
cmp /private/tmp/contentos-m2-gov-013-expected/01-AGENTS.md AGENTS.md
git status --short --untracked-files=all -- README.md
cmp /private/tmp/contentos-m2-gov-013-expected/02-README.md README.md
git status --short --untracked-files=all -- README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-013-expected/03-README.zh-CN.md README.zh-CN.md
git status --short --untracked-files=all -- docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-013-expected/12-roadmap.md docs/implementation/roadmap.md
```

Existing files must emit exactly one ` M`; Record002 exactly one `??`. Every
pair is RC 0. There is no thirteenth reconstruction write.

### P6 — exact-twelve local integrity

Run independently in literal order:

```text
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
```

Then run every expected-byte and implementation-structure predicate
independently in this literal order, replacing only `<RECOVERY_BASE_SHA>`:

```text
cmp /private/tmp/contentos-m2-gov-013-expected/01-AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-013-expected/02-README.md README.md
cmp /private/tmp/contentos-m2-gov-013-expected/03-README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-013-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/12-roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md' '## M2-GOV-013 recovery of GOV008' '{"task":"M2-GOV-013","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md' '## M2-GOV-013 recovery of GOV009' '{"task":"M2-GOV-013","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md' '## M2-GOV-013 recovery of GOV010' '{"task":"M2-GOV-013","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md' '## M2-GOV-013 recovery of GOV011' '{"task":"M2-GOV-013","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"literal-predicate-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md' '## M2-GOV-013 recovery of GOV012' '{"task":"M2-GOV-013","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":283,"planningRun":31592395469,"planningSquash":"053548d462bd3eb7bb21591c0005f856269cad08","passedThrough":"P3-GOV011-targets","firstRed":"P3-issue-144-stateReason-null-predicate","firstRedRc":1,"firstRedError":"issue-state-invalid","laterIssuePredicates":0,"p4PlusRuns":0,"expectedDirCreated":false,"repositoryWrites":0,"githubMutations":0,"diagnosis":false,"retry":false,"cleanup":false,"record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md' '## GOV013 publication implementation evidence' '{"task":"M2-GOV-013","document":"M2-GOV-013","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/12-roadmap.md' '### M2-GOV-013 roadmap recovery boundary' '{"task":"M2-GOV-013","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/12/2","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Every RC is 0. Before staging require eleven `M` plus Record002 `??`; after
staging require eleven `M` plus Record002 `A`, empty untracked, and no positive
safe-count delta.

### P7 — dual publication review and expected-byte metadata

Two non-author reviewers independently PASS: (1) frozen evidence, predecessor
chronology, issue-schema facts, expected artifacts, and strict Blocked decision;
(2) schema/execution protocol, exact-twelve scope, immutable Record, security,
migration, and lifecycle. Any other result freezes the head.

After dual PASS, append one exact review JSON block to expected GOV013 then
expected Roadmap through two ordered external patches, validate both
structurally, then append the identical block to repository GOV013 then
Roadmap through two ordered patches. Each repository candidate immediately
passes target-only `MM` status and expected-file `cmp`.

The standalone heading is `### GOV013 publication review evidence`. Its exact
canonical JSON is frozen here:

```text
{"evidenceReviewer":"/root/m2_gov_013_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}
```

After each of the two ordered expected-artifact patches, run its literal
anchored-line validator independently:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md' '### GOV013 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_013_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/12-roadmap.md' '### GOV013 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_013_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
```

Then the two ordered repository patches have these immediate physical pairs:

```text
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-013-expected/12-roadmap.md docs/implementation/roadmap.md
```

Each target status is exactly `MM`; every RC is 0. A red prevents the next
write. The anchored-line validator ignores this prose and the command argv;
only an exact standalone Markdown heading line counts.

After the two physical pairs pass, run this complete final sequence
independently, replacing only `<RECOVERY_BASE_SHA>`:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-013-expected/01-AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-013-expected/02-README.md README.md
cmp /private/tmp/contentos-m2-gov-013-expected/03-README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-013-expected/04-m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/05-m2-gov-006.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
cmp /private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-expected/12-roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/06-m2-gov-008.md' '## M2-GOV-013 recovery of GOV008' '{"task":"M2-GOV-013","document":"M2-GOV-008","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"atomic-context-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/07-m2-gov-009.md' '## M2-GOV-013 recovery of GOV009' '{"task":"M2-GOV-013","document":"M2-GOV-009","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"numeric-hunk-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/08-m2-gov-010.md' '## M2-GOV-013 recovery of GOV010' '{"task":"M2-GOV-013","document":"M2-GOV-010","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"empty-object-contract-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/09-m2-gov-011.md' '## M2-GOV-013 recovery of GOV011' '{"task":"M2-GOV-013","document":"M2-GOV-011","recoveryBase":"<RECOVERY_BASE_SHA>","predecessor":"literal-predicate-red","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/10-m2-gov-012.md' '## M2-GOV-013 recovery of GOV012' '{"task":"M2-GOV-013","document":"M2-GOV-012","recoveryBase":"<RECOVERY_BASE_SHA>","planningPr":283,"planningRun":31592395469,"planningSquash":"053548d462bd3eb7bb21591c0005f856269cad08","passedThrough":"P3-GOV011-targets","firstRed":"P3-issue-144-stateReason-null-predicate","firstRedRc":1,"firstRedError":"issue-state-invalid","laterIssuePredicates":0,"p4PlusRuns":0,"expectedDirCreated":false,"repositoryWrites":0,"githubMutations":0,"diagnosis":false,"retry":false,"cleanup":false,"record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md' '## GOV013 publication implementation evidence' '{"task":"M2-GOV-013","document":"M2-GOV-013","recoveryBase":"<RECOVERY_BASE_SHA>","role":"IMPLEMENTER","thread":"/root","runtime":"UNVERIFIED_RUNTIME_MODEL","reached":"P0-P5","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/12-roadmap.md' '### M2-GOV-013 roadmap recovery boundary' '{"task":"M2-GOV-013","document":"Roadmap","recoveryBase":"<RECOVERY_BASE_SHA>","lifecycle":"2/12/2","issueSchema":"OPEN-empty-CLOSED-enum","record002":"Blocked","record002Effective":false,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284],"nextOnRed":"M2-GOV-014"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/11-m2-gov-013.md' '### GOV013 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_013_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-expected/12-roadmap.md' '### GOV013 publication review evidence' '{"evidenceReviewer":"/root/m2_gov_013_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-012-m2-acceptance-record-002-deterministic-expected-byte-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require exact-twelve staged scope, empty untracked, Record001-zero,
forbidden-zero, every byte/structure predicate, and no positive safe-count
delta.

Finally validate exact expected-directory path/type/UID, remove only that
directory, and prove absence:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);process.stdout.write("expected-dir=validated-owned\n")'
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,rmSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);rmSync(p,{recursive:true})'
test ! -e /private/tmp/contentos-m2-gov-013-expected
```

Require `0,0,0` and exact first output. After any earlier red these are the
only allowed hygiene calls, and only if directory ownership was already proven.

### P8 — commit, PR, exact-head CI, and merge

Only the Orchestrator proceeds after P7 is green:

```text
git commit -m 'docs: recover record publication issue schema'
git rev-parse HEAD
git push -u origin codex/m2-gov-013-issue-state-schema-recovery
gh pr create --draft --base main --head codex/m2-gov-013-issue-state-schema-recovery --title 'docs: recover record publication issue schema' --body-file /private/tmp/contentos-m2-gov-013-publication-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID> --jq 'if (.head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

Require every RC 0, exact SHA/event, attempt 1, completed/success, and exactly
the three named jobs. Merge makes Record 002 immutable/effective `Blocked` and
GOV006 `Completed — Exit Review Blocked`; M2 remains In Progress, M3 Not
Started, and all seven relevant Issues remain Open. CI is publication
eligibility only.

## Postmerge tracked exact-two reconciliation

Every invocation below is independent, literal, fixed-cwd, and first-red. From
repository cwd `/Users/ketchup/Projects/ContentOS`, run:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-013-issue-state-schema-reconcile
test ! -e /private/tmp/contentos-m2-gov-013-postmerge-wt
test ! -e /private/tmp/contentos-m2-gov-013-postmerge-expected
git worktree add -b codex/m2-gov-013-issue-state-schema-reconcile /private/tmp/contentos-m2-gov-013-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Require statuses `0,0,1,0,0,0` and exact latest main equal to the ledgered
publication merge. All later reconciliation commands use fixed cwd
`/private/tmp/contentos-m2-gov-013-postmerge-wt`. Run independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 284 --json number,state,stateReason --jq 'if (.number==284 and .state=="OPEN" and .stateReason=="") then "issue-open=verified" else error("issue-state-invalid") end'
gh issue view 139 --json number,state,stateReason --jq 'if (.number==139 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 175 --json number,state,stateReason --jq 'if (.number==175 and .state=="CLOSED" and .stateReason=="NOT_PLANNED") then "issue-not-planned=verified" else error("issue-state-invalid") end'
mkdir /private/tmp/contentos-m2-gov-013-postmerge-expected
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,readdirSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid()||readdirSync(p).length!==0)process.exit(1);process.stdout.write("postmerge-expected-dir=validated-empty\n")'
cp docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md /private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md
cp docs/implementation/roadmap.md /private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md
```

Require exact branch/SHA identities, empty status/diff, Record001-zero, seven
`issue-open=verified`, both exact sentinel outputs, exact directory-validation
output, and every RC 0.

Render this exact canonical publication-fact JSON only by replacing its three
ledger placeholders:

```text
{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}
```

Execute exactly two ordered external expected-file patches: append heading
`## GOV013 postmerge publication facts` plus that fenced JSON to `GOV013.md`,
then append heading `### M2-GOV-013 postmerge publication facts` plus the same
JSON to `roadmap.md`. After each candidate run its corresponding independent
literal validator:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md' '## GOV013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md' '### M2-GOV-013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
```

Both return RC 0 and exact output. Then append the corresponding exact blocks
through exactly two repository patches, GOV013 Packet then Roadmap. After each
non-error candidate run its immediate physical pair before the next patch:

```text
git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
git status --short --untracked-files=all -- docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md docs/implementation/roadmap.md
```

Target status is exactly one ` M`; every RC is 0. Run the complete initial
exact-two sequence independently:

```text
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md' '## GOV013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md' '### M2-GOV-013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require Node/pnpm/workspace exact values, exact-two staged scope, empty
untracked, Record001-zero, forbidden-zero, and every RC 0. Two fresh reviewers
`/root/m2_gov_013_postmerge_evidence_review` and
`/root/m2_gov_013_postmerge_governance_review` must independently PASS.

The exact canonical postmerge review JSON is:

```text
{"evidenceReviewer":"/root/m2_gov_013_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}
```

Execute exactly two ordered external patches, expected GOV013 then Roadmap,
appending standalone heading `### GOV013 postmerge review evidence` plus that
JSON. After each patch run the corresponding validator:

```text
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md' '### GOV013 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_013_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md' '### GOV013 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_013_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
```

Then append the exact block to repository GOV013 followed by Roadmap through
two ordered patches. Each candidate must pass its target-only `MM` status and
the same expected-file `cmp` physical pair written above before proceeding.
Run this complete final sequence independently:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md
cmp /private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md' '## GOV013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md' '### M2-GOV-013 postmerge publication facts' '{"publicationPr":<PUBLICATION_PR_NUMBER>,"publicationRun":<PUBLICATION_RUN_ID>,"publicationMerge":"<PUBLICATION_MERGE_SHA>","jobs":"exact-three-success","record002":"Blocked","record002Effective":true,"m2":"In Progress","m3":"Not Started","openIssues":[144,274,276,278,280,282,284]}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/GOV013.md' '### GOV013 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_013_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 node -e 'const {readFileSync}=require("node:fs");const [p,h,j]=process.argv.slice(1);const t=readFileSync(p,"utf8");const block=`${h}\n\n\`\`\`json\n${j}\n\`\`\``;if(t.split("\n").filter((line)=>line===h).length!==1||!t.includes(block)||JSON.stringify(JSON.parse(j))!==j)process.exit(1);process.stdout.write("expected-structure=verified\n")' '/private/tmp/contentos-m2-gov-013-postmerge-expected/roadmap.md' '### GOV013 postmerge review evidence' '{"evidenceReviewer":"/root/m2_gov_013_postmerge_evidence_review","evidenceResult":"PASS","governanceReviewer":"/root/m2_gov_013_postmerge_governance_review","governanceResult":"PASS","runtime":"UNVERIFIED_RUNTIME_MODEL"}'
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-013-m2-acceptance-record-002-issue-state-schema-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Every RC is 0; exact-two, empty untracked, Record001-zero, forbidden-zero, and
all four exact expected structures pass. Finally run exact-path hygiene:

```text
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);process.stdout.write("postmerge-expected-dir=validated-owned\n")'
fnm exec --using=24.18.0 node -e 'const {lstatSync,realpathSync,rmSync}=require("node:fs");const p=realpathSync("/private/tmp/contentos-m2-gov-013-postmerge-expected");const s=lstatSync(p);if(p!=="/private/tmp/contentos-m2-gov-013-postmerge-expected"||!s.isDirectory()||s.uid!==process.getuid())process.exit(1);rmSync(p,{recursive:true})'
test ! -e /private/tmp/contentos-m2-gov-013-postmerge-expected
```

Require `0,0,0` and exact first output. Any hygiene red transfers to GOV014;
no broader cleanup is authorized. Only then run independently:

```text
git commit -m 'docs: reconcile issue-schema record publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-013-issue-state-schema-reconcile
gh pr create --draft --base main --head codex/m2-gov-013-issue-state-schema-reconcile --title 'docs: reconcile issue-schema record publication' --body-file /private/tmp/contentos-m2-gov-013-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID> --jq 'if (.head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'Strict Blocked Record 002 publication and tracked reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close 274 --reason completed --comment 'GOV008 publication first red is preserved and recovered by merged GOV013 publication/reconciliation.'
gh issue close 276 --reason completed --comment 'GOV009 numeric-hunk first red is preserved and recovered by merged GOV013 publication/reconciliation.'
gh issue close 278 --reason completed --comment 'GOV010 result-contract first red is preserved and recovered by merged GOV013 publication/reconciliation.'
gh issue close 280 --reason completed --comment 'GOV011 literal-predicate first red is preserved and recovered by merged GOV013 publication/reconciliation.'
gh issue close 282 --reason completed --comment 'GOV012 Issue-schema first red is preserved and recovered by merged GOV013 publication/reconciliation.'
gh issue close 284 --reason completed --comment 'GOV013 exact-twelve issue-schema publication and exact-two reconciliation are merged.'
```

Require exact attempt-1 three-job success, verified `MERGED` facts, and every
RC 0. Only after that exact-two merge do the seven closes run. Then verify each
closed tuple independently:

```text
gh issue view 144 --json number,state,stateReason --jq 'if (.number==144 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 274 --json number,state,stateReason --jq 'if (.number==274 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 276 --json number,state,stateReason --jq 'if (.number==276 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 278 --json number,state,stateReason --jq 'if (.number==278 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 280 --json number,state,stateReason --jq 'if (.number==280 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 282 --json number,state,stateReason --jq 'if (.number==282 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
gh issue view 284 --json number,state,stateReason --jq 'if (.number==284 and .state=="CLOSED" and .stateReason=="COMPLETED") then "issue-completed=verified" else error("issue-state-invalid") end'
```

Every RC is 0 and output is `issue-completed=verified`. `NOT_PLANNED` remains
a valid observed API enum but is an invalid outcome for these seven successful
Work Items. Issue completion does not make M2 Passed or start M3.

## Acceptance criteria

1. Planning exact two merges before implementation.
2. GOV006–GOV012 first-red evidence remains immutable; no direct/local
   exit/runtime evidence reruns and no failed head is reused.
3. Every relevant Issue is read before expected-artifact creation and matches
   the frozen Open empty-string schema; completed/not-planned sentinels prove
   the two actual Closed enum values.
4. Every expected artifact is built outside the repository and independently
   validated before its repository write.
5. Fresh publication performs exactly twelve ordered per-file writes; every
   non-error candidate immediately passes target-only status plus expected-byte
   equality before the next write.
6. Exact-twelve integrity, dual reviews, review metadata, attempt-1 exact-three
   CI, and merge pass.
7. Exact-twelve merge makes Record 002 effective Blocked while M2 remains In
   Progress, M3 Not Started, and all seven Issues remain Open.
8. Fresh postmerge tracked exact-two passes expected-byte checks, dual review,
   attempt-1 exact-three CI, and merge; only then may all seven Issues close as
   Completed and must verify `CLOSED + COMPLETED`.
9. Any red/missing result freezes the actual shape and transfers continuation
   to GOV014 without same-head retry or replacement.

## Required evidence

- Static/docs: targeted Prettier write/check, `format:check`, `check:docs`,
  `repository:check`, `check:secrets`, and `git diff --check`.
- Scope/effect: validated expected artifacts; per-write target status/byte
  pairs; exact tracked/staged/untracked predicates; Record001-zero;
  forbidden-zero; entry/final safe-count.
- Issue lifecycle: exact number/state/stateReason queries before publication,
  before postmerge writes, and after closure.
- Review: two independent PASS results for publication and two fresh PASS
  results for postmerge reconciliation.
- CI: first eligible exact-head attempt-1 exact-three-job success for each docs
  PR; publication eligibility only.
- Direct/local exit/runtime/test/audit/migration replay: Not Run by GOV013.

## Security review

Documentation-only. No user content, Credential, provider transmission,
Authentication, Authorization, Object Storage, Secret, Source-safety,
Renderer isolation, logging, Export, deletion, or production boundary changes.
Read-only GitHub schema queries expose only Issue number/state/reason. Expected
directories are fixed, identity/ownership validated, and narrowly removed.
Existing Secret checks run. No hash, broad cleanup, or exception is introduced.

## Migration and compatibility review

No database, Schema, API, Queue Payload, Artifact Version, Agent Spec, Prompt,
dependency, lockfile, configuration, migration, backfill, compatibility, or
rollback change is authorized. `db:generate` and `db:migrate` do not run.

## Observability

No production Log, Metric, Trace, Audit Event, Failure Category, or Correlation
ID changes. Evidence is stable, aggregate, and sanitized.

## Documentation updates

- Planning: GOV013 Packet and Roadmap only.
- Publication: exact twelve documents listed above.
- Postmerge: tracked GOV013 Packet and Roadmap only.
- Record 001, Accepted DEC, code, configuration, and M3 documents: unchanged.

## Planning verification chronology

Planning began at exact base/HEAD
`053548d462bd3eb7bb21591c0005f856269cad08`. The Planning Agent read current
AGENTS, Work Item Template, Agent Collaboration Workflow, complete GOV006,
GOV008, GOV009, GOV010, GOV011, and GOV012 Packets, and the relevant Roadmap.
Read-only verification observed the six current predecessor Issues and new
Issue #284 as `OPEN + ""`; #139/#267/#269/#271 as
`CLOSED + COMPLETED`; and #175/#184 as `CLOSED + NOT_PLANNED`. Issue #284 was
created Open. No exit, runtime, test, audit, migration, commit, push, PR, merge,
or implementation command ran in planning.

The first correctness review returned three blocking executable-ledger
findings: seven pretty JSON objects contradicted canonical-string validation;
publication review heading uniqueness used unsafe substring counting; and the
postmerge exact-two was narrative rather than a complete literal ledger. That
review did not authorize execution. The correction changed only this Packet
and Roadmap: all JSON is canonical one-line, validators count exact standalone
heading lines, publication P4/P6/P7 is fully literal, and postmerge now freezes
fresh-tree identity, Issue predicates, expected files, two fact writes, two
review writes, both complete static/scope sequences, exact hygiene, Git/PR/
attempt-1 CI/merge, seven close comments, and seven readbacks.

Corrected-head targeted Node 24 Prettier write/check, `repository:check`,
`git diff --check`, exact-two status/tracked/untracked, Record001-zero,
forbidden-zero, and Issue #284 full body parity all passed. Correctness reviewer
`/root/m2_gov_013_planning/gov013_dor_corrected` and governance reviewer
`/root/m2_gov_013_planning/gov013_dor_governance`, both acting as
`DEFINITION_OF_READY_REVIEWER` with actual runtime
`UNVERIFIED_RUNTIME_MODEL`, independently returned PASS with no findings, no
Blocking Design Question, and no DEC. Both completed reviewers were then
closed. No exit, runtime, test, audit, migration, commit, push, PR, merge, or
implementation command ran in planning.

## Definition of Ready

Ready for planning publication only. Corrected-head exact-two static/scope
checks and Issue #284 byte-exact parity passed. Both independent reviewers
returned PASS/no findings/no BQ/no DEC. Their authority is planning DoR only.
Planning commit/PR/first-eligible CI/merge and an explicit Orchestrator handoff
remain required before P0; planning does not authorize implementation, Issue
transition, M2 completion, or M3 work.

## Definition of Done

Only merged exact-twelve publication, merged fresh postmerge tracked exact-two
reconciliation, and Orchestrator closure/verification of all seven Issues as
Completed completes GOV013. Record 002 remains Blocked, M2 In Progress, and M3
Not Started.

## Rollback and possible DEC

Before merge, abandon only the affected branch/PR and remove only a validated
task-owned expected directory. After Record 002 merges it is immutable; later
correction uses a later numbered recovery or Acceptance Record. No runtime or
database rollback exists. No new DEC is expected; an actual authority conflict
returns `HUMAN_DECISION_REQUIRED`.
