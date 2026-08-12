# ContentOS MVP Scope

**Status:** Current Truth
**Scope:** Formal text-first private MVP boundary
**Last Updated:** 2026-08-12

This document defines the smallest ContentOS product that validates the core user value. DEC-295 supersedes the earlier requirement that visual rendering, packaged image output, broad production hardening, and production deployment complete before the first formal MVP.

---

## 1. MVP outcome

ContentOS MVP is a private, single-user, desktop-first application that turns trusted Sources and user judgment into two independently reviewable content assets:

```text
Approved Sources
→ reviewed Research
→ optional confirmed Human Opinion or explicit Research-based Mode
→ Approved Blog Markdown
+ Approved Xiaohongshu text/carousel content
→ manual text export
```

The product is not complete because a model returned text. The user must be able to review, edit, approve, trace, and export both outputs.

## 2. User and product form

The MVP serves one individual creator or product/operations professional.

It provides:

- Login;
- Dashboard and New Package;
- one structured Content Package Workspace;
- Source, Research, Human Opinion, Blog, and Xiaohongshu text stages; and
- local/private operation with manual publishing.

Multi-user collaboration, organizations, public registration, mobile-first editing, and public sharing are outside the MVP.

## 3. Supported Sources

The MVP supports:

- public HTTP/HTTPS URL;
- Pasted Text;
- `.md`;
- `.txt`; and
- one Primary Source plus zero to five Supporting Sources per Package.

Source capture preserves the raw/original evidence and a normalized reviewable form. Failed URL capture remains visible and may fall back to Pasted Text; it cannot become a false successful Source.

PDF, Office, OCR, audio, video, email, cloud-drive import, and authenticated browser automation are deferred.

## 4. Research

Minimum Research contains:

- Summary;
- important Facts and Claims;
- Source Evidence or locators;
- tensions, Open Questions, and Needs Verification items; and
- exact Source references.

The user can accept, correct, exclude, or mark items as needing verification, then approve one immutable Research Version. One Fake Provider supports deterministic tests; one real Provider Adapter is sufficient for the MVP when separately authorized credentials and cost limits exist.

Research does not need autonomous web search, unrestricted tools, multi-agent debate, or a general knowledge platform.

## 5. Human Opinion

The MVP keeps the product's Source → AI Analysis → Human Opinion distinction with the smallest useful interaction:

```text
Focused Question
→ Raw User Response
→ AI Interpretation
→ User confirmation or correction
→ Confirmed Opinion
```

The user may skip opinion collection and explicitly choose Research-based Mode. AI interpretation is never treated as the user's opinion, and Research-based content cannot fabricate first-person experience or belief.

A free-form conversational interview system is not required.

## 6. Blog

The Blog branch independently consumes Approved Research plus either Confirmed Human Opinion or Research-based Mode.

Minimum Blog capability includes:

- title, summary, Markdown body, public References, internal Provenance, and Content Mode;
- generated Draft;
- direct Markdown editing and preview;
- one Working Copy and immutable checkpoint Versions;
- validation and exact Version Approval; and
- manual `article.md` download or Copy Markdown.

Selective-apply Diff tooling, rich Blocks, asset packaging, ZIP manifests, automated PersonalBlog import, and public deployment are post-MVP.

## 7. Xiaohongshu text

The Xiaohongshu branch consumes the same Approved Content Foundation independently; it is not a shortened Blog.

Minimum capability includes:

- Platform Title candidates and one selected title;
- Cover Title and optional subtitle;
- a structured 6–10-page text/carousel plan with stable page identity, purpose, heading, body, emphasis, and Provenance;
- Caption, CTA, Hashtags, and public References;
- direct field editing and page ordering;
- one Working Copy and immutable checkpoint Versions;
- validation and exact Version Approval; and
- manual portable Markdown/JSON text export.

The MVP does not require visual component selection, Design Specification, image generation, Asset review, PNG rendering, or pixel regression.

## 8. Manual export

The MVP export boundary is intentionally simple:

### Blog

- `article.md`

### Xiaohongshu

- `post.md` for title, caption, CTA, Hashtags, and References;
- `pages.json` or an equivalent portable text representation for ordered page content.

Exports identify the approved Artifact and Version in their content or metadata. They do not require asset directories, ZIP packaging, file-hash manifests, publishing credentials, or automatic platform delivery.

```text
Exported ≠ Published
```

## 9. Workflow, versions, and approval

The following remain core rather than optional hardening:

- API-owned authoritative mutations;
- Mutable Working Copy and immutable Version;
- Review Candidate and exact Version Approval;
- exact upstream dependencies and Provenance;
- Outdated state when an approved upstream changes;
- deterministic validation before Approval;
- Human Review gates; and
- visible failure, retry, cancellation, and stale-result behavior for affected tasks.

The MVP uses the existing fixed Workflow foundation. It does not require a Workflow Builder, general Chief Editor autonomy, arbitrary tools, or Agent-created sub-agents.

## 10. Security boundary

Only security controls attached to active MVP capabilities are release-blocking:

- authenticated owner scope;
- private API and Object Storage access;
- `.md`/`.txt` upload validation;
- public-URL SSRF, redirect, TLS, and resource limits;
- least-privilege process identities and Secret References;
- Prompt/input separation for the one active Provider path;
- model output remaining Candidate material;
- Markdown-safe display;
- redacted errors/logs; and
- verified owned-runtime cleanup for affected Integration/Browser evidence.

Renderer isolation, Export asset allowlists, deletion restore ledgers, backup restore, production Secret provisioning, public-sharing security, and production incident response become gates only when those post-MVP capabilities begin.

## 11. Quality and completion

Verification follows the affected-layer strategy. The formal MVP requires one current-main end-to-end acceptance proving that one user can:

1. create a Package and capture/review Sources;
2. approve Research;
3. confirm Human Opinion or explicitly choose Research-based Mode;
4. generate, edit, validate, and approve Blog Markdown;
5. independently generate, edit, validate, and approve Xiaohongshu text;
6. export both approved text outputs; and
7. recover honestly from the credible failure paths exercised by this active flow.

Required failure coverage is limited to the active implementation: refresh/resume, duplicate commands or delivery, Provider/task failure, Worker interruption, upstream Version change, cancellation, retry, and late-result rejection where applicable.

Backup restore, deletion restore, Render regression, image completeness, production rollback, high availability, and unrelated future-capability drills do not block this MVP.

## 12. Explicit post-MVP work

The following are valuable but deferred:

- Design Specification and Visual Agent;
- Component Registry, Theme, image generation, and Asset review;
- deterministic PNG Renderer and carousel image export;
- packaged assets, manifests, checksums, and automated import adapters;
- production deployment, monitoring, backup/restore, and high availability;
- public sharing, automated publishing, and scheduling;
- Analytics;
- multi-user/organization features;
- Workflow Builder, Agent Marketplace, Plugin Platform, and Template Marketplace; and
- additional input formats or autonomous web search.

These remain candidates for M6 and later. Deferral is not a claim that they are implemented or unnecessary forever.

## 13. Initial success signals

The first validation measures:

- **Task completion:** both approved text exports are reached;
- **Content trust:** Source, evidence, opinion, Version, and dependency lineage are understandable;
- **Editing value:** users can improve Drafts without fighting the system;
- **Reuse value:** one Content Foundation produces two useful platform-native expressions;
- **Speed:** time from approved Sources to approved dual text export;
- **Reliability:** the active flow survives its credible failure and retry paths; and
- **Cost:** Provider use stays within the separately authorized MVP budget.

Growth, engagement, revenue, image quality, and production availability are not first-MVP completion criteria.

## 14. Decision traceability

| Scope area                                                 | Governing Decisions |
| ---------------------------------------------------------- | ------------------- |
| Text-first formal MVP and deferred visual/production work  | DEC-295             |
| Single-user private product and supported Sources          | DEC-267–DEC-268     |
| Independent Blog/Xiaohongshu outputs and manual publishing | DEC-269–DEC-270     |
| Human gates, Versions, dependencies, and Provenance        | DEC-271–DEC-272     |
| Limited runway and thin vertical slices                    | DEC-275             |
| M3 Research and M4/M5 content order                        | DEC-281–DEC-282     |
| Scope-change governance                                    | DEC-290, DEC-292    |

The [Canonical Decision Register](../decisions/decisions.md) is authoritative. Earlier visual, Renderer, hardening, and deployment Decisions remain applicable to post-MVP work unless a later Decision changes them.
