# ContentOS Session-016

**Status:** Formalized  
**Session Type:** Rendering Architecture, Export Pipeline, and Output Lifecycle  
**Topic:** Render Engine, Render Profiles, Render Outputs, Export Packages, Validation, and Failure Recovery  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the following content and visual pipeline:

```text
Approved Normalized Source Versions
→ Approved Research Result Version
→ Confirmed Human Opinion Version
→ Approved Xiaohongshu Artifact Version
→ Approved Design Specification Version
→ Rendered Images
→ Publishing-ready Export Package
```

Session-014 defined the Xiaohongshu Artifact.

Session-015 defined:

- Visual Agent
- Design Specification
- Component Registry
- Brand Theme
- Asset Registry
- Image Generation Service
- Design Working Copy
- Immutable Design Versions
- Design Validation
- Approved Asset requirements

The unresolved questions were:

1. What is the Render Engine responsible for?
2. Should the MVP use HTML/CSS, SVG, Canvas, or an external design tool?
3. How can the same Design Specification produce reproducible results?
4. How should Preview Render and Final Render differ?
5. What is the difference between Render Job, Render Output, and Export Package?
6. How should text overflow, missing fonts, failed assets, and browser errors be handled?
7. May the Render Engine shrink, truncate, split, or rewrite content?
8. What files belong in the Xiaohongshu Export Package?
9. What happens to historical Render Outputs after upstream content changes?
10. How should the rendering architecture support future platforms without overengineering the MVP?

This Session defines the rendering and export architecture.

---

## 2. Core Rendering Pipeline

The authoritative rendering pipeline is:

```text
Approved Design Specification Version
        ↓
Resolve exact dependencies
        ↓
Create Render Job
        ↓
Render Engine
        ↓
Render Validation
        ↓
Immutable Render Output
        ↓
Export Pipeline
        ↓
Immutable Export Package
```

The Render Engine is an execution layer.

It does not repeat the content or visual-design work performed by upstream Agents.

---

## 3. Render Engine Responsibility

The Render Engine converts a specific Design Specification Version into exact output files.

It is responsible for:

- Reading the Design Specification
- Loading registered components
- Resolving Content Bindings
- Applying Brand Theme tokens
- Loading approved Asset Versions
- Loading controlled Font Bundles
- Drawing deterministic diagrams
- Rendering accurate text
- Generating Preview output
- Generating Final output
- Measuring actual layout
- Detecting overflow and overlap
- Recording the Render Environment
- Generating file hashes
- Producing a Render Manifest
- Returning structured success or failure results

The Render Engine is not responsible for:

- Understanding Research
- Rewriting Xiaohongshu content
- Inferring Human Opinion
- Selecting the narrative
- Choosing a different component
- Generating a new illustration
- Calling an LLM during rendering
- Modifying the Design Specification
- Approving the output
- Publishing to Xiaohongshu
- Creating an alternative content version

The responsibility boundary is:

```text
Packaging Agent
→ Content semantics

Visual Agent
→ Visual structure

Image Generation Service
→ Generated visual assets

Render Engine
→ Deterministic pixels

Export Pipeline
→ User-facing delivery package
```

---

## 4. Render Engine Is an LLM-free Layer

Rendering must not depend on another generative interpretation.

Rejected flow:

```text
Design Specification
→ LLM reinterprets design
→ Generates HTML or image
```

Required flow:

```text
Design Specification
→ Registered component implementation
→ Controlled render environment
→ Output file
```

The Render Engine executes decisions already made upstream.

This separation supports:

- Reproducibility
- Automated testing
- Visual regression testing
- Clear debugging
- Stable typography
- Consistent brand output
- Predictable error handling

---

## 5. MVP Rendering Technology Direction

The MVP uses:

```text
Design Specification
→ Code-defined HTML/CSS Components
→ Controlled Headless Chromium
→ Screenshot
→ PNG
```

HTML/CSS is selected as the primary page-rendering model because it supports:

- Reliable Chinese text rendering
- Strong typography and spacing controls
- Fixed-size canvases
- Reusable web components
- Browser-based Preview
- DOM layout measurement
- Easier overflow detection
- Familiar development tooling
- Asset composition
- Embedded SVG diagrams
- Future platform dimensions

This decision does not authorize the Visual Agent to generate unrestricted HTML or CSS.

The Visual Agent selects registered components and approved configuration.

The Render Engine executes their code-defined implementations.

---

## 6. Role of SVG and Canvas

SVG and Canvas are not the primary page-level architecture for the MVP.

They may be used inside specific registered components.

### SVG is suitable for:

- Flow diagrams
- Arrows
- Node relationships
- Timelines
- Simple charts
- Icons
- Framework diagrams

### Canvas may later support:

- Specialized image operations
- Complex graphic rendering
- Dynamic visual effects
- High-volume visual objects

The default page remains:

```text
HTML/CSS Page Component
├── Accurate text
├── Raster asset
├── System icon
└── Embedded SVG diagram
```

This avoids forcing the entire system into a single rendering technology.

---

## 7. Canva Positioning

Canva is not the authoritative Render Engine for the ContentOS MVP.

It may remain:

- A manual fallback
- An external editing option
- A future Export Adapter
- A reference tool during template design

It is not the primary automated rendering dependency.

Potential problems with a Canva-centered core include:

- External API dependence
- Permission and account dependence
- Limited control over version reproduction
- Difficult automated testing
- Hidden Content Binding behavior
- Separation from ContentOS domain objects
- More difficult local development
- Template and data drift

The formal MVP direction is:

```text
Component Registry
+
HTML/CSS Renderer
+
Controlled Browser Screenshot
```

---

## 8. Render Engine Abstraction

Although the MVP uses an HTML/CSS renderer, the domain model should use a generic Render Engine interface.

Conceptual structure:

```text
Render Engine Interface
├── HTML/CSS Renderer — MVP
├── SVG Renderer — specialized capability
├── PDF Renderer — future
├── Presentation Renderer — future
└── Video Renderer — future
```

The domain contract should not expose implementation-specific names such as:

```text
playwright_screenshot
```

as the core rendering concept.

Implementation-specific tools remain inside the renderer adapter.

---

## 9. Render Profile

Platform-specific dimensions and output requirements are defined by a versioned Render Profile.

Recommended conceptual structure:

```json
{
  "render_profile_id": "xiaohongshu-portrait/v1",
  "platform": "xiaohongshu",

  "canvas": {
    "width": 1080,
    "height": 1440,
    "pixel_ratio": 1
  },

  "output": {
    "format": "png",
    "color_space": "srgb",
    "background": "opaque"
  },

  "quality": {
    "minimum_text_size": 28,
    "maximum_file_size_bytes": null
  }
}
```

The Render Profile may later define:

- Supported output formats
- Page size
- Pixel ratio
- Color space
- Background behavior
- Compression policy
- File-size limits
- Minimum typography
- Safe margins
- Naming rules

Historical outputs retain the exact Render Profile Version used.

---

## 10. Render Input Contract

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.render-input/v1",

  "render_mode": "final",

  "content_package_id": "cp_001",
  "design_version_id": "designver_002",

  "dependencies": {
    "xiaohongshu_version_id": "xhsver_003",
    "platform_profile_version": "xiaohongshu-content-profile/v1",
    "render_profile_version": "xiaohongshu-portrait/v1",
    "brand_theme_version": "contentos-default/1.0.0",
    "component_registry_version": "xhs-components/1.0.0",
    "renderer_version": "contentos-html-renderer/1.0.0",
    "font_bundle_version": "contentos-fonts/v1"
  },

  "design_specification": {},
  "resolved_content": {},
  "resolved_assets": [],
  "resolved_fonts": []
}
```

The Render Engine receives resolved, validated dependencies.

It must not search for missing assets or external resources during Final Render.

---

## 11. Preview Render

Preview Render supports fast visual review during design editing.

It may consume:

```text
Design Working Copy
+
Preview-eligible Asset Candidates
```

Preview Render may:

- Use reduced image resolution
- Use compressed preview files
- Contain visible Preview status
- Allow non-blocking warnings
- Use pending optional asset candidates
- Generate only affected pages
- Display partial results
- Prioritize speed over final delivery quality

Preview Render does not produce a publishable Export Package.

Preview output must be clearly distinguishable from Final output.

---

## 12. Final Render

Final Render produces formal output eligible for export.

It may consume only:

- Approved Design Specification Version
- Approved Xiaohongshu Artifact Version
- Approved Asset Versions
- Valid Platform Profile Version
- Valid Render Profile Version
- Valid Component Registry Version
- Valid Brand Theme Version
- Valid Font Bundle Version
- Accessible local dependencies

Final Render must reject:

- Design Working Copy
- Pending Assets
- Rejected Assets
- Missing fonts
- Missing Components
- Outdated content dependencies
- Blocking Design warnings
- Live external resources
- Invalid Content Bindings

---

## 13. Render Job

Every rendering execution is represented by a Render Job.

Recommended conceptual structure:

```json
{
  "render_job_id": "renderjob_001",
  "content_package_id": "cp_001",
  "design_version_id": "designver_002",

  "mode": "final",
  "status": "queued",

  "requested_outputs": [
    "page_pngs",
    "cover_thumbnail",
    "render_manifest"
  ],

  "attempt": 1,
  "created_at": "2026-07-26T17:00:00Z"
}
```

Recommended primary states:

```text
queued
→ preparing
→ rendering
→ validating
→ succeeded
```

Additional states:

```text
failed
cancelled
superseded
```

One Design Version may have multiple Render Jobs.

Examples:

- Preview Render
- Final Render
- Infrastructure retry
- Re-render after Renderer upgrade
- Comparison render
- Visual regression render

---

## 14. Render Job Attempt

A Render Job may contain multiple Attempts when a transient failure occurs.

Each Attempt should record:

- Attempt number
- Worker identifier
- Renderer version
- Environment fingerprint
- Start time
- Finish time
- Error code
- Error classification
- Error message
- Produced temporary files
- Retry decision

Attempts are not silently discarded.

This information supports troubleshooting and infrastructure monitoring.

---

## 15. Render Output

Render Output is an immutable internal domain object representing exact files produced by one successful Render Job.

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.render-output/v1",

  "render_output_id": "renderout_001",
  "render_job_id": "renderjob_001",
  "content_package_id": "cp_001",

  "mode": "final",
  "status": "succeeded",

  "dependencies": {
    "design_version_id": "designver_002",
    "xiaohongshu_version_id": "xhsver_003",
    "render_profile_version": "xiaohongshu-portrait/v1",
    "renderer_version": "contentos-html-renderer/1.0.0"
  },

  "environment": {
    "runtime_image_digest": "sha256:...",
    "browser_version": "...",
    "font_bundle_version": "contentos-fonts/v1",
    "locale": "zh-CN",
    "pixel_ratio": 1
  },

  "pages": [
    {
      "page_id": "page_001",
      "page_number": 1,
      "object_key": "renders/renderout_001/page-01.png",
      "width": 1080,
      "height": 1440,
      "mime_type": "image/png",
      "sha256": "..."
    }
  ],

  "validation_result_id": "renderval_001",
  "created_at": "2026-07-26T17:03:00Z"
}
```

A Render Output does not represent publication.

It represents an exact rendering result.

---

## 16. Render Output Is Immutable

A successful Render Output must not be modified in place.

If the same Design Version is rendered again, a new Render Output is created.

Example:

```text
Design Version 2
├── Render Output 1 — Renderer 1.0
├── Render Output 2 — Renderer 1.0 retry
└── Render Output 3 — Renderer 1.1
```

This supports:

- Renderer comparison
- Historical reproduction
- Output rollback
- Debugging
- Visual regression testing
- Environment analysis

Files from older outputs remain preserved according to retention policy.

---

## 17. Selecting the Current Final Render

One Design Version may have multiple successful Final Render Outputs.

The product must explicitly record the selected output.

Example:

```json
{
  "design_version_id": "designver_002",
  "selected_final_render_output_id": "renderout_003"
}
```

Selecting another successful Render Output:

- Does not modify the Design Version
- Does not create a new Design Version
- Must be recorded
- May create a new Export Package
- Must preserve selection history

---

## 18. Render Environment Fingerprint

Absolute pixel equivalence cannot be assumed across uncontrolled environments.

ContentOS therefore defines reproducibility as:

> Reproducible within a recorded and controlled Render Environment.

The Environment Fingerprint should include:

- Renderer Version
- Runtime Image Digest
- Browser Version
- Operating-system or container image
- Component Registry Version
- Brand Theme Version
- Render Profile Version
- Font Bundle Version
- Asset Versions
- Locale
- Pixel ratio
- Relevant rendering flags

This makes output differences diagnosable.

---

## 19. Controlled Fonts

Fonts are first-class render dependencies.

The Render Engine must not rely on arbitrary system fonts.

Required relationship:

```text
Typography Token
→ Font Registry
→ Exact Font Family and Weight
→ Controlled Font Asset
```

Font management must record:

- Font family
- Font weight
- Font version
- File identity
- Character coverage
- Chinese support
- License or usage status
- Fallback policy
- Font Bundle Version

Final Render must fail when a required font cannot be loaded.

It must not silently replace it with an uncontrolled system fallback.

The specific font family remains unresolved until the technical-stack and brand-design stages.

---

## 20. Controlled Components

The Render Engine executes only registered components.

A Design Specification must not contain:

- Arbitrary HTML
- Arbitrary CSS
- Arbitrary JavaScript
- Remote JavaScript URLs
- Dynamic iframes
- User-provided executable code
- Unregistered web components
- Unvalidated external stylesheets

Only configuration supported by the selected Component Contract may be used.

This reduces:

- Security risk
- Rendering drift
- Resource leakage
- Unbounded layout behavior
- Difficult debugging
- Brand inconsistency

---

## 21. External Network Policy

Final Render should not require live external network access.

Required assets must already be stored or resolved through:

- Asset Registry
- Font Registry
- Theme Bundle
- Component Bundle
- Content Snapshot
- Local icon bundle

Final Render must not rely on:

- External image URLs
- Third-party font CDNs
- Live webpages
- Remote scripts
- Embedded external applications
- Authentication-dependent resources

This protects:

- Reproducibility
- Privacy
- Availability
- Rendering speed
- Historical access
- Security

Preview should also prefer locally resolved resources.

---

## 22. Deterministic Fit Strategy

A Component may define a limited Fit Strategy.

Example:

```json
{
  "fit_strategy": [
    "default",
    "compact_spacing",
    "reduce_heading_one_step"
  ],
  "minimum_typography_token": "heading_m",
  "on_failure": "block"
}
```

Allowed controlled adjustments may include:

- Switching from standard to compact spacing
- Reducing one predefined typography level
- Hiding an explicitly optional decorative element
- Choosing a registered compact variant
- Adjusting image fit within allowed modes

The Render Engine must not:

- Rewrite text
- Delete factual content
- Remove Supporting Points
- Hide required Attribution
- Use unlimited font reduction
- Silently truncate
- Automatically split pages
- Change the Narrative
- Select a different Component without an updated Design Specification

---

## 23. Actual Overflow Detection

Fit Preflight during Design Validation is only an estimate.

The Render Engine must perform actual layout measurement.

Checks may include:

- Element `scrollWidth`
- Element `scrollHeight`
- Bounding-box overflow
- Clipped text
- Element overlap
- Asset overflow
- Footer collision
- Attribution visibility
- Minimum font-size compliance
- Safe-margin compliance
- Missing page number
- Incorrect image crop
- Hidden element
- Off-canvas element

A Final Render with unresolved overflow cannot be marked `succeeded`.

---

## 24. Render Validation Gate

Final Render must pass a deterministic validation process.

Validation categories:

```text
File Validation
Page Validation
Layout Validation
Asset Validation
Font Validation
Dependency Validation
Output Validation
```

---

## 25. File Validation

Checks include:

- Expected files exist
- File count is correct
- Files are non-empty
- MIME type is correct
- PNG files can be decoded
- Width is correct
- Height is correct
- File hashes are generated
- File paths are valid
- No unexpected temporary files are included

---

## 26. Page Validation

Checks include:

- Every expected `page_id` has one output
- Page numbers are continuous
- Cover page exists
- No page is duplicated
- No page is missing
- Output order matches the Design Specification
- Page dimensions match the Render Profile
- Page identity is recorded in the Manifest

---

## 27. Layout Validation

Checks include:

- No text overflow
- No element overlap
- No clipped body copy
- No hidden required content
- Attribution is visible
- Minimum typography is respected
- Images are loaded
- Theme tokens are applied
- Required diagram labels are visible
- Page number is visible when required
- Safe areas remain valid

---

## 28. Font Validation

Checks include:

- Required fonts loaded successfully
- Required font weights are available
- No uncontrolled system fallback was used
- Chinese glyphs are available
- Missing-glyph placeholders are absent
- Font Bundle Version is recorded
- Typography measurements remain within expected tolerance

---

## 29. Asset Validation

Checks include:

- All required Asset Versions are available
- Every Final Render asset is approved
- Images decode successfully
- Asset dimensions are sufficient
- Crop settings are valid
- Required attribution remains present
- No pending candidate is used
- No external image dependency remains
- No asset was replaced during rendering

---

## 30. Dependency Validation

Checks include:

- Design Version exists
- Design Version is approved
- Xiaohongshu Version exists
- Xiaohongshu Version is approved
- Upstream dependency did not change during rendering
- Brand Theme Version exists
- Component Registry Version exists
- Render Profile Version exists
- Font Bundle Version exists
- Asset Versions exist
- All dependencies remain accessible

---

## 31. Output Validation

Checks include:

- Render Manifest can be generated
- File hashes match generated files
- Render Output object is complete
- Validation Result is attached
- No Blocking Error remains
- Output can be consumed by Export Pipeline
- Environment Fingerprint is recorded
- Selected Final Render may be assigned

---

## 32. Blank-page and Basic Visual Anomaly Detection

The MVP may implement deterministic anomaly detection such as:

- File size unexpectedly small
- Page contains only the background
- Required text nodes missing
- Placeholder values remain
- Image-loading error markers exist
- DOM element is outside the canvas
- Screenshot dimensions differ from profile
- Main component failed to mount
- Font failed to load
- Render timed out before layout stabilization

Subjective judgments such as:

- Whether the page is attractive
- Whether the design feels premium
- Whether the hierarchy is aesthetically excellent
- Whether the cover is likely to perform well

remain part of Visual Review or future evaluation systems.

They must not be presented as deterministic Render Validation.

---

## 33. Render Error Classification

Render errors are classified into three major categories.

### Input Error

Examples:

- Invalid Design Specification
- Missing Component
- Missing Content Binding
- Unapproved Asset
- Missing Font
- Invalid Render Profile
- Missing dependency

Input Errors require upstream or configuration correction.

Automatic retry is generally not useful.

---

### Deterministic Render Error

Examples:

- Content overflow
- Attribution does not fit
- Component capacity conflict
- Unsupported image ratio
- Minimum font-size violation
- Layout overlap
- Missing required Slot

Repeating the same input in the same environment is expected to fail again.

Resolution may require:

- Design change
- Component change
- Content change
- Page split
- Asset replacement
- Theme adjustment within allowed rules

---

### Transient Infrastructure Error

Examples:

- Browser startup failure
- Worker process crash
- Temporary Object Storage failure
- Temporary file-system error
- Worker timeout
- Internal service interruption

A limited automatic retry is permitted.

---

## 34. Retry Policy

Only Transient Infrastructure Errors receive automatic retries.

Recommended conceptual behavior:

```text
Attempt 1
→ Transient failure
→ Retry

Attempt 2
→ Transient failure
→ Retry

Attempt 3
→ Failed
→ Surface error
```

The exact maximum attempt count remains an implementation decision.

Input Errors and Deterministic Render Errors must not enter uncontrolled retry loops.

Every retry must preserve:

- Attempt number
- Failure code
- Failure category
- Worker
- Renderer version
- Environment
- Start time
- Finish time

---

## 35. Atomic Final Rendering

A Final Render is atomic at the carousel level.

Example:

```text
Page 1 succeeded
Page 2 succeeded
Page 3 succeeded
Page 4 succeeded
Page 5 succeeded
Page 6 failed
Page 7 not accepted
Page 8 not accepted
```

The Final Render Job status is:

```text
failed
```

Successful temporary pages may be preserved for debugging.

They cannot be assembled into a formal Export Package.

Preview Render may display partial output with clearly marked failures.

---

## 36. Render Output and Export Package Separation

Render Output and Export Package are separate objects.

### Render Output represents:

- Exact generated image files
- Technical rendering metadata
- File hashes
- Validation results
- Environment Fingerprint
- Dependency versions
- Internal storage paths

### Export Package represents:

- User-facing final images
- Selected Platform Title
- Caption
- Hashtags
- Public References
- Simplified Manifest
- Delivery-ready file structure

Separating them allows ContentOS to reorganize an Export Package without rerendering images.

---

## 37. Xiaohongshu Export Package

Recommended MVP file structure:

```text
xiaohongshu-export/
├── images/
│   ├── 01-cover.png
│   ├── 02.png
│   ├── 03.png
│   └── ...
├── post.md
├── references.md
└── manifest.json
```

The package is publishing-ready but not automatically published.

---

## 38. Export Image Naming

Image files use zero-padded numbering.

Examples:

```text
01-cover.png
02.png
03.png
04.png
...
10.png
```

This protects page ordering across:

- File browsers
- ZIP archives
- Upload interfaces
- Operating systems

File names should not depend on unstable title text.

---

## 39. `post.md`

`post.md` contains the user-facing publishing copy.

Recommended structure:

```markdown
# 平台标题

选中的平台标题

## Caption

发布正文……

## CTA

互动问题或其他已批准 CTA。

## Hashtags

#AI产品经理 #AIAgent #MCP
```

It must derive from the Approved Xiaohongshu Artifact Version.

It is not an independently editable content source.

---

## 40. `references.md`

`references.md` contains reader-facing Source information.

It may include:

- Source title
- Author or organization
- Public URL
- Publication date when available
- Short attribution note
- References used in the carousel or Caption

It must not expose internal identifiers such as:

```text
researchver_002
claim_004
evidence_006
opresp_001
```

---

## 41. `manifest.json`

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.xhs-export-manifest/v1",

  "export_package_id": "export_001",
  "content_package_id": "cp_001",

  "dependencies": {
    "xiaohongshu_version_id": "xhsver_003",
    "design_version_id": "designver_002",
    "render_output_id": "renderout_003"
  },

  "content_mode": "creator_led",

  "platform": {
    "name": "xiaohongshu",
    "platform_profile_version": "xiaohongshu-content-profile/v1",
    "render_profile_version": "xiaohongshu-portrait/v1"
  },

  "files": [
    {
      "path": "images/01-cover.png",
      "page_id": "page_001",
      "sha256": "..."
    }
  ],

  "post_file": "post.md",
  "references_file": "references.md",

  "status": "ready",
  "created_at": "2026-07-26T17:10:00Z"
}
```

The Manifest supports:

- File integrity
- Dependency tracing
- Import or delivery tooling
- Historical review
- Future publishing adapters

---

## 42. Export Package Versioning

Export Packages are immutable and versioned.

An Export Package depends on:

```text
Approved Xiaohongshu Version
+
Approved Design Specification Version
+
Selected Final Render Output
```

If a new package is required, ContentOS creates a new Export Package.

It does not overwrite the old package.

Changing formal content such as:

- Platform Title
- Caption
- Hashtags
- References
- Page text

must first occur through the relevant Xiaohongshu Working Copy and Version workflow.

The Export Package must not become another independent editable content store.

---

## 43. Export Eligibility

A Xiaohongshu Export Package may be created only when:

- Xiaohongshu Version is approved
- Design Specification Version is approved
- Selected Final Render Output succeeded
- Render Validation has no Blocking Error
- All required assets are approved
- Platform Title is selected
- Caption is valid
- Required References exist
- Required Attribution is preserved
- Dependencies are not stale or outdated

Optional missing Hashtags may be treated as a Warning if product rules allow it.

---

## 44. Export Does Not Mean Published

The MVP ends at:

```text
Publishing-ready Export Package
```

It does not automatically publish to Xiaohongshu.

Recommended workflow:

```text
Generate Export Package
→ User checks images and copy
→ User manually uploads
→ User manually confirms publication
```

Generating an Export Package may create state:

```text
exported
```

It must not automatically create:

```text
published
```

Publication requires a separate explicit user action or future Publisher integration.

---

## 45. Historical Output Status

Example dependency chain:

```text
XHS v3
→ Design v2
→ Render Output v4
→ Export Package v1
```

If XHS v4 is later approved:

```text
Design v2
→ outdated

Render Output v4
→ outdated

Export Package v1
→ outdated
```

`outdated` means:

> The object is no longer the latest publishing candidate because a newer approved upstream version exists.

It does not mean:

- File corruption
- Historical invalidity
- Automatic deletion
- Inability to download

Historical outputs remain accessible.

---

## 46. Asset and Design Changes

A new approved Asset Version does not automatically rewrite an existing approved Design Specification.

The existing Design Specification continues to reference the old Asset Version.

To use the new Asset:

```text
Create or update Design Working Copy
→ Save new Design Version
→ Approve
→ Final Render
→ Create new Export Package
```

This prevents hidden visual changes.

---

## 47. Renderer Upgrade

A new Renderer Version does not automatically make historical Render Outputs outdated.

Historical outputs remain valid representations of their recorded environment.

The user or system may offer:

```text
Re-render with latest Renderer
```

This creates a new Render Job and Render Output.

Historical output should only be explicitly invalidated when it is known to be defective, for example:

- Corrupted file
- Critical security problem
- Confirmed incorrect rendering
- Inaccessible output
- Invalid Manifest
- Missing page

---

## 48. Blog Relationship

ContentOS Blog output remains:

```text
Blog Artifact
→ Blog Export Package
→ PersonalBlog
```

The Session-016 Render Engine does not initially:

- Build the PersonalBlog website
- Generate Blog detail pages
- Deploy Astro
- Generate public Blog URLs
- Apply PersonalBlog CSS
- Publish Blog content

The first Render Engine primarily supports Xiaohongshu visual output.

Future render or export profiles may support:

- Blog hero images
- LinkedIn carousels
- X graphics
- PDF documents
- Presentation pages
- Video covers

These are not MVP commitments.

---

## 49. Multi-platform Extension Principle

Future platforms should reuse the core rendering infrastructure where appropriate.

Conceptual model:

```text
Platform-specific Design Specification
+
Compatible Component Registry
+
Platform Render Profile
+
Render Engine
→ Platform Output
```

Potential future profiles:

```text
xiaohongshu_portrait/v1
linkedin_carousel/v1
x_landscape/v1
blog_hero/v1
```

A Design Specification is not assumed to be universally resizable.

Different platforms may require:

- Different content structure
- Different component choice
- Different visual hierarchy
- Different page count
- Different dimensions

Platform adaptation remains a future explicit workflow.

---

## 50. MVP Scope

### Included

- LLM-free Render Engine
- HTML/CSS page rendering
- Controlled Headless Chromium
- Registered components
- Versioned Render Profiles
- Preview Render
- Final Render
- Render Jobs
- Render Attempts
- Immutable Render Outputs
- Environment Fingerprint
- Controlled fonts
- Controlled local assets
- Deterministic Fit Strategy
- Actual overflow detection
- Render Validation
- Atomic final carousel rendering
- Structured error classification
- Limited transient retry
- Selected Final Render Output
- Xiaohongshu Export Package
- `images/`
- `post.md`
- `references.md`
- `manifest.json`
- Export eligibility checks
- Historical output retention
- Outdated propagation

### Deferred

- Canva as the primary Render Engine
- User-provided executable HTML or CSS
- Live external resource loading
- Video rendering
- Animation rendering
- PPTX rendering
- Full PDF layout
- PersonalBlog webpage rendering
- Automatic Xiaohongshu publishing
- Multi-region Render Workers
- Advanced image optimization
- Multiple rendering backends
- Automatic aesthetic scoring
- Universal cross-platform resizing
- Automatic historical output migration

---

# 51. Decisions

## DEC-111

### Status

Accepted

### Title

Render Engine 是无 LLM 的确定性执行层

### Decision

Render Engine generates pixel output from:

- Design Specification
- Component Registry
- Brand Theme
- Approved Assets
- Controlled Fonts
- Render Profile

It must not:

- Invoke an LLM
- Rewrite content
- Choose a new narrative
- Select a different visual strategy
- Generate new assets
- Modify the Design Specification

### Reason

Rendering must remain predictable, testable, reproducible, and auditable.

### Impact

All content and visual decisions must be completed before Render execution.

---

## DEC-112

### Status

Accepted

### Title

MVP 使用 HTML/CSS 组件与 Headless Chromium 作为主要渲染方案

### Decision

The MVP uses code-defined HTML/CSS Components rendered inside a controlled Headless Chromium environment.

Final pages are captured as PNG files.

SVG or Canvas may be used inside specialized components, but they are not the primary page-level architecture.

### Reason

HTML/CSS supports:

- Accurate text
- Chinese typography
- Fixed canvases
- Component reuse
- Browser Preview
- Layout measurement
- Automated screenshots

### Impact

Component Registry entries require executable web-component implementations.

The specific browser automation library remains a later technical decision.

---

## DEC-113

### Status

Accepted

### Title

渲染能力通过 Render Engine Interface 与版本化 Render Profile 抽象

### Decision

The domain model does not directly depend on a specific browser-control library.

Canvas dimensions, output format, quality constraints, and platform rendering requirements are supplied through a versioned Render Profile.

### Reason

This preserves future renderer and platform extension without overengineering the MVP implementation.

### Impact

Render Input and Render Output must record:

```text
render_profile_version
renderer_version
```

---

## DEC-114

### Status

Accepted

### Title

Preview Render 与 Final Render 使用不同资格规则

### Decision

Preview Render may consume:

- Design Working Copy
- Preview-eligible Asset Candidates
- Non-blocking warnings

Final Render may consume only:

- Approved Design Specification Version
- Approved Asset Versions
- Valid and current dependencies
- Controlled fonts and resources

Preview output is not eligible for formal export.

### Reason

Design iteration requires speed, while final delivery requires stable and audited dependencies.

### Impact

Every Render Job must record:

```text
preview
or
final
```

---

## DEC-115

### Status

Accepted

### Title

Render Job 与 Render Output 是独立、不可变且版本化的对象

### Decision

Every rendering execution creates a Render Job.

Every successful rendering creates a new immutable Render Output containing:

- Page files
- File hashes
- Dependency versions
- Render Environment Fingerprint
- Validation Result

Re-rendering never overwrites historical output.

### Reason

This supports:

- Debugging
- Rollback
- Reproducibility
- Renderer-version comparison
- Visual regression testing

### Impact

The domain model and Object Storage must support multiple Render Outputs per Design Version.

---

## DEC-116

### Status

Accepted

### Title

Render Output 与面向用户的 Export Package 分离

### Decision

Render Output represents internal pixel-generation results.

Export Package organizes:

- Final images
- Platform Title
- Caption
- CTA
- Hashtags
- Public References
- Delivery Manifest

for user-facing publishing preparation.

### Reason

Technical rendering results and user delivery packages have different responsibilities and change patterns.

### Impact

ContentOS requires an independent Export Pipeline and Export Package Contract.

---

## DEC-117

### Status

Accepted

### Title

小红书 MVP Export Package 使用图片目录、post.md、references.md 与 manifest.json

### Decision

The first Xiaohongshu Export Package contains:

```text
images/
post.md
references.md
manifest.json
```

Images use zero-padded page numbering.

The Package is publishing-ready but does not automatically publish.

### Reason

This structure is simple, portable, reviewable, and suitable for manual platform upload.

### Impact

The Export Pipeline must combine the Approved Xiaohongshu Artifact and selected Final Render Output.

---

## DEC-118

### Status

Accepted

### Title

Render Engine 仅执行受控组件，不允许任意 HTML、CSS、JavaScript 或实时外部资源

### Decision

Design Specification may reference only:

- Registered components
- Approved Theme Tokens
- Resolved Content Bindings
- Controlled local Assets
- Controlled Fonts
- Valid Render configuration

Final Render prohibits arbitrary executable content and live external dependencies.

### Reason

This reduces:

- Security risk
- Rendering drift
- External-resource failure
- Brand inconsistency
- Reproduction failure

### Impact

All formal rendering resources must be resolved before Final Render begins.

---

## DEC-119

### Status

Accepted

### Title

字体作为版本化 Render Dependency 管理

### Decision

Typography Tokens must resolve through a controlled Font Registry or Font Bundle.

Render Engine must not depend on random system fonts.

Missing required fonts are a Final Render Blocking Error.

### Reason

Font differences change:

- Line wrapping
- Text width
- Page density
- Overflow
- Pixel output

This is especially important for Chinese rendering.

### Impact

Technical implementation must define:

- Font files
- Font weights
- Character coverage
- License status
- Worker distribution
- Font Bundle Version

---

## DEC-120

### Status

Accepted

### Title

Render Engine 只允许有边界的确定性 Fit Strategy

### Decision

A Component may define a limited sequence of safe fitting actions such as:

- Compact spacing
- One-step typography reduction
- Registered compact variant
- Removal of optional decoration

Render Engine must not:

- Rewrite content
- Delete content
- Hide required Attribution
- Use unlimited font reduction
- Silently truncate
- Automatically split pages

If safe capacity cannot be achieved, rendering must fail and return upstream.

### Reason

Rendering adaptation must not damage content accuracy, completeness, or readability.

### Impact

Component Contracts must define:

- Allowed Fit Strategy
- Minimum typography
- Capacity rules
- Failure behavior

---

## DEC-121

### Status

Accepted

### Title

Final Render 必须通过实际布局与文件 Validation Gate

### Decision

Final Render must validate:

- File integrity
- Page quantity
- Page order
- Output dimensions
- Text overflow
- Element overlap
- Image loading
- Attribution visibility
- Font loading
- File hashes
- Dependency status

Any Blocking Error prevents Export Package creation.

### Reason

Design-stage Fit Preflight cannot replace actual browser layout measurement.

### Impact

Render Engine must produce a structured Render Validation Result.

---

## DEC-122

### Status

Accepted

### Title

Final Render 使用整组原子性结果

### Decision

A Xiaohongshu Final Render succeeds only when all expected pages render and pass validation.

Partial page success cannot produce a formal Export Package.

Preview may display partial output with explicit failure information.

### Reason

A missing or invalid page makes the carousel incomplete and unsafe to publish.

### Impact

Temporary successful pages may be retained for debugging, while Final Job status remains failed.

---

## DEC-123

### Status

Accepted

### Title

Render Error 分类决定重试与返回路径

### Decision

Render errors are classified as:

- Input Error
- Deterministic Render Error
- Transient Infrastructure Error

Only Transient Infrastructure Errors receive limited automatic retries.

Other errors return to the relevant Design, Asset, Packaging, or configuration stage.

### Reason

Unclassified retry loops increase cost and hide real design or input problems.

### Impact

Render Jobs require standardized:

- Error Code
- Error Classification
- Attempt history
- Suggested resolution path

---

## DEC-124

### Status

Accepted

### Title

上游变化使 Render Output 和 Export Package Outdated，但不删除历史文件

### Decision

When a newer approved XHS, Design, or required Asset Version replaces the current upstream dependency, dependent Render Outputs and Export Packages become `outdated`.

Historical files remain available.

A Renderer upgrade alone does not automatically make historical output outdated.

### Reason

Historical output remains a truthful representation of the versions and environment used at the time.

### Impact

ContentOS must preserve:

- Dependency graphs
- Historical outputs
- Current publishing candidate
- Outdated state
- Optional re-render action

---

## 52. Rejected or Deferred Approaches

### LLM-based Rendering

Rejected because rendering must not introduce another generative interpretation.

### AI-generated Complete Carousel Images

Rejected because exact text and layout cannot be guaranteed.

### Canva as the Core Render Engine

Rejected for the MVP because it would reduce control, reproducibility, and testability.

### Full-page Canvas or SVG as the Only Renderer

Rejected because HTML/CSS provides better typography and component flexibility for the current output.

### Arbitrary HTML, CSS, or JavaScript

Rejected because it creates security and stability risks.

### Live External Assets in Final Render

Rejected because external resources prevent reliable reproduction.

### Automatic Content Rewriting During Fit

Rejected because Render Engine does not own content.

### Unlimited Font Reduction

Rejected because it can produce unreadable output.

### Silent Truncation

Rejected because it hides content loss.

### Partial Final Export

Rejected because an incomplete carousel is not publishing-ready.

### Automatic Platform Publishing

Deferred because the MVP ends with a manually reviewed Export Package.

### Renderer Upgrade Overwriting History

Rejected because historical results must remain reproducible.

### PersonalBlog Rendering

Deferred because Blog publishing remains a separate project and integration boundary.

---

## 53. Open Questions

The following questions remain unresolved:

1. Which Headless Chromium control library will be used?
2. Will rendering execute in the application process or a separate Worker?
3. Which task-queue technology will be used?
4. How many Render retries are allowed?
5. What timeout applies per page?
6. What timeout applies per carousel?
7. Should Preview render all pages or only changed pages?
8. Which Preview format should be used?
9. Should Preview files be retained permanently?
10. How long should temporary render files remain?
11. Which Chinese font will be selected?
12. Which English font will be selected?
13. Which font weights are required?
14. How will font licensing be verified?
15. How will font assets be distributed to Workers?
16. Should fonts be embedded in the Runtime Image?
17. Which Render Profile fields are mandatory?
18. Which image-compression strategy will be used?
19. Should PNG metadata be removed?
20. Is WebP useful for Preview?
21. How will sRGB output be guaranteed?
22. Which browser flags are required?
23. How will layout stabilization be detected?
24. How will asynchronous image loading be awaited?
25. How will SVG diagrams signal completion?
26. How should component rendering errors be classified?
27. How should blank-page thresholds be defined?
28. Which DOM measurements become Blocking?
29. How should invisible text be detected?
30. How should image-crop errors be detected?
31. Should Final Render produce a thumbnail?
32. Should Final Render also produce a combined contact sheet?
33. Should the Export Package be ZIP-compressed?
34. How should users access the Export Package?
35. Should the system copy Caption directly to the clipboard?
36. Should `post.md` contain alternative titles?
37. Should unselected title candidates be exported?
38. How many Hashtags should be included?
39. Is `references.md` always required?
40. Should public Sources also appear in `post.md`?
41. How should Export Package warnings be displayed?
42. Can a Package be generated with missing optional Hashtags?
43. Should a new Export Package be created when only the selected Render Output changes?
44. How should Render Output selection history be represented?
45. How should old Render Outputs be retained or deleted?
46. What storage-retention policy applies?
47. When should an Output become `invalidated` rather than `outdated`?
48. How will visual regression testing be implemented?
49. Which reference snapshots will be stored?
50. How should cross-platform rendering be introduced later?

---

## 54. Documentation Updates

Create:

```text
docs/sessions/session-016.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-111
DEC-112
DEC-113
DEC-114
DEC-115
DEC-116
DEC-117
DEC-118
DEC-119
DEC-120
DEC-121
DEC-122
DEC-123
DEC-124
```

Future documents to create:

```text
docs/architecture/render-engine.md
docs/architecture/render-input-contract.md
docs/architecture/render-profile.md
docs/architecture/render-job.md
docs/architecture/render-output.md
docs/architecture/render-validation.md
docs/architecture/font-registry.md
docs/architecture/export-pipeline.md
docs/architecture/xiaohongshu-export-package.md
docs/product/render-preview.md
docs/product/export-workflow.md
```

Possible future Schema files:

```text
schemas/render-input-v1.json
schemas/render-profile-v1.json
schemas/render-job-v1.json
schemas/render-attempt-v1.json
schemas/render-output-v1.json
schemas/render-validation-result-v1.json
schemas/xiaohongshu-export-manifest-v1.json
schemas/export-package-v1.json
schemas/font-registry-v1.json
```

These paths are suggestions rather than final implementation decisions.

---

## 55. Documentation Sync Checklist

- [x] DEC-111 confirmed
- [x] DEC-112 confirmed
- [x] DEC-113 confirmed
- [x] DEC-114 confirmed
- [x] DEC-115 confirmed
- [x] DEC-116 confirmed
- [x] DEC-117 confirmed
- [x] DEC-118 confirmed
- [x] DEC-119 confirmed
- [x] DEC-120 confirmed
- [x] DEC-121 confirmed
- [x] DEC-122 confirmed
- [x] DEC-123 confirmed
- [x] DEC-124 confirmed
- [ ] Save this document as `docs/sessions/session-016.md`
- [ ] Add DEC-111 through DEC-124 to `docs/decisions/decisions.md`
- [ ] Define Render Engine Interface
- [ ] Define HTML/CSS Renderer Adapter
- [ ] Define Render Profile v1
- [ ] Define Render Input Contract
- [ ] Define Render Job and Attempt models
- [ ] Define Render Output Contract
- [ ] Define Render Environment Fingerprint
- [ ] Define controlled Font Registry
- [ ] Define Component Fit Strategy
- [ ] Define actual overflow checks
- [ ] Define Render Validation Result
- [ ] Define Render Error codes
- [ ] Define retry policy
- [ ] Define selected Final Render behavior
- [ ] Define Xiaohongshu Export Package Contract
- [ ] Define Export eligibility
- [ ] Define historical-output retention
- [ ] Review AGENTS.md after Render and Export specifications become authoritative

---

## 56. Session Summary

Render Engine is an LLM-free deterministic execution layer.

It converts an Approved Design Specification Version into exact image files using:

```text
Registered HTML/CSS Components
+
Brand Theme
+
Approved Assets
+
Controlled Fonts
+
Render Profile
+
Controlled Headless Chromium
```

SVG or Canvas may be used inside specialized components.

The domain layer remains abstracted from the specific browser automation library.

Preview Render supports fast design iteration.

Final Render requires approved and valid dependencies.

Every rendering execution creates a Render Job.

Every successful execution creates a new immutable Render Output.

Render Outputs preserve:

- Exact page files
- File hashes
- Dependency versions
- Renderer Version
- Environment Fingerprint
- Validation results

Render Output is distinct from Export Package.

The Xiaohongshu MVP Export Package contains:

```text
images/
post.md
references.md
manifest.json
```

The Export Package is publishing-ready but does not automatically publish.

Fonts, Components, Assets, Themes, and Render Profiles are controlled versioned dependencies.

Final Render prohibits arbitrary executable content and live external resources.

Render Engine may use only limited, predefined Fit Strategies.

It cannot rewrite, delete, silently truncate, or automatically split content.

Actual browser layout must be validated after rendering.

A Final Render succeeds only when every expected carousel page succeeds and passes validation.

Render errors are classified as:

```text
Input Error
Deterministic Render Error
Transient Infrastructure Error
```

Only transient infrastructure failures receive automatic retries.

When upstream approved content or design changes, dependent Render Outputs and Export Packages become `outdated`, while historical files remain preserved.