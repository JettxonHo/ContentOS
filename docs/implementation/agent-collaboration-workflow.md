# ContentOS Agent Collaboration Workflow

**Status:** Current Truth

**Scope:** Cross-agent planning, implementation handoff, independent review, and Pull Request progression

**Last Updated:** 2026-07-28

This document defines a collaboration workflow for bounded ContentOS Work Items. It separates planning, implementation, and independent review without creating a second product, architecture, or Decision authority.

Related documents: [Roadmap](roadmap.md), [Work Item Template](work-item-template.md), [Milestone Exit Criteria](milestone-exit-criteria.md), [Implementation Report Template](templates/implementation-report-template.md), and [Review Gate Template](templates/review-gate-template.md).

---

## 1. Authority and truth hierarchy

Every participant follows this order:

```text
Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap
→ GitHub Issue
→ Work Packet
→ Agent judgment
```

No Agent, Issue, Work Packet, report, or review may override a higher authority. A Completion Report is evidence for review, not an authority source. A conflict, missing authority, or requested change to product scope, domain semantics, workflow, security, agent responsibility, technical architecture, or release gate requires `HUMAN_DECISION_REQUIRED` and no speculative implementation.

## 2. Roles and separation of duties

The roles are responsibilities, not permanent model, provider, or tool assignments. A Work Packet names an abstract Executor Profile and, when useful, the approved execution configuration for that one task.

| Role                     | Primary responsibility                                                      | May                                                                                                                                                               | Must not                                                                                             |
| ------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Human decision authority | Product, architecture, security, destructive-operation, and merge decisions | Resolve escalations; approve scope or decision changes; decide whether to merge                                                                                   | Delegate a higher-authority decision implicitly to an Agent                                          |
| Planning Agent           | Turn a Ready Work Item into an executable handoff                           | Inspect repository truth; select or refine one Ready Work Item; create an Issue and branch when authorized; issue a Work Packet                                   | Implement the task; bypass a DEC; approve its own implementation                                     |
| Implementation Agent     | Execute one Work Packet                                                     | Modify only allowed files; add required tests; run required verification; return a Completion Report                                                              | Change requirements; create a DEC; expand scope; commit, push, create a PR, merge, or approve itself |
| Independent Review Agent | Check implementation evidence against authority and the Work Packet         | Inspect the real diff and repository state; run independent checks; return a Review Gate result; after `PASS`, perform Git actions only when expressly authorized | Approve from a report alone; ignore failed evidence; merge on behalf of the Human                    |

The current Claude Code entry point is [CLAUDE.md](../../CLAUDE.md). It is an implementation-agent entry point only; [AGENTS.md](../../AGENTS.md) remains the repository-wide executable guidance.

## 3. Executor profiles

Use a durable, task-oriented Executor Profile instead of embedding a provider or model name in governance. Profiles may include:

- `BACKEND_GENERAL_EXECUTOR` for contracts, domain, API, workers, storage, tests, and bounded engineering work;
- `FRONTEND_VISUAL_EXECUTOR` for UI composition, interaction, accessibility, and visual verification;
- `DOCUMENTATION_EXECUTOR` for bounded documentation or governance work; and
- `INFRASTRUCTURE_EXECUTOR` for approved local infrastructure, operational configuration, and recovery verification.

The Planning Agent records the selected profile and any execution configuration in the Work Packet. The Implementation Agent reports the actual runtime configuration in its Completion Report when it can be verified. No profile changes the authority hierarchy, file permissions, required verification, or Git restrictions.

## 4. Standard lifecycle

```text
Phase 1: Planning
    Ready Work Item → Issue / branch when authorized → Work Packet

Phase 2: Implementation
    Work Packet → bounded change → Completion Report

Phase 3: Independent Review
    real diff + repository state + verification → PASS | NEEDS CHANGES | BLOCKED

Phase 4: Pull Request and Merge
    authorized commit / push / PR after PASS → Human review and merge decision
```

### 4.1 Planning

Before issuing a Work Packet, the Planning Agent confirms that the Work Item is Ready under the [Work Item Template](work-item-template.md#17-definition-of-ready), the base branch is current, dependencies are complete, and the task is independently reviewable. It reads only the applicable Accepted DEC and Current-truth documents.

The Planning Agent may create the associated GitHub Issue and a branch from the current base only when repository policy and the task authorize those actions. The Work Packet records the Issue, branch, and exact base commit. If no branch has been authorized, it states that fact instead of inventing one.

### 4.2 Implementation

The Implementation Agent reads `AGENTS.md`, the supplied Work Packet, the listed canonical sources, the associated Issue when present, and relevant existing code or tests. It works only in the Work Packet's allowed files and returns the [Implementation Completion Report](templates/implementation-report-template.md).

One agent owns repository writes during this phase. The Planning and Review Agents may inspect read-only state, but do not make concurrent edits. An implementation that needs a forbidden-file change, a broader dependency update, a destructive operation, or a decision change must stop and escalate rather than work around the boundary.

### 4.3 Independent review and correction

The Review Agent treats the repository as the primary evidence source and the Completion Report as an index. It uses the [Review Gate](templates/review-gate-template.md) to compare the real diff, file scope, tests, failure-path evidence, and Current-truth compliance with the Work Packet.

- `PASS`: the bounded change has sufficient evidence. The Review Agent may commit, push, and create a Pull Request only if that authority is explicitly granted for the Work Item and by repository policy.
- `NEEDS CHANGES`: the Review Agent issues a bounded Correction Packet that names the failed criterion, evidence, permitted files, and required re-verification. The Implementation Agent resumes only for that correction.
- `BLOCKED`: an external failure or authority conflict prevents a safe decision. No approval, commit, push, or PR follows until the blocker is resolved.

The same agent must not both implement the change and independently approve it. A correction remains part of the same Work Item only when it does not change the approved scope.

### 4.4 Pull Request and merge

After an authorized `PASS`, the Review Agent prepares a reviewable commit and Pull Request linked to the Work Item's Issue. The Pull Request includes the Work Item, scope, verification evidence, security and migration impact, documentation updates, limitations, and any accepted exceptions.

The Human retains the merge decision. A merged dependency is synchronized to the current base before a dependent Work Item starts. A Work Item is not `Completed` merely because an implementation report, commit, or Pull Request exists; its status follows the applicable Roadmap and review evidence.

## 5. Branch and repository ownership

- One bounded Work Item maps to one Issue, one active branch, and one reviewable Pull Request unless the Human explicitly approves a different arrangement.
- Implementation occurs off `main`. Do not start a dependent Work Item from an unmerged or stale branch.
- Sequential agents may use the same branch only when they do not write concurrently. Parallel work requires isolated branches or worktrees and explicit integration planning.
- The Work Packet defines whether the initial working tree must be clean, which changes are pre-existing and allowed, and whether destructive operations are authorized.
- Temporary credentials, generated diagnostics, local artifacts, and verification data remain untracked unless the Work Packet explicitly identifies a commit-eligible generated artifact and its regeneration check.

## 6. Information flow and durable records

The normal handoff is intentionally small:

```text
Planning Agent → Work Packet → Implementation Agent
Implementation Agent → Completion Report → Review Agent
Review Agent → Review Gate result or Correction Packet → Implementation Agent / Human
```

Agents inspect the same repository rather than copying code, large diffs, secrets, or terminal transcripts into handoffs. The durable records are the governing documents, Issue, Work Packet, Completion Report, review evidence, commit, and Pull Request. Reports must link or name evidence without exposing Secrets, private content, temporary URLs, or local-only credentials.

## 7. Escalation and failure handling

Stop and return exactly this heading when a Human decision is needed:

```text
HUMAN_DECISION_REQUIRED
```

The escalation records the blocker, concrete evidence, affected authority or Acceptance Criterion, safe progress already completed, and the decision required. Escalate when any of the following applies:

- a new or revised DEC is required;
- an Accepted DEC or Current-truth conflict cannot be reconciled;
- MVP scope, architecture, security boundary, workflow, agent responsibility, or release gate would change;
- the Work Packet requires a destructive operation that has not been specifically authorized;
- a required dependency, credential, provider, or external system prevents verification;
- a required test or failure-path check cannot run safely; or
- satisfying the task requires files, contracts, or dependencies outside the bounded scope.

Do not silently replace a blocked component, weaken an Acceptance Criterion, suppress a failing check, or classify incomplete runtime verification as passed.

## 8. Documentation and status discipline

This workflow does not replace the [Work Item Template](work-item-template.md), GitHub Issue Forms, or Pull Request template. It adds an explicit handoff and independent-review layer around them. Documentation is synchronized only when the Work Item changes a repository fact or approved behavior. Accepted DEC are never edited by this workflow.

When the workflow itself needs a change that affects accepted agent responsibility, security, architecture, or release governance, use the Decision Review path rather than revising this document as an implementation detail.
