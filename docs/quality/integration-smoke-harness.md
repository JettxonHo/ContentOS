# ContentOS Integration Smoke Harness

**Status:** Implementation Baseline
**Scope:** The single Docker-dependent integration smoke command, its isolation design, what it verifies, and its boundary against the Docker-independent quality gate
**Last Updated:** 2026-07-28

This document records the executable integration smoke baseline introduced by `M0-QUAL-002`. It is the Docker-dependent companion to the [Local Quality Toolchain](local-quality-toolchain.md). It does not create a product feature, a remote CI system, an end-to-end or browser test, a product database, schema, or migration test, a queue test, an Agent Eval, or a release gate.

Related documents: [Local Quality Toolchain](local-quality-toolchain.md), [CI Skeleton](ci-skeleton.md), [Test Strategy](test-strategy.md), [Release Gates](release-gates.md), [Repository Structure](../architecture/repository-structure.md), and the [Roadmap](../implementation/roadmap.md).

The M0 CI workflow runs `corepack pnpm test:integration` as its own Docker-dependent job, separate from the Docker-independent quality job; see [CI Skeleton](ci-skeleton.md).

---

## 1. Purpose

`corepack pnpm test:integration` is one explicit, repeatable, black-box command that verifies the five existing application skeletons (`web`, `api`, `worker`, `fetcher`, `renderer`) and the existing local-state baseline (PostgreSQL, Redis, and the SeaweedFS S3-compatible Object Storage) work together through their real entry points and real containers. It introduces no product behavior and changes no application source.

It proves the baseline is wired together before later Milestones depend on that wiring. It is not a Vertical Slice and does not exercise Domain, Workflow, Agent, Render, or Source behavior.

## 2. Command boundary

| Command                          | Docker required | Collected by                                                                                   |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `corepack pnpm test`             | No              | Unit tests only; excludes `packages/testing/src/integration/**`.                               |
| `corepack pnpm check`            | No              | `format:check`, `lint`, `typecheck`, `test`, `build`. Does **not** include `test:integration`. |
| `corepack pnpm test:integration` | **Yes**         | Only `packages/testing/src/integration/**/*.test.ts`.                                          |

`test` and `check` remain Docker-, network-, and credential-independent. `test:integration` is the only Docker-dependent entry point. It is deliberately absent from `check` so that the ordinary pre-commit gate never requires Docker.

## 3. Isolation design

The harness never reads, mounts, changes, or deletes the existing `contentos-local` Compose project or its named volumes. It starts its own isolated project whose validated name begins with `contentos-smoke-`:

- **Merged Compose configuration:** the repository `compose.yaml` combined with `packages/testing/fixtures/compose.smoke.yaml`.
- **No persistent volumes:** the override clears the inherited named-volume mounts with `volumes: !reset []` and replaces service data with `tmpfs`. No named volume is created for the smoke project.
- **Loopback-only ephemeral ports:** every published host port is rebound with `ports: !override` to `127.0.0.1:0`, so the host binds an ephemeral port on IPv4 loopback only.
- **Temporary credentials outside the repository:** PostgreSQL, Redis, and S3 credentials are generated at runtime and written to a file under the OS temp directory. They never appear in process arguments, terminal output, exception messages, logs, or the repository.
- **No image, digest, credential, healthcheck, or command change:** the override changes only volumes, tmpfs, and published ports.
- **Cleanup:** on success or failure, the harness stops the application processes and runs `docker compose down` for its own project only. It never uses `-v`/`--volumes`, volume removal, image removal, `prune`, or any global cleanup.

The three named volumes declared by the current `compose.yaml` (`contentos_postgres_data`, `contentos_redis_data`, and `contentos_seaweedfs_data`) are left untouched. The object-storage service mounts the SeaweedFS volume; no separate object-storage data volume is declared or affected.

## 4. What the harness verifies

A Vitest `globalSetup` performs, once per run: a Docker availability check, an application build, `docker compose up -d --wait` for the isolated project, host-port resolution, and startup of the `api` and `web` artifacts. Test slices then verify:

- **web:** responds over loopback with a successful HTTP status.
- **api:** `GET /health/live` returns the exact liveness contract `{ "status": "ok", "service": "api" }`.
- **worker, fetcher, renderer:** each emits `process.started`, responds to `SIGTERM` with `process.stopping`, and exits cleanly with code `0`.
- **postgres:** healthy, loopback-reachable, authenticates the correct credential over TCP (including `SELECT 1`), rejects a wrong credential, and introduces no application table, schema, or migration.
- **redis:** healthy, loopback-reachable, returns `PONG` for the correct credential, rejects a wrong credential, and holds no key.
- **object storage:** healthy, loopback-reachable, accepts a correct AWS SigV4 signature, rejects a wrong signature, rejects anonymous access, and leaves no probe bucket or object after the run.

The S3 signature is produced by a minimal SigV4 signer built only from the Node.js standard library (`node:crypto`). No S3 SDK or new dependency is introduced.

## 5. Failure path

A required failure returns a non-zero exit code. When a test fails, the `globalSetup` teardown still runs and removes the isolated Compose project, so no container, network, volume, host port binding, application process, or temp directory remains.

Teardown is fail-fast on cleanup errors: every cleanup step (web stop, api stop, Compose `down`, and temporary-credential directory removal) is still attempted, but if any step fails, teardown rejects and `test:integration` exits non-zero. A required cleanup failure can never produce a zero exit.

Two harness-only failure-injection switches are available for exercising these paths:

- `CONTENTOS_SMOKE_INJECT_FAILURE=1` forces one test assertion to fail (the test-failure path).
- `CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE=1` lets all tests pass, then records one synthetic cleanup failure after real cleanup has completed, so teardown rejects and the command exits non-zero with zero runtime residue.

Neither switch touches application or production code, and neither emits a credential value.

If Docker is missing or invalid, the harness fails clearly with a non-zero exit and a `Docker engine is not available` message. It never silently skips.

## 6. Preconditions

- Docker engine and Compose v2 available (Compose `!reset`/`!override` and tmpfs support is required).
- Node.js `24.18.0` and Corepack-managed pnpm `11.17.0` (per `.node-version` and the [Local Quality Toolchain](local-quality-toolchain.md)).
- IPv4 loopback port `3001` free for the API artifact (the harness starts the API on `127.0.0.1:3001`).

## 7. Scope boundary

This harness is an M0 engineering baseline. It is local-only. It is not a product end-to-end test, a queue behavior test, a Renderer or Playwright test, an Agent Eval, a recovery drill, or a release gate. It is not a product database, schema, or migration test: it does not create any business schema, migration, table, or persistent business data. It does, however, verify PostgreSQL health, TCP connectivity, correct and incorrect authentication, and `SELECT 1` against an empty database. It does not connect any application to a state service through Domain or Adapter code; it drives the skeletons and containers directly from the test process.

## 8. Decision traceability

This baseline follows DEC-244–DEC-266 for deterministic tests and gates, DEC-277–DEC-278 for M0 demonstrability, and DEC-284, DEC-287–DEC-292 for quality, bounded Work Items, and scope governance. The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
