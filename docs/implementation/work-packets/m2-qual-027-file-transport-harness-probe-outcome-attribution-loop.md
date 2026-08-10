# M2-QUAL-027 — File-Transport Harness-Probe Outcome Attribution Loop

**Status:** Blocked — Harness Probe Attribution Not Verified

## Identification

- **Task ID:** M2-QUAL-027
- **Milestone:** M2 — Source and Workflow Foundation
- **Work Item type:** Quality / diagnostic attribution
- **Issue:** #232 — `M2-QUAL-027 — File-Transport Harness-Probe Outcome
Attribution Loop` (Open)
- **Planning worktree:** `/private/tmp/contentos-m2-qual-027-plan-wt`
- **Planning branch:** `codex/m2-qual-027-harness-probe-plan`
- **Planning base/HEAD:** `3490615cc789e0e5077d788770033bf12363f9fc`
- **Planning target shape:** exact two — this Packet plus
  `docs/implementation/roadmap.md`
- **Executor profile:** `BACKEND_GENERAL_EXECUTOR`
- **Implementation thread:** `/root/m2_qual_027_implementation`
- **Implementation role:** `IMPLEMENTER`
- **Requested implementation agent:** `luna-worker`
- **Configured implementation model/reasoning:** `gpt-5.6-luna` / Max
- **Actual runtime model:** `UNVERIFIED_RUNTIME_MODEL`
- **Implementation worktree:** `/private/tmp/contentos-m2-qual-027-plan-wt`
- **Implementation branch:** `codex/m2-qual-027-harness-probe-plan`
- **Implementation base/HEAD:** `3490615cc789e0e5077d788770033bf12363f9fc`
- **Authorized initial handoff:** same-worktree implementation handoff from
  the reviewed planning exact-two Packet/Roadmap shape; the local maximum was
  authorized to become exact four by adding only the two owned code files.
- **Fresh publication candidate worktree:**
  `/private/tmp/contentos-m2-qual-027-blocked-status-wt`
- **Fresh publication candidate branch:**
  `codex/m2-qual-027-blocked-status-sync`
- **Fresh publication candidate base/HEAD:**
  `3490615cc789e0e5077d788770033bf12363f9fc`
- **Fresh publication candidate target shape:** exact two — this Packet plus
  `docs/implementation/roadmap.md`
- **Definition-of-Ready reviewers:**
  `/root/m2_qual_014_dor_correctness` and
  `/root/m2_qual_012_browser_setup_diagnosis`
- **Relevant DEC:** none; this is a local reversible diagnostic and does not
  change an Accepted product, architecture, security, workflow, or release
  contract
- **Risk classification:** bounded local diagnostic, command transport,
  filesystem metadata, evidence minimization

## Goal

Create one fast deterministic and red-capable loop at the exact unresolved
`harness-probe` seam. The loop must distinguish bounded temporary-directory
enumeration open, read, close, and over-cap outcomes without retaining entry
names or raw errors. It must then run the real probe in at most three
predetermined slots and publish only a reviewed Packet/Roadmap terminal record.

This Work Item diagnoses one filesystem-operation stage only. It does not
repair the probe, explain the historical failure, replay Concurrent or Worker,
or resume M2-GOV-006.

## Context and dependency evidence

M2-QUAL-026 is effective terminal
`Blocked — Process Command Probe Attribution Not Verified` on current main.
Its first non-Git heredoc invocation failed before the safety body because the
tool transport changed a literal newline escape. The separately permitted raw
final safety invocation reached the body and returned exactly:

```text
QUAL026_SAFETY safe=blocked category=harness-probe
```

The frozen QUAL026 command maps `harness-probe` only to the bounded
`opendirSync(tmpdir())` / repeated `readSync()` / `closeSync()` enumeration or
its 10,000-entry cap. The later `contentos-smoke-harness-` prefix predicate was
not reached when the generic category was emitted. This bounds the next seam;
it does not identify a root cause.

PR #230 published the QUAL026 Blocked record and PR #231 reconciled it. Issue
#229 remains Open. Issues #226/#222/#218/#215/#208/#204/#196/#147 remain Open;
#212/#210 remain Closed. M2-GOV-006 remains Blocked, M2 remains In Progress,
and M3 remains Not Started.

The diagnosing-bugs Phase-1 requirement governs this Work Item: no hypothesis,
repair, Worker replay, or broader instrumentation is allowed until the focused
synthetic read-failure fixture has run once and proved the exact RC20 red
record.

## In scope

1. Add one import-safe local observer with a pure injected enumeration core,
   a real `tmpdir()` directory adapter, a fixed preflight mode, and one fixed
   CLI record.
2. Add exactly one deterministic twelve-test file covering the complete
   clear/red/blocked tuple matrix and a synthetic read-failure red loop.
3. Permit the two code files to be created with `apply_patch` before the first
   process call so that the first governed invocation uses a file path and pure
   argv rather than inline source transport.
4. Run one exact preflight, one install/workspace sequence, one focused test,
   one root check, and at most three predetermined real-observer slots under
   normal permission from their first physical invocations.
5. Record the fixed terminal evidence in this Packet and Roadmap, then publish
   only a separate fresh-main exact-two Packet/Roadmap candidate.

## Out of scope

- no repair, cleanup, deletion, signal, timeout, retry policy, prefix-filter
  behavior, or directory-permission change;
- no Process Command, `lsof`, `ps`, Docker, Concurrent, Integration, Browser,
  Worker, or QUAL026-observer invocation inside the real probe;
- no Worker repair publication, Concurrent runner change, Harness Current-truth
  change, package script, dependency, lockfile, CI, Compose, Schema, migration,
  product, API, Acceptance Record, README, AGENTS, or DEC change;
- no root-cause, actor, permission-denial, filesystem-size, historical
  explanation, repair, or non-recurrence claim;
- no publication of the observer or test, regardless of local outcome; and
- no M2-GOV-006 restart, M2 completion, or M3 start.

## Relevant documents

- [Repository guidance](../../../AGENTS.md)
- [Work Item template](../work-item-template.md)
- [Agent collaboration workflow](../agent-collaboration-workflow.md)
- [Test strategy](../../quality/test-strategy.md)
- [Release gates](../../quality/release-gates.md)
- [Roadmap](../roadmap.md)
- [M2-QUAL-026 Packet](m2-qual-026-process-command-probe-outcome-attribution-loop.md)

No Current-truth behavior changes. A later Accepted DEC governs any actual
conflict.

## Exact file and phase boundaries

### Planning exact two

1. `docs/implementation/work-packets/m2-qual-027-file-transport-harness-probe-outcome-attribution-loop.md`
2. `docs/implementation/roadmap.md`

Planning remains local in this worktree. There is no planning PR.

### Local maximum exact four

1. `packages/testing/src/integration/observe-harness-probe.ts`
2. `packages/testing/src/harness-probe-observer.test.ts`
3. this Packet
4. `docs/implementation/roadmap.md`

If any first red occurs before exact four, freeze the actual exact-two,
exact-three, or exact-four shape immediately. Do not create a missing file only
to satisfy a preferred shape.

### Terminal publication exact two

Every terminal outcome is reconstructed from a separate fresh latest-main
worktree and publishes only this Packet plus Roadmap. Observer/test never
publish. A post-merge status reconciliation, when required to record immutable
PR/CI facts, is also exact two tracked Packet plus Roadmap.

### Forbidden zero-diff paths

- `packages/testing/src/integration/run-concurrent-smoke.ts`
- `packages/testing/src/concurrent-smoke.test.ts`
- `docs/quality/integration-smoke-harness.md`
- QUAL021/QUAL026 observer or test files
- M2-QUAL-026 and every older Packet
- Worker code/tests and the M2-QUAL-003 Packet
- package manifests/scripts, dependencies, lockfile, CI, Compose, Schema,
  migrations, product/API/current-truth, Acceptance Records, README, AGENTS,
  and the DEC register

No generated file, log, raw output, hash, manifest, tee, temporary source file,
or diagnostic artifact may be retained or committed.

## Observer contract

### Pure adapter

The core accepts an injected adapter with exactly these operations:

```ts
type DirectoryAdapter = {
  open(): unknown;
  read(handle: unknown): boolean;
  close(handle: unknown): void;
};
```

`read` returns only whether another entry existed. It never returns a name,
`Dirent`, path, content, or error object to the core. Unsupported or missing
operations are malformed and Blocked.

### Real adapter

The real adapter performs exactly this narrow operation:

1. `opendirSync(tmpdir())` once;
2. at most 10,001 `readSync()` attempts for a 10,000-entry cap;
3. discard each returned `Dirent` immediately without reading or retaining its
   name;
4. identify over-cap only when the 10,001st entry exists; and
5. attempt `closeSync()` exactly once in `finally` after a successful open.

It does not filter prefixes, inspect entry metadata, follow links, open entry
contents, delete anything, spawn a child, or inspect an error value. Caught
error objects are discarded immediately; only the operation stage is retained.

### Result schema

The pure result has exactly these own fields and no raw field:

```ts
type HarnessProbeResult = {
  exitCode: 0 | 1 | 20;
  predicate: 'clear' | 'red' | 'blocked';
  reason: 'none' | 'open-error' | 'read-error' | 'close-error' | 'over-cap' | 'mixed' | 'malformed' | 'unexpected';
  entries: 'zero' | 'one' | 'multiple' | 'over-cap';
  failures: 'zero' | 'one' | 'multiple';
};
```

Failure count is a bounded condition bucket. Open/read/close errors and the
over-cap condition each contribute one condition; it is never a numeric error
code or raw count.

### Closed tuple rules

| Predicate | Reason                 | Entries                          | Failures | RC  |
| --------- | ---------------------- | -------------------------------- | -------- | --- |
| clear     | none                   | zero / one / multiple            | zero     | 0   |
| red       | open-error             | zero                             | one      | 20  |
| red       | read-error             | zero / one / multiple            | one      | 20  |
| red       | close-error            | zero / one / multiple            | one      | 20  |
| red       | over-cap               | over-cap                         | one      | 20  |
| red       | mixed                  | zero / one / multiple / over-cap | multiple | 20  |
| blocked   | malformed / unexpected | zero                             | one      | 1   |

Precedence is exact:

1. malformed adapter or impossible internal tuple → blocked/malformed RC1;
2. unexpected caller/core exception → blocked/unexpected RC1;
3. two or more open/read/close/over-cap conditions → red/mixed RC20;
4. otherwise the single open/read/close/over-cap condition wins; and
5. no condition → clear/none RC0.

An open failure has no handle and therefore no close attempt. After successful
open, close is attempted once even after read failure or over-cap.

### Fixed output and CLI

Default invocation emits exactly one LF-terminated line:

```text
Harness harness-probe predicate=<clear|red|blocked> reason=<allowlisted> entries=<zero|one|multiple|over-cap> failures=<zero|one|multiple>
```

The module uses an import-safe guard based on `pathToFileURL(process.argv[1])`.
Importing it performs no open/read/close/write/exit action. The CLI calls the
core once, calls the supplied writer once, and assigns `process.exitCode` once.
Writer failure or unexpected caller failure causes RC1 and no second write.

The only other accepted argv is `--mode=preflight`. It performs no target
directory operation and emits exactly:

```text
Harness harness-probe preflight=verified
```

Preflight requires Node `24.18.0` and all exact eleven governed injection
variables unset. Every preflight failure that reaches the caller emits exactly
one LF-terminated line:

```text
Harness harness-probe preflight=blocked reason=<node-version|injection|invalid-invocation|unexpected>
```

The closed mapping is Node mismatch → `node-version`, any governed injection →
`injection`, unknown/multiple argv → `invalid-invocation`, and unexpected
caller/core failure → `unexpected`; all use RC1. Preflight success or failure
performs exactly one writer call and one `process.exitCode` assignment. Writer
failure emits no secondary line and returns RC1. Parse/transport failure,
missing status/output, extra/partial/duplicate/CRLF output, or a reason outside
the closed set Blocks without substitute or retry.

Exact injection names:

1. `CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE`
2. `CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE`
3. `CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY`
4. `CONTENTOS_SMOKE_INJECT_FAILURE`
5. `CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE`
6. `CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE`
7. `CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE`
8. `CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE`
9. `CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE`
10. `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE`
11. `CONTENTOS_BROWSER_INJECT_FAILURE`

No heredoc, stdin program, `node -e`, `--eval`, command substitution,
shell-generated source, pipe, tee, temporary source, or alternate transport is
authorized in the implementation epoch.

## Deterministic fixtures and Phase-1 loop

Exactly twelve ordinary tests in one file:

1. zero entries → clear/none/zero/zero;
2. one entry → clear/none/one/zero;
3. multiple bounded entries → clear/none/multiple/zero;
4. exactly 10,000 entries → clear and exactly 10,001 read attempts including
   the final EOF read;
5. a present 10,001st entry → red/over-cap with no 10,002nd read;
6. open throws → red/open-error, no close;
7. first read throws → red/read-error with close once;
8. later read throws → red/read-error with bounded entry bucket and close once;
9. close-only throw → red/close-error;
10. read plus close throw → red/mixed;
11. over-cap plus close throw → red/mixed; and
12. grouped caller/security matrix: malformed adapter, exact LF and field
    allowlist, one write/one exit, import safety, exact preflight success and
    blocked grammars, node/injection/argv mapping, and sanitized
    unexpected/writer failure.

The focused command validates the classifier and caller, including deterministic
red capability:

```bash
fnm exec --using=24.18.0 corepack pnpm exec vitest run packages/testing/src/harness-probe-observer.test.ts
```

It runs once and must return RC0 with exactly `1 file / 12 tests`. The synthetic
read-failure fixture must assert the exact RC20 red/read-error record. It does
not itself exercise the unresolved real `tmpdir()` adapter and therefore does
not complete diagnosing-bugs Phase 1.

The actual Phase-1 loop is the exact checked-in CLI real-slot command in step 8.
Phase 1 completes only after at least one real slot has run and returned one
valid exact RC0 clear or RC20 red tuple. If preflight, static, focused, or root
Blocks first, the real Phase-1 loop remains unexecuted and no reproduction or
hypothesis is claimed.

Current main CI run `31353496981` proves the root baseline `54 files / 578
tests`. With this one twelve-test file, the exact root expectation is `55 files
/ 590 tests` plus five application builds.

## Normal-permission execution order and exact counts

Every invoked fnm/Node/Corepack/pnpm/Prettier/Vitest/repository process uses
normal process permission from its first physical invocation. Sandbox-first is
first-red Blocked. Pure Git and the two authorized `apply_patch` file writes may
precede the first process; no other command or exploratory probe may.

1. Pure Git only: verify branch/base/initial exact-two/diff-check/allowlist and
   no unexpected path. Live Issue parity is Orchestrator/DoR evidence outside
   the implementation epoch; the implementer does not query GitHub.
2. Add only observer and test with one bounded `apply_patch` operation per file.
   Physical shape becomes exact four before any process.
3. First process-spawning call exactly once from candidate cwd:

   ```bash
   fnm exec --using=24.18.0 node packages/testing/src/integration/observe-harness-probe.ts --mode=preflight
   ```

   Require RC0 and exactly one preflight verified line. Any failure freezes
   exact four; no retry, substitute, or default Node version probe.

4. Run each exact command once and require pnpm `11.17.0`, frozen install RC0,
   and workspace RC0:

   ```bash
   fnm exec --using=24.18.0 corepack pnpm --version
   fnm exec --using=24.18.0 corepack pnpm install --frozen-lockfile
   fnm exec --using=24.18.0 corepack pnpm workspace:check
   ```

5. Run exactly one code formatting transformation, then the targeted code
   formatting/repository/diff checks exactly once. Any red freezes code and
   permits only Packet/Roadmap evidence sync.
6. Run the focused command once; require `1 file / 12 tests`, including the
   exact synthetic RC20 red loop.
7. Run root exactly once and require RC0, `55 files / 590 tests`, and five
   builds.
8. Run up to three predetermined sequential real slots, each using exactly:

   ```bash
   fnm exec --using=24.18.0 node packages/testing/src/integration/observe-harness-probe.ts
   ```

   A valid RC0 clear consumes a slot; the first valid RC20 red stops with
   attribution. Any other result Blocks immediately. No consumed slot is
   retried or replaced.

9. Synchronize Packet/Roadmap only, then run the final exact-four targeted
   Prettier/repository/diff checks once. Do not rerun preflight, focused, root,
   or an observer slot.

No local Docker, residue, cleanup, Integration, Browser, Concurrent, Worker,
QUAL026 observer, direct tmpdir shell inspection, or second diagnostic command
is authorized. After any ordinary first red, stop every later gate, slot,
transformation, rerun, or replacement. Freeze the actual shape and never add a
file to reach a preferred count.

## Local and publication outcomes

### Local eligible outcomes

- first valid RC20 exact red record after all prerequisites →
  `In Review — Harness Probe Reproduced and Safely Classified`;
- three valid RC0 exact clear records after all prerequisites →
  `In Review — Harness Probe Not Reproduced`;
- any prerequisite/static/test/root/CLI/record/status/scope/security/review
  failure → `Blocked — Harness Probe Attribution Not Verified`.

### Merge-effective publication outcomes

- `Completed — Harness Probe Reproduced and Safely Classified`;
- `Completed — Harness Probe Not Reproduced`; or
- `Blocked — Harness Probe Attribution Not Verified`.

Completed means only that this filesystem-operation seam was safely classified
or not reproduced in three bounded slots. It does not prove cause, repair,
historical explanation, deterministic non-recurrence, or Worker/Concurrent
readiness.

## Reviews, publication, and recovery

1. Two independent Definition-of-Ready reviews PASS before implementation
   handoff.
2. The actual frozen exact-four implementation/evidence shape received two new
   independent reviews recorded below; existing QUAL026 reviews cannot
   substitute.
3. This fresh latest-main exact-two terminal candidate requires its own two
   publication reviews and targeted docs static/scope PASS.
4. The exact final docs head must receive its first eligible
   quality/Integration/Browser CI result. All three must be green before the
   Orchestrator squash-merges.
5. CI red/missing closes the PR unmerged with no unchanged rerun, replacement,
   or new head. At most one material fresh-main exact-two evidence correction
   may receive new reviews/static/first eligible three-job CI. A second
   red/missing result requires M2-QUAL-028.
6. Implementer and reviewers have no Git/GitHub/Issue mutation authority. The
   Orchestrator alone may publish, merge, and transition Issues after every
   gate is satisfied.

Observer/test never publish. A later separately Ready Work Item must consume
the terminal classification before any broader safety, Process Command,
Concurrent, Worker, or Acceptance replay.

## Issue lifecycle

- Keep Issue #232 and all linked Open Issues, including #229, Open through this
  candidate's review, CI, and merge.
- A merged Blocked record leaves every Open Issue Open; #212/#210 remain Closed.
- M2-GOV-006 remains Blocked, M2 remains In Progress, and M3 remains Not
  Started in every QUAL027 outcome.

## Security, migration, observability, and DEC

The observer handles only transient filesystem enumeration metadata. It never
retains or publishes entry names, `Dirent` values, paths, contents, error
objects/codes/messages, PIDs, commands/arguments, environment values, status or
signal detail, URL/port, secret, stack, log, hash, manifest, artifact, or raw
stdout/stderr. Durable evidence is limited to governance identities, approved
top-level command/result tuples, exact fixed records, RC, test/build counts,
physical file scope, and fixed enum/bucket fields.

No product data, external input, credential, network/provider transmission,
Authentication, Authorization, Object Storage, Queue, API, Schema, migration,
configuration, logging policy, deletion range, or accepted security boundary
changes. No migration, compatibility sequence, backfill, or rollback is needed.
There is no cleanup authority or persistent diagnostic sink.

Documentation updates are this Packet and Roadmap only. No new DEC is required:
this is local unpublished diagnostic instrumentation at an existing test seam.
Any repair, interface change, or accepted release/security/architecture change
requires a separate Ready Work Item or Decision Review as applicable.

## Acceptance criteria

1. Planning is exact two from main
   `3490615cc789e0e5077d788770033bf12363f9fc`, with live Issue parity, dual DoR
   PASS, no Blocking Design Question, and no new DEC before handoff.
2. The two code files are created before the first process; the first process is
   the exact pure-argv preflight file invocation with no inline source transport.
3. The observer implements the exact adapter, cap, tuple, import, one-write,
   fixed-output, and no-raw-evidence contracts.
4. Focused `1 file / 12 tests` validates the classifier/caller and synthetic
   read-failure RC20 branch; root passes `55 files / 590 tests` plus five builds
   exactly once.
5. The exact checked-in CLI real-slot command runs at least once to establish
   the actual Phase-1 loop; at most three slots produce a valid red, three
   valid clears, or immediate Blocked, with no rerun/replacement.
6. Final actual-shape static/scope and two independent reviews PASS, or a
   precise frozen Blocked record is reviewed without code publication.
7. Fresh exact-two publication reviews/static, first eligible exact-head
   three-job CI, and Orchestrator merge complete before terminal status is
   effective.
8. Issue, security, predecessor, M2/M3, recovery, publication, and no-DEC
   boundaries remain exact.

## Definition of Ready checklist

- [x] Goal and exact diagnostic seam are clear.
- [x] Planning 2 / local maximum 4 / publication 2 scopes are fixed.
- [x] Issue exists and matches this Packet.
- [x] Pure adapter, real adapter, cap, tuple, record, CLI, and preflight contracts
      are closed.
- [x] Twelve fixtures and exact focused/root counts are fixed.
- [x] Pure-argv first-call and normal-permission order are executable.
- [x] First-red, terminal, publication, recovery, and Issue lifecycles are fixed.
- [x] Security, migration, documentation, and DEC impacts are resolved.
- [x] Two independent DoR reviews PASS with no unresolved finding.

## Definition-of-Ready reviews

Two independent Definition-of-Ready reviews are PASS with no findings and all
corrections closed:

- `/root/m2_qual_014_dor_correctness`, logical role
  `DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`; and
- `/root/m2_qual_012_browser_setup_diagnosis`, logical role
  `DEFINITION_OF_READY_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.

Both reviewed base/HEAD `3490615cc789e0e5077d788770033bf12363f9fc`, planning
exact-two shape, final planning static/scope, and live Issue #232 parity. Their
PASS authority was limited to the same-worktree implementation handoff.

## Implementation evidence and frozen terminal outcome

The explicit same-worktree handoff used worktree
`/private/tmp/contentos-m2-qual-027-plan-wt`, branch
`codex/m2-qual-027-harness-probe-plan`, and base/HEAD
`3490615cc789e0e5077d788770033bf12363f9fc`. The implementation role was
`IMPLEMENTER`, requested agent `luna-worker`, configured model/reasoning
`gpt-5.6-luna` / Max, and actual runtime model
`UNVERIFIED_RUNTIME_MODEL`. The local maximum froze at exact four: the two
owned code files, this Packet, and the Roadmap. No forbidden or unexpected
path was introduced.

The first process was the exact pure-argv preflight invocation under normal
permission and returned RC0 with one exact line:

```text
Harness harness-probe preflight=verified
```

The one-time pnpm version, frozen install, workspace, code formatting write,
pre-runtime formatting check, repository check, and diff check all returned
RC0. The focused classifier/caller command then returned RC0 with exactly one
file and twelve passing tests, including the synthetic read-failure RC20
branch. The single root `pnpm check` stopped at its first red: format check
passed, then the owned `harness-probe-observer.test.ts` lint case was
`prefer-const`. Typecheck, test, and build did not run. No later
implementation/runtime gate or code transformation, retry, replacement, or
real observer command was run. The permitted Packet/Roadmap docs-only
evidence write then recorded this frozen outcome. The final exact-four
targeted Prettier check (including both code files and both docs),
`repository:check`, `git diff --check`, and exact-four/forbidden/no-unexpected
scope checks all passed. No runtime rerun occurred.

The real diagnosing-bugs Phase-1 loop remains unexecuted: real CLI slots `0`,
valid clear records `0`, valid red records `0`, and hypotheses, repair,
root-cause, non-recurrence, Worker, Concurrent, Integration, Browser, and
Process Command replay counts all remain `0`.

### Frozen code/test adequacy finding (not repaired)

Frozen review found one contract adequacy gap in the unpublished observer/test
shape. An unexpected exception while evaluating `--mode=preflight` reaches the
common CLI catch and emits the default
`Harness harness-probe predicate=blocked reason=unexpected entries=zero failures=one`
record instead of the required exact
`Harness harness-probe preflight=blocked reason=unexpected` LF record. The
twelfth grouped fixture covers an unexpected default caller/core failure and a
writer failure, but does not exercise an unexpected preflight failure. This is
recorded as a code/test adequacy finding only; the first root red froze the
code, so there was no repair or rerun, and observer/test remain unpublished.

### Frozen exact-four independent reviews

The frozen exact-four implementation/evidence shape and Completion Report were
independently reviewed by both reviewers below against base/HEAD
`3490615cc789e0e5077d788770033bf12363f9fc`, the corrected physical exact-four
shape (the two owned code files plus Packet and Roadmap), the recorded first
red, the frozen adequacy finding, and the final static evidence:

- `/root/m2_qual_014_dor_correctness`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.
- `/root/m2_qual_012_browser_setup_diagnosis`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.

Both reviews are **PASS for frozen evidence correctness and eligibility to
advance a future fresh-main exact-two Blocked publication**; no remaining
docs/evidence findings are recorded. The preflight-unexpected code/test
adequacy finding remains unresolved, frozen, unrerun, and unpublished. Their
authority is limited to permitting that future fresh-main exact-two Blocked
publication candidate. They do not authorize observer/test publication,
runtime reruns, Issue transitions, M2/M3 changes, Git/GitHub mutation, repair,
or any broader replay.

The local terminal outcome is exactly **Blocked — Harness Probe Attribution
Not Verified**. Observer/test code remains unpublished. Issue #232 and all
linked Open Issues, including #229, remain Open; #212/#210 remain Closed;
M2-GOV-006 remains Blocked, M2 remains In Progress, and M3 remains Not
Started. No DEC, Current-truth, product, security, migration, or acceptance
record changed. A later separately Ready Work Item is required before any
repair or broader replay.

## Fresh-main exact-two publication candidate

This candidate was manually reconstructed from fresh main at
`3490615cc789e0e5077d788770033bf12363f9fc` in
`/private/tmp/contentos-m2-qual-027-blocked-status-wt` on branch
`codex/m2-qual-027-blocked-status-sync`. Only this Packet and the Roadmap were
added/changed with `apply_patch`; no observer/test was copied, cherry-picked,
published, or modified in this worktree. The candidate physical shape is exact
two, with no forbidden or unexpected path.

### Fresh exact-two publication reviews

The corrected current exact-two Packet/Roadmap candidate was independently
reviewed against the frozen exact-four shape and evidence at base/HEAD
`3490615cc789e0e5077d788770033bf12363f9fc` by:

- `/root/m2_qual_014_dor_correctness`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`; and
- `/root/m2_qual_012_browser_setup_diagnosis`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.

Both reviews are **PASS for this exact-two Blocked publication**, with no
remaining publication docs findings. They reviewed the corrected current
exact-two Packet/Roadmap against the frozen exact-four evidence. The frozen
preflight-unexpected code/test adequacy gap remains unresolved, frozen,
unrerun, and unpublished. Their authority is limited to this exact-two Blocked
publication and does not authorize observer/test publication, runtime reruns,
Issue transitions, repair, or M2/M3 changes.

The initial normal-permission targeted Packet/Roadmap Prettier check materialized
only ignored locked `node_modules`; no tracked, forbidden, or unexpected
artifact appeared, and it was red only for Packet formatting. One authorized
exact-two docs Prettier write corrected that formatting. Final targeted
Packet/Roadmap Prettier, `repository:check`, `git diff --check`, and
exact-two/forbidden/no-unexpected scope checks all PASS. This is an
operator/docs-formatting chronology only, not a runtime red, rerun, or cleanup
event. Static/scope and fresh exact-two publication reviews are PASS. At that
candidate stage, the first eligible exact-head three-job quality/Integration/
Browser CI and Orchestrator squash merge were pending; the effective
publication facts are recorded below. A publication CI red or missing result
closes its PR unmerged
without unchanged rerun, replacement, or new head; at most one material
fresh-main exact-two evidence correction may receive new reviews/static and a
first eligible three-job CI result. A second red/missing result requires
M2-QUAL-028. At that candidate stage, the terminal Blocked status was not yet
effective as a merged record; the effective publication is recorded below.

## Effective publication and current reconciliation

Effective PR #233, titled `docs: record blocked M2-QUAL-027 attribution`, used
base `3490615cc789e0e5077d788770033bf12363f9fc`, final head
`01ad0e73d434c60c45d94bd9d422dfb765fb81f8`, and exactly the Packet plus
Roadmap. Its first eligible CI run `31356786230` was all-success: quality
`2m15`, Integration `2m58`, and Browser `2m24`. Orchestrator squash/main is
`a77fb8420a7e71f89af1c6eb09a1098bfe0bdfdd`, merged at
`2026-08-10T04:54:39Z`. The effective terminal remains **Blocked — Harness
Probe Attribution Not Verified**; Issues #232 and #229 remain Open. Observer,
test, and other implementation code remain unpublished, and the frozen
preflight-unexpected code/test adequacy gap remains unresolved, unrerun, and
unpublished.

The `gh` merge command returned nonzero only after the remote merge because the
local `main` checkout was owned by another worktree. Read-only verification
confirmed the remote merge, and no second merge was attempted.

This merge-status reconciliation is the exact-two tracked Packet + Roadmap
shape in worktree `/private/tmp/contentos-m2-qual-027-merge-status-wt`, branch
`codex/m2-qual-027-merge-status-sync`, base/HEAD
`a77fb8420a7e71f89af1c6eb09a1098bfe0bdfdd`, with no other path. Its targeted
docs/static/scope checks and both reconciliation reviews PASS after the
permitted local checks. Only the first eligible exact-head three-job
quality/Integration/Browser CI and Orchestrator merge remain pending and
non-effective. If a publication CI result is red or missing, close the PR
unmerged without unchanged rerun, replacement, or new head; allow one material
fresh exact-two correction with new reviews/static/first eligible three-job CI,
and require M2-QUAL-028 after a second red or missing result.

### Current reconciliation independent reviews

The corrected tracked exact-two Packet + Roadmap at base/HEAD
`a77fb8420a7e71f89af1c6eb09a1098bfe0bdfdd` was independently reviewed for this
reconciliation by:

- `/root/m2_qual_014_dor_correctness`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`; and
- `/root/m2_qual_012_browser_setup_diagnosis`, logical role
  `INDEPENDENT_REVIEWER`, requested `gpt-5.6-sol` High, actual
  `UNVERIFIED_RUNTIME_MODEL`.

Both reviews are **PASS with no findings** for reconciliation-publication only.
They reviewed the corrected tracked exact-two shape and recorded effective
publication facts; they do not reopen or alter the effective Blocked terminal,
authorize code/test publication, runtime reruns, Issue transitions, repair, or
M2/M3 changes. Targeted docs/static/scope checks are PASS; only the first
eligible exact-head three-job quality/Integration/Browser CI and Orchestrator
merge remain pending and non-effective.

## Completion report

- **Summary:** Effective PR #233 and all-success first eligible CI are recorded
  for the frozen QUAL027 Blocked outcome; this is an exact-two merge-status
  reconciliation, with no observer/test publication.
- **Files changed:** this Packet and `docs/implementation/roadmap.md` only.
- **Commands:** permitted targeted Packet/Roadmap docs/static/scope checks only;
  no runtime, focused, root, Docker, observer, GitHub, or Issue command ran in
  this reconciliation.
- **Tests:** no candidate runtime tests; frozen implementation focused gate was
  `1 file / 12 tests` PASS, while root first red was ESLint `prefer-const`.
- **Acceptance criteria:** local diagnostic evidence and frozen exact-four
  review are recorded; effective PR #233, all-success first eligible CI, and
  Orchestrator squash/main are recorded; current reconciliation docs/static
  checks and independent reviews are PASS with no findings; only the first
  eligible exact-head three-job quality/Integration/Browser CI and Orchestrator
  merge remain pending/non-effective.
- **Security impact:** no product/security boundary, raw output, or secret
  exposure; evidence remains fixed and aggregate only.
- **Known limitations:** preflight unexpected-exception output contract and
  fixture coverage remain unresolved; real Phase-1 slots remain `0`.
- **Incomplete items:** first eligible exact-head three-job
  quality/Integration/Browser CI and Orchestrator merge remain
  pending/non-effective; reconciliation reviews/static are PASS with no
  findings, and effective PR #233 with its first eligible CI is complete.
  Downstream state is unchanged: Issues #232/#229 remain Open and the M2 exit
  review has not advanced.
- **Documentation updates:** this Packet and Roadmap only.
- **Possible new DEC:** none.
- **Git status:** exact two tracked docs only; no commit/push/PR/merge/Issue
  mutation performed by this reconciliation implementer.
