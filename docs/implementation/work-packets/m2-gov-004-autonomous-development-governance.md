# M2-GOV-004 — Autonomous Development Governance Normalization

**Status:** In Review

**Decision Review outcome:** `ACCEPTED` — Human authority approved the bounded
autonomous development and merge flow on 2026-08-06.

**Issue:** [#88](https://github.com/JettxonHo/ContentOS/issues/88)

**Branch:** `codex/m2-gov-004-autonomous-development`

**Base commit:** `1b6d49eb9f922126207cbf4bd34030b7e183a358`

## Identification

- Work Item: `M2-GOV-004`
- Milestone: M2 — Source and Workflow Foundation
- Executor Profile: `DOCUMENTATION_EXECUTOR`
- Target implementation configuration: `gpt-5.6-terra`, XHigh
- Logical Role: `ORCHESTRATOR_REVIEWER`
- Actual Model: `UNVERIFIED_RUNTIME_MODEL`
- Reasoning: not reliably observable from the primary runtime
- Thread: `/root`
- Runtime Model Status: `UNVERIFIED_RUNTIME_MODEL`

The planned Terra writer threads produced no repository mutation and were
stopped. The primary thread performed the bounded documentation change and does
not independently approve it. A separate `gpt-5.6-sol` XHigh reviewer must
inspect the real diff.

## Goal

Normalize the existing collaboration workflow for the Human-approved bounded
autonomous merge process without changing product behavior or creating another
source of truth.

## Canonical sources

- [Canonical Decision Register](../../decisions/decisions.md)
- [AGENTS.md](../../../AGENTS.md)
- [Agent Collaboration Workflow](../agent-collaboration-workflow.md)
- [Work Item Template](../work-item-template.md)
- [Issue #88](https://github.com/JettxonHo/ContentOS/issues/88)

## Accepted decision

### Ordinary bounded work

For an ordinary, reversible change inside a Ready Work Item, the Work Packet
may explicitly authorize the Implementation Agent to commit, push, and create
or update a draft PR. The Implementation Agent cannot approve its own work,
mark the PR ready, or merge it.

After a different Agent returns an independent `PASS` against the real diff,
all required CI checks are green, and no escalation category applies, the
Orchestrator / Reviewer may mark the PR ready and squash merge it. A dependent
Work Item begins only from the refreshed `origin/main` baseline.

### Human decision boundary

Return `HUMAN_DECISION_REQUIRED` for:

- product direction or a material choice between reasonable approaches;
- authentication, authorization, permissions, production data, sensitive
  information, or production configuration;
- irreversible migrations or external actions;
- major security, privacy, compliance, architecture, technical-stack, or public
  protocol changes;
- material cost, high-risk release, or production operations;
- changes to MVP scope, workflow, Agent responsibility, or release gates; or
- a request to lower or waive an accepted Acceptance Criterion.

This process does not authorize product-level Agent Approval, public publishing,
production release, or a bypass of Accepted DEC.

## In scope

- normalize the current Agent roles, Git permissions, independent review gate,
  CI gate, merge gate, and Human escalation boundary;
- record observable execution metadata without inferring a model;
- demote the old Product Design Protocol to historical exploration guidance;
- enrich the existing PR templates with approach, non-changes, Acceptance
  Criteria evidence, rollback, and review focus; and
- preserve the current truth hierarchy and single-writer rule.

## Out of scope

- code, dependencies, configuration, migrations, tests, runtime behavior, or
  M2 product status;
- modification of an Accepted DEC;
- `GOAL.md`, `docs/current-status.md`, `docs/decision-log.md`, or any duplicate
  architecture, testing, status, or collaboration source;
- a new review outcome or parallel status machine; and
- implementation of any Fetcher, Source, Workflow, Web, or Agent capability.

## Allowed files

- `docs/implementation/work-packets/m2-gov-004-autonomous-development-governance.md`
- `docs/implementation/agent-collaboration-workflow.md`
- `docs/implementation/templates/work-packet-template.md`
- `docs/implementation/templates/implementation-report-template.md`
- `docs/implementation/templates/review-gate-template.md`
- `docs/implementation/templates/pull-request-template.md`
- `docs/governance/product-design-protocol.md`
- `.github/pull_request_template.md`

All other files are forbidden.

## Acceptance criteria

1. The explicit Implementer Git permission is limited to commit, push, and a
   draft PR for an ordinary reversible Work Item.
2. The Implementer cannot self-approve, mark ready, or merge.
3. Independent `PASS`, required green CI, and no escalation item are all
   required before an Orchestrator squash merge.
4. Human escalation categories remain explicit and fail closed.
5. Work Packet, Completion Report, and Review Gate templates record Logical
   Role, Actual Model, Reasoning, Thread, and Runtime Model Status, using
   `UNVERIFIED_RUNTIME_MODEL` rather than inference.
6. The Product Design Protocol cannot be mistaken for an active Decision Log or
   implementation authority.
7. Both PR templates expose implementation approach, explicit non-changes,
   Acceptance Criteria mapping, rollback, and review focus.
8. No parallel truth source, runtime change, dependency, migration, or Accepted
   DEC modification is introduced.

## Verification

- `corepack pnpm format:check`
- `corepack pnpm check:docs`
- `corepack pnpm repository:check`
- `git diff --check`
- exact changed-file and conflict-language inspection

## Security and migration impact

No runtime security boundary, credential, data permission, Schema, or migration
changes. The governance change makes high-risk escalation explicit and retains
independent review. It does not add generic security mechanisms or speculative
test matrices.

## Git permissions

- Commit: Yes, after independent `PASS`
- Push: Yes, after independent `PASS`
- Draft Pull Request: Yes, after independent `PASS`
- Mark Pull Request Ready: Orchestrator only after independent `PASS`, required green CI, and confirmation that no escalation category applies
- Merge: Orchestrator only through the accepted bounded autonomous gate

## Documentation updates

Only the allowed governance documents and existing templates are synchronized.
No Roadmap status changes until this Work Item is merged and reviewed under the
normal status-sync discipline.
