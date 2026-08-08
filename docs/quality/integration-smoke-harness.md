# ContentOS Integration Smoke Harness

**Status:** Implementation Baseline
**Scope:** The API/process integration smoke command, its isolation design, what it verifies, and its boundary against other quality entry points
**Last Updated:** 2026-08-09

This document records the executable integration smoke baseline introduced by `M0-QUAL-002`, extended through M2 Source, Worker, Fetcher, Gateway, Workflow, and Approved-input foundations. `M2-QUAL-001` adds a continuous authenticated URL Command → Worker → Queue → Fetcher → Source Approval acceptance scenario and an unmodified-process loopback SSRF denial; see the [M2 Acceptance Harness](m2-acceptance-harness.md). It is a Docker-dependent companion to the [Local Quality Toolchain](local-quality-toolchain.md). It does not itself collect browser tests; the browser suite reuses its isolated runtime through the separate [M1 Browser Thin Slice](browser-thin-slice.md).

Related documents: [Local Quality Toolchain](local-quality-toolchain.md), [CI Skeleton](ci-skeleton.md), [Test Strategy](test-strategy.md), [Release Gates](release-gates.md), [Repository Structure](../architecture/repository-structure.md), and the [Roadmap](../implementation/roadmap.md).

The M0 CI workflow runs `corepack pnpm test:integration` as its own Docker-dependent job, separate from the Docker-independent quality job; see [CI Skeleton](ci-skeleton.md).

---

## 1. Purpose

`corepack pnpm test:integration` is one explicit, repeatable, black-box command that verifies the five application entry points and the local-state baseline through real processes and containers. M1 extends it to apply the reviewed migrations and exercise the API's single-user Session and owner-scoped Content Package boundaries against isolated PostgreSQL. M2-SRC-001 extends it to exercise the Pasted-text Source Capture, Working Copy edit, Version creation, Approval, role-limit enforcement, owner-scope isolation, and revision-conflict paths.

It proves the baseline is wired together before later Milestones depend on that wiring. It is not a Vertical Slice and does not exercise Workflow Engine, Agent, Render, or publishing behavior.

## 2. Command boundary

| Command                                     | Docker required | Collected by                                                                                   |
| ------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `corepack pnpm test`                        | No              | Unit tests only; excludes `packages/testing/src/integration/**`.                               |
| `corepack pnpm check`                       | No              | `format:check`, `lint`, `typecheck`, `test`, `build`. Does **not** include `test:integration`. |
| `corepack pnpm test:integration`            | **Yes**         | Only `packages/testing/src/integration/**/*.test.ts`.                                          |
| `corepack pnpm test:integration:concurrent` | **Yes**         | Two complete `test:integration` runs plus isolation and zero-residue assertions.               |
| `corepack pnpm test:browser`                | **Yes**         | Only `packages/testing/src/browser/**/*.spec.ts`; documented separately.                       |

`test` and `check` remain Docker-, network-, and credential-independent. The two explicit smoke entry points are deliberately absent from `check` so the ordinary pre-commit gate never requires Docker.

## 3. Isolation design

The harness never reads, mounts, changes, or deletes the existing `contentos-local` Compose project or its named volumes. It starts its own isolated project whose validated name begins with `contentos-smoke-`:

- **Merged Compose configuration:** the repository `compose.yaml` combined with `packages/testing/fixtures/compose.smoke.yaml`.
- **No persistent volumes:** the override clears the inherited named-volume mounts with `volumes: !reset []` and replaces service data with `tmpfs`. No named volume is created for the smoke project.
- **Loopback-only ephemeral ports:** every published host port is rebound with `ports: !override` to `127.0.0.1:0`, so the host binds an ephemeral port on IPv4 loopback only.
- **Temporary credentials outside the repository:** PostgreSQL, Redis, and S3 credentials are generated at runtime and written to a file under the OS temp directory. They never appear in process arguments, terminal output, exception messages, logs, or the repository.
- **Ownership before side effects:** an ordinary run publishes a non-secret immutable claim before generating credentials or starting runtime work. The concurrent parent first creates one unique parent root, two exact child roots, and two claims. Each claim binds its parent/child tokens, run root, claim path, managed-process control path, ready-state path, and Compose project. A child must validate and use that exact identity; it cannot substitute a global temporary root or project.
- **Claim, process control, and readiness are separate:** the immutable claim is cleanup authority. An atomically replaced token-bound control record contains only exact API/Web process-group identities. The ready state is published only after runtime readiness and carries bounded isolation evidence. Missing or invalid claim/control data cannot be reported as verified cleanup and never authorizes inference, global scanning, signaling, or deletion.
- **Detached-process handoff is fail-closed:** immediately after each API/Web spawn, the current harness keeps the child handle and newly created process-group identifier in an in-memory pending record before any identity inspection or `unref`. Full identity capture remains local until the complete control record is published. Pending ownership is cleared and the child is unref'ed only after that publication succeeds. Capture or publication failure rolls back the exact pending group with bounded `SIGTERM`/confirmation and `SIGKILL` escalation; pending ownership makes physical cleanup incomplete until disappearance is proven.
- **Run-unique state:** every invocation uses its own directory, ready-state file, credential file, logs, Compose project, ports, and bucket. The exact ready-state path is propagated to Vitest or Playwright through `CONTENTOS_SMOKE_STATE_FILE`; teardown validates its claim and removes only that run directory. Ordinary compilation uses an atomically published cross-process owner lock. The concurrent parent builds once after both claims exist, then its two children share that reviewed build output without racing to overwrite it.
- **No image, digest, credential, healthcheck, or command change:** the override changes only volumes, tmpfs, and published ports.
- **Cleanup:** on success or failure, the harness stops the application processes and runs `docker compose down` for its own project only. It never uses `-v`/`--volumes`, volume removal, image removal, `prune`, or any global cleanup.

The three named volumes declared by the current `compose.yaml` (`contentos_postgres_data`, `contentos_redis_data`, and `contentos_seaweedfs_data`) are left untouched. The object-storage service mounts the SeaweedFS volume; no separate object-storage data volume is declared or affected.

## 4. What the harness verifies

A Vitest `globalSetup` performs, once per run: a Docker availability check, a build, isolated Compose startup, ephemeral port resolution, two repeatable migration-runner executions, and startup of the `api` and `web` artifacts with temporary process-specific configuration. Test slices then verify:

- **web:** responds over loopback with a successful HTTP status.
- **api:** liveness and security headers; OpenAPI JSON; fail-closed redacted configuration startup; correct/incorrect login; bounded throttling; HttpOnly SameSite cookie behavior; protected Session inspection; exact-Origin denial; persisted token hashing; expiry; revocation; cookie clearing; and replay denial.
- **worker, fetcher, renderer:** each emits `process.started`, responds to `SIGTERM` with `process.stopping`, and exits cleanly with code `0`.
- **postgres:** healthy, loopback-reachable, authenticates the correct credential over TCP, rejects a wrong credential, and contains only the reviewed product tables (`auth_sessions`, `content_packages`, `sources`, `source_raw_snapshots`, `source_working_copies`, `source_versions`, `source_heads`, `source_approvals`) plus Drizzle's migration journal.
- **redis:** healthy, loopback-reachable, returns `PONG` for the correct credential, rejects a wrong credential, and holds no key.
- **object storage:** healthy, loopback-reachable, accepts a correct AWS SigV4 signature, rejects a wrong signature, rejects anonymous access, proves the real adapter's conditional-put collision behavior, verifies bytes/hash/size/content type and metadata, and leaves no probe bucket or object after the run.
- **Source database safety:** exact JSON/schema/UTF-8 bounds, complete owner/package/source composite constraints, rollback of capture/Version/Approval units, concurrent role limits, duplicate-checkpoint and Approval serialization, archived-Package reads/writes, and deterministic archive/write races.
- **Workflow notification:** exact owner-scoped SSE preflight, immediate no-Instance and instantiated notifications, cache/CORS headers, explicit bounded `HEAD`, Event-backed and same-sequence Task-only changes, and no state write from stream reads.

`corepack pnpm test:integration:concurrent` starts two complete smoke commands at the same time through this real harness. Before either spawn, the parent persists two exact claims and empty managed-process controls under its unique root. Authenticated ready-state and hashed credential-isolation evidence are retained as each child publishes them, so the two ready-state files do not need to coexist. Child exit competes with discovery: an exit before that child's state is captured fails promptly with a bounded classification-only diagnostic. A remaining exact child receives bounded `SIGTERM`/`SIGKILL`; the parent then validates only the pre-created claim/control records to stop exact detached API/Web groups, bring down exact Compose projects, remove exact child roots, and finally remove its empty parent root. It never scans or changes unrelated temporary roots, processes, or projects. The gate asserts distinct run directories, ready-state files, Compose projects, ports, temporary credentials, and cleanup sentinels, then requires both commands to succeed with no owned residue.

When a child is classified as `test-run-failed`, the coordinator may append one `test=<basename>.test.ts` field. The value is derived only from complete, newline-terminated Vitest failed-module or `FAIL` metadata lines after terminal-formatting removal, and only for a lowercase/digit/hyphen basename under `packages/testing/src/integration/`. The bounded capture also records a non-sensitive leading-fragment flag: only when the JavaScript slice boundary is known to fall inside a line is the first split fragment discarded. Repeated occurrences of one basename are deduplicated; missing, malformed, or multiple distinct basenames produce `test=unclassified`.

Only when that safe test field is exactly `fetcher-gateway-api.test.ts` may the coordinator append `case=fg-01` through `case=fg-11`. Every complete, newline-terminated Vitest `FAIL` metadata line anchored to the exact Fetcher Gateway integration path must contain exactly one allowlisted `[FG-01]`–`[FG-11]` marker. Repeated lines carrying the same marker are deduplicated; a missing marker on any matching line, incomplete or unknown metadata, or multiple different markers produces `case=unclassified`. Markers on adjacent assertions, stacks, or other non-metadata lines are ignored and cannot be attributed. Other failure categories and other test basenames retain their existing diagnostic shape. Raw output, test titles, assertions, stacks, URLs, credentials, paths, PIDs, and logs are never emitted or persisted.

The S3 signature is produced by a minimal SigV4 signer built only from the Node.js standard library (`node:crypto`). No S3 SDK or new dependency is introduced.

## 5. Failure path

A required failure returns a non-zero exit code. Setup failure attempts every teardown step and reports a stable sanitized `setup=<category> teardown=<clean|failed>` classification; identity capture or complete control-record publication failures use `setup=process-identity-failed`. Teardown failure is never replaced by the setup error. When a test fails, `globalSetup` teardown still runs and removes the isolated Compose project, so no container, network, volume, host port binding, application process, or claimed temp directory remains. If exact pending-group disappearance cannot be proven, teardown reports `cleanup=managed-process physical=incomplete capsule=preserved`, leaves the in-memory runtime and capsule for a controlled same-process retry, and does not claim that the parent can recover pending ownership; the parent may use only already-published full identities.

Teardown is fail-closed on cleanup errors: every cleanup step (web stop, api stop, Compose `down`, and temporary-credential directory removal) is still attempted, but if any step fails, teardown rejects and `test:integration` exits non-zero. A required cleanup failure can never produce a zero exit.

Two harness-only failure-injection switches are available for exercising these paths:

- `CONTENTOS_SMOKE_INJECT_FAILURE=1` forces one test assertion to fail (the test-failure path).
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE=1` lets all tests pass, then records one synthetic cleanup failure after real cleanup has completed, so teardown rejects and the command exits non-zero with zero runtime residue.
- `CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE=1` makes one real wrong-signature cleanup probe receive `403`, then continues valid object/bucket cleanup and all later cleanup steps before forcing a non-zero teardown result.
- `CONTENTOS_SMOKE_INJECT_API_IDENTITY_CAPTURE_FAILURE=1` rejects the API identity capture after its detached spawn. The resulting non-zero `setup=process-identity-failed` path proves bounded rollback of the pending API group; a clean teardown is reported only after that exact group and all other task-owned runtime state are absent.

The concurrent coordinator also has bounded verification-only switches: `CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE=1` fails the first child after Compose startup but before ready-state publication; pairing it with `CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE=1` proves cleanup failure is reported rather than hidden. `CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY=SIGTERM` or `SIGKILL` proves the parent can finish exact claim-authorized cleanup after forced child termination.

Neither switch touches application or production code, and neither emits a credential value.

If Docker is missing or invalid, the harness fails clearly with a non-zero exit and a `Docker engine is not available` message. It never silently skips.

## 6. Preconditions

- Docker engine and Compose v2 available (Compose `!reset`/`!override` and tmpfs support is required).
- Node.js `24.18.0` and Corepack-managed pnpm `11.17.0` (per `.node-version` and the [Local Quality Toolchain](local-quality-toolchain.md)).
- Free ephemeral IPv4 loopback ports; the harness allocates both API and Web ports for each run.

## 7. Scope boundary

This harness is local-only. It is not a browser or full product end-to-end test, queue behavior test, Renderer or Playwright test, Agent Eval, recovery drill, or release gate. It verifies all reviewed migrations, the Drizzle Session, Content Package, and Source repositories through the API, owner non-disclosure, revision conflicts, Archive, pagination, Source role-limit enforcement, Working Copy revision conflicts, Version creation, Approval uniqueness, Source owner-scope isolation, and PostgreSQL authentication against a disposable `tmpfs` database. It runs no migration against `contentos-local` and persists no test data beyond the isolated run.

## 8. Decision traceability

This baseline follows DEC-244–DEC-266 for deterministic tests and gates, DEC-277–DEC-278 for M0 demonstrability, and DEC-284, DEC-287–DEC-292 for quality, bounded Work Items, and scope governance. The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
