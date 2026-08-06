# Product Design and Decision Protocol

**Version:** 1.1

**Status:** Historical exploration guidance — not an implementation authority

## 1. Purpose and authority

This document preserves a lightweight vocabulary for exploratory product and
architecture discussions. It is not a second governance path and must not be
used to create a parallel RFC register, Decision Log, Decision Record series,
Current-truth hierarchy, or implementation status source.

For current work, use:

- [AGENTS.md](../../AGENTS.md) for repository-wide executable guidance;
- the [Canonical Decision Register](../decisions/decisions.md) for accepted
  decisions and lifecycle navigation;
- the [Decision Review Template](../implementation/templates/decision-review-template.md)
  when a bounded Human decision is required;
- the [Agent Collaboration Workflow](../implementation/agent-collaboration-workflow.md)
  for planning, implementation, independent review, and PR progression; and
- the [Roadmap](../implementation/roadmap.md) and the applicable Work Packet for
  implementation status and scope.

The authority order remains:

```text
Current explicit user instruction
→ Later Accepted DEC
→ Current-truth Specification
→ AGENTS.md
→ Roadmap / Issue / Work Packet
→ Agent judgment
```

## 2. Useful exploration distinctions

During a design discussion, distinguish:

- fact;
- assumption;
- observation;
- proposal;
- alternative;
- risk; and
- open question.

A proposal is not an accepted decision. A historical Session preserves context
but does not override a later Accepted DEC or Current-truth Specification.

When alternatives materially affect product direction, MVP scope, domain or
workflow semantics, security or privacy boundaries, Agent responsibility,
technical architecture, public protocols, or release gates, stop implementation
and use the current Decision Review path. Human authority accepts, rejects,
revises, or defers the proposal.

## 3. Legacy terminology

Earlier ContentOS discussions used the terms **RFC**, **Decision Log**, and
**Decision Record**. Those terms in historical material describe proposals and
records from that period only:

- a legacy RFC maps to a proposal or current Decision Review;
- a legacy Decision Log maps to the Canonical Decision Register; and
- a legacy Decision Record maps to an indexed DEC or an accepted bounded
  Decision Review, as applicable.

Do not create new files or status systems under those legacy names. Accepted
DEC are never rewritten by this protocol; Current-truth documents are updated
only through the repository's present governance.

## 4. Reusable exploration prompt

```text
Identify the topic, context, goal, non-goals, accepted constraints, and the
decision that is actually required. Separate facts, assumptions, proposals,
alternatives, risks, and open questions. Compare only meaningful alternatives.
Do not treat a recommendation as approval or expand MVP scope. If the choice
changes an accepted boundary, produce a bounded Decision Review and wait for
Human authority before implementation. After approval, update only the
existing canonical register, Current-truth, Roadmap, Issue, and Work Packet
that the change actually affects.
```
