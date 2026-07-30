# CORRECTION PACKET 004 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-003.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `27cdf77f6c7f8455de298191f2e2600fd971673b` plus the uncommitted Correction 003 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Four P2 evidence/contract defects still block publication. The bounded P3 cleanup and documentation defects below should be repaired in the same correction pass to avoid carrying known fragility.

No new DEC is required.

## Required corrections

### 1. Declare archived-Package read conflicts truthfully

- Source list, Source detail, Working Copy read, Version list, and exact Version detail return `PACKAGE_ARCHIVED` as HTTP 409 for an owned archived Package.
- Add the shared 409 error response to each affected OpenAPI operation.
- Make the OpenAPI regression test require the exact real status set rather than only 401/404/422.
- Preserve owner non-disclosure: unknown and other-owner Packages remain 404.

### 2. Align accepted text with PostgreSQL JSON/UTF-8 persistence

- Reject embedded NUL and non-well-formed Unicode, including lone UTF-16 surrogates, before any Object Storage write.
- Keep Core, HTTP/request validation, JSON Schema, normalized body validation, byte counting, content hashing, PostgreSQL `jsonb`, and documentation aligned.
- Return stable 422 with no object or database side effect for rejected input.
- Add Core, contract/schema, HTTP, and disposable-PostgreSQL-boundary regression tests for NUL, lone high surrogate, lone low surrogate, and valid supplementary-plane characters.

### 3. Add real repository recovery and rollback evidence

- Exercise `DrizzleSourceRepository.capture`, `createVersion`, and `approve` through injectable, bounded fault seams or an equivalent production-repository test seam.
- Prove intermediate callback failures roll back all authoritative rows and Head changes.
- Exercise capture commit-acknowledgement uncertainty with the real repository boundary and prove exact reconciliation of committed, absent, and unresolved states without destructive compensation when uncertain.
- Do not replace production repository calls with hand-written equivalent SQL or a FakeRepository for this evidence.
- Keep the fault seam test-only/bounded and out of Domain Core semantics.

### 4. Make concurrent-run and browser cleanup ownership executable

- Remove the Browser wrapper's recursive deletion of the fixed legacy `/tmp/contentos-smoke-harness` directory.
- The global setup/harness must remain the only owner of its exact `mkdtemp` run directory.
- Add an automated regression that launches two complete smoke runs concurrently and asserts distinct run directories, state files, Compose projects, ports, credentials, cleanup ownership, success, and zero residue.
- The regression must run through the real harness entry point; manual one-off shell evidence is insufficient.

### 5. Repair known bounded P3 fragility

- Replace ordered XML string replacements with a one-pass XML entity decoder/parser so nested entity text cannot be decoded twice into a different object key.
- Add a regression for a key containing literal entity-like text.
- Make build-lock creation atomic enough that an empty/malformed lock left by a crash can be safely classified and reclaimed; creation/write failure must close and remove its own lock.
- Add bounded tests for malformed/stale lock recovery without deleting a live lock.

### 6. Correct DEC traceability labels

- Recheck every DEC referenced by `docs/architecture/source-foundation.md` against the Canonical Decision Register.
- Correct descriptive grouping/labels without changing the DEC IDs, Accepted decisions, or implementation meaning.
- Do not infer or create new decisions.

## Required verification

Run the complete parent + Corrections 002/003 gate again, plus:

- OpenAPI exact response-set assertions for all Source operations;
- NUL/lone-surrogate/valid supplementary Unicode tests before storage and at HTTP/schema/DB seams;
- real `DrizzleSourceRepository` rollback and capture commit-ack reconciliation tests;
- an automated two-complete-run concurrency test;
- Browser wrapper execution proving only run-owned cleanup;
- nested XML entity and malformed/stale build-lock tests;
- DEC label audit against `docs/decisions/decisions.md`;
- all success/failure injection, migration, browser, audit, repository, scope, Secret, link, artifact, residue, and named-volume checks already required.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
