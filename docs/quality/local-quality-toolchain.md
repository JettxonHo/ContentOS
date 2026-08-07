# ContentOS Local Quality Toolchain

**Status:** Implementation Baseline
**Scope:** Local formatting, linting, type checking, unit tests, builds, and the M0 quality command gate
**Last Updated:** 2026-07-28

This document records the executable local quality baseline introduced by `M0-QUAL-001`. It implements the M0 tooling boundary from [Test Strategy](test-strategy.md) and [Release Gates](release-gates.md); it does not create a remote CI system, a release gate implementation, browser testing, infrastructure testing, or product behavior.

## 1. Runtime and installation

Use Node.js `24.18.0` from `.node-version` and Corepack-managed pnpm `11.17.0`.

```bash
corepack pnpm install --frozen-lockfile
```

## 2. Commands

| Command                          | Purpose                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm format`           | Formats the active repository baseline.                                                                                                                                     |
| `corepack pnpm format:check`     | Checks formatting without modifying files.                                                                                                                                  |
| `corepack pnpm lint`             | Lints TypeScript, JavaScript, and the relevant configuration files.                                                                                                         |
| `corepack pnpm typecheck`        | Builds shared declarations, then runs strict TypeScript checks across the workspace.                                                                                        |
| `corepack pnpm test`             | Runs deterministic local unit tests through Vitest.                                                                                                                         |
| `corepack pnpm test:integration` | Runs the Docker-dependent integration smoke harness. See [Integration Smoke Harness](integration-smoke-harness.md).                                                         |
| `corepack pnpm test:browser`     | Runs the Docker-dependent M1/M2 browser suite in pinned Chromium. See [M1 Browser Thin Slice](browser-thin-slice.md) and [M2 Acceptance Harness](m2-acceptance-harness.md). |
| `corepack pnpm build`            | Builds the four runtime shared packages and five application entry points.                                                                                                  |
| `corepack pnpm check`            | Runs `format:check`, `lint`, `typecheck`, `test`, and `build` in order.                                                                                                     |

Run `corepack pnpm check` before a commit. It has no Docker, database, Redis, Object Storage, browser, network, API key, Secret, or cloud-service dependency. `test:integration` and `test:browser` are Docker-dependent, intentionally excluded from `check`, and documented separately. The repository-integrity commands (`check:docs`, `check:decisions`, `check:secrets`, `repository:check`) are also Docker-independent and are documented in [CI Skeleton](ci-skeleton.md); they are not part of `check`.

The root strict baseline keeps `skipLibCheck` disabled. The `packages/database` adapter alone enables it to isolate known cross-dialect declaration failures inside the pinned Drizzle release; ContentOS source in that package remains checked with all other strict options, and every other package retains full library checking.

## 3. Tooling choices

- **Prettier `3.9.6`** is a root development dependency. It consistently formats TypeScript, JavaScript, JSON, Markdown, and YAML. The commands explicitly cover active source, root configuration, quality documents, and the roadmap; split historical Sessions and Decisions are not reformatted as part of this baseline.
- **ESLint `9.39.3`**, **`@eslint/js` `9.39.3`**, **TypeScript ESLint `8.65.0`**, **`globals` `16.4.0`**, and **`eslint-config-next` `16.2.12`** are root development dependencies. The flat configuration applies TypeScript-aware rules without duplicating type checking, confines browser globals and Next rules to `apps/web`, and applies Node globals to the Node processes and shared packages.
- **Vitest `4.1.10`** is a root development dependency. Its configuration discovers TypeScript tests under `apps/` and `packages/`, while allowing a workspace area with no tests to pass. It runs only local unit tests.

The principal alternatives were ESLint legacy configuration, framework-only lint commands, Jest, and broad whole-repository formatting. Legacy configuration is deprecated for the selected ESLint generation; framework-only linting would not cover all processes and packages; Jest is unnecessary for this ESM-first baseline; and broad formatting would create an unrelated rewrite of the historical record.

## 4. Baseline unit example

[`isPlainRecord`](../../packages/testing/src/is-plain-record.ts) is a minimal shared testing helper. Its unit test verifies that ordinary and null-prototype records are accepted while `null`, arrays, and class instances are rejected. This is a deterministic, dependency-free helper for future tests; it introduces neither a ContentOS domain model nor a product behavior.

## 5. Scope boundary

This local toolchain is an M0 engineering baseline (the `M0-QUAL-001` scope). Browser and E2E testing, Docker Compose testing, PostgreSQL, Redis, SeaweedFS, API integration, database integration, and Agent evaluation remain outside its scope. A bounded GitHub Actions workflow and repository-integrity checks are introduced separately by `M0-CI-001`; see [CI Skeleton](ci-skeleton.md).

## 6. Decision traceability

This baseline follows DEC-244–DEC-266 for deterministic tests and gates, DEC-277–DEC-278 for M0 demonstrability, and DEC-284, DEC-287–DEC-292 for quality, bounded Work Items, and scope governance. The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
