# HANDOFF 003 — M2-SRC-001 Codex Takeover Boundary

**Status:** In Progress — correction implementation interrupted at a safe filesystem boundary

**Issue:** [#39](https://github.com/JettxonHo/ContentOS/issues/39)

**Branch:** `codex/m2-src-001-pasted-text-source`

**Committed HEAD:** `79c6472ccdf52f8dcd9d9a2ca55d7e7673b55769`

**Working tree:** Dirty by design; the M2-SRC-001 implementation remains uncommitted

**Recorded:** 2026-07-29

## Reason for this handoff

The user clarified the execution model while Correction Packet 002 was being implemented:

- Codex owns planning, implementation, review, and GitHub publication.
- The main-control Agent is GPT-5.6-sol high.
- The requested implementation subagent is GPT-5.5 high.
- Local Claude Code must no longer be used.

The active local Claude process was stopped immediately. No Git reset, stash, branch switch, commit, push, Pull Request, or merge was performed by that process.

The current Codex subagent runtime exposes only `gpt-5.6-sol` and `gpt-5.6-terra`; an explicit request for `gpt-5.5` was rejected as an unknown model. Do not silently substitute a different model. Resume implementation only after the user selects an available execution configuration or GPT-5.5 becomes available.

## Governing documents

Read completely before editing:

1. `AGENTS.md` and `CLAUDE.md`;
2. `docs/implementation/work-packets/m2-src-001.md`;
3. `docs/implementation/work-packets/m2-src-001-correction-001.md`;
4. `docs/implementation/work-packets/m2-src-001-handoff-002.md`;
5. `docs/implementation/work-packets/m2-src-001-correction-002.md`;
6. this handoff.

Correction Packet 002 remains the controlling correction contract. The current implementation is not approved for publication.

## Completed independent review evidence

Before the interrupted correction pass, Codex and two independent read-only reviewers found no P0 but identified merge-blocking P1 findings:

- persisted Normalized Source bodies did not match or execute the JSON Schema contract;
- Approval validation evidence hashed the Version ID rather than the exact Version body/content;
- database constraints allowed cross-Source and cross-owner pointers;
- S3 task-bucket cleanup ignored non-2xx responses;
- capture could report failure after its transaction had already committed.

P2 findings covered exact Version review access, ignored list filtering, incomplete OpenAPI errors, missing database/S3/scope/concurrency tests, and stale Current-truth wording. All required corrections are specified in Correction Packet 002.

## Partial correction work now present

The interrupted writer began, but did not finish, these changes:

- added a Core-owned normalized-body validator seam;
- began changing Source Domain state from raw strings to a structured normalized body;
- added an Ajv adapter under `packages/contracts/src/source/`;
- began wiring the validator through API composition;
- began expanding Source contracts/controller behavior;
- began adding composite relational constraints in the Drizzle schema;
- began revising the Source repository;
- began hardening task-owned S3 bucket cleanup.

Treat all of these as unreviewed partial work. Inspect each diff before continuing; preserve correct changes, repair incomplete ones, and do not assume internal consistency.

## Known current failure

The interrupted tree does not typecheck. The latest command was:

```text
corepack pnpm typecheck
```

It stopped while building `@contentos/contracts` because `packages/contracts/src/source/ajv-body-validator.ts` imports `@contentos/core`, but `packages/contracts/package.json` and/or the package build ordering/dependency wiring had not yet been synchronized. This is a partial-edit failure, not a final design decision.

Do not fix it by introducing a dependency cycle, moving Ajv into Core, weakening TypeScript, deleting the validator seam, or bypassing the versioned JSON Schema.

## Repository state boundaries

- No local Claude implementation process from this Work Item remains running.
- `git diff --check` was clean immediately after interruption.
- No implementation file has been committed.
- The only committed change after the previous handoff is Correction Packet 002 at `79c6472`.
- The uncommitted tree contains the original M2-SRC-001 implementation plus partial Correction 002 edits.
- Do not reset, discard, overwrite, stash, or reconstruct the tree from scratch.
- Do not create migration 0003. Correct and regenerate the still-unmerged migration 0002 and its snapshot.

## Resume order

1. Confirm the branch and exact HEAD above.
2. Confirm no unexpected writer process is active.
3. Read all governing packets.
4. Inspect the complete tracked and untracked diff, including the partial validator, schema, repository, controller, contracts, and harness edits.
5. Restore a coherent dependency direction and typecheck before proceeding.
6. Complete every Correction Packet 002 requirement.
7. Run the full required success, failure-injection, migration, OpenAPI, security, cleanup, scope, and repository verification.
8. Return an Implementation Completion Report without Git publication actions.
9. Codex main control performs a fresh independent review. Commit/push/PR/merge are allowed only after no P0/P1/P2 findings remain.

## Prohibited actions

Do not use local Claude Code, change Accepted Decisions, expand M2-SRC-001, modify forbidden modules, delete local data, weaken tests, expose Secrets/private bodies/object keys, or perform Git publication from the implementation subagent.
