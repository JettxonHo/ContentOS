# HANDOFF 004 — M2-SRC-001 Correction 009 Completed, Ready for Independent Review

**Status:** Implementation frozen; all required local gates green; awaiting Codex independent review

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Branch:** `codex/m2-src-001-pasted-text-source`

**Committed HEAD:** `c34c55a` (ninth correction packet). The Correction 009 implementation is UNCOMMITTED on top of this HEAD.

**Recorded:** 2026-07-31 by the local Claude implementation Agent (`claude-fable-5`)

## Why this handoff exists

The previous Codex-driven session ran out of quota mid-way through Correction 009. The implementation subagent had landed the process-identity layer (`process-identity.ts`) but the tree did not compile and the Correction 009 §1/§2 targeted tests were not yet passing. The local Claude Agent was asked to resume, finish Correction 009, get every required gate green, and leave durable records. That work is complete.

## What was done in this session (all in allowed files)

1. **Restored the compiled, migrated tree.** The tree had three type errors left by the interrupted migration:
   - `run-concurrent-smoke.ts:528` referenced a non-existent `stopProcessGroup` with a wrong signature; replaced with the imported `stopManagedProcess(managedProcess)` (full `ManagedProcessIdentity`, not `.pid`).
   - `ClaimCleanupOperations.stopManagedProcess` signature changed from `(pid: number)` to `(identity: ManagedProcessIdentity)`.
   - `concurrent-smoke.test.ts` fixtures/mocks migrated to the 6-field identity shape and the identity-based mock signature; fixture claim/process files now written `0600` (required by `assertPrivateFile`).

2. **Correction 009 §1.3 — exact Compose name comparison.** Replaced substring `stdout.includes(projectName)` in `cleanupAndVerifyClaims` with exact JSON parsing via the already-imported `parseComposeProjectNames`, comparing names by set membership.

3. **Correction 009 §2 — added the missing real identity fail-closed tests.** New `packages/testing/src/process-identity.test.ts` (runs under `pnpm test`, no Docker): complete-identity capture for a detached group leader; `inspectManagedProcess` undefined for a dead pid; all-six-field comparison; matching identity stops the exact process; forged identity fails closed with an unrelated real process left alive; SIGTERM→SIGKILL escalation for a SIGTERM-ignoring process.

4. **Fixed a real flakiness bug the new tests exposed.** `waitForGroupGone` (in `process-identity.ts`) treated a transient macOS `EPERM` during the post-signal death-wait as a hard `managed-process-probe-failed`. Diagnosis confirmed the error is `EPERM` during process reaping; a tolerant wait (keep polling until deadline) gave 0/40 failures. Fail-closed identity verification (before each signal) is unchanged; only the post-signal death-wait was made tolerant. This is spec-aligned: Correction 009 §2 scopes fail-closed to identity verification, not the death-wait.

5. **Fixed a Node strip-only incompatibility.** `HarnessCleanupError` used constructor parameter properties (non-erasable), which crashed `node run-concurrent-smoke.ts` with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` (vitest transpiled it, so unit tests passed but the concurrent runner did not). Converted to explicit field declarations + assignments. Verified the concurrent runner now loads under Node type-stripping.

6. **Removed dead code flagged by lint:** unused `statSync` import (`run-concurrent-smoke.ts`), unused `managedProcessControlForClaim` destructure (`harness.ts`), and unused `childRequiresRecoveryCapsule` (`run-concurrent-smoke.ts`) — the `capsule=preserved` case is already covered by the `teardown=failed` substring check at the coordination cleanup determination, since the harness always emits `teardown=failed` alongside `physical=/capsule=`.

## Verification results (all green)

- `install --frozen-lockfile` RC=0; `workspace:check` RC=0.
- `check` (format/lint/typecheck/test/build) RC=0 — 22 files / 129 tests.
- `test:integration` RC=0 — 33 tests.
- `test:integration:concurrent` RC=0 (two parallel smokes, isolated).
- `test:browser` RC=0 (M1 owner loop regression).
- Failure injections all non-zero with the expected cleanup semantics:
  - `CONTENTOS_SMOKE_INJECT_FAILURE`, `_TEARDOWN_FAILURE`, `_PROCESS_STOP_FAILURE`, `_S3_CLEANUP_FAILURE`, `_COMPOSE_DOWN_FAILURE` → RC=1.
  - Invalid Docker (`DOCKER_HOST=unix:///nonexistent/...`) → RC=1.
  - Concurrent `_FIRST_TEARDOWN_FAILURE` → RC=1 with `owned-cleanup=verified` and ZERO residue (Parent recovered).
- `db:generate` → "No schema changes" (schema ↔ migration 0002 ↔ snapshot agree; no drift). Migration 0002 retains the `text/plain; charset=utf-8` literal, the `source_versions.parent_version_id` self-FK, and the `octet_length` body checks.
- `pnpm audit --audit-level high --registry https://registry.npmjs.org/` → no known vulnerabilities.
- `repository:check` RC=0.
- Scope: no forbidden files. Secret/local-path scan clean. `git diff --check` clean. Lockfile changed only by the approved `@aws-sdk/client-s3@3.1096.0` tree.
- `contentos-local` named volumes (postgres/redis/seaweedfs) unchanged (CreatedAt 2026-07-27), never mounted by the smoke harness.

## Known residue and cleanup notes (read before re-running)

- **Cleanup-failure injections intentionally preserve the recovery capsule** (Correction 009 §1). In ORDINARY mode (`test:integration`) there is no Parent to recover, so a `_PROCESS_STOP_FAILURE` / `_S3_CLEANUP_FAILURE` leaves the preserved capsule run dir, and a `_COMPOSE_DOWN_FAILURE` also leaves the Compose project/containers. These were cleaned manually after verification. The CONCURRENT mode demonstrates Parent recovery → zero residue (`owned-cleanup=verified`).
- **Pre-existing stale residue from the suspended session's crashed runs (2026-07-29), intentionally NOT deleted** per the Correction 009 fail-safe ("do not delete unattributable resources; report them"): temp dir `contentos-smoke-harness-IFQ9xj` and orphan processes PID 10432 (api `dist/main.js`) and 10444 (`corepack ... web start`). These predate this session and cannot be token-attributed to a current run. A future operator may remove them after confirming no live smoke run depends on them.
- `contentos-smoke-harness/playwright-output` is the M1 browser test's Playwright output dir (persists by design; present since 2026-07-29). Not a smoke-harness leak.
- `docs/quality/browser-thin-slice.md` was updated by the suspended session as legitimate documentation sync (migration count and teardown wording reflect the M2 harness changes, per AGENTS.md §14). It is not in the work packet's explicit allowed list but is a required Current-truth sync, not a behavior change.

## Where to resume (Codex independent review)

The implementation is frozen and uncommitted. Per the Work Packet Git boundary, the Implementation Agent did not stage/commit/push/PR/merge. Codex should now perform a fresh independent multi-axis review of the full uncommitted diff (Domain/API/Unicode/OpenAPI and Repository/S3/Harness/cleanup-authority axes). Publish (commit/push/PR) only after no P0/P1/P2 findings remain and every required check is re-run green. The two prior review axes' historical findings (Corrections 001–008) are resolved; Correction 009's cleanup-authority and identity fail-closed requirements are now implemented and evidenced above.
