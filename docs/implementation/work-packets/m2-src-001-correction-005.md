# CORRECTION PACKET 005 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-004.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `8f4645b696a3e7d9d838db41c839ad7204e49007` plus the uncommitted Correction 004 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Three bounded P2 findings block publication. Previously accepted Correction 004 implementation must be preserved.

No new DEC is required.

## Required corrections

### 1. Exercise rollback after every Head mutation

- Add real production-repository/disposable-PostgreSQL cases using `capture.afterHeadInsert` and `approval.afterHeadUpdate`.
- After capture failure following Head insertion, assert the complete capture graph is absent.
- After Approval failure following Head update, assert the Approval row is absent and the authoritative Head is unchanged.
- Exercise `version.afterWorkingCopyUpdate` so the complete Version/Head/Working Copy mutation sequence is protected.
- Tests must invoke the real `DrizzleSourceRepository`; no hand-written SQL or FakeRepository substitute is acceptable.

### 2. Bind concurrent smoke children by explicit ownership tokens

- Generate one parent execution token and distinct child tokens before spawning the two complete smoke commands.
- Pass the exact token to each child through its environment and persist it in the run-owned state.
- Discover and inspect only states authenticated by the expected parent/child tokens.
- Never classify, write a sentinel into, wait on, or clean an unrelated concurrently running harness directory.
- Assert two owned children have distinct directories, state files, Compose projects, ports, credentials, cleanup sentinels, successful exits, and zero owned residue.
- Add a deterministic third-party-run regression proving the concurrent gate ignores and does not modify an unrelated valid run.

### 3. Count Source label length as Unicode scalar values

- After rejecting non-well-formed Unicode, count label length by Unicode scalar values rather than JavaScript UTF-16 code units.
- Keep Core, request contract JSON Schema, PostgreSQL `char_length`, and documentation aligned at the 200-character boundary.
- Add tests for 100, 200, and 201 supplementary-plane characters and mixed BMP/supplementary labels at the exact boundary.

### 4. Repair bounded documentation details

- Correct the truncated `Security Bas` link label in Source Foundation.
- Update Browser Thin Slice metadata and migration-count wording to match the current migration journal.
- Add `test:integration:concurrent` to the repository-entry command guidance in `README.md` and `AGENTS.md`.

## Required verification

Run the complete parent and Corrections 002–004 gates again, plus:

- capture/Version/Approval post-Head rollback tests against the real repository;
- owned dual-run concurrency plus unrelated third-run isolation regression;
- Unicode-scalar label boundary tests across Core/contract/HTTP/PostgreSQL;
- repository-entry and Current-truth documentation/link checks;
- all ordinary, concurrent, failure-injection, browser, migration, audit, repository, security, residue, and named-volume checks already required.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
