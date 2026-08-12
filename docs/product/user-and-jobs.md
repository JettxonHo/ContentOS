# ContentOS User and Jobs

**Status:** Current Truth

**Scope:** Primary user, jobs, responsibilities, and initial success signals

**Last Updated:** 2026-08-12

This document defines who the first ContentOS release serves and what that user must be able to accomplish. It does not introduce demographic assumptions, market claims, pricing assumptions, or unverified Persona stories.

---

## 1. Primary User

The first ContentOS release serves one user at a time:

- A single content creator; or
- A single product or operations professional who creates content.

The product is not initially designed for a team, organization, editorial department, or public self-service user base.

## 2. User Characteristics

The primary user:

- Regularly reads articles, reports, product information, and industry material;
- Identifies individual sources worth understanding and discussing;
- Wants to create both Blog and Xiaohongshu content;
- Wants AI to reduce research, writing, restructuring, and layout effort;
- Needs to know which Sources and evidence support the content;
- Wants AI analysis separated from their own actual judgment;
- Is willing to review, correct, edit, and approve important work;
- Does not want AI to publish automatically on their behalf;
- Expects content history and workflow state to remain traceable and recoverable.

No current Accepted Decision defines the user's age, location, income, organization size, technical proficiency, willingness to pay, or other demographic attributes.

## 3. Primary Job to Be Done

> Starting from one source worth discussing, create an evidence-backed Content Package with genuine personal opinion when available, expressed independently as an approved Blog and an approved Xiaohongshu output.

For the Creator-led path, genuine user-confirmed opinion is part of the job. When the user chooses the valid Research-based path, the system produces research-based content without inventing a first-person position or experience.

The job is complete only when both output branches have been reviewed and exported for manual use; producing draft text alone is not completion.

## 4. Supporting Jobs

The user also needs to:

- Capture a Primary Source and a small number of Supporting Sources;
- Preserve the original material and identify capture failures;
- Review AI-organized Research at an evidence-aware item level;
- Correct, exclude, or mark uncertain Research items;
- Respond to focused questions that help surface a real position or experience;
- Confirm, correct, or reject AI interpretations of their responses;
- Choose Research-based Mode when no meaningful personal contribution is available;
- Review and edit long-form Blog content;
- Review platform title, cover copy, pages, Caption, CTA, and Hashtags separately for Xiaohongshu;
- Review the visual plan and final carousel output;
- Compare AI Revision Proposals before applying them;
- Understand which Version is current, approved, historical, stale, or outdated;
- Download portable Export Packages and publish them manually outside ContentOS;
- Resume work after interruption or failure without reconstructing context from Chat.

## 5. Current User Pain Points

The current workflow often requires the user to:

- Repeatedly paste the same context into separate AI conversations;
- Manually distinguish source statements, model interpretation, and personal opinion;
- Guess which evidence an AI-generated claim relied on;
- Rebuild a personal point of view after Research has already been summarized elsewhere;
- Mechanically shorten a Blog into Xiaohongshu content even though the platforms need different structures;
- Maintain multiple draft files without a clear authoritative Version;
- Reconcile AI changes with manual edits;
- Plan and lay out every carousel page manually;
- Search across temporary files for the final publishable package;
- Recover work after refreshes, retries, provider failures, or duplicate actions.

## 6. Desired User Outcomes

The user should be able to:

- Understand a worthwhile source with less repetitive research work;
- See which statements are source-backed, uncertain, AI-derived, or user-confirmed;
- Express a real position without AI fabricating personal authority;
- Reuse one approved Content Foundation across two platform-native outputs;
- Edit each output without losing history or silently changing the other branch;
- Know the current stage, required action, and reason for any block;
- Approve an exact immutable Version with visible validation and dependencies;
- Recover or restore prior work without destructive overwrites;
- Export complete files that can be inspected and published manually.

## 7. End-to-end User Journey

1. **Create a Content Package.** The user provides one Primary Source and may add Supporting Sources.
2. **Review Source capture.** The user confirms the normalized Source or uses a supported fallback when capture fails.
3. **Review Research.** The user accepts, corrects, excludes, or marks important items as needing verification, then approves an immutable Research Version.
4. **Choose the contribution mode.** The user provides and confirms Human Opinion for Creator-led Mode, or explicitly continues in Research-based Mode.
5. **Form the Content Foundation.** ContentOS binds the approved Research and the applicable Human Opinion Version or mode.
6. **Work through parallel output branches.** Blog and Xiaohongshu are independently planned, generated, edited, validated, versioned, and approved.
7. **Export both text outputs.** The user downloads approved Blog Markdown and approved Xiaohongshu text/carousel files.
8. **Optionally continue into post-MVP visuals.** Design, Assets, and rendered carousel review are not required for first-MVP completion.
9. **Publish manually.** Publication happens outside ContentOS; Export does not imply Published.

At every stage, the Workspace—not Chat history—shows the authoritative Artifact and workflow state.

## 8. Creator-led Mode

Creator-led Mode is used when at least one relevant Human Opinion Statement has been explicitly confirmed by the user.

The flow preserves:

```text
Raw User Response
→ AI Interpretation
→ User Confirmation
→ Confirmed Opinion Statement
→ Optional confirmed Editorial Expression
```

Creator-led outputs may use confirmed first-person positions, experiences, judgments, and recommendations. Every such use must be traceable to a Confirmed Human Opinion response. AI may improve wording but must not invent, intensify, or silently alter the user's position.

## 9. Research-based Mode

The user may skip Human Opinion or state that no meaningful personal contribution is available. This is a valid workflow path, not an error.

Research-based outputs may synthesize, compare, explain, and structure Approved Research. They must not fabricate:

- First-person beliefs;
- Personal experience;
- Team experience;
- Creator-specific judgment;
- False shared experience.

The interface must make the absence of confirmed Human Opinion visible so the user understands that the output is research-based rather than Creator-led.

## 10. Human Review Responsibilities

The user is responsible for:

- Reviewing Source capture and material accuracy where needed;
- Reviewing Research claims, evidence, corrections, exclusions, and uncertainty;
- Confirming that an AI Interpretation accurately represents any Human Opinion;
- Deciding whether first-person content is authorized;
- Reviewing Blog and Xiaohongshu Artifacts separately;
- Reviewing required attribution and visible validation warnings;
- Approving exact immutable Versions at defined Human Gates;
- Reviewing Design, visual Assets, and final render eligibility;
- Deciding whether and where to publish exported content.

Approval does not mean that every uncertainty has disappeared. It means the user reviewed the represented uncertainty and approved the exact Version under the applicable validation rules. Blocking Errors cannot be overridden through a normal approval action.

## 11. Trust Expectations

The user must be able to determine:

- Which Sources are used and which Source Version is authoritative;
- What the Source actually states;
- How AI Research interpreted and organized it;
- Which statements are accepted, corrected, excluded, or uncertain;
- Which opinions or experiences were explicitly confirmed by the user;
- Which Research and Human Opinion Versions an output depends on;
- Which Version was approved and exported;
- Whether a downstream Artifact became stale or outdated;
- Which dependencies and files are contained in an Export Package.

ContentOS provides traceability and Originality Provenance. It does not claim to determine copyright ownership, legal originality, plagiarism status, or platform originality certification.

## 12. Editing and Reuse Value

### Editing value

AI assistance is valuable when it reduces starting-from-zero work while preserving user control. The user should be able to:

- Edit a Mutable Working Copy with autosave;
- Compare an AI Revision Proposal with the current content;
- Apply all or selected changes;
- Preserve immutable checkpoints;
- Review validation and provenance in context;
- Restore a historical Version as a new Working Copy;
- Avoid silent overwrite and avoid a new Version for every keystroke.

If the user repeatedly has to discard and fully rewrite generated work, the system is not delivering sufficient editing value.

### Reuse value

The same Approved Content Foundation should produce factually and editorially consistent Blog and Xiaohongshu outputs without forcing identical structure or wording. A change in one output branch must not silently rewrite the other branch. An upstream change should preserve history and make affected downstream Artifacts visibly outdated until reviewed or regenerated.

## 13. Initial Success Signals

Initial validation centers on:

- **Task Completion:** completion of the full Source-to-dual-Export path;
- **Content Trust:** clear understanding of Source, Research, Human Opinion, Versions, dependencies, and provenance;
- **Editing Value:** reduced research, restructuring, rewriting, platform adaptation, and layout effort;
- **Reuse Value:** useful independent Blog and Xiaohongshu expressions from one Content Foundation;
- **Reliability:** correct recovery, history, workflow state, Approval, and Export behavior under interruption and failure.

Observable signals may include Package completion, time to both Exports, Research corrections, Human Opinion skip rate, edit distance, revision requests, first-attempt generation success, render failure, recovery outcomes, and whether the user creates another Package.

Numeric targets are **Not defined by current Accepted Decisions**. These signals must not automatically retrain the system or modify Prompts, Agent Specs, or routing policy.

## 14. Non-primary Users

The first release is not designed primarily for:

- Multi-user editorial teams;
- Organizations requiring roles, permissions, and collaborative workflows;
- Agencies producing bulk content for many clients;
- Public visitors or anonymous creators;
- Users seeking automatic publishing or scheduling;
- Users seeking a general chatbot, Workflow Builder, design canvas, or Agent platform;
- Users whose core workflow depends on unsupported media or enterprise integrations.

These exclusions do not make claims about future markets; they only bound the current MVP.

## 15. Decision Traceability

| User or job area                             | Accepted Decisions                                                           | Primary historical sources                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary user and product form                | DEC-014, DEC-019, DEC-267, DEC-273                                           | [Session-004](../sessions/session-004.md), [Session-005](../sessions/session-005.md), [Session-024](../sessions/session-024.md)                                                                          |
| Primary job and dual-output value            | DEC-001, DEC-003–DEC-005, DEC-008, DEC-036–DEC-037, DEC-269, DEC-293–DEC-295 | [Session-001](../sessions/session-001.md), [Session-002](../sessions/session-002.md), [Session-008](../sessions/session-008.md), [Session-024](../sessions/session-024.md), user confirmation 2026-08-12 |
| Human Opinion modes and first-person rules   | DEC-067–DEC-075, DEC-093                                                     | [Session-012](../sessions/session-012.md), [Session-014](../sessions/session-014.md)                                                                                                                     |
| Independent platform work                    | DEC-086–DEC-097, DEC-147                                                     | [Session-014](../sessions/session-014.md), [Session-018](../sessions/session-018.md)                                                                                                                     |
| Review, editing, trust, and history          | DEC-145, DEC-150–DEC-155, DEC-271–DEC-272                                    | [Session-018](../sessions/session-018.md), [Session-024](../sessions/session-024.md)                                                                                                                     |
| Non-primary users and excluded product types | DEC-040–DEC-042, DEC-267, DEC-270, DEC-274                                   | [Session-008](../sessions/session-008.md), [Session-024](../sessions/session-024.md)                                                                                                                     |

The authoritative status and wording of all Decisions is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
