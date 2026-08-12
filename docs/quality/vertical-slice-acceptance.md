# ContentOS Vertical Slice Acceptance

**Status:** Current Truth
**Scope:** Formal text-first MVP end-to-end acceptance behavior and evidence
**Last Updated:** 2026-08-12

This specification defines the smallest complete behavior that proves the DEC-295 MVP. It tests the user-visible product and authoritative state together; it does not require post-MVP visual production or production deployment.

Related documents: [Product Definition](../product/product-definition.md), [MVP Scope](../product/mvp-scope.md), [Workflow Overview](../architecture/workflow-overview.md), [Agent Runtime](../architecture/agent-runtime.md), [Test Strategy](test-strategy.md), and [Security Baseline](../security/security-baseline.md).

---

## 1. Acceptance path

```text
Create Content Package
→ add and approve Sources
→ generate, review, and approve Research
→ confirm Human Opinion or explicitly choose Research-based Mode
→ generate, edit, validate, and approve Blog Markdown
→ independently generate, edit, validate, and approve Xiaohongshu text
→ manually export both approved text outputs
```

A page, Queue Job, model response, Draft, or one output alone is not completion.

## 2. Required final results

Acceptance requires:

- an exact Approved Research Version;
- a Confirmed Human Opinion Version or recorded Research-based Mode;
- an Approved Blog Version and portable `article.md`;
- an independently generated Approved Xiaohongshu Version and portable Markdown/JSON text export;
- exact dependencies and Provenance connecting outputs to their Content Foundation; and
- no unresolved Blocking Defect in the active flow.

Design Version, Assets, Final Render, PNG files, ZIP package, production deployment, backup/restore, and automatic publishing are not required.

## 3. Source acceptance

Verify supported Public URL, Pasted Text, `.md`, and `.txt` input; one Primary and zero to five Supporting Sources; visible capture failure; manual fallback; review; and exact Source Version Approval.

URL capture preserves raw/original evidence, normalized reviewable content, origin metadata, SSRF/resource boundaries, and safe display. Failure never fabricates success.

## 4. Research acceptance

Research consumes only exact Approved Source Versions. It exposes Summary, Facts/Claims, Evidence or locators, Open Questions, and Needs Verification items.

The user can correct, exclude, or mark items uncertain, checkpoint an immutable Version, and approve an exact eligible Version. Unsupported claims remain blocked or visibly uncertain. Raw Provider output never becomes approved Research automatically.

## 5. Human Opinion acceptance

Creator-led Mode preserves:

```text
Raw Response → AI Interpretation → User confirmation/correction → Confirmed Opinion
```

Only confirmed Opinion supports first-person content.

The user may explicitly choose Research-based Mode. It does not fabricate experience, belief, team activity, recommendation, or personal judgment. A free-form interview system is not required.

## 6. Blog acceptance

Verify:

- independently generated Blog Draft from the Approved Content Foundation;
- title, summary, Markdown body, public References, internal Provenance, and Content Mode;
- direct Markdown edit and preview;
- Working Copy and immutable checkpoint Version;
- deterministic validation and exact Version Approval; and
- manual `article.md` export from the Approved Version.

AI output cannot silently overwrite the Working Copy or create Approval. Rich Blocks, selective-apply Diff, asset package, manifest, and automated publishing are outside this acceptance.

## 7. Xiaohongshu text acceptance

Verify:

- independent generation rather than Blog shortening;
- Platform Title candidates/selection and separate Cover Title;
- ordered 6–10 text pages with the default 8-page path;
- stable page identity, Page Purpose, heading/body, emphasis, and Provenance;
- Caption, CTA, Hashtags, and public References;
- direct field editing and page reordering;
- Working Copy, immutable checkpoint Version, validation, and exact Approval; and
- portable Markdown/JSON text export.

Visual component choice, Design Specification, image generation, Asset review, PNG Render, clipping/pixel checks, and carousel image export are post-MVP.

## 8. Workflow and failure acceptance

Judge failures by final Domain/Workflow state, not by process output alone. Cover the credible active-flow paths:

- URL capture failure and supported fallback;
- malformed Provider output or Provider/task timeout;
- duplicate Workflow command or Queue delivery;
- Worker interruption and existing delivery/lease recovery;
- page refresh and SSE/Polling recovery;
- cancellation, retry, and late result rejection where applicable;
- upstream Version change and Outdated propagation; and
- no duplicate Version, Promotion, Approval, or export eligibility.

Do not add image, Renderer, backup, deletion-restore, production rollback, or unrelated future-capability drills.

## 9. Security acceptance

Verify the active boundaries:

- Authentication and Owner Authorization;
- private API/Object access;
- upload validation and safe display;
- public-URL SSRF/redirect/TLS/resource denial;
- least-privilege service identities and Secret separation;
- Prompt/input separation and model output remaining Candidate material;
- Markdown-safe display and log/error redaction; and
- no Approval bypass or cross-owner data.

A Security Error remains Blocking. Renderer isolation, asset Export allowlists, backup/restore, public sharing, and production controls are evaluated only when implemented.

## 10. UX and accessibility acceptance

The Workspace makes Current Stage and Current Action clear; distinguishes Working, Review, Approved, Warning, and Blocking Error; identifies AI Candidates; explains Outdated state; shows failure/retry state; survives refresh; and distinguishes Exported from Published.

The active flow supports keyboard use, visible focus, labels, associated errors, non-color-only status, and meaningful heading hierarchy. Formal broader accessibility certification is not required for first MVP completion.

## 11. Evidence

The Acceptance Record retains only evidence needed to review the decision:

- reviewed commit/build;
- test environment and input fixture;
- relevant Artifact/Version identities;
- affected automated checks;
- Demo Result;
- active failure/security results;
- Provider/cost result when a real Provider is used;
- human reviewer;
- known limitations, Blocking Defects, and final decision.

Detailed logs remain in CI/artifacts. Do not copy Secrets, raw Provider payloads, private content, runtime URLs, or terminal transcripts into the Record.

## 12. Milestone application

| Milestone | Acceptance focus                                                               |
| --------- | ------------------------------------------------------------------------------ |
| M0        | Development environment and quality entry points                               |
| M1        | Content Package thin slice                                                     |
| M2        | Source and Workflow foundation                                                 |
| M3        | Approved Research                                                              |
| M4        | Confirmed Opinion/Research-based Mode and Approved Blog Markdown               |
| M5        | Approved Xiaohongshu text, both manual text exports, and formal MVP acceptance |
| M6        | Post-MVP Design/Render/rich Export                                             |
| M7        | Post-MVP production hardening                                                  |
| M8        | Private production release                                                     |

## 13. Completion rule

The formal MVP is complete when one current-main run produces both approved text outputs from formal Sources through the reviewable, traceable flow, and the active failure/security paths are green.

It is not complete with only pages, model calls, Drafts, one output, or an unreviewed happy path. It is not blocked by an unimplemented deferred visual/production capability.

## 14. Decision traceability

DEC-295 governs the text-first acceptance boundary. DEC-269–DEC-272 preserve independent dual outputs, manual publishing, Human Gates, Versions, dependencies, and Provenance. DEC-244–DEC-266 continue to govern applicable quality evidence. Earlier Design/Renderer/production Decisions apply after MVP when those capabilities begin.

The [Canonical Decision Register](../decisions/decisions.md) remains authoritative.
