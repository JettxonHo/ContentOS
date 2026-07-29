# CORRECTION PACKET 009 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-008.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `0f523d6565fa6d06c2b7fcfc76bb56c00136376b` plus the uncommitted Correction 008 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Two cleanup-authority P2 findings block publication. The claim-before-side-effect design is accepted and must be preserved.

No new DEC is required.

## Required corrections

### 1. Preserve the recovery capsule until physical cleanup succeeds

- Separate “cleanup attempted,” “resource absence verified,” and “recovery capsule removed.”
- If exact managed-process, S3, or Compose cleanup fails or absence cannot be verified, retain the permission-`0600` claim, managed-process control, and Compose environment needed for Parent recovery.
- Atomically update process control to contain only identities that may still be alive.
- Child may remove its run root only after exact managed processes and the exact Compose project are verified absent. A synthetic failure after successful physical cleanup may still remove the root while returning non-zero.
- Parent must authenticate the preserved claim, retry exact cleanup, verify physical absence, then remove the child root and finally its unique parent root.
- A child-reported cleanup failure followed by an absent or invalid recovery capsule must be reported as cleanup incomplete, never verified.
- Parse Compose listing JSON and compare exact project names; do not use substring matching.
- Emit only allowlisted cleanup step categories, not paths, raw logs, env contents, credentials, Source bodies, or object keys.

### 2. Bind managed processes to non-reusable OS identity

- Do not signal a process group from an unverified child-supplied positive PID.
- Record and protect, at minimum, PID, PGID, process start identity, role, and an expected executable/command fingerprint suitable for local macOS and the supported CI runtime.
- Immediately before every TERM/KILL, query the OS and require exact agreement with the authenticated record. Missing, reused, changed, or malformed identity must fail closed without signaling.
- Preserve parent/child claim tokens and exact control-file binding; never infer ownership from command text alone.
- Add a real long-lived unrelated-process regression. A stale or forged control record pointing at that valid process must be rejected, and the unrelated process must remain alive.
- Real SIGTERM and SIGKILL gates must prove the exact API/Web identities disappear, unrelated processes receive no signal, exact Compose/root residue is zero, and invalid identity cannot be reported as verified cleanup.

## Required tests

- Real process-stop failure and real Compose-down failure preserve the recovery capsule; Parent retries and achieves zero owned residue.
- Missing capsule after child-reported cleanup failure yields cleanup incomplete.
- Synthetic teardown failure after physically successful cleanup remains non-zero but leaves no capsule or runtime residue.
- Stale/reused/forged PID/PGID/start/fingerprint records fail closed and leave an unrelated real process alive.
- Existing claim-before-side-effect, partial Compose, setup+teardown combined failure, TERM, KILL, ordinary/concurrent integration, unrelated third run, four failure injections, browser, migration, audit, repository, and residue gates remain passing.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
