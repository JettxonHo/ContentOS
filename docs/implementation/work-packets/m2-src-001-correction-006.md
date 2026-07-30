# CORRECTION PACKET 006 — M2-SRC-001

**Review result:** NEEDS CHANGES

**Parent Work Packet:** `docs/implementation/work-packets/m2-src-001.md`

**Prior correction:** `docs/implementation/work-packets/m2-src-001-correction-005.md`

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Reviewed base:** committed handoff `5b9f494131367eceead3d8c5464ec2d8e06f0f96` plus the uncommitted Correction 005 implementation

**Independent review:** two read-only GPT-5.6-sol high axes plus main-control review

**Review date:** 2026-07-29

## Outcome

No P0 or P1 findings remain. Three localized P2 findings block publication. All prior correction behavior must be preserved.

No new DEC is required.

## Required corrections

### 1. Fail fast on canonical non-secret Object Storage configuration

- Parse the endpoint once and reject any non-empty URL username or password.
- Keep credential material only in `ApiSecrets`; never retain or echo endpoint userinfo in `ApiConfig`, errors, logs, or test output.
- Validate region as a canonical printable S3 region token: non-empty, bounded to 64 characters, starts with an alphanumeric character, and contains only alphanumerics, `.`, `_`, or `-` thereafter.
- Reject whitespace-only, control-character, userinfo-bearing, and otherwise malformed values before API composition accepts work.
- Add focused no-echo tests that reach the intended endpoint/region validation rather than failing on an earlier unrelated field.

### 2. Prove Approval rollback by querying authoritative rows

- Preserve the generated Approval ID used in the post-Head rollback attempt.
- Query the real disposable PostgreSQL `source_approvals` table directly through the bounded test boundary and assert zero matching rows.
- Do not rely only on `getApprovalForPackageOwner`, because that read follows Head state and can hide a leaked Approval row.

### 3. Prove complete Head and Working Copy rollback state

- Use a distinct later timestamp for injected Version and Approval failures.
- Capture the complete pre-mutation Head and Working Copy rows.
- After each injected post-mutation failure, compare the complete authoritative rows, including every pointer, revision/checkpoint/base field, owner/source identity, and `updated_at`.
- Preserve the existing real `DrizzleSourceRepository` and disposable-PostgreSQL execution path.

### 4. Repair bounded P3 test robustness

- In concurrent-state discovery, catch only unreadable/incomplete JSON files. Once a state matches expected ownership tokens, duplicate-child-token and exact path/identity violations must fail immediately rather than being swallowed into a timeout.
- Add regressions for duplicate owned child tokens and invalid owned directory identity.
- Change the mixed-Unicode label test to assert the scalar count of `[...label]` rather than UTF-16 code-unit length.

## Required verification

Run the complete parent and Corrections 002–005 gates again, plus:

- endpoint userinfo and region canonical/no-echo config tests;
- direct Approval-row absence after post-Head rollback;
- complete pre/post Head and Working Copy equality with distinct timestamps;
- duplicate-token and owned-identity failure tests;
- all ordinary, concurrent, failure-injection, browser, migration, audit, repository, security, documentation, residue, and named-volume checks already required.

Unknown or unowned temporary directories must not be deleted. Only token-verified run-owned residue may be cleaned.

## Git boundary

The implementation Agent must not stage, commit, push, create a Pull Request, merge, switch branches, or self-approve. Main control may publish only after a fresh independent review returns no P0/P1/P2 findings and every required check passes.
