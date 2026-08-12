# M2-GOV-011 — M2 Acceptance Record 002 apply_patch Result Contract Recovery

**Status:** Ready — Explicit Orchestrator same-worktree handoff recorded

**Issue:** [#280](https://github.com/JettxonHo/ContentOS/issues/280) is Open;
Orchestrator body parity is synchronized to this planning candidate.

## Identification

- **Task ID:** `M2-GOV-011`
- **Milestone:** M2 — Source and Workflow Foundation
- **Type:** Governance / documentation publication recovery
- **Owner:** Orchestrator Reviewer
- **Executor Profile:** `DOCUMENTATION_EXECUTOR`
- **Logical planning role:** `WORK_ITEM_PLANNER`
- **Requested model / reasoning:** `gpt-5.6-sol` / High
- **Actual runtime:** `UNVERIFIED_RUNTIME_MODEL`
- **Planning thread:** `/root/m2_gov_011_planning`
- **Planning worktree:** `/private/tmp/contentos-m2-gov-011-plan-wt`
- **Planning branch:** `codex/m2-gov-011-apply-patch-result-contract-plan`
- **Planning base/HEAD:** `6acde678ff3a3bba3002ea23bfad310b43551530`
- **Planning shape:** new GOV011 Packet + tracked Roadmap only
- **Relevant DEC:** DEC-244–DEC-266 and DEC-267–DEC-293
- **Risk:** immutable milestone-decision publication integrity

## Goal

Recover M2 Acceptance Record 002 publication after GOV010's first native
single-file `apply_patch` call completed without a tool error, returned the
literal serialized value `{}`, and physically modified `AGENTS.md`, but the
GOV010 contract required an explicit success report and did not define that
empty non-error result. Start from fresh latest main, define an exact tool-result
and physical-effect contract, publish the exact-ten strict Blocked documentation
set, and reconcile the publication through one fresh-main tracked exact-two
change.

The bounded repair changes only how a successful `apply_patch` invocation is
recognized and how its physical effect is proven. It does not reinterpret any
predecessor red, rerun exit/runtime evidence, or change the strict Blocked
decision.

## Immutable predecessor evidence

### M2-GOV-006

- Reviewed Commit remains
  `d335d01af7064fa58f5f3aec6c52fa3ba07fb950`.
- Gate 3 root `check` ran exactly once and returned structured exit `1`.
  Format, lint, and typecheck passed; the Fetcher public-transport test
  `rejects decoded content above 8 MiB while the expansion ratio remains below 20:1`
  timed out at 5000 ms. Test files were 54 total, 53 passed, 1 failed; tests
  were 580 total, 579 passed, 1 failed. Build was not reached.
- Gates 4–8 have zero runs. No rerun, replacement, diagnosis, repair, cause
  claim, or cleanup occurred.
- Gate 9 steps 1–3 returned RC 0. Step 4 remains the immutable publication
  first red because `git add` lacked its own independent invocation and
  structured status inside a combined command; step 5 onward is zero/unearned.
- Final GOV006 working-tree bytes remain the source for the five standalone
  frozen documents. Record 002 remains ineffective and Issue #144 remains Open.

### M2-GOV-008 and M2-GOV-009

- GOV008 planning PR #275 merged as
  `469828ad7557b37e4dae68a973c814bb16f6e1a0`; Issue #274 remains Open. P0–P2
  and all frozen-source predicates passed. Its sole monolithic P3 patch failed
  context verification on `AGENTS.md`, was atomic, and wrote no file. P3
  postchecks and P4+ are zero; no retry or replacement occurred.
- GOV009 planning PR #277 merged as
  `3562b56b865d20b02f6cf50e295f062f5e4da4cd`; Issue #276 remains Open. P0–P3
  passed. Its only P4 write used invalid numeric hunk
  `@@ -1,14 +1,34 @@`, failed atomically, and left writes 2–8/P5+ at zero.
  There was no retry, replacement, diagnosis, or later governed write.

### M2-GOV-010

- Planning PR #279, head
  `0c71ce92a74341442c9c24b6d6b798c1893fe15e`, used first eligible
  pull-request run `31585514462`, attempt 1. Its exact three named quality,
  Integration, and Browser jobs all completed successfully. It squash merged
  at `2026-08-12T10:04:17Z` as
  `6acde678ff3a3bba3002ea23bfad310b43551530`. Issue #278 remains Open.
- GOV010 implementation started fresh branch
  `codex/m2-gov-010-apply-patch-hunk-recovery`, worktree
  `/private/tmp/contentos-m2-gov-010-publication-wt`, exact base/HEAD
  `6acde678ff3a3bba3002ea23bfad310b43551530`. P0–P3 passed. P2 returned
  `safe-count compiled=72 compose=0 temp=1 repo-store=0` and authorized no
  cleanup.
- P4 write 1 targeted only `AGENTS.md` with legal `*** Update File` and bare
  `@@` syntax. The tool returned the literal serialized result `{}` with no
  reported error or exception and physically modified the file. The frozen
  post-call shape is exactly status ` M AGENTS.md` and name-status
  `M AGENTS.md`.
- GOV010 required each tool result to "explicitly report success" but did not
  define `{}` as success. The Orchestrator therefore classified the ambiguous
  result as the first red. P4 writes 2–9 and P5+ have zero runs. After red,
  only the two read-only physical-shape observations above ran. There was no
  retry, diagnosis, document closeout, Git/GitHub/Issue mutation, or cleanup.
  The failed GOV010 head is frozen and is not reused.

M2 remains In Progress, M3 remains Not Started, Record 002 is ineffective, and
Issues #144/#274/#276/#278/#280 remain Open. GOV011 preserves rather than
reclassifies every predecessor result.

## Authority and relevant documents

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ Issue #280
→ this Packet
→ Agent judgment
```

Relevant documents: Canonical Decision Register; Work Item Template; Agent
Collaboration Workflow; Milestone Exit Criteria; Release Gates; Test Strategy;
M2 Acceptance Record 001; GOV006/GOV008/GOV009/GOV010 Packets; and Roadmap.
Later Accepted DEC govern an actual conflict.

## Scope

### In scope

1. Planning exact two: this Packet and Roadmap.
2. Fresh latest-main exact-ten strict Blocked publication.
3. Exactly ten ordered per-file native `apply_patch` reconstruction writes,
   each followed immediately by independent target-only status and physical
   content verification.
4. Five frozen-source byte equalities and bounded predecessor/result predicates
   for GOV008/GOV009/GOV010/GOV011/Roadmap.
5. Exact-ten local integrity, dual independent review, first eligible attempt-1
   exact-head three-job CI, and squash merge.
6. Fresh postmerge tracked exact-two GOV011 Packet/Roadmap reconciliation,
   dual review, first eligible attempt-1 exact-head three-job CI, merge, then
   Orchestrator closure of Issues #144/#274/#276/#278/#280 as Completed.

### Out of scope

- any direct/local exit, runtime, unit, integration, concurrent, browser,
  audit, or migration replay; mandatory documentation-PR CI is publication
  eligibility only and is not GOV006 exit/runtime evidence;
- code, test, fixture, dependency, lockfile, configuration, Schema, Compose,
  CI, DEC, product, M3, or Record 001 change;
- changing any GOV006/GOV008/GOV009/GOV010 first red or evidence total;
- same-head retry, tool-result experiment, replacement command/head,
  diagnosis, repair, waiver, Conditional Pass, or inherited runtime result;
- GitHub/Issue mutation by the Documentation Executor.

## Exact 2 / 10 / 2 lifecycle and allowed files

| Phase       | Exact tracked shape                                                                        | Meaning                               |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| Planning    | GOV011 Packet + Roadmap                                                                    | Plan only.                            |
| Publication | `AGENTS.md`, both READMEs, Record 002, GOV006/GOV008/GOV009/GOV010/GOV011 Packets, Roadmap | Exact-ten strict Blocked publication. |
| Postmerge   | tracked GOV011 Packet + tracked Roadmap                                                    | Publication reconciliation only.      |

Every other path is prohibited. Record 001 remains zero-diff. No generated
file is commit-eligible; ignored locked dependencies may materialize but must
not appear in tracked or untracked scope evidence.

## Invocation and first-red discipline

Every process command is one independent literal invocation with fixed cwd and
structured terminal status. `&&`, `||`, pipes, wrappers, heredocs, command
substitution, redirection-derived status, and shell-derived status are
prohibited. Only fixed cwd/SHA/PR/Issue/run IDs may first be ledgered and then
substituted as literal argv. A missing or unexpected status/output is first
red: freeze the actual shape, perform no retry/correction/replacement, and
transfer continuation to M2-GOV-012.

Every `apply_patch` call is one independent governed tool invocation. A tool
error, exception, transport failure, explicit error result, or missing result
is first red even when the file was partly modified. No later write or
post-write verifier runs after such a tool-level red.

## Native apply_patch syntax, result, and physical-effect contract

Every governed documentation write in publication or postmerge—including
reconstruction, fact sync, and review-metadata sync—must satisfy all rules:

1. Input begins with `*** Begin Patch` and ends with `*** End Patch`.
2. An existing-file call has exactly one
   `*** Update File: <allowed-relative-path>` section. Every hunk uses a bare
   literal `@@` plus stable current-file context. Numeric unified-diff hunks,
   absolute destinations, multiple file sections, `---`/`+++` headers,
   deletion, and move instructions are forbidden.
3. Record 002 uses exactly one `*** Add File` section, no hunk marker, and a
   `+` prefix on every content line.
4. The tool call is a **successful invocation candidate** when it completes
   and returns control without a tool error, exception, transport failure,
   explicit error result, or missing result. No success word is required. A
   serialized empty object `{}` is an allowed non-error success value. It is
   not, by itself, proof that the requested bytes changed.
5. Immediately after each successful-invocation candidate, and before any next
   write, execute its one literal target-only `git status` command followed by
   its one independent physical content validator (`cmp` for frozen files,
   `rg -F -q` for non-self mutable governance files). Both must return
   structured RC 0 and the status output must equal the target's expected
   physical state. For a write that adds evidence to this Packet, run its
   declared anchored-section `rg -c --include-zero` baseline immediately
   before the write, require planned RC 1 and exact output `0`, then run the
   identical count after status, require RC 0 and exact output `1`. Because the
   command text does not begin with the anchored Markdown heading, it does not
   count itself. The physical pair or baseline→post count—not serialization
   text—proves the write succeeded.
6. A red or missing immediate status/content result freezes the shape and
   prohibits the next numbered write. There is no retry of the patch or either
   verifier. Reading stable context immediately before a call is allowed but
   cannot serve as post-write proof or authorize retry.

No governed patch updates more than one file. Publication P4 has exactly ten
reconstruction calls. P7 has exactly five mutable-governance review-metadata
calls. Postmerge has two fact-reconciliation calls and, after dual review, two
review-metadata calls. The same result/effect contract applies to every call.

## Publication ledger

### P0 — fresh latest-main identity

From `/Users/ketchup/Projects/ContentOS`, run separately:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-011-apply-patch-result-contract-recovery
test ! -e /private/tmp/contentos-m2-gov-011-publication-wt
git worktree add -b codex/m2-gov-011-apply-patch-result-contract-recovery /private/tmp/contentos-m2-gov-011-publication-wt <RECOVERY_BASE_SHA>
```

Require statuses `0,0,1,0,0`. Ledger latest `origin/main` as
`<RECOVERY_BASE_SHA>`; it must include merged GOV011 planning. Fixed publication
cwd becomes `/private/tmp/contentos-m2-gov-011-publication-wt`. Independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require all RC 0, exact identities, empty status/diff, and Record001-zero.

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

### P2 — entry safe-count

Run once at fixed publication cwd:

```text
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require RC 0 and ledger all four fields. This authorizes no cleanup. The same
literal observer runs at the end of P6 and P7; no positive delta is permitted.
It does not run in postmerge.

### P3 — source and predecessor identities

From frozen GOV006 cwd
`/private/tmp/contentos-m2-gov-006-exit-review-current-wt`, independently:

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
forbidden-zero. Final working-tree bytes—not index—are authoritative.

From frozen GOV010 publication cwd
`/private/tmp/contentos-m2-gov-010-publication-wt`, independently:

```text
git branch --show-current
git rev-parse HEAD
git status --short --untracked-files=all
git diff --name-status 6acde678ff3a3bba3002ea23bfad310b43551530
git ls-files --others --exclude-standard
git diff --exit-code 6acde678ff3a3bba3002ea23bfad310b43551530 -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code 6acde678ff3a3bba3002ea23bfad310b43551530 -- . ':(exclude)AGENTS.md'
```

Require exact GOV010 branch/HEAD, exact ` M AGENTS.md`, exact name-status
`M AGENTS.md`, empty untracked, Record001-zero, and every non-AGENTS path zero.
This observes but never continues the frozen head.

### P4 — exactly ten per-file reconstruction writes

Execute in order. After each non-error tool return, immediately run its two
listed independent verifiers before the next write. Every status command must
emit exactly one target entry (` M <path>` for existing files; `?? <path>` for
new Record 002), and every process returns RC 0.

1. Patch `AGENTS.md` to exact frozen GOV006 bytes, then run independently:

   ```text
   git status --short --untracked-files=all -- AGENTS.md
   cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
   ```

2. Patch `README.md` to exact frozen GOV006 bytes, then run independently:

   ```text
   git status --short --untracked-files=all -- README.md
   cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
   ```

3. Patch `README.zh-CN.md` to exact frozen GOV006 bytes, then run independently:

   ```text
   git status --short --untracked-files=all -- README.zh-CN.md
   cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
   ```

4. Add `docs/implementation/m2-acceptance-record-002.md` with exact frozen
   GOV006 bytes, then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/m2-acceptance-record-002.md
   cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
   ```

5. Patch the GOV006 Packet to exact frozen GOV006 bytes, then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
   cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
   ```

6. Patch the GOV008 Packet with preserved history and the new unique marker
   `Recovery handoff: M2-GOV-011 after GOV010 result-contract red.`, then run
   independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
   rg -F -q 'Recovery handoff: M2-GOV-011 after GOV010 result-contract red.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
   ```

7. Patch the GOV009 Packet with preserved history and the new unique marker
   `Recovery handoff: M2-GOV-011 owns the fresh result-contract recovery.`,
   then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
   rg -F -q 'Recovery handoff: M2-GOV-011 owns the fresh result-contract recovery.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
   ```

8. Patch the GOV010 Packet to status
   `Completed — apply_patch Result Contract Blocked`, record PR #279/run/merge,
   P0–P3 PASS, sole write-1 `{}` plus physical AGENTS change, writes 2–9/P5+
   zero, two post-red read-only observations, transfer to GOV011, and the new
   unique marker `Recovery handoff: M2-GOV-011 after the literal empty-object
result red.`, then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
   rg -F -q 'Recovery handoff: M2-GOV-011 after the literal empty-object result red.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
   ```

9. Patch Roadmap with preserved history and the new unique marker
   `GOV011 publication reconstruction is In Review.`, then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/roadmap.md
   rg -F -q 'GOV011 publication reconstruction is In Review.' docs/implementation/roadmap.md
   ```

10. Immediately before patching the GOV011 Packet, run this independent literal
    structural baseline command:

    ```text
    rg -c --include-zero '^## GOV011 publication implementation evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
    ```

    Require planned RC 1 and exact output `0`. Then patch the GOV011 Packet with
    implementation identity, exact recovery base, actual P0–P4 results, status
    `In Review — exact-ten result-contract recovery`, no P5+ claim, and exactly
    one evidence section headed at Markdown level 2 by the anchored title used
    in the baseline command. After the non-error return, run independently:

    ```text
    git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
    rg -c --include-zero '^## GOV011 publication implementation evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
    ```

    Require status exactly one ` M` entry; require the count RC 0 and exact
    output `1`. Any other pre/post count is first red.

There is no eleventh reconstruction patch or same-head result experiment.
Before review, physical shape is nine tracked `M` files plus untracked Record 002. An allowed `{}` return proceeds only to that call's immediate two
verifiers; it never skips them or proves success alone.

### P5 — complete reconstruction predicates

Run the five frozen byte comparisons and every mutable-governance predicate
below independently, exactly once and in this order. Whole-file equality is
prohibited for the five mutable governance documents.

```text
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after GOV010 result-contract red.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q '3562b56b865d20b02f6cf50e295f062f5e4da4cd' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '@@ -1,14 +1,34 @@' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'P4 writes 2–8 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 owns the fresh result-contract recovery.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '31585514462' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '6acde678ff3a3bba3002ea23bfad310b43551530' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'safe-count compiled=72 compose=0 temp=1 repo-store=0' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'literal serialized result `{}`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'physically modified `AGENTS.md`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'P4 writes 2–9 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after the literal empty-object result red.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'serialized empty object `{}` is an allowed non-error success value' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Exact 2 / 10 / 2 lifecycle' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -c --include-zero '^## GOV011 publication implementation evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'GOV011 publication reconstruction is In Review.' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 remains Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
```

Every command returns RC 0. The anchored GOV011 implementation-section count
must emit exactly `1`.

### P6 — exact-ten local integrity

Run each command independently at fixed publication cwd, exactly once and in
the literal order below:

```text
git status --short --untracked-files=all
git diff --name-status <RECOVERY_BASE_SHA>
git ls-files --others --exclude-standard
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after GOV010 result-contract red.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q '3562b56b865d20b02f6cf50e295f062f5e4da4cd' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '@@ -1,14 +1,34 @@' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'P4 writes 2–8 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 owns the fresh result-contract recovery.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '31585514462' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '6acde678ff3a3bba3002ea23bfad310b43551530' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'safe-count compiled=72 compose=0 temp=1 repo-store=0' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'literal serialized result `{}`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'physically modified `AGENTS.md`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'P4 writes 2–9 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after the literal empty-object result red.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'serialized empty object `{}` is an allowed non-error success value' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Exact 2 / 10 / 2 lifecycle' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -c --include-zero '^## GOV011 publication implementation evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'GOV011 publication reconstruction is In Review.' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 remains Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require nine tracked `M` plus Record002 `A` after staging, empty untracked,
Record001-zero, forbidden-zero, every listed frozen/mutable predicate, and no
positive safe-count delta. The five byte comparisons and every mutable
predicate occur after formatter write/check and before staging, so formatting
cannot silently alter the verified bytes or evidence markers. The anchored
GOV011 implementation-section count must emit exactly `1`.

### P7 — dual review, five metadata writes, final sequence

Two non-author reviewers independently PASS: (1) frozen evidence and strict
Blocked decision accuracy; (2) result/effect contract executability, exact-ten
scope, security/migration/lifecycle correctness. Any finding freezes the head.

After both PASS, execute exactly five ordered native review-metadata patches:
GOV008, GOV009, GOV010, GOV011, then Roadmap. Each updates only its one file and
only review metadata. After each non-error return, run the two literal commands
for that file before the next patch; status must be exactly `MM <path>` and both
commands return RC 0:

1. GOV008 Packet metadata patch:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
   rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
   ```

2. GOV009 Packet metadata patch:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
   rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
   ```

3. GOV010 Packet metadata patch:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
   rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
   ```

4. Immediately before the GOV011 Packet metadata patch, run:

   ```text
   rg -c --include-zero '^### GOV011 publication review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   ```

   Require planned RC 1 and exact output `0`. Patch exactly one evidence
   section headed at Markdown level 3 by the anchored title used in that
   baseline command. Then run independently:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   rg -c --include-zero '^### GOV011 publication review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   ```

   Require status exactly `MM` for the target; require count RC 0 and exact
   output `1`. Any other pre/post count is first red.

5. Roadmap metadata patch:

   ```text
   git status --short --untracked-files=all -- docs/implementation/roadmap.md
   rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/roadmap.md
   ```

Any red prevents every later call. After the fifth physical pair is green, run
each command independently, exactly once and in the literal order below:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/AGENTS.md AGENTS.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.md README.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/README.zh-CN.md README.zh-CN.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/m2-acceptance-record-002.md docs/implementation/m2-acceptance-record-002.md
cmp /private/tmp/contentos-m2-gov-006-exit-review-current-wt/docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md
rg -F -q '469828ad7557b37e4dae68a973c814bb16f6e1a0' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'sole monolithic P3 `apply_patch` returned a context-verification failure on `AGENTS.md`' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'atomic and wrote no file' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'No retry or replacement occurred' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after GOV010 result-contract red.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md
rg -F -q '3562b56b865d20b02f6cf50e295f062f5e4da4cd' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '@@ -1,14 +1,34 @@' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'P4 writes 2–8 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 owns the fresh result-contract recovery.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md
rg -F -q '31585514462' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q '6acde678ff3a3bba3002ea23bfad310b43551530' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'safe-count compiled=72 compose=0 temp=1 repo-store=0' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'literal serialized result `{}`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'physically modified `AGENTS.md`' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'P4 writes 2–9 and P5+ have zero runs' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'Recovery handoff: M2-GOV-011 after the literal empty-object result red.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md
rg -F -q 'serialized empty object `{}` is an allowed non-error success value' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Exact 2 / 10 / 2 lifecycle' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -c --include-zero '^## GOV011 publication implementation evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -c --include-zero '^### GOV011 publication review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'GOV011 publication reconstruction is In Review.' docs/implementation/roadmap.md
rg -F -q 'Record 002 is ineffective' docs/implementation/roadmap.md
rg -F -q 'M2 remains In Progress' docs/implementation/roadmap.md
rg -F -q 'M3 remains Not Started' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
rg -F -q 'GOV011 publication review: evidence and governance reviewers PASS.' docs/implementation/roadmap.md
git diff --check
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 corepack pnpm check:docs
fnm exec --using=24.18.0 corepack pnpm repository:check
fnm exec --using=24.18.0 corepack pnpm check:secrets
git add -- AGENTS.md README.md README.zh-CN.md docs/implementation/m2-acceptance-record-002.md docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
git diff --cached --name-status
git diff --cached --check
git status --short --untracked-files=all
git diff --cached --name-only
git ls-files --others --exclude-standard
git diff --exit-code <RECOVERY_BASE_SHA> -- docs/implementation/m2-acceptance-record-001.md
git diff --exit-code <RECOVERY_BASE_SHA> -- . ':(exclude)AGENTS.md' ':(exclude)README.md' ':(exclude)README.zh-CN.md' ':(exclude)docs/implementation/m2-acceptance-record-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-006-m2-exit-review-002.md' ':(exclude)docs/implementation/work-packets/m2-gov-008-m2-acceptance-record-002-publication-protocol-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-009-m2-acceptance-record-002-per-file-publication-reconstruction-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-010-m2-acceptance-record-002-apply-patch-hunk-recovery.md' ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
fnm exec --using=24.18.0 node -e 'const {execFileSync}=require("node:child_process");const {existsSync,readdirSync}=require("node:fs");const {tmpdir}=require("node:os");const {join}=require("node:path");const ps=execFileSync("ps",["-axo","command="],{encoding:"utf8"});const compiled=ps.split("\n").filter((line)=>/\/apps\/(api|worker|fetcher|renderer)\/dist\/main\.js(?:\s|$)/.test(line)).length;const compose=JSON.parse(execFileSync("docker",["compose","ls","--format","json","--all"],{encoding:"utf8"})).filter((row)=>typeof row.Name==="string"&&row.Name.startsWith("contentos-smoke-")).length;const temp=readdirSync(tmpdir()).filter((name)=>name.startsWith("contentos-smoke-")).length;const store=existsSync(join(process.cwd(),".pnpm-store"))?1:0;process.stdout.write(`safe-count compiled=${compiled} compose=${compose} temp=${temp} repo-store=${store}\n`)'
```

Require exact-ten staged shape, empty untracked, Record001-zero,
forbidden-zero, every frozen/content/review predicate, and no positive
safe-count delta. This is a planned post-review sequence, not a retry after
red. Both anchored GOV011 section counts must emit exactly `1`.

### P8 — commit, PR, exact-head CI, merge

Only the Orchestrator proceeds after P7 is green. Run independently:

```text
git commit -m 'docs: recover record publication result contract'
git rev-parse HEAD
git push -u origin codex/m2-gov-011-apply-patch-result-contract-recovery
gh pr create --draft --base main --head codex/m2-gov-011-apply-patch-result-contract-recovery --title 'docs: recover record publication result contract' --body-file /private/tmp/contentos-m2-gov-011-publication-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<PUBLICATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID> --jq 'if (.head_sha=="<PUBLICATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "publication-ci=verified" else error("publication-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<PUBLICATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "publication-ci-jobs=verified" else error("publication-ci-jobs-invalid") end'
gh pr ready <PUBLICATION_PR_NUMBER>
gh pr merge <PUBLICATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <PUBLICATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
```

The outside-repository body file is one bounded non-shell text write and is
validated read-only. Require exact SHA/event, attempt 1, completed/success, and
exactly the three named jobs. Merge makes Record 002 immutable/effective
Blocked and GOV006 `Completed — Exit Review Blocked`; M2 stays In Progress, M3
Not Started, and all five Issues stay Open. CI is publication eligibility only.

## Postmerge tracked exact-two reconciliation

From repository cwd, independently:

```text
git fetch origin main
git rev-parse origin/main
git show-ref --verify --quiet refs/heads/codex/m2-gov-011-apply-patch-result-contract-reconcile
test ! -e /private/tmp/contentos-m2-gov-011-postmerge-wt
git worktree add -b codex/m2-gov-011-apply-patch-result-contract-reconcile /private/tmp/contentos-m2-gov-011-postmerge-wt <PUBLICATION_MERGE_SHA>
```

Require statuses `0,0,1,0,0` and latest main exactly the publication merge.
From fixed postmerge cwd, independently:

```text
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --untracked-files=all
git diff --exit-code
git diff --exit-code <PUBLICATION_MERGE_SHA> -- docs/implementation/m2-acceptance-record-001.md
```

Require all RC 0, exact branch/SHA identities, empty status/diff, Record001-zero.

Execute exactly two ordered native fact patches: GOV011 Packet, then Roadmap.
Each records exact publication PR/run/jobs/merge, effective Blocked decision,
M2/M3 state, and all still-Open Issues. After each non-error return, run the
two literal commands for that file before the next patch:

1. GOV011 Packet fact patch; target status must be exactly one ` M` entry:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   ```

2. Roadmap fact patch; target status must be exactly one ` M` entry:

   ```text
   git status --short --untracked-files=all -- docs/implementation/roadmap.md
   rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
   ```

Each verifier returns RC 0. Any red freezes the shape. After both physical
pairs are green, substitute ledgered values literally and run every command
independently, exactly once and in this order:

```text
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
fnm exec --using=24.18.0 node --version
fnm exec --using=24.18.0 corepack pnpm --version
fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
fnm exec --using=24.18.0 corepack pnpm workspace:check
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require Node/pnpm/workspace, exact-two staged/status/name, empty untracked,
Record001-zero, forbidden-zero, all ten fact predicates both before and after
formatting, and every RC 0.

Two fresh independent reviewers must PASS. Then execute exactly two ordered
review-metadata patches, GOV011 Packet then Roadmap. After each non-error return,
run the two literal commands for that file before the next patch:

1. Immediately before the GOV011 Packet review-metadata patch, run:

   ```text
   rg -c --include-zero '^### GOV011 postmerge review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   ```

   Require planned RC 1 and exact output `0`. Patch exactly one evidence
   section headed at Markdown level 3 by the anchored title used in that
   baseline command. Then run independently; target status must be exactly
   `MM`:

   ```text
   git status --short --untracked-files=all -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   rg -c --include-zero '^### GOV011 postmerge review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
   ```

   Require count RC 0 and exact output `1`. Any other pre/post count is first
   red.

2. Roadmap review-metadata patch; target status must be exactly `MM`:

   ```text
   git status --short --untracked-files=all -- docs/implementation/roadmap.md
   rg -F -q 'GOV011 postmerge review: evidence and governance reviewers PASS.' docs/implementation/roadmap.md
   ```

Each verifier returns RC 0. Any red freezes the shape. After both physical
pairs are green, run every command independently, exactly once and in this
literal order:

```text
fnm exec --using=24.18.0 corepack pnpm exec prettier --write docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm exec prettier --check docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -c --include-zero '^### GOV011 postmerge review evidence$' docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md
rg -F -q '<PUBLICATION_PR_NUMBER>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_RUN_ID>' docs/implementation/roadmap.md
rg -F -q '<PUBLICATION_MERGE_SHA>' docs/implementation/roadmap.md
rg -F -q 'Record 002 is effective Blocked' docs/implementation/roadmap.md
rg -F -q 'Issues #144/#274/#276/#278/#280 remain Open' docs/implementation/roadmap.md
rg -F -q 'GOV011 postmerge review: evidence and governance reviewers PASS.' docs/implementation/roadmap.md
fnm exec --using=24.18.0 corepack pnpm format:check
git add -- docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md docs/implementation/roadmap.md
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
git diff --exit-code <PUBLICATION_MERGE_SHA> -- . ':(exclude)docs/implementation/work-packets/m2-gov-011-m2-acceptance-record-002-apply-patch-result-contract-recovery.md' ':(exclude)docs/implementation/roadmap.md'
```

Require exact-two, empty untracked, Record001-zero, forbidden-zero, all ten
publication-fact predicates, both review-metadata predicates, and every RC 0.
The anchored GOV011 postmerge-review section count must emit exactly `1`.

Then independently:

```text
git commit -m 'docs: reconcile result-contract record publication'
git rev-parse HEAD
git push -u origin codex/m2-gov-011-apply-patch-result-contract-reconcile
gh pr create --draft --base main --head codex/m2-gov-011-apply-patch-result-contract-reconcile --title 'docs: reconcile result-contract record publication' --body-file /private/tmp/contentos-m2-gov-011-postmerge-pr-body.md
gh api --method GET repos/JettxonHo/ContentOS/actions/workflows/ci.yml/runs -f head_sha=<RECONCILIATION_SHA> -f event=pull_request -f per_page=100 --jq '.workflow_runs|sort_by(.created_at,.id)|.[0]|[.id,.head_sha,.event,.run_attempt,.status,.conclusion]|@tsv'
gh api repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID> --jq 'if (.head_sha=="<RECONCILIATION_SHA>" and .event=="pull_request" and .run_attempt==1 and .status=="completed" and .conclusion=="success") then "reconciliation-ci=verified" else error("reconciliation-ci-invalid") end'
gh api --method GET repos/JettxonHo/ContentOS/actions/runs/<RECONCILIATION_RUN_ID>/jobs -f per_page=100 --jq 'if ((.jobs|length)==3 and ([.jobs[].name]|sort)==(["Docker-independent quality","Integration smoke (Docker)","M1/M2 browser smoke (Chromium)"]|sort) and all(.jobs[];.status=="completed" and .conclusion=="success")) then "reconciliation-ci-jobs=verified" else error("reconciliation-ci-jobs-invalid") end'
gh pr ready <RECONCILIATION_PR_NUMBER>
gh pr merge <RECONCILIATION_PR_NUMBER> --squash --delete-branch=false
gh pr view <RECONCILIATION_PR_NUMBER> --json state,mergedAt,mergeCommit --jq '[.state,.mergedAt,.mergeCommit.oid]|@tsv'
gh issue close 144 --reason completed --comment 'Strict Blocked Record 002 publication and tracked reconciliation are merged; M2 remains In Progress and M3 remains Not Started.'
gh issue close 274 --reason completed --comment 'GOV008 publication first red is preserved and recovered by merged GOV011 publication/reconciliation.'
gh issue close 276 --reason completed --comment 'GOV009 numeric-hunk first red is preserved and recovered by merged GOV011 publication/reconciliation.'
gh issue close 278 --reason completed --comment 'GOV010 result-contract first red is preserved and recovered by merged GOV011 publication/reconciliation.'
gh issue close 280 --reason completed --comment 'GOV011 exact-ten result-contract publication and exact-two reconciliation are merged.'
```

Require every RC 0, exact attempt-1 three-job success, and verified merge facts.
Only after exact-two merge may all five Issues close Completed. Issue completion
does not make M2 Passed or start M3.

## Acceptance criteria

1. Planning exact two merges before implementation.
2. GOV006/GOV008/GOV009/GOV010 evidence remains immutable; no exit/runtime
   evidence reruns and no failed head is reused.
3. The tool-result contract accepts `{}` only as a non-error invocation
   candidate and requires immediate independent status/content proof before the
   next write.
4. Fresh publication performs exactly ten ordered per-file writes; each has its
   own immediate physical pair and no retry.
5. Five standalone destinations byte-equal frozen working-tree sources after
   reconstruction, formatter, and metadata; bounded predicates validate the
   five mutable governance documents.
6. Exact-ten local integrity, dual reviews, metadata sync, attempt-1 three-job
   CI, and merge all pass.
7. Exact-ten merge makes Record 002 effective Blocked while M2 remains In
   Progress, M3 Not Started, and all five Issues remain Open.
8. Fresh postmerge tracked exact-two passes checks, reviews, result/effect
   validation, CI, and merge; only then may all five Issues close Completed.
9. Any red/missing result freezes actual shape and transfers to GOV012 without
   same-head retry or replacement.

## Required evidence

- Static/docs: targeted Prettier write/check, repository-wide `format:check`,
  `check:docs`, `repository:check`, `check:secrets`, and `git diff --check`.
- Scope/effect: per-write target status/content pairs; exact tracked/staged/
  untracked predicates; Record001-zero; forbidden-zero; five byte equalities;
  mutable fixed predicates; entry/final safe-count comparison.
- Review: two independent PASS results for publication and two fresh PASS
  results for postmerge reconciliation.
- CI: first eligible exact-head attempt-1 exact three-job success for each docs
  PR; publication eligibility only, never GOV006 exit/runtime evidence.
- Direct/local exit/runtime/test/audit/migration replay: Not Run by GOV011.

## Security review

Documentation-only. No user content, external input, Credential, network,
Authentication, Authorization, Object Storage, Secret, Source-safety,
prompt-injection, Renderer isolation, logging, Export, deletion, or production
boundary changes. Existing Secret checks run. No hash, cleanup authority, or
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

- Planning: GOV011 Packet and Roadmap only.
- Publication: exact ten documents listed above.
- Postmerge: tracked GOV011 Packet and Roadmap only.
- Record 001, Accepted DEC, code, configuration, and M3 documents: unchanged.

## Planning verification chronology

Planning began on exact base/HEAD
`6acde678ff3a3bba3002ea23bfad310b43551530` in the fixed branch/worktree above.
The Planning Agent read current AGENTS, Work Item Template, Agent Collaboration
Workflow, complete GOV006/GOV008/GOV009/GOV010 Packets, and relevant Roadmap.
Read-only verification confirmed PR #279 merged as the stated squash, run
`31585514462` was attempt-1 exact-three-job success, predecessor Issues remained
Open, and frozen GOV010 physical shape was one modified `AGENTS.md`. Issue #280
was created Open. No exit, runtime, test, audit, migration, commit, push, PR,
merge, or implementation command ran in planning.

The first targeted Node 24 Packet/Roadmap Prettier write returned RC 0 and
materialized 571 ignored locked packages. The following targeted Prettier
check, `repository:check`, `git diff --check`, exact-two status/tracked/
untracked, Record001-zero, and forbidden-zero each independently returned RC 0. Physical status was exactly tracked `M` Roadmap plus untracked GOV011
Packet. Issue #280 was then synchronized to full Packet-body parity. No exit,
runtime, test, audit, migration, commit, push, PR, merge, or implementation
command ran in planning. Dual Definition of Ready review and any corrected-head
checks/parity remain pending.

Dual Definition of Ready review returned three executable-ledger findings: all
19 governed writes needed literal fixed-path target status plus independent
content verification; mutable immediate predicates needed unique write-created
markers and the GOV008 historical sentence needed canonical spacing; and P6,
P7, postmerge entry, and postmerge final sequences needed complete literal
expansion with metadata-affected predicate revalidation. The correction changed
only this Packet and Roadmap. It adds ten P4, five P7, two postmerge-fact, and
two postmerge-metadata physical pairs; unique mutable markers; canonical GOV008
wording; and complete ordered formatter/predicate/staging/static/scope ledgers
without repeat/reference shorthand. The corrected targeted Node 24 Prettier
write returned RC 0, formatting this Packet while Roadmap was unchanged. Its
following targeted Prettier check, `repository:check`, `git diff --check`,
exact-two status/tracked/untracked, Record001-zero, and forbidden-zero each
independently returned RC 0. Physical status remained exactly tracked `M`
Roadmap plus untracked GOV011 Packet. One final current-head check set and Issue
#280 body parity follow this chronology write; no exit/runtime/test/audit/
migration, commit, push, PR, merge, or implementation command has run.

The corrected plan's sole remaining review finding identified three
self-preexisting GOV011 Packet markers. The final correction replaces them at
P4 write 10, P7 GOV011 metadata, and postmerge GOV011 metadata with independent
anchored-section baseline→post counts: planned RC1/output `0` immediately
before the write and RC0/output `1` immediately after target-only status. The
command text cannot match its anchored Markdown-heading target. The relevant
later ledgers revalidate exact count `1`. Only this Packet and Roadmap changed.
One final Node 24 exact-two check set and Issue #280 parity follow; no prohibited
runtime/test/audit/migration/Git action has run.

## Definition of Ready

Ready. Exact-two static/scope and Issue #280 parity passed. Reviewers
`/root/m2_gov_006_dor_correctness` and `/root/m2_gov_006_dor_governance`, role
`DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
`UNVERIFIED_RUNTIME_MODEL`, reviewed base `6acde678ff3a3bba3002ea23bfad310b43551530`,
the corrected physical exact-two, frozen predecessor evidence, and live parity;
both returned PASS/no findings/no BQ/no DEC with planning-only authority. The
Orchestrator records explicit same-worktree handoff. Planning PR/CI/merge remains
required before P0.

## Definition of Done

Only merged exact-ten publication, merged fresh postmerge tracked exact-two
reconciliation, and Orchestrator closure of all five Issues completes GOV011.
Record 002 remains Blocked, M2 In Progress, and M3 Not Started.

## Rollback and possible DEC

Before merge, abandon only the affected fresh branch/PR. After Record 002
merges it is immutable; later correction uses a later numbered recovery or
Acceptance Record. No runtime/database rollback exists. No new DEC is expected;
an actual authority conflict returns `HUMAN_DECISION_REQUIRED`.
