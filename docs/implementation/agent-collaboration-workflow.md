# ContentOS Agent Collaboration Workflow

**Status:** Current Truth
**Scope:** Proportional planning, implementation, independent review, and merge
**Last Updated:** 2026-08-12

This workflow keeps changes bounded without turning coordination into the product. The repository and Pull Request are the primary evidence; handoff documents exist only when they reduce risk or context.

Related documents: [Work Item Template](work-item-template.md), [Roadmap](roadmap.md), and [Milestone Exit Criteria](milestone-exit-criteria.md).

---

## 1. Authority

```text
Later Accepted DEC
→ Current-truth specification
→ AGENTS.md
→ Work Item / Issue
→ implementation and tests
```

Roadmap status, reports, and agent judgment cannot override higher authority. An actual change to product scope, domain semantics, workflow, security policy, agent responsibility, technical architecture, or release gates requires the appropriate human/Decision path.

## 2. Default fast path

Use this path for ordinary reversible engineering and documentation:

```text
Issue or concise Work Item
→ implementation on one branch
→ affected checks
→ one independent review of the real diff
→ required CI
→ squash merge
```

Under the procedural amendment in DEC-295, the same agent may refine the task and implement an ordinary reversible Work Item. It must not independently approve its own change. A separate Planning Agent, Work Packet, planning-only Pull Request, explicit handoff ceremony, second reviewer, or postmerge reconciliation is not required for that fast path.

The Issue or Pull Request records scope, Acceptance Criteria, verification, and relevant security/migration impact once. Do not synchronize identical prose across Roadmap, Issue, Packet, and report.

## 3. Controlled path triggers

Use separated planning/implementation and an explicit Work Packet only for:

- milestone exit or immutable Acceptance Record;
- irreversible migration or destructive data action;
- production deployment, paid/external action, or material cost;
- new/high-risk Authentication, Authorization, Secret, public sharing, active rendering, deletion/restore, Provider/tool capability, or production security boundary;
- a change requiring a new DEC or human product decision; or
- genuinely parallel ownership that cannot be expressed as one bounded branch.

Dual independent review is reserved for milestone/acceptance decisions or an explicitly high-risk boundary. Other changes use one independent reviewer.

## 4. Roles

| Role                     | Responsibility                                                     | Key restriction                                       |
| ------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------- |
| Human decision authority | Product, irreversible, production, and accepted-boundary decisions | Authority is never inferred from silence              |
| Implementer              | Plan/refine and implement one bounded Work Item                    | Cannot self-approve or broaden scope                  |
| Independent reviewer     | Review the real diff, affected evidence, and authority             | Does not edit while acting as reviewer                |
| Orchestrator             | Enforce ordering, CI, and merge conditions                         | Does not invent extra gates absent from the Work Item |

Model/provider/thread metadata is operational, not product evidence. Record it only when routing was explicitly required or runtime identity matters to the task. `UNVERIFIED_RUNTIME_MODEL` does not need to be copied into every document.

## 5. Review and correction

A review returns:

- **PASS:** the change improves the repository and has sufficient affected-layer evidence;
- **NEEDS CHANGES:** bounded corrections remain on the same Work Item/branch;
- **BLOCKED:** an external dependency or authority decision prevents progress.

Ordinary formatting, wording, test, CI, or tool failures may be diagnosed and corrected once the failure is understood, then the smallest affected check is rerun. Do not create a new numbered Work Item or fresh publication branch merely to preserve an unmerged failure report.

Strict freeze/no-rerun behavior is appropriate only when explicitly protecting:

- destructive or production actions;
- migrations whose first attempt changes state;
- paid/external side effects;
- immutable acceptance/release evidence; or
- a security investigation whose evidence would be destroyed by retry.

## 6. Verification and evidence

Use summaries, not command choreography:

- name commands that ran and their result;
- retain detailed logs in CI/artifacts when useful;
- review the actual diff and current repository state;
- do not copy raw private data, credentials, URLs, or terminal transcripts into docs;
- do not require exact file cardinality when an allowed-path review proves scope;
- do not require byte-for-byte Markdown reconstruction, tool-return serialization, or per-command status files for reversible documentation.

Documentation-only Pull Requests use targeted formatting, repository checks, and diff hygiene. Integration/Browser CI is affected-path only unless the docs change commands, harness behavior, runtime configuration, Accepted Decisions, agent/release governance, or formal acceptance/release evidence. The CI path classifier treats those sensitive paths as full-CI changes; prose cannot waive them.

## 7. Branch and ownership

- One Work Item normally uses one Issue, branch, and Pull Request.
- Work off current `main`; rebase or recreate only when the base materially affects the change.
- One writer owns a worktree at a time. Parallel work uses isolated worktrees and explicit file ownership.
- Preserve unrelated user changes. Do not clean, reset, or overwrite them.
- Temporary diagnostics and credentials remain untracked and are removed only when ownership and scope are clear.

A dependent task may begin from a reviewed merged base. It does not need a separate docs reconciliation PR solely to restate the merge.

## 8. Escalation

Return `HUMAN_DECISION_REQUIRED` only when an actual human decision is needed, such as:

- new/revised DEC or conflicting accepted authority;
- materially different product approaches;
- new production, destructive, irreversible, or high-risk security action;
- permission, credential, provider, or external dependency unavailable;
- required verification cannot run safely; or
- progress requires lowering an accepted criterion.

Do not escalate reversible implementation choices, formatting, ordinary failures, or missing optional metadata.

## 9. Status and documentation

Roadmap contains milestone dependency order and current status, not a chronological execution log. Work Packets and Git history preserve task history. Update Current-truth only when behavior or accepted policy changes.

A Work Item is not complete because a report, commit, or PR exists. It is complete when its Acceptance Criteria, affected checks, independent review, and required merge gate are satisfied. A milestone exit additionally requires its Acceptance Record.

## 10. Decision traceability

This workflow preserves the responsibilities accepted by DEC-287–DEC-292 while choosing the least ceremonial path that still provides bounded scope, independent review, and honest evidence. M2-GOV-004's autonomous gate does not require every ordinary change to use the controlled path.
