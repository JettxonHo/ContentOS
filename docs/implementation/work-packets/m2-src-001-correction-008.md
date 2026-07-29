# CORRECTION PACKET 008 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-007.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `78edc8b333fa18129bb559ee4a60b88176724e4e` plus the uncommitted Correction 007 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Correction 007's state retention and child-lifecycle coordination are accepted. One pre-ready ownership/cleanup P2 blocks publication.

No new DEC is required.

## Required correction

### Establish authenticated ownership before any child side effect

- For the concurrent gate, the parent must create a unique parent-owned root and two exact child-owned run roots before spawning either child.
- Generate and persist a minimal non-secret ownership claim for each child before credentials, build, Docker, Compose, ports, processes, or ready-state side effects.
- Bind each claim to the exact parent token, child token, run directory, state/claim path, and Compose project identity.
- Pass the exact claimed identity to the child. The harness must validate it and must not silently replace it with a new global temporary directory or project.
- Keep ownership claim and ready state separate: the claim proves cleanup authority; the ready state proves runtime readiness and carries the bounded isolation evidence.
- Ordinary non-concurrent harness runs may continue to create their own unique roots, but must also publish ownership before credentials or runtime side effects.

### Make setup failure and parent cleanup truthful

- Setup failure must attempt every teardown step and must not suppress teardown failures. Return a stable, sanitized combined failure classification.
- On child early exit or forced termination, the parent must use only that child's authenticated claim to stop/await exact managed processes, bring down the exact Compose project, remove the exact child root, and verify zero owned residue.
- The parent may remove only the unique parent root it created after both child roots are verified clean.
- Never scan, infer ownership from, delete, or modify unrelated global temporary directories or Compose projects.
- Never report `owned-cleanup=verified` when an expected child claim is absent, invalid, or still has residue.

## Required tests

- A real harness child fails after ownership publication but before ready state, with a partial task-owned Compose/resource side effect; successful teardown leaves zero claimed residue.
- A teardown step also fails: the combined sanitized error is non-zero and Parent reports cleanup failure rather than success.
- SIGTERM and SIGKILL paths use the claim to verify or finish exact cleanup.
- An unrelated run directory, claim, sentinel, process, and Compose project remain untouched.
- Existing non-overlapping ready-state, pre-state prompt failure, two-success-child, unrelated-third-run, duplicate-token, invalid-identity, ordinary integration, four failure injections, browser, migration, audit, repository, and residue gates remain passing.
- Browser setup explicitly recognizes the stable `setup-failed` category without exposing raw logs, paths, credentials, or env contents.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
