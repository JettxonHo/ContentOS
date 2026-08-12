# ContentOS Product Definition

**Status:** Current Truth

**Scope:** Product definition

**Last Updated:** 2026-08-12

This document defines what ContentOS currently is. It integrates the latest Accepted Decisions and does not replace the historical Sessions or the Canonical Decision Register.

---

## 1. Product Identity

ContentOS is a **single-user, desktop-first Personal AI Content Studio**.

It helps one creator transform valuable external information into reviewed, traceable, reusable content assets. The MVP is delivered as a **Private Web Application**.

Codex is an implementation environment used to build ContentOS. Codex is not the ContentOS product interface or runtime product form.

## 2. Product Positioning

ContentOS is a personal content-production workspace in which AI assists research, organization, writing, and platform adaptation while the user retains editorial authority. Visual planning and rendering are post-MVP capabilities.

The product is organized around completing one content project, not around operating Agents, Prompts, models, or workflow infrastructure. Its primary user-facing object is the Content Package.

ContentOS optimizes for one high-quality, reviewable content cycle rather than bulk generation or maximum automation.

## 3. Primary User

The first version serves one:

- Individual content creator; or
- Individual product or operations professional who creates content.

The user regularly works from articles, reports, product material, or other worthwhile sources; wants Blog and Xiaohongshu outputs; and is willing to review, edit, and approve AI-assisted work.

Detailed user needs and responsibilities are defined in [User and Jobs](user-and-jobs.md).

## 4. Core Problem

Turning a valuable source into original multi-platform content requires the user to:

- Preserve and understand the source;
- Separate source claims from analysis;
- Review evidence and uncertainty;
- Add genuine personal judgment when available;
- Create different structures for different platforms;
- Manage edits, versions, approvals, and final files;
- Recover from failures without losing the authoritative state.

When this work is spread across chats and temporary files, context is repeatedly copied, provenance is unclear, human and AI contributions become mixed, and the final version is difficult to identify or recover.

## 5. Core Value Proposition

ContentOS turns:

```text
One Primary Source
+
Optional Supporting Sources
```

into:

```text
One approved and reusable Content Foundation
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
    Blog expression    Xiaohongshu expression
```

The value is not merely generated text. It is a complete text-first content-production process that reduces research, restructuring, and platform-adaptation effort while preserving evidence, human control, editing history, and recoverability.

## 6. Primary Content Flow

```text
Source Capture
→ Normalized Source Version
→ Research Review and Approval
→ Confirmed Human Opinion or Research-based Mode
→ Approved Content Foundation
→ Parallel Blog and Xiaohongshu branches
→ Independent review and approval
→ Manual Blog Markdown and Xiaohongshu text export
```

The formal MVP must finish both text output branches. Publishing remains an external, explicit user action. Design, images, rendering, and rich delivery packages are post-MVP.

## 7. Content Package Product Role

The Content Package is the central product object and represents one complete content project. It connects:

- Sources;
- Research;
- Human Opinion;
- Blog and Xiaohongshu Artifacts;
- optional post-MVP Design Specifications, visual Assets, Rendered Outputs, and rich Export Packages;
- Workflow state, dependencies, provenance, versions, and approvals.

An article, carousel, image, or Export Package is an output or state within a Content Package, not the product's primary organizing unit. The Dashboard and Workspace therefore present Packages and the actions required to complete them rather than exposing infrastructure objects as the main navigation.

## 8. Source, Research, Human Opinion, and Outputs

ContentOS preserves distinct authority boundaries:

```text
Source Content
≠
AI Analysis / Research
≠
Human Opinion
```

- **Source Content** records what an external source states. A source statement is not automatically an independently verified fact.
- **Research** records how AI structures and interprets approved Sources, including evidence, uncertainty, tensions, and open questions.
- **Human Opinion** records only user-authored or explicitly user-confirmed positions, experiences, judgments, and recommendations.
- **Content Foundation** consists of Approved Research plus a Confirmed Human Opinion Version, or an explicit Research-based Mode when opinion is skipped.
- **Output Artifacts** consume exact approved foundation versions and preserve their dependencies and provenance.

AI interpretation is not automatically the user's opinion. Source material, AI analysis, and human contribution must remain identifiable throughout review and export.

## 9. Blog and Xiaohongshu as Independent Expressions

Blog and Xiaohongshu share the same Approved Content Foundation, but they are parallel platform outputs. They are:

- Planned and generated independently;
- Edited in separate structured experiences;
- Saved as separate Working Copies and immutable Versions;
- Validated and approved independently;
- Linked directly to their approved Research and Human Opinion dependencies.

Xiaohongshu is not created by mechanically shortening a Blog, and neither output is the other's canonical source.

The Blog prioritizes coherent long-form explanation and portable Markdown. Xiaohongshu uses a platform-native title hierarchy, carousel narrative, page semantics, Caption, and visual production flow.

## 10. Human-in-the-loop Principle

Human Review and Approval are required product capabilities, not optional enhancements. The user retains control over:

- Research corrections and uncertainty;
- Whether and how personal opinions are represented;
- Blog and Xiaohongshu content;
- Design and visual Asset choices;
- Final Export eligibility;
- Any external publication action.

AI may propose revisions or workflow commands, but it must not silently overwrite Canonical Artifacts, create Approval on the user's behalf, bypass a Blocking Error, or publish automatically.

## 11. Private Web Application Product Form

ContentOS is delivered as a private, persistent Web Application with a desktop-first structured Workspace. The current first-level product areas are:

- Dashboard;
- New Content Package;
- Content Package Workspace;
- Settings.

Dashboard, New Content Package, and Content Package Workspace are the three core work Surfaces. Settings was added and confirmed by later Decisions as a fourth first-level page. The Content Package Workspace remains the primary editing and lifecycle interface; the Chief Editor Panel is an auxiliary collaboration surface inside it.

Mobile support is limited to viewing and lightweight review actions. Full structured editing remains desktop-first.

## 12. Product Boundaries and Differentiation

### Compared with an ordinary Chat

ContentOS preserves visible Package state, structured Artifacts, dependencies, provenance, Working Copies, Versions, Approvals, validation, and history. Chat can explain or propose actions, but Chat history is not the authoritative product state.

### Compared with an automatic publishing tool

ContentOS prepares reviewed portable text files for manual download and publication. It does not connect platform accounts or automatically publish in the MVP. `Exported` and `Published` are distinct states. Rich asset packages are post-MVP.

### Compared with a generic Agent platform

ContentOS implements one bounded content-production workflow with controlled Agent responsibilities and deterministic workflow rules. It is not a Workflow Builder, Agent Marketplace, Plugin Platform, unrestricted tool-running environment, or self-modifying Agent system.

## 13. Product Principles

1. **Content re-creation over generic generation.** AI helps transform information into personally valuable content assets.
2. **Authority boundaries remain visible.** Source, AI Analysis, and Human Opinion are never silently merged.
3. **Content Package is the product center.** Outputs and technical operations support a Package.
4. **Platform outputs remain independent.** Shared evidence does not imply shared editable copy.
5. **Human judgment controls formal state.** AI does not approve or publish.
6. **Workspace state is authoritative.** Chat initiates Proposals and Commands; structured editors remain canonical.
7. **Important content is reviewable and recoverable.** Versions, Approval, dependencies, provenance, and outdated state are core behavior.
8. **Post-MVP visual work stays separate.** When introduced, structured Design Specification and registered components drive deterministic output without changing approved text.
9. **Quality is more important than volume.** The MVP validates one complete dual-output loop.
10. **Scope stays bounded.** The MVP does not pre-build a generic content, Agent, workflow, publishing, or design platform.

## 14. Product Success Dimensions

Initial product value is evaluated through five dimensions:

- **Task Completion:** the user reaches approved Blog Markdown and approved Xiaohongshu text exports from Sources.
- **Content Trust:** the user can understand Sources, evidence, human contribution, Versions, dependencies, and outdated state.
- **Editing Value:** AI meaningfully reduces research, writing, restructuring, and platform-adaptation effort without taking editorial control.
- **Reuse Value:** the same Content Foundation supports consistent but platform-native Blog and Xiaohongshu expressions.
- **Reliability:** state, history, approvals, and legal next actions remain correct through failures, retries, refreshes, and upstream changes.

Growth, engagement, and revenue are not the primary first-round MVP success criteria.

## 15. Decision Traceability

| Current-truth area                           | Accepted Decisions                                                   | Primary historical sources                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content re-creation and authority boundaries | DEC-001–DEC-002, DEC-067–DEC-075                                     | [Session-001](../sessions/session-001.md), [Session-012](../sessions/session-012.md)                                                                                       |
| Content Package and independent dual outputs | DEC-003, DEC-005, DEC-008, DEC-028, DEC-037, DEC-086, DEC-269        | [Session-002](../sessions/session-002.md), [Session-008](../sessions/session-008.md), [Session-014](../sessions/session-014.md), [Session-024](../sessions/session-024.md) |
| Product form and user                        | DEC-013–DEC-019, DEC-267, DEC-273                                    | [Session-004](../sessions/session-004.md), [Session-005](../sessions/session-005.md), [Session-018](../sessions/session-018.md), [Session-024](../sessions/session-024.md) |
| Human control and manual Export              | DEC-012, DEC-025, DEC-041, DEC-145, DEC-150–DEC-157, DEC-270–DEC-272 | [Session-008](../sessions/session-008.md), [Session-018](../sessions/session-018.md), [Session-024](../sessions/session-024.md)                                            |
| MVP boundary and success                     | DEC-004, DEC-036, DEC-038–DEC-042, DEC-269–DEC-275, DEC-293–DEC-295  | [Session-008](../sessions/session-008.md), [Session-024](../sessions/session-024.md), user confirmation 2026-08-12                                                         |

The authoritative status and wording of all Decisions is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
