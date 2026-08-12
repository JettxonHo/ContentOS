# ContentOS Decisions — Text-first MVP Rebaseline

## DEC-295

### Status

Accepted

### Title

正式最小 MVP 收敛为 Text-first 私有双输出闭环

### Decision

The first formal MVP ends when one user can complete this private, reviewable flow:

```text
Approved Sources
→ reviewed Research
→ optional confirmed Human Opinion or explicit Research-based Mode
→ independently generated and approved Blog Markdown
+ independently generated and approved Xiaohongshu text/carousel content
→ manual text export
```

The MVP keeps authenticated owner scope, Source evidence, Working Copies, immutable Versions, exact Approval, dependencies, Provenance, visible failures, and manual publishing.

The following are post-MVP capabilities and do not block the text-first MVP:

- Design Specification, Visual Agent, image generation, Asset workflow, and PNG Renderer;
- packaged asset manifests, file-integrity hashes, and automated import/publishing adapters;
- broad backup/restore, production deployment, high availability, and release hardening unrelated to the active private text workflow; and
- generic Agent platform, Marketplace, public sharing, Analytics, and multi-user capabilities.

M3 delivers Research. M4 delivers minimum Human Opinion and Blog. M5 delivers Xiaohongshu text, manual text export, and the complete text-first MVP acceptance. M6 and later visual, production, and broader hardening work remain valid post-MVP roadmap candidates.

This Decision supersedes the first-MVP completion portions of DEC-261, DEC-276, DEC-283, DEC-285, DEC-286, and DEC-293. It preserves DEC-269's independent Blog/Xiaohongshu outputs, DEC-270's manual-publishing boundary, DEC-271's human gates, and DEC-272's traceability model.

For `GOAL-MVP-TEXT-001`, this Decision also amends the procedural application of DEC-287–DEC-292 without removing their core controls:

- every Work Item still names its applicable Contracts, bounded files/modules, testable Acceptance Criteria, verification, and documentation impact;
- an ordinary reversible Work Item may be refined and implemented by the same agent, but that agent cannot independently approve its own diff;
- milestone exits, immutable Acceptance Records, irreversible operations, production actions, and high-risk security or architecture changes retain separated planning/implementation and the controlled review path; and
- CI may skip Integration/Browser for a documentation-only Pull Request only when it does not change commands, harness behavior, runtime configuration, Accepted Decisions, agent/release governance, or formal acceptance/release evidence. Those sensitive documentation paths remain on the full CI path.

### Reason

ContentOS must validate its core product value quickly: turning trusted Sources and user judgment into two useful, independently reviewable content assets. Requiring visual production, PNG rendering, exhaustive recovery drills, and production operations before this learning delays product feedback without proving additional text-workflow value.

### Impact

- The formal MVP completes at M5 rather than M8.
- The MVP export may be simple portable Markdown/JSON text; no image or ZIP package is required.
- Security and tests remain capability-triggered. Authentication, owner isolation, untrusted-input handling, SSRF protection, private storage, Secret redaction, Approval, and affected workflow recovery remain Blocking.
- Agent implementation proceeds through one thin vertical slice at a time under the approved execution Goal.
- DEC-287's Contracts requirement, independent review, explicit scope-change governance, and full CI for sensitive governance/evidence changes remain mandatory under the proportional workflow.
- Visual/Renderer/production decisions remain historical and applicable when those post-MVP capabilities begin; they are not erased or retroactively declared implemented.
