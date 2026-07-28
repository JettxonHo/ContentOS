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

| Command                          | Purpose                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm format`           | Formats the active repository baseline.                                                                             |
| `corepack pnpm format:check`     | Checks formatting without modifying files.                                                                          |
| `corepack pnpm lint`             | Lints TypeScript, JavaScript, and the relevant configuration files.                                                 |
| `corepack pnpm typecheck`        | Runs strict TypeScript checks in every workspace package.                                                           |
| `corepack pnpm test`             | Runs deterministic local unit tests through Vitest.                                                                 |
| `corepack pnpm test:integration` | Runs the Docker-dependent integration smoke harness. See [Integration Smoke Harness](integration-smoke-harness.md). |
| `corepack pnpm build`            | Builds the five application skeletons.                                                                              |
| `corepack pnpm check`            | Runs `format:check`, `lint`, `typecheck`, `test`, and `build` in order.                                             |

Run `corepack pnpm check` before a commit. It has no Docker, database, Redis, Object Storage, browser, network, API key, Secret, or cloud-service dependency. `test:integration` is the only Docker-dependent command; it is intentionally excluded from `check` and is documented separately.

## 3. Tooling choices

- **Prettier `3.9.6`** is a root development dependency. It consistently formats TypeScript, JavaScript, JSON, Markdown, and YAML. The commands explicitly cover active source, root configuration, quality documents, and the roadmap; split historical Sessions and Decisions are not reformatted as part of this baseline.
- **ESLint `9.39.3`**, **`@eslint/js` `9.39.3`**, **TypeScript ESLint `8.65.0`**, **`globals` `16.4.0`**, and **`eslint-config-next` `16.2.12`** are root development dependencies. The flat configuration applies TypeScript-aware rules without duplicating type checking, confines browser globals and Next rules to `apps/web`, and applies Node globals to the Node processes and shared packages.
- **Vitest `4.1.10`** is a root development dependency. Its configuration discovers TypeScript tests under `apps/` and `packages/`, while allowing a workspace area with no tests to pass. It runs only local unit tests.

The principal alternatives were ESLint legacy configuration, framework-only lint commands, Jest, and broad whole-repository formatting. Legacy configuration is deprecated for the selected ESLint generation; framework-only linting would not cover all processes and packages; Jest is unnecessary for this ESM-first baseline; and broad formatting would create an unrelated rewrite of the historical record.

## 4. Baseline unit example

[`isPlainRecord`](../../packages/testing/src/is-plain-record.ts) is a minimal shared testing helper. Its unit test verifies that ordinary and null-prototype records are accepted while `null`, arrays, and class instances are rejected. This is a deterministic, dependency-free helper for future tests; it introduces neither a ContentOS domain model nor a product behavior.

## 5. Scope boundary

This local toolchain is an M0 engineering baseline. GitHub Actions, remote CI, browser and E2E testing, Docker Compose testing, PostgreSQL, Redis, SeaweedFS, API integration, database integration, and Agent evaluation remain outside its scope.

## 6. Decision traceability

This baseline follows DEC-244–DEC-266 for deterministic tests and gates, DEC-277–DEC-278 for M0 demonstrability, and DEC-284, DEC-287–DEC-292 for quality, bounded Work Items, and scope governance. The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
