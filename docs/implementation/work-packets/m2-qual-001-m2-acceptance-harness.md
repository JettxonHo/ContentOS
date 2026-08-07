# M2-QUAL-001 — M2 Acceptance Harness and Evidence Matrix

**Status:** Completed

**Issue:** [#124](https://github.com/JettxonHo/ContentOS/issues/124)

**Planning branch:** `codex/m2-qual-001-ready-design`

**Planning base:** `ba575c55184457258d88a268d850bf875e6010a1`

## Identification

- Task ID: `M2-QUAL-001`
- Milestone: M2 — Source and Workflow Foundation
- Logical implementation role: `IMPLEMENTATION_AGENT`
- Executor profile: `BACKEND_GENERAL_EXECUTOR`
- Target implementation model: `gpt-5.6-terra`, High
- Actual implementation model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: High
- Implementation thread: `/root/m2qual_implementation`
- Runtime model status: `UNVERIFIED_RUNTIME_MODEL` unless exposed by the runtime
- Implementation branch: `codex/m2-qual-001-m2-acceptance-harness` from
  `15aecf99503c831962953bec6aeb426d022c2eb2` (the exact implementation base)
- Owner: one Implementation Agent with exclusive repository-write ownership
- Reviewer: independent `gpt-5.6-sol`, High review agents
- Risk classification: milestone acceptance evidence over private Source content,
  controlled public transport, Queue delivery, Object Storage, human Approval,
  browser recovery, and owned runtime cleanup

## Goal

Establish reproducible M2 milestone evidence inside the existing isolated
Vitest and Playwright smoke systems. The evidence must prove the complete
Source and Workflow foundation from the protected URL Command through durable
delivery, controlled Fetcher execution, Source evidence, human Version
Approval, authoritative Workflow reads, browser recovery, and the internal
current-Approved Source input projection.

This Work Item adds tests and an evidence matrix only. It does not add product
behavior, a second test harness, or the M2 Acceptance Record. M2 remains In
Progress until `M2-GOV-005` independently runs the accepted evidence from the
latest `main` and records a Passed decision.

## Context

The completed M2 Work Items already have strong focused evidence:

- Source repository/API/browser tests cover Pasted Text, `.md`, `.txt`, upload
  quarantine, Working Copy, immutable Version, Approval, URL failure, and
  manual fallback;
- public-transport tests cover all-address DNS policy, verified numeric peer
  binding, HTTP/HTTPS, TLS identity, redirects, resource limits, and SSRF
  denial;
- delivery and Gateway tests cover Transactional Outbox, BullMQ, Claim,
  Heartbeat, Result, Redis Job loss, duplicate delivery, and lease recovery;
- Fetcher integration covers controlled HTTP bytes, Candidate extraction,
  immutable S3 Snapshot write, Result submission, and Source promotion;
- Workflow tests cover PostgreSQL projection, Timeline, SSE notification, and
  Polling recovery; and
- the internal Approved Source input projection returns exact current Approved
  Versions only.

The missing evidence is not another edge-case matrix. It is:

1. one continuous backend scenario beginning at the authenticated URL API
   Command and crossing the real Worker delivery boundary before Fetcher
   execution and Source Approval;
2. one production-process scenario showing that the unmodified Fetcher rejects
   a loopback URL and produces no Source evidence; and
3. one bounded browser milestone scenario showing the human-visible failure,
   fallback, four formal Source input paths, Approval, refresh, Timeline, and
   SSE-to-Polling recovery in one user journey.

## Canonical sources

- [M2 Exit Criteria](../milestone-exit-criteria.md#12-m2-exit-criteria)
- [Vertical Slice Acceptance](../../quality/vertical-slice-acceptance.md)
- [Test Strategy](../../quality/test-strategy.md)
- [Release Gates](../../quality/release-gates.md)
- [Integration Smoke Harness](../../quality/integration-smoke-harness.md)
- [M1 Browser Thin Slice](../../quality/browser-thin-slice.md)
- [Source Foundation](../../architecture/source-foundation.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Process Topology](../../architecture/process-topology.md)
- [Source Fetcher Security Boundary](../../security/source-fetcher.md)
- [Security Baseline](../../security/security-baseline.md)
- [Issue #124](https://github.com/JettxonHo/ContentOS/issues/124)

Relevant Accepted Decisions: DEC-059–DEC-066, DEC-135, DEC-161–DEC-176,
DEC-199–DEC-200, DEC-207–DEC-209, DEC-221, DEC-224, DEC-226,
DEC-228–DEC-234, DEC-245, DEC-247, DEC-249, DEC-259, DEC-268,
DEC-271–DEC-273, DEC-280, DEC-284–DEC-285, and DEC-287–DEC-293.

Later Accepted DEC governs an actual conflict. This Work Item may not weaken a
Security Error, Approval Gate, owner boundary, Queue/Workflow authority rule,
or milestone release requirement.

## Dependencies

Completed dependencies:

- `M2-SRC-001` through `M2-SRC-004`;
- `M2-WF-001` through `M2-WF-004B`;
- `M2-FETCH-001A` through `M2-FETCH-001C`;
- `M2-WEB-001A` and `M2-WEB-001B`; and
- the existing M0/M1 integration, concurrent-run, browser, CI, repository,
  and Secret-check baselines.

No product implementation dependency remains. `M2-GOV-005` depends on this
Work Item and is not part of it.

## In scope

1. Add one M2 backend acceptance integration file to the existing Vitest
   integration suite.
2. In its success scenario, create an authenticated owner Session and Content
   Package through the real API, submit the real URL-capture Command, and let a
   real Worker process dispatch the resulting PostgreSQL Outbox record to the
   existing BullMQ Queue.
3. Consume that Job with the existing Fetcher Queue consumer, orchestration,
   Gateway client, Candidate preparation, and S3 Snapshot store production
   classes. Only the already-approved test transport provider seam may map a
   DNS result representing a public address to a test-owned loopback HTTP
   server.
4. Verify the real controlled response bytes produce exactly one immutable Raw
   Snapshot, Result, Source, Working Copy, Head, and safe success Event. Verify
   Raw HTML bytes and normalized plain-text Candidate remain distinct.
5. Through the authenticated public Source API, explicitly save when needed,
   create one immutable Version, and perform exact human Approval of the
   current Review Candidate.
6. Query the internal owner-scoped Approved Source input port and prove it
   returns only that exact Approved Source Version. This is evidence for future
   Research input eligibility, not Research readiness or execution.
7. Read the owner Workflow projection and Timeline through their real REST
   endpoints and verify safe, authoritative state without raw URL, body,
   Object key, claim, Secret, or internal error exposure.
8. Redeliver the terminal Job and prove no second fetch, Result, Source,
   Snapshot, Version, Approval, promotion, or terminal Event is created.
9. Add one production-process SSRF scenario. Submit a loopback URL through the
   real API, start the real Worker and unmodified Fetcher application
   processes, and verify terminal `VALIDATION_BLOCKED` behavior with no Source,
   Snapshot object, or promoted evidence.
10. Verify the production-process rejection and lifecycle output contain no
    submitted URL, Secret, opaque claim, database/Redis/Object Storage
    credential, Queue payload body, raw provider error, or stack.
11. Add one bounded Playwright milestone scenario using the current browser
    harness. It covers URL failure, visible independent Pasted Text fallback,
    `.md` and `.txt` Supporting Sources, Working Copy save, immutable Version,
    exact human Approval, refresh persistence, safe Timeline, forced SSE
    disconnect, and five-second authoritative Polling recovery.
12. Add a Current-truth M2 evidence matrix mapping every M2 Exit Criterion to
    exact reproducible existing or new tests and commands.
13. Correct stale quality, Fetcher-status, browser-job-label, and repository
    entry documentation only where it contradicts the merged implementation.
14. Preserve the existing three CI jobs. The browser job display name may be
    changed from the historical M1 label to a current M1/M2 label; its command,
    permissions, runner, and topology do not change.

## Out of scope

- any product code, runtime behavior, API, Contract, Domain rule, database
  repository, Queue contract, Result contract, Event type, Source state, or
  Workflow transition change;
- Research Agent, Frozen Input, Research readiness, prompt, model, Eval,
  rendering, export, publishing, M3 behavior, or a public Approved-input API;
- a second integration/browser harness, new Compose project, new runtime mode,
  new CI job, new coordinator, new test runner, or parallel acceptance system;
- a dependency, package version, lockfile, Schema, migration, Drizzle metadata,
  configuration variable, production test hook, or credential mechanism;
- a real public-network request, DNS override in production, proxy, privileged
  route, fake public host interface, relaxed address policy, or SSRF bypass;
- automatic Approval, Source Approval Workflow transition, Approval Timeline
  Event, retry command, Pause/Cancel, or Agent behavior;
- a new hash, SHA-256 use, digest, fingerprint, generalized security framework,
  or speculative impossible-case matrix;
- duplication of every existing focused Queue, lease, upload, transport, or
  browser assertion inside one large acceptance test;
- modification of `contentos-local`, unrelated containers, named volumes,
  images, developer credentials, or external services;
- creation of the immutable M2 Acceptance Record or marking M2 Completed; and
- Accepted DEC, Session, product scope, technical stack, or M3 planning changes.

## Evidence architecture

### Existing harness only

The new integration file is discovered by the existing
`vitest.integration.config.ts`. It uses the existing run-owned PostgreSQL,
Redis, S3-compatible Object Storage, API, Web, credentials, and cleanup
capsule. The new browser file is discovered by the existing Playwright
configuration and uses the same browser harness.

No new harness entry point is required. The formal reproducible M2 evidence
sequence is:

```text
corepack pnpm check
corepack pnpm repository:check
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
```

`M2-GOV-005` must run this sequence from the latest `main`; this Work Item does
not claim that the milestone passed merely because the tests were added.

### Success transport fixture

The public URL success scenario uses the existing
`createPublicUrlTransportForTesting` provider seam:

- the resolver returns a representative public numeric address;
- the test connector binds the verified selection to a test-owned loopback
  HTTP fixture;
- production request parsing, redirect/resource policy, Candidate extraction,
  Snapshot preparation, Gateway, Queue, S3, and Result code remain in use; and
- no production address rule, proxy, environment variable, or connector is
  changed.

This is layered deterministic evidence. The existing HTTP/HTTPS/DNS tests
remain the authority for real Resolver, SNI, certificate, and peer-binding
mechanics.

### Production SSRF fixture

The SSRF scenario does not use the test transport provider. It starts the
committed Fetcher application with its normal transport and a URL whose host is
loopback. The expected result is a safe terminal validation failure. The test
must not start a loopback content server and then expect the Fetcher to reach
it; successful access would be a security defect.

The child-process environment must explicitly remove inherited proxy inputs:
`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` and their lowercase
variants, plus `NODE_USE_ENV_PROXY`. `NODE_OPTIONS` must be absent or verified
not to contain `--use-env-proxy`. This is test isolation for the committed
no-proxy contract, not a product bypass; otherwise a proxy-policy rejection
could be mistaken for loopback-address rejection.

### Browser milestone fixture

The browser scenario uses the real Login, Dashboard, Workspace, API, Source
commands, review controls, Timeline, and browser recovery controller. To
establish a deterministic visible URL failure, the fixture must start an owned
real Worker, wait until the current Outbox/Job has been dispatched, Claim the
Task through the private Gateway, and submit the safe failure through that
Gateway. It must close the Worker and remove only its exact remaining Job in a
`finally` block. It may not use a direct database state shortcut or write
domain rows to fabricate a Source, Working Copy, Version, Approval, or
terminal Result.

The scenario is a milestone demonstration, not a replacement for focused
browser tests. Existing focused tests remain and must stay green.

## Fixed invariants

- PostgreSQL remains Workflow and Source truth.
- Redis/BullMQ transports work and never decides terminal state.
- API owns Task, Result, Source, Version, Approval, and Workflow mutation.
- Fetcher receives no `DATABASE_URL`.
- The success fixture does not weaken the production public-address policy.
- Raw Snapshot bytes never become browser Safe Display or normalized body.
- Approval binds exactly one current immutable Version and is human-triggered.
- Approved-input evidence returns exact current Approved Versions only.
- SSE is notification-only. REST/Database reads recover authoritative state.
- A duplicate or stale delivery cannot create duplicate Source evidence or
  promotion.
- Owned cleanup never deletes named volumes, images, another test run, or an
  unrelated process/container.

## Allowed files

### Tests

- new `packages/testing/src/integration/m2-acceptance.test.ts`
- new `packages/testing/src/browser/m2-acceptance.spec.ts`
- optional new
  `packages/testing/src/browser/m2-acceptance-fixtures.ts`
- `packages/testing/src/integration/process.ts` only if one existing bounded
  child-process helper must be generalized without behavior change
- `packages/testing/src/integration/harness.ts` only if a minimal run-owned
  cleanup helper must be exported; Compose lifecycle and ownership semantics
  may not change
- `packages/testing/src/integration/env.ts` only for a read-only export of an
  already-existing run-owned value

### Quality and current-status documentation

- new `docs/quality/m2-acceptance-harness.md`
- `docs/quality/integration-smoke-harness.md`
- `docs/quality/browser-thin-slice.md`
- `docs/quality/ci-skeleton.md`
- `docs/quality/local-quality-toolchain.md`
- `docs/security/source-fetcher.md`
- `.github/workflows/ci.yml` only to rename the stale browser display label;
  no command, trigger, permission, action, runner, environment, or topology
  change
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `docs/implementation/roadmap.md`
- this Work Packet

### Explicitly not allowed

- `apps/**`
- `packages/core/**`, `packages/contracts/**`, `packages/database/**`,
  `packages/config/**`, or `packages/object-storage/**`
- package manifests, `package.json`, `pnpm-lock.yaml`, workspace/configuration
  files, Compose files, Playwright/Vitest configuration, Schema, migrations,
  generated metadata, Decision files, or Session files
- any file not listed above

If a required implementation change falls outside this allowlist, stop and
return it to the Orchestrator. Do not silently broaden the packet.

## Contracts

### Product contracts

No product Contract changes. Tests consume the committed API, Queue, Gateway,
Result, Source, Workflow, Object Storage, and Approved-input contracts exactly
as they exist on the base commit.

### Test-provider contract

The success fixture may inject only the existing provider-neutral
`PublicUrlTransport` testing seam. The selected peer remains the representative
public address supplied by the resolver; only the test connector socket is
redirected to the owned fixture. No test-only branch enters production code.

### Evidence matrix contract

`docs/quality/m2-acceptance-harness.md` must record for every M2 Exit
Criterion:

- the capability or failure path;
- exact test file and scenario;
- reproducible command;
- authoritative final state being proved;
- whether evidence is new or pre-existing; and
- intentional boundary or known limitation.

It must not claim a Passed milestone decision. It is mutable Current-truth
quality documentation; the later Acceptance Record is the immutable result.

### Error and logging contract

Assertions and process lifecycle output use stable safe categories only. They
never emit the submitted URL, content body, Snapshot bytes, Object key, Secret,
opaque claim, database/Redis/S3 URL, raw error, SQL, Queue payload, or stack.
The owner-facing Source Intake record may display its submitted URL; the
Timeline, error surfaces, ordinary logs, and process output must not expose it.

## Acceptance Criteria

1. An authenticated URL Command created through the real API reaches the real
   Worker Outbox Dispatcher and fixed BullMQ Job before Fetcher consumption.
2. The existing Fetcher production classes fetch controlled HTTP bytes through
   the approved test provider seam, write and verify one immutable S3 Raw
   Snapshot, submit one exact Result through the private Gateway, and produce
   one Source, Working Copy, Head, and safe success Event.
3. The Raw Snapshot preserves the fixture HTML bytes while the Working Copy
   and Review Candidate contain only the deterministic normalized plain text;
   the two representations are not interchangeable.
4. The owner creates an immutable Source Version and explicitly approves the
   exact current Review Candidate through the public API. The internal
   Approved Source input port returns exactly that Version/body and no
   unapproved or historical alternative.
5. Workflow projection and Timeline REST reads expose the authoritative
   materialized state and safe ordered Events without private transport or
   content internals.
6. Terminal redelivery creates no additional fetch, Result, Source, Snapshot,
   Version, Approval, terminal Event, or promotion.
7. An unmodified production Worker/Fetcher process flow rejects a loopback URL
   as `VALIDATION_BLOCKED`, reaches the accepted safe terminal state, and
   creates no Source, Raw Snapshot record/object, or success evidence.
8. Process output for the SSRF path is bounded and redacted; both processes
   respond to the normal termination contract and leave no owned process,
   Queue Job, object, container, or temporary credential residue.
9. The browser milestone scenario shows URL failure and an independent formal
   fallback, creates Pasted Text plus `.md` and `.txt` Sources, saves the
   Working Copy, creates a Version, confirms exact human Approval, and retains
   the Approved state after refresh.
10. With the Workflow SSE route forcibly disconnected, the existing five-second
    Polling fallback discovers authoritative Source/Timeline changes. The UI
    displays safe fixed labels and never body internals, Object key, claim,
    Secret, or diagnostic data. The owner-facing Source Intake record may show
    its submitted URL.
11. The evidence matrix maps SSRF denial, Upload Quarantine, Raw/Safe
    separation, URL fallback, exact Approval, duplicate Queue protection,
    Outbox recovery, Redis-loss reconciliation, Lease recovery, SSE fallback,
    Workflow Timeline, and exact current-Approved Source input to exact tests
    and commands without duplicating all focused assertions.
12. Existing Unit, Contract, API, migration, integration, concurrent-run, and
    browser suites remain green. Two complete concurrent smoke runs keep
    distinct runtime state and clean only owned resources.
13. The diff contains no product code, dependency, lockfile, Schema, migration,
    Compose, configuration, new hash mechanism, real-public-network access, or
    unapproved file.
14. Current-truth quality, Fetcher status, CI label, Roadmap, English/Chinese
    README, and `AGENTS.md` accurately describe the M2 evidence boundary while
    recording `M2-QUAL-001` as Completed and keeping M2 In Progress.

## Required tests and commands

### Focused TDD

Before the complete implementation passes, the new scenarios must fail for
the missing continuous evidence rather than for an unrelated setup error.
Implementation reuses committed seams; it does not introduce a product fix to
make the test green.

### Required commands

```text
corepack pnpm install --frozen-lockfile
corepack pnpm workspace:check
corepack pnpm check
corepack pnpm check:docs
corepack pnpm repository:check
corepack pnpm check:secrets
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm db:generate
corepack pnpm db:generate
git diff --check
```

The Docker-dependent commands must run where the harness can inspect and
reclaim its owned processes. A restricted `ps`/process-inspection denial is an
environment failure and must be reported, then rerun in the approved normal
process environment. It is not a product pass or failure.

### Required evidence

- exact new scenario names and pass counts;
- successful full suite counts;
- one successful exact concurrent command, with any earlier flake retained;
- no `db:generate` diff on either run;
- exact changed-file allowlist;
- no package/lockfile/Schema/migration/Compose diff;
- no Secret, local absolute path, generated artifact, or `.DS_Store`;
- zero owned Worker/Fetcher processes, BullMQ Jobs, Snapshot objects,
  `contentos-smoke-*` projects/containers/networks, and current-run temp
  credential directories after success and failure; and
- proof that `contentos-local` volumes and unrelated containers were not
  touched.

## Security review

- External HTML, pasted text, and uploaded text remain untrusted private
  content.
- The successful public-transport test uses an existing provider seam and does
  not modify or bypass the production SSRF policy.
- The production-process test must fail closed for loopback and must not treat
  it as Retry, Warning, or manual bypass.
- The production-process child environment removes inherited proxy variables
  and environment-proxy flags so the test proves the committed direct
  transport address policy rather than an unrelated proxy rejection.
- Temporary credentials come only from the existing repository-external
  run-owned env file. They are never printed, staged, or persisted.
- The Fetcher process receives only Fetcher-prefixed Redis/Object
  Storage/Gateway configuration and no `DATABASE_URL`. The local smoke harness
  reuses its one ephemeral S3 credential pair under those Fetcher-prefixed
  variables; this Work Item does not claim or prove a distinct production S3
  principal.
- Owner Authorization remains server-side. Tests must not use direct database
  writes to fabricate the accepted user-level Source/Version/Approval path.
- Raw Snapshot bytes, Candidate body, Object key, Queue payload, claim, and
  Secrets must not enter Timeline, errors, ordinary logs, or the browser UI.
  The owner-facing Source Intake record may show its submitted URL.
- Cleanup is scoped by run identity and opaque fixture IDs; no global prune,
  volume deletion, image deletion, or unrelated process termination is
  permitted.

No new security mechanism is authorized or required.

## Migration and compatibility review

No database Schema, migration, backfill, API, Queue, Event, Artifact version,
configuration, dependency, or production compatibility change is expected.

Both `db:generate` runs must report no changes. Any generated migration,
metadata diff, package/lockfile change, or product Contract requirement is a
scope breach and stops implementation.

## Observability

No product telemetry is added. Test diagnostics may identify only:

- scenario/step name;
- stable safe failure category;
- process role;
- exit code or signal;
- opaque test-owned identity where needed; and
- cleanup category.

They must not include private content or credential-bearing values. Existing
process lifecycle events remain unchanged.

## Cleanup and rollback

Integration scenarios use opaque random IDs and reclaim their owned database
graph, Queue Jobs, Snapshot objects, HTTP fixture, and child processes in
bounded `finally` cleanup. SIGTERM is followed by the existing bounded SIGKILL
fallback only for an owned child process.

The browser scenario closes its owned routes, stream readers, Worker, and any
exact remaining Job in `finally`. Its database graph and uploaded, pasted, or
Snapshot objects may live until the run-owned browser harness tears down its
tmpfs database and bucket; the scenario must not perform global cleanup to
remove them early.

Zero residue means after the relevant integration or browser command has
completed harness teardown, not after every assertion. Cleanup may never
delete a named volume, image, another harness run, or unrelated process,
container, Queue Job, or object.

Rollback is deletion of the new tests and documentation/label changes. There
is no data migration or production state rollback.

## Documentation updates

- create `docs/quality/m2-acceptance-harness.md`;
- synchronize the current integration/browser/CI quality documentation;
- update stale Fetcher status in `docs/security/source-fetcher.md`;
- update `AGENTS.md`, both README files, and Roadmap to mark this Work Item
  Completed after PR #126, without marking M2 Completed; and
- update this Work Packet with implementation and independent-review evidence.

No Decision Register or Session update is required.

## Implementation sequence

1. Create the fixed implementation branch from the latest `origin/main`,
   record its exact base SHA, Agent thread, actual model/runtime metadata, and
   confirm the Ready packet, Issue, clean branch, Node, pnpm, Docker, and
   Chromium prerequisites.
2. Add the backend success scenario test-first using the real API Command and
   Worker, then the existing in-process Fetcher production classes.
3. Add the unmodified production Fetcher loopback-denial scenario and verify
   safe terminal state/logging/cleanup.
4. Add the bounded browser milestone scenario without deleting or weakening
   existing focused browser specs.
5. Create the evidence matrix from actual test names and commands.
6. Synchronize only the allowed stale documentation and optional CI display
   label.
7. Run the complete gates and cleanup checks.
8. Stop in `In Review` with no Git publication. Independent reviewers inspect
   the real diff and evidence before the Orchestrator may commit, push, or
   merge. This was the implementation handoff state before the recorded merge.

## Definition of Ready

Passed by two independent read-only review axes on the planning base
`ba575c55184457258d88a268d850bf875e6010a1`:

- `QUALITY_ACCEPTANCE_DESIGN_REVIEWER`
  - Target model: `gpt-5.6-sol`, High
  - Actual model: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2qual_exit_coverage`
  - Verdict: PASS
- `HARNESS_FEASIBILITY_REVIEWER`
  - Target model: `gpt-5.6-sol`, High
  - Actual model: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2qual_harness_feasibility`
  - Verdict: PASS

The review confirmed that the three scenarios are minimal milestone evidence,
the existing transport seam preserves production SSRF policy, the real
Worker/Fetcher and cleanup design is feasible inside the allowlist, every M2
Exit Criterion has an evidence path, and Issue #124 matches this packet.

- Blocking Design Question: None
- Possible new DEC: None

## Implementation and independent-review evidence

Implementation completed on branch
`codex/m2-qual-001-m2-acceptance-harness` from base
`15aecf99503c831962953bec6aeb426d022c2eb2`. The implementation remained
inside the final allowlist: two new acceptance tests, one new evidence matrix,
bounded quality/security/status documentation, and CI display labels only.
There is no product code, dependency, Lockfile, Schema, migration, Compose, or
runtime-configuration change.

The first formal integration run exposed a fixture-close race, an unclosed
database runtime, incomplete cleanup evidence, and an incorrect foreign-key
cleanup order. A later browser run passed 15 of 16 tests and exposed one
missing post-refresh Version selection step. These failures were retained as
review evidence; their run-owned processes, Compose projects, objects, and
temporary capsules were cleaned before the corrected runs.

Final local evidence on 2026-08-07:

- `corepack pnpm install --frozen-lockfile`: PASS with Node `v24.18.0` and pnpm
  `11.17.0`;
- `corepack pnpm workspace:check`: PASS for the five applications and six
  packages;
- `corepack pnpm check`: PASS — 53 files and 485 unit tests, plus all five
  application builds;
- `corepack pnpm test:integration`: PASS — 27 files and 184 tests;
- `corepack pnpm test:integration:concurrent`: PASS, exit 0;
- `corepack pnpm test:browser`: PASS — 16 tests;
- `check:docs`, `repository:check`, `check:secrets`, and `git diff --check`:
  PASS;
- two consecutive `corepack pnpm db:generate` runs: PASS with no Schema
  changes; and
- final residue and scope checks: no ContentOS smoke/browser project,
  container, temporary capsule, local absolute path, tracked `.DS_Store`, or
  forbidden-file diff.

The existing PostgreSQL client deprecation warning remains visible during the
integration suite and is not introduced by this Work Item. One initial frozen
install attempt was blocked only because the restricted sandbox denied fnm's
temporary multishell symlink; the same command passed immediately with the
already-active required Node version.

Independent final reviews:

- `CORRECTNESS_TEST_EVIDENCE_REVIEWER`
  - Target model: `gpt-5.6-sol`, High
  - Actual runtime: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2qual_correctness_review`
  - Verdict: PASS
- `SECURITY_SCOPE_DOCUMENTATION_REVIEWER`
  - Target model: `gpt-5.6-sol`, High
  - Actual runtime: `UNVERIFIED_RUNTIME_MODEL`
  - Thread: `/root/m2qual_harness_feasibility`
  - Verdict: PASS

No Blocking Design Question, scope escalation, or new DEC was found.

## Definition of Done

Done requires every Acceptance Criterion and required command above to have
recorded evidence, both independent review axes to return PASS, all required CI
checks to pass, and the implementation PR to merge into `main`.

`M2-QUAL-001` is not Completed merely because an Implementation Agent reports
success. After merge, a separate minimal status sync records completion. M2
then remains In Progress until `M2-GOV-005` produces a Passed immutable
Acceptance Record.

## Post-merge status synchronization

`M2-QUAL-001` was completed through PR #126, squash merge
`4ee1911c69d9ad55bbb34a3729be3cd3d9625f23` (`test: add M2 acceptance harness (#126)`).
This documentation-only synchronization does not mark M2 Completed or Passed;
M2 remains In Progress and `M2-GOV-005` remains not started.

- Logical Role: `DOCUMENTATION_STATUS_IMPLEMENTER`
- Requested Model: `gpt-5.6-terra`
- Reasoning: High
- Actual Runtime: `UNVERIFIED_RUNTIME_MODEL`
- Thread: `/root/m2qual_status_writer`
- Base SHA: `4ee1911c69d9ad55bbb34a3729be3cd3d9625f23`

## Completion report requirements

Report:

1. Summary and exact branch/base;
2. actual model/runtime metadata;
3. files changed;
4. new scenario design and exact evidence;
5. commands and exit results;
6. integration/concurrent/browser counts;
7. SSRF denial and redaction evidence;
8. Raw Snapshot/Candidate separation;
9. Queue/Result/Source/Approval/projection/Timeline evidence;
10. browser fallback/recovery/refresh evidence;
11. cleanup and residue evidence;
12. Acceptance Criteria mapping;
13. security impact;
14. known limitations and incomplete items;
15. documentation updates;
16. possible new DEC; and
17. Git status.

Do not commit, push, create a PR, merge, or mark M2 Completed. Stop for
independent review.
