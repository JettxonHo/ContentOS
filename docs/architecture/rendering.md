# ContentOS Rendering

**Status:** Current Truth

**Scope:** Post-MVP Xiaohongshu visual planning, Asset governance, deterministic rendering, validation, and rich Export boundaries

**Last Updated:** 2026-08-12

This document defines the post-MVP capability that transforms an Approved Xiaohongshu Version into reviewable Design, deterministic pixel output, and a portable rich Export Package. DEC-295 makes this entire capability non-blocking for the text-first MVP. The document defines responsibilities and invariants, not a Design JSON Schema, concrete components, visual style, fonts, canvas dimensions, Provider, or package versions.

Related current-truth documents:

- [Product Definition](../product/product-definition.md)
- [MVP Scope](../product/mvp-scope.md)
- [Domain Overview](domain-overview.md)
- [Artifact Versioning](artifact-versioning.md)
- [Technical Architecture](technical-architecture.md)
- [Process Topology](process-topology.md)
- [Workflow Overview](workflow-overview.md)
- [Agent Runtime](agent-runtime.md)

---

## 1. Rendering Pipeline

```text
Approved Xiaohongshu Version
→ Design Specification
→ Asset Requests
→ Approved Assets
→ Preview Render
→ Design Approval
→ Final Render
→ Export Package
```

The pipeline preserves independent content, design, Asset, render, and delivery identities. A later stage consumes exact versioned dependencies and never silently edits an upstream object.

## 2. Responsibility Separation

```text
Packaging Agent
→ decides platform content

Visual Agent
→ produces Design Specification

Image Generation Service
→ produces requested visual Asset Candidates

Render Engine
→ deterministically produces pixels

Export Service
→ assembles a portable delivery package
```

| Capability               | Owns                                                                                                                  | Does not own                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Packaging Agent          | Xiaohongshu narrative, titles, page semantics, text, Caption, CTA, Hashtags, and provenance                           | layout, generated pixels, Asset generation, final Export                               |
| Visual Agent             | Component selection, Content Binding, visual hierarchy, emphasis, Theme use, Asset Requests, and Design Specification | canonical Xiaohongshu edits, final pixels, Asset Approval, Export                      |
| Image Generation Service | Provider execution, binary Candidate storage, metadata, retry, and Asset Candidate creation                           | page layout, canonical content, Design selection, final page images with critical text |
| Render Engine            | controlled Component execution, layout measurement, validation, and immutable PNG output                              | LLM calls, content rewriting, visual strategy, Asset generation, Export packaging      |
| Export Service           | delivery file assembly, manifest, hashes, and package identity                                                        | pixel rendering, content Approval, publication                                         |

These responsibilities may exist in one Repository and coordinated release. Separation does not imply microservices.

## 3. Visual Agent

The Visual Agent:

- Consumes one exact Approved Xiaohongshu Version;
- Resolves one versioned Component Registry and Brand Theme;
- Produces a structured Design Specification Candidate;
- Defines Content Bindings rather than copying canonical Xiaohongshu text into a second editable body;
- Requests optional Assets when they provide communication value;
- records exact dependencies and attribution placement;
- does not render final pixels or approve content, Design, or Assets.

If approved content does not fit registered Components, the Visual Agent returns a Fit Issue or Packaging Revision Request. It may suggest a different registered Component or an upstream content change, but it cannot silently delete, shorten, split, crop, or rewrite canonical Xiaohongshu content.

## 4. Design Specification

A Design Specification is the authoritative versioned Contract between visual planning and deterministic rendering. It conceptually includes:

- **Canvas:** platform surface and rendering coordinate context;
- **Page:** stable page identity, order, and purpose reference;
- **Component:** registered Component identity and Version;
- **Content Binding:** exact references from Component slots to approved Xiaohongshu fields;
- **Design Token:** permitted Theme token references;
- **Emphasis:** structured hierarchy intent within allowed Component capabilities;
- **Asset Reference:** exact Candidate or Approved Asset dependency according to Preview or Final eligibility;
- **Attribution:** required source or Asset attribution placement;
- **Fit Policy:** registered bounded fitting behavior;
- **Dependency references:** Xiaohongshu, Theme, Registry, Asset, and configuration Versions;
- **Schema Version:** exact Contract interpretation.

Design editing uses a mutable Working Copy and meaningful immutable Design Versions. Only an Approved Design Version may enter Final Render. This document does not define the concrete Schema.

## 5. Component Registry

A Component is a versioned, code-defined, controlled layout capability. The Component Registry describes registered Components and their eligible use.

Each Component conceptually constrains:

- supported Page Purposes;
- required and optional slots;
- content capacity;
- permitted Component variants;
- Asset requirements;
- attribution support;
- compatible Theme tokens;
- permitted Fit Strategy;
- failure behavior.

The Visual Agent selects only registered Components. The Renderer implements only registered Components. A Design Specification cannot contain arbitrary HTML, CSS, JavaScript, unrestricted absolute pixel instructions, or an invented layout. Component choice must remain compatible with the Page Purpose and content Contract.

## 6. Brand Theme

A Brand Theme is a separately versioned visual-token input. It conceptually defines:

- Typography tokens;
- spacing tokens;
- color tokens;
- shape and radius rules;
- borders and shadow rules;
- illustration guidance;
- Theme Version.

Theme appearance and Component structure remain separate. One Component may support multiple approved Themes in the future. The MVP requires only one approved default Theme, but this document does not select its colors, typefaces, or visual style.

## 7. Asset Model

The Asset lifecycle distinguishes:

- **Asset Request:** structured need, purpose, constraints, and permitted fallback;
- **Asset Candidate:** generated, uploaded, reused, or derived file awaiting applicable validation and review;
- **Asset Version:** immutable file identity plus metadata and integrity information;
- **Approved Asset:** exact Asset Version authorized for eligible Design or Final Render use;
- **Asset Registry:** versioned inventory and lifecycle records for generated, uploaded, reusable, screenshot, icon, and deterministic Assets;
- **Attribution:** public or internal credit and display requirements;
- **Provenance:** origin type, creator or Provider metadata, source, transformation, permission or licence state, and history.

Regeneration or replacement creates another Asset Candidate and Version. It never overwrites a historical Asset Version or changes the dependency identity of a historical Design or Render Output.

## 8. Image Generation Service

Image Generation is separate from the Visual Agent and Render Engine.

The service:

- Accepts a typed Asset Request;
- may call an approved image-generation Provider through its controlled boundary;
- stores Raw Provider and generation metadata under the appropriate restricted policy;
- produces one or more Asset Candidates;
- records usage, cost, safety, provenance, and file metadata;
- submits Candidate Assets for validation and human review.

An Asset Candidate must be approved before Final Render use. The service does not choose page layout, edit the Design Specification, or generate complete final pages carrying important Chinese text. It does not turn a Provider response directly into an Approved Asset.

## 9. Deterministic-first Asset Policy

Visual communication prefers the most controlled adequate form. The conceptual priority is:

1. Typography;
2. system or registered Icons;
3. deterministic Diagrams;
4. user-provided Assets;
5. reusable Approved Assets;
6. generated illustration when it materially improves comprehension.

Generated images do not carry:

- critical page text or titles;
- technical terms that must be exact;
- precise numbers or charts;
- process labels;
- direct quotations;
- required attribution;
- exact architecture or product-interface representation.

Exact diagrams, labels, numbers, and charts use deterministic Components. A generated illustration is optional communication support, not a required image on every page.

## 10. Render Engine

The Render Engine is an LLM-free deterministic execution layer. It:

- Executes code-defined Components;
- uses controlled HTML and CSS;
- runs through Playwright and pinned Chromium;
- executes Final Render in a controlled Linux environment;
- resolves only approved local Assets, Font Bundle, Theme, Component Registry, and Render Profile inputs;
- measures actual layout and validates output;
- writes PNG files and immutable Render metadata;
- has no public-network access;
- does not modify content or Design;
- does not call a model or Image Generation Service.

The Renderer process has a dedicated Service Identity and minimum Object Storage and metadata permissions. It never receives general Agent Provider credentials.

## 11. Preview versus Final Render

### 11.1 Preview Render

A Preview:

- May consume a Design Working Copy;
- may use preview-eligible Asset Candidates;
- may allow non-blocking Warnings;
- may use an explicitly qualified faster path;
- may include Watermark or Draft labeling;
- may display partial results with clear failure information;
- is never formally export-eligible.

### 11.2 Final Render

A Final Render requires:

- one exact Approved Xiaohongshu Version;
- one exact Approved Design Version;
- all required Approved Asset Versions;
- an approved Font Bundle and eligible Render Profile;
- exact Theme, Component Registry, and environment dependencies;
- complete input and actual-layout validation;
- atomic success for the expected page set.

A successful Final Render creates an immutable Render Output. A Preview cannot be relabeled as Final merely because it looks correct.

## 12. Render Job and Render Output

- **Render Job** is one execution request with exact inputs, mode, policy, identity, cancellation, attempt, and eligibility.
- **Render Output** is one immutable result containing the complete page files, file hashes, dependency Versions, validation result, and Environment Fingerprint.

One Design Version may have multiple Preview and Final Render Outputs. Re-rendering, retry, Renderer upgrade, or configuration change creates another Attempt and, when successful, another Render Output. Historical outputs are never overwritten.

The system explicitly selects one eligible Final Render Output for Export. Render Output remains distinct from the user-facing Export Package.

## 13. Render Profile and Environment Fingerprint

A versioned Render Profile and Environment Fingerprint conceptually record:

- Canvas size;
- pixel ratio;
- image format;
- quality constraints;
- Browser and Chromium Version;
- Playwright or Browser-control runtime Version;
- Renderer Version;
- Component Registry Version;
- Brand Theme Version;
- Font Bundle Version;
- Container Image identity;
- controlled operating environment identity;
- applicable rendering configuration Hash.

The exact values and hashing method are not selected here. Local developer Preview output does not automatically qualify as Final because its Environment Fingerprint may differ.

## 14. Font Policy

- The Font Bundle is versioned and included in the Environment Fingerprint;
- Final Render uses only approved controlled Font files and weights;
- required Chinese character coverage is validated;
- missing a required Font or weight is a Final Render Blocking Error;
- licence and attribution state are recorded;
- local system Fonts are never an implicit formal Renderer dependency;
- changing Font Bundle triggers the relevant full Render Regression rather than rewriting historical output.

This document does not select a typeface or licence.

## 15. Fit Strategy

Fit behavior is bounded and registered per Component. The safe order is conceptually:

```text
Approved Component Variant
→ Approved Spacing Adjustment
→ Approved Typography Adjustment
→ Fit Issue
→ Packaging Revision Request
```

A registered optional-decoration removal may be allowed when the Component Contract explicitly permits it and content or attribution is unaffected.

The Renderer must not:

- silently delete or rewrite content;
- hide required attribution;
- reduce typography without a minimum bound;
- silently crop or truncate text;
- automatically split a page and thereby change content structure;
- invent a different Component or narrative;
- return apparent success after capacity failure.

When registered safe actions cannot fit the content, rendering fails with a structured Fit Issue and returns to the appropriate Design or Packaging path.

## 16. Render Validation

Render Validation covers both eligibility and actual output. It includes at least:

- input eligibility and Approval state;
- exact dependency validation;
- expected page count and order;
- output dimensions and pixel ratio;
- missing or failed Asset loading;
- missing Font, weight, or character coverage;
- text and Component overflow;
- clipping and unintended crop;
- element overlap;
- empty or missing page;
- file MIME and decodability;
- file Hash and integrity;
- unauthorized external-network request;
- Manifest consistency;
- attribution visibility;
- consistency of every page with the same Render Job and Attempt.

Any Blocking Error prevents a Final Render Output from becoming Export-eligible. Design Fit Preflight does not replace actual Browser layout validation.

## 17. Atomic Carousel

A Final Xiaohongshu carousel is one atomic result.

- Every expected page must render and pass validation;
- one failed, missing, empty, corrupt, or ineligible page makes the entire Final result unavailable;
- pages from different Attempts or Render Jobs cannot be combined into one Final Output;
- temporary successful pages may be retained for diagnosis but do not form a partial formal carousel;
- Export consumes one complete selected Final Render Output.

## 18. Error and Retry

Render errors are classified as:

| Category                       | Meaning                                                                                               | Recovery                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Input Error                    | Missing, unapproved, outdated, invalid, or inconsistent input                                         | Correct or replace the input                               |
| Deterministic Render Error     | Component capacity, missing Font, invalid binding, overflow, clipping, layout, or content-fit failure | Return to Design, Packaging, Asset, or configuration owner |
| Transient Infrastructure Error | Temporary process, storage, Browser startup, or infrastructure failure                                | Bounded automatic retry where policy allows                |

Only suitable Transient Infrastructure Errors retry automatically. Content density, invalid Design, and missing required Font cannot be solved through unlimited retry. Retry preserves attempt history and never overwrites an earlier Render Output.

## 19. Export Package

The post-MVP Xiaohongshu rich Export Package contains:

```text
images/
post.md
references.md
manifest.json
```

- `images/` contains the complete selected Final carousel using deterministic page ordering;
- `post.md` contains selected Platform Title, Caption, CTA, and Hashtags;
- `references.md` contains public references and required attribution;
- `manifest.json` records Contract Version, Artifact and dependency Versions, selected Render Output, file paths, MIME, hashes, and Export metadata.

The Export Package:

- Has its own immutable identity and Version;
- binds exact Xiaohongshu, Design, Asset, Font, Component, Theme, Render Profile, and Render Output dependencies as applicable;
- is assembled only from an eligible complete Final Render and approved platform content;
- contains no Prompt, Raw Model Output, Secret, Credential Reference, internal diagnostic payload, or temporary signed URL;
- does not imply publication.

```text
Exported ≠ Published
```

Text-first Blog and Xiaohongshu exports are defined in [MVP Scope](../product/mvp-scope.md). ContentOS does not provide a public Blog Renderer; this post-MVP rendering document does not expand that pipeline.

## 20. Rendering Security

- Renderer has no public-network access;
- Design Specification cannot execute arbitrary user HTML, CSS, JavaScript, or external resource requests;
- Renderer reads only authorized resolved inputs and does not access arbitrary Host files;
- Components and templates are controlled code;
- generated and uploaded Assets pass quarantine, validation, and applicable human Approval before Final use;
- Object Storage access is scoped to exact approved inputs and the Render output prefix;
- Render logs and traces do not contain complete private content, signed URLs, Secrets, or raw binary data;
- Chromium runs with a dedicated process identity and bounded filesystem, network, CPU, memory, and timeout controls;
- an attempted external request is a Blocking Error and security signal, not an opportunity to fetch the resource.

## 21. Rendering Invariants

- Visual Agent never modifies canonical Xiaohongshu content.
- Image Generation Service does not decide page layout or create Final pages with critical text.
- Render Engine does not call an LLM or image-generation model.
- Render Engine does not generate Assets, rewrite content, or alter Design strategy.
- Final Render uses only exact Approved dependencies and controlled resources.
- Missing required Font blocks Final Render.
- Renderer never silently truncates, crops, deletes, splits, or rewrites content.
- Final carousel success is atomic.
- Render Output is immutable and retry does not overwrite history.
- Render Output and Export Package remain separate identities.
- Preview is not formal Export evidence.
- Renderer has no public egress.
- Renderer upgrade does not mutate or automatically invalidate historical Design Versions.
- Export always selects one complete Final Render Output, never a mixture of Attempts.

## 22. Open Implementation Decisions

Accepted Decisions do not yet select:

- Component Registry v1's concrete Components;
- Brand Theme v1's visual values;
- Font Bundle and licences;
- Preview optimization method;
- Pixel Diff threshold;
- Browser recycling policy;
- Render timeout;
- Asset Generation Provider;
- exact canvas dimensions;
- Export compression settings.

These choices require bounded implementation and validation work. They must not alter canonical content, eligibility, approval, isolation, or deterministic-rendering rules without Decision governance.

## 23. Decision Traceability

| Rendering area                                                              | Accepted Decisions               | Primary historical sources                                                           |
| --------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Design Specification, component rendering, and separated visual production  | DEC-026–DEC-027                  | [Session-006](../sessions/session-006.md)                                            |
| Xiaohongshu content and Visual boundary                                     | DEC-086–DEC-097                  | [Session-014](../sessions/session-014.md)                                            |
| Visual Agent, Component Registry, Theme, Asset, and fit responsibilities    | DEC-098–DEC-110                  | [Session-015](../sessions/session-015.md)                                            |
| Deterministic Renderer, Preview, Final, Output, Font, atomicity, and Export | DEC-111–DEC-124                  | [Session-016](../sessions/session-016.md)                                            |
| Candidate, Frozen Input, Promotion, and bounded execution                   | DEC-129–DEC-139, DEC-177–DEC-198 | [Session-017](../sessions/session-017.md), [Session-020](../sessions/session-020.md) |
| Isolated Renderer, Object Storage, Playwright, Chromium, and environment    | DEC-221, DEC-230–DEC-235         | [Session-022](../sessions/session-022.md)                                            |
| deterministic validation and Render Regression                              | DEC-245, DEC-259–DEC-263         | [Session-023](../sessions/session-023.md)                                            |
| Human Gates, post-MVP M6 order, and release boundary                        | DEC-269–DEC-285, DEC-293–DEC-295 | [Session-024](../sessions/session-024.md), user confirmation 2026-08-12              |

The authoritative status and wording of every Decision is maintained in the [Canonical Decision Register Index](../decisions/decisions.md).
