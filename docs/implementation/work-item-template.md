# ContentOS Work Item Template

**Status:** Current Truth
**Scope:** Minimum task contract, proportional readiness, verification, and completion
**Last Updated:** 2026-08-12

A Work Item is the smallest independently reviewable objective. It may live directly in a GitHub Issue. Create a separate Work Packet only when the task needs a cross-agent handoff, a milestone/acceptance record, an irreversible operation, or a high-risk security/architecture change.

Related documents: [Roadmap](roadmap.md), [Milestone Exit Criteria](milestone-exit-criteria.md), [Canonical Decision Register](../decisions/decisions.md), and [Agent Collaboration Workflow](agent-collaboration-workflow.md).

---

## 1. Minimum Work Item

Every Work Item contains only these required fields:

```markdown
Task ID / title:
Goal:
In Scope:
Out of Scope:
Relevant DEC / specifications:
Contracts:
Allowed files or modules:
Acceptance Criteria:
Verification:
Documentation updates:
```

`Contracts` names each applicable Domain, API, Schema, Queue/Event, Configuration, Error, migration, and security boundary, or states that the Work Item changes no contract. Add dependencies when the task has them. Add a risk note only when the task changes a credible security, migration, production, cost, or irreversible boundary. Owner, reviewer, model, thread, branch, and exact commit metadata belong in the Issue or Pull Request when useful; they are not product requirements.

The Goal states one user or system outcome. Scope names the smallest complete change, not every implementation step. Allowed files prevent accidental spread, but an obvious adjacent test or generated artifact may be added with an explicit explanation instead of opening a new Work Item.

## 2. Conditional supplements

Include a supplement only when its trigger is present:

| Trigger                                                                                                                                         | Required supplement                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Public contract, schema, queue payload, or configuration changes                                                                                | Contract/version/compatibility and migration notes                                  |
| Authentication, Authorization, external input/network, Secret, private storage, active rendering, deletion/restore, or production configuration | Focused security impact and tests                                                   |
| Database change                                                                                                                                 | Migration, compatibility, rollback, and relevant real-database test                 |
| User-visible workflow                                                                                                                           | Demo or targeted Browser evidence                                                   |
| Queue/process/recovery change                                                                                                                   | Relevant Integration/recovery scenario                                              |
| Model/Agent capability exists and changes                                                                                                       | Fake Provider/Eval/Prompt/Capability evidence appropriate to that milestone         |
| Production or irreversible external action                                                                                                      | Explicit human authorization, preflight, rollback, and stop conditions              |
| Milestone exit or immutable Acceptance Record                                                                                                   | Reviewed commit, affected exit evidence, decision, limitations, reviewer, timestamp |

For an unaffected category, write one short statement such as `No migration` or `No new security boundary`. Do not copy a whole checklist.

## 3. Security triage

Use the smallest applicable tier:

- **S0 — No new boundary:** documentation, formatting, internal refactor, or deterministic logic that neither consumes new untrusted data nor changes access. Existing tests are sufficient; no separate security review.
- **S1 — Existing boundary changed:** owner checks, URL/input validation, Secret use, storage access, logging, Queue authority, or rendering behavior changes. Name the credible attack path and add focused regression evidence.
- **S2 — New/high-risk boundary:** new Authentication/Authorization model, production Secret flow, destructive deletion/restore, public sharing, active content execution, provider/tool capability, irreversible migration, or production operation. Require explicit security review and human decision where the authority hierarchy requires it.

Security review does not reward more controls. It asks whether the accepted boundary is preserved with the least additional mechanism. Do not add hashes, probes, diagnostic channels, fixtures, or fallback rules without a concrete risk or accepted contract.

## 4. Verification selection

Select tests by affected layer:

- documentation: targeted formatting, repository checks, `git diff --check`;
- deterministic code: targeted unit/validator tests and root static checks;
- database/API: affected repository/migration/API integration tests;
- Queue/process/recovery: affected Integration or recovery scenario;
- visible workflow: affected Browser scenario;
- formal release/exit: only the milestone's still-relevant exit evidence.

Do not require every layer for every task. A green unaffected suite may be referenced from CI; it need not be replayed locally. A test failure may be diagnosed, fixed, and rerun on the same branch. Freeze/no-rerun rules are reserved for explicitly immutable, destructive, production, migration, or acceptance-evidence runs.

## 5. Definition of Ready

A Work Item is Ready when:

- the outcome and bounded scope are clear;
- dependencies and applicable contracts are known;
- Acceptance Criteria are testable;
- affected verification layers are named;
- any real security/migration/production impact is identified; and
- no unresolved decision changes product scope, architecture, workflow, security policy, agent responsibility, or release gates.

Readiness does **not** require a planning-only Pull Request, a clean-room worktree protocol, literal command argv, exact file-count predicates, serialized tool results, dual reviewers, or exhaustive `not applicable` prose.

## 6. Definition of Done

A Work Item is Done when:

- the implementation and Acceptance Criteria are complete;
- affected checks pass;
- relevant failure handling and compatibility are covered;
- no unrelated edits or Secrets are present;
- changed current-truth documentation is synchronized; and
- one independent reviewer approves the real diff.

A milestone exit additionally requires its Acceptance Record. Ordinary Work Items do not need postmerge reconciliation documents.

## 7. Correction and failure policy

Keep corrections in the same Work Item and branch when scope is unchanged. Formatting, evidence wording, a review finding, a deterministic test failure, or a tool invocation error does not require a new numbered recovery item.

Create a successor Work Item only when:

- scope or authority changes;
- a merged immutable record needs a new decision;
- a destructive/production attempt is frozen by design; or
- the current branch cannot safely preserve evidence.

Record failures honestly, but prefer one concise diagnosis and correction over recursive governance about the failure-reporting mechanism.

## 8. Completion report

The Pull Request description or final handoff contains:

```markdown
## Outcome

## Files changed

## Verification

## Security / migration impact

## Limitations or incomplete items

## Git status
```

Add design choices only when they are not obvious from the diff. Link to durable evidence; do not paste raw logs, full transcripts, or duplicate the Work Item.

## 9. Anti-patterns

Do not create:

- a planning PR required before every implementation PR;
- a Work Packet longer than the implementation it governs;
- a new recovery item for formatting, wording, or ordinary CI/tool correction;
- literal command-by-command evidence ledgers for reversible work;
- exact-N file-shape protocols when an allowlist and diff review suffice;
- duplicate status in Roadmap, Issue, Packet, completion report, and reconciliation report;
- speculative security controls for capabilities not yet implemented;
- full Integration/Browser runs for unrelated docs-only changes; or
- a new DEC for a reversible implementation detail.

## 10. Decision traceability

This template implements DEC-287–DEC-292: bounded Work Items, explicit applicable Contracts, reviewable Pull Requests, concise agent guidance, separated truth sources, Definition of Ready/Done, and explicit scope-change governance. DEC-295 defines the current text-first MVP completion boundary and authorizes the proportional collaboration/affected-path rules for `GOAL-MVP-TEXT-001` while preserving dual output, human Approval, traceability, independent review, and affected failure gates.
