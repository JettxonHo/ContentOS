# CORRECTION PACKET 007 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-006.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `5a2e89d5f388ec7b0d61bdfa8984269af57afb4d` plus the uncommitted Correction 006 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Correction 006 is accepted. One test-orchestration P2 blocks publication; no Source product behavior needs redesign.

No new DEC is required.

## Required correction

### Make the concurrent smoke gate responsive to child lifecycle

- Race state discovery against both child-result promises instead of waiting only for the 240-second discovery deadline.
- If either child exits before its authenticated state has been captured, fail promptly.
- Safely await or terminate the remaining owned child through a bounded SIGTERM/SIGKILL lifecycle, then verify zero owned residue.
- Include bounded, sanitized child diagnostics in the failure without credentials, env contents, object keys, Source bodies, or unbounded output.
- Retain authenticated state snapshots across polling iterations. A fast valid child may publish and remove its state before the slower child publishes; the parent must not require both files to coexist in one filesystem scan.
- Preserve strict parent/child-token ownership and never inspect, signal, write, wait on, or clean unrelated concurrent runs.

## Required tests

- A child exits non-zero before state publication: the parent fails promptly, reports bounded safe diagnostics, handles the remaining owned child, and leaves zero owned residue.
- Two valid children publish authenticated states during non-overlapping lifetimes: both snapshots are retained and the gate completes without a false timeout.
- Existing unrelated-third-run, duplicate-token, invalid-owned-identity, ordinary dual-run, assertion, teardown, S3 cleanup, invalid-Docker, browser, migration, audit, repository, and residue gates remain passing.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
