# M2-SRC-001 Handoff 002

**Status:** Active implementation paused for agent handoff

**Recorded:** 2026-07-29 (Asia/Shanghai)

**Issue:** [#39 — M2-SRC-001: add pasted-text Source approval foundation](https://github.com/JettxonHo/ContentOS/issues/39)

**Branch:** `codex/m2-src-001-pasted-text-source`

**Branch HEAD:** `e5136a4ef1e17d7f8051450fa6541cb5f01f9c27`

**Implementation state:** Uncommitted and not ready for review

## 1. Authority and durable inputs

Read these before resuming:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/implementation/work-packets/m2-src-001.md`
4. `docs/implementation/work-packets/m2-src-001-correction-001.md`
5. Issue #39 and its correction comment

The two earlier Work Packets are already committed and pushed:

- `ef84986` — `docs: add M2 Source work packet`
- `e5136a4` — `docs: record M2 Source correction packet`

Do not modify Accepted Decisions, expand M2, introduce upload or URL fetching, or begin Workflow, Queue, Web, Agent, or M3 work.

## 2. Execution model

- Codex is the control, review, GitHub, and merge authority.
- Local Claude Code is the sole implementation writer.
- Claude may use up to three read-only specialists for domain/contracts, persistence/storage/security, and tests/documentation.
- Claude must not commit, push, create or merge a PR, switch branches, or self-approve.
- Codex must independently verify all claims before publication.

The resumable Claude Code session is:

```text
b56f7af1-1bc7-4a75-8a0e-af2ef8aa76cc
```

The previous Claude process was intentionally interrupted after an atomic tool action so this handoff could be recorded. No Completion Report was produced for the correction pass.

## 3. Current working-tree state

The implementation is intentionally uncommitted. The change set contains the M2-SRC-001 Source foundation across API, Core, Contracts, Database, Object Storage, integration harness/tests, migration, schema, configuration, and bounded documentation.

No implementation commit, PR, or merge exists. Do not discard or reset the working tree. Preserve all user and implementation changes.

The current generated migration is:

```text
migrations/0002_futuristic_adam_destine.sql
```

The old first-pass migration name was removed during regeneration.

## 4. Independent review history

The first Claude implementation was rejected by Codex for eight bounded findings, recorded completely in `m2-src-001-correction-001.md`:

1. smoke runtime object-storage bucket isolation and cleanup;
2. package path ownership and membership enforcement;
3. truthful list response without fabricated resource fields;
4. repeatable approval lifecycle bound to the current review candidate;
5. Raw Snapshot `contentType` and conditional immutable S3 creation;
6. relational integrity, UTF-8 octet checks, and regenerated migration;
7. strict UUID validation at the HTTP boundary;
8. storage integrity plus write/commit/compensation failure tests.

The first independent runtime check also found `pnpm test:integration` could not start the API because the smoke harness did not provide the new Object Storage configuration.

## 5. Correction progress at pause

Claude had implemented or started the following corrections, but Codex has not yet accepted them:

- added Raw Snapshot `contentType`;
- changed the S3 adapter toward conditional immutable creation;
- revised Source Service and repository interfaces for package scoping and approval lifecycle;
- added list-item contracts instead of fabricated full resources;
- added stricter UUID boundary validation;
- added object-storage configuration and isolated smoke-bucket setup to the integration harness;
- regenerated migration `0002` with Source foreign keys, validation summary, content type, and octet constraints;
- created `packages/core/src/source/source-service.test.ts` for failure paths;
- started revising integration tests for package isolation, second-version approval, and S3 integrity.

These are implementation observations, not passed Acceptance Criteria.

## 6. Exact pause point and known failure

The most recent executed verification was:

```text
corepack pnpm typecheck
```

It failed in `packages/database/src/schema.ts` with TypeScript error `TS7022` caused by the self-referencing `sourceVersions.parentVersionId` foreign key inference.

Claude had begun investigating Drizzle's supported `AnyPgColumn` annotation for self-references. Resume by using the documented Drizzle self-reference typing pattern, preserving the foreign key in both schema and generated migration. Do not solve this by deleting the relational constraint, weakening TypeScript, or editing generated metadata into a state that diverges from the schema.

After correcting the schema, regenerate migration `0002` from the corrected schema and verify the generated SQL and snapshot agree. Be alert to the semicolon in `text/plain; charset=utf-8`; the SQL must retain the entire literal.

## 7. Resume procedure

First confirm:

```text
branch = codex/m2-src-001-pasted-text-source
HEAD = e5136a4ef1e17d7f8051450fa6541cb5f01f9c27
working tree = existing uncommitted M2-SRC-001 changes only
```

Then resume the existing Claude session as sole writer with this instruction:

```text
Resume M2-SRC-001 from docs/implementation/work-packets/m2-src-001-handoff-002.md. Read that file and both prior M2-SRC-001 packets completely. Preserve the current uncommitted tree. Fix the TS7022 self-reference using Drizzle's supported typed self-reference pattern without removing the FK or weakening TypeScript. Complete all eight Correction Packet sections, run every required verification, leave zero runtime residue, and return a revised Completion Report. Do not commit, push, create/merge a PR, switch branches, modify forbidden files, or expand scope.
```

Suggested command shape:

```text
claude -p --resume b56f7af1-1bc7-4a75-8a0e-af2ef8aa76cc --model opus --effort high --permission-mode acceptEdits --allowedTools Bash Edit Write Read Glob Grep
```

If resume is unavailable, start a fresh local Claude Code session only after it reads this handoff and both prior packets.

## 8. Required independent verification

Claude must run and report these, then Codex must rerun them independently:

1. frozen-lockfile install;
2. exact workspace check;
3. full local `check` gate;
4. Docker integration smoke test;
5. assertion-failure injection, expected non-zero;
6. teardown-failure injection, expected non-zero;
7. invalid-Docker failure, expected non-zero;
8. browser regression;
9. fresh migration and repeat migration;
10. dependency audit at the approved threshold;
11. repository check;
12. diff, scope, secret, local-path, `.DS_Store`, generated-artifact, and Markdown-link checks;
13. zero smoke containers, processes, temporary directories, buckets, and objects after every path;
14. proof that existing `contentos-local` volumes were neither mounted nor changed.

Runtime evidence must additionally prove:

- correct package path works and a wrong package path returns the approved not-found behavior for list, detail, edit, version, and approval;
- list responses contain only truthful persisted fields;
- a newer review candidate can be approved after an earlier approval, while duplicate or non-current candidate approval is rejected;
- validation summary is persisted deterministically;
- correct authenticated S3 retrieval returns exact bytes, hash, size, and content type;
- wrong and anonymous S3 access are denied;
- conditional overwrite of an existing immutable key is rejected;
- object write failure creates no database state;
- repository failure triggers object compensation;
- compensation failure is surfaced and does not produce false success.

## 9. Publication gate

Do not commit implementation or open a PR until Codex completes an independent multi-axis review with no unresolved P0/P1/P2 findings and all required checks pass.

If accepted, the intended publication sequence is:

```text
stage only M2-SRC-001 files
→ verify staged scope and secrets
→ commit
→ push
→ create PR closing #39
→ wait for all CI checks
→ independent PR review
→ merge
→ sync main and remove the merged branch
→ create the next M2 Issue and durable Work Packet before implementation
```

M2 is not complete when M2-SRC-001 merges. M3 must not start before the immutable M2 Exit Review passes.
