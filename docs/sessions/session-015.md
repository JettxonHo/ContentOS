# ContentOS Session-015

**Status:** Formalized  
**Session Type:** Visual Architecture, Design Contract, and Asset Strategy  
**Topic:** Visual Agent, Design Specification, Component Registry, Visual Assets, and Design Validation  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the following content-production chain:

```text
Approved Normalized Source Versions
→ Approved Research Result Version
→ Confirmed Human Opinion Version
→ Xiaohongshu Artifact Version
→ Visual Design
→ Rendered Images
```

Session-014 defined the Packaging Agent and Xiaohongshu Artifact contract.

The Packaging Agent produces:

- Platform Title
- Cover Title
- Cover Subtitle
- Page-level content
- Caption
- CTA
- Hashtags
- Page Purpose
- Content Density
- Emphasis
- Content-side Visual Brief
- Research and Human Opinion provenance

The unresolved questions were:

1. What is the Visual Agent responsible for?
2. Should the Visual Agent directly create final images?
3. What information must exist in a Design Specification?
4. How should page content map to visual components?
5. Should AI be allowed to design arbitrary layouts?
6. How should templates, diagrams, screenshots, icons, and generated illustrations be selected?
7. What is the boundary between Visual Agent, Image Generation Service, and Render Engine?
8. How should visual assets be versioned and reviewed?
9. How should Brand Theme and Component Registry be represented?
10. What happens when approved Xiaohongshu content changes?
11. Which validations must run before final rendering?

This Session defines the visual-planning architecture and the contract between Xiaohongshu content and deterministic rendering.

---

## 2. Core Visual Pipeline

The authoritative visual pipeline is:

```text
Approved Xiaohongshu Artifact Version
        ↓
Visual Agent
        ↓
Design Specification
        ↓
Design Validation
        ↓
Approved Design Specification Version
        ↓
Render Engine
        ↓
Rendered Output
```

Visual assets may be resolved through a parallel flow:

```text
Visual Agent
        ↓
Visual Asset Request
        ↓
Image Generation Service / Asset Processing
        ↓
Asset Registry
        ↓
Approved Asset Version
        ↓
Design Specification
```

The Visual Agent does not directly generate final image files.

---

## 3. Visual Agent Responsibility

The Visual Agent converts approved content into a structured and executable visual plan.

It is responsible for:

- Analyzing each page’s communication purpose
- Selecting an allowed visual component
- Mapping Xiaohongshu content fields into component slots
- Defining page-level visual hierarchy
- Selecting emphasis targets
- Determining whether a page needs:
  - Typography only
  - Icons
  - Deterministic diagram
  - Screenshot
  - Existing visual asset
  - Generated illustration
- Creating structured Visual Asset Requests
- Applying Brand Theme tokens
- Planning public-attribution placement
- Detecting content-fit problems
- Producing a Design Specification
- Returning visual warnings and blocking issues

The Visual Agent is not responsible for:

- Modifying Research
- Modifying Human Opinion
- Rewriting approved Xiaohongshu content
- Generating final PNG files
- Performing browser screenshot rendering
- Choosing arbitrary pixel coordinates
- Creating unrestricted CSS
- Searching the internet for unapproved images
- Approving assets
- Publishing content
- Inventing brand rules
- Automatically altering Source attribution

The responsibility boundary is:

```text
Packaging Agent
→ Defines what the page communicates

Visual Agent
→ Defines how the approved content should be visually structured

Image Generation Service
→ Produces requested visual assets

Render Engine
→ Produces deterministic final pixels
```

---

## 4. Visual Agent Must Not Modify Content

The Xiaohongshu Artifact remains the canonical source of content.

The Visual Agent must not silently:

- Remove a Supporting Point
- Rewrite a factual statement
- Shorten a Confirmed Human Opinion
- Delete Source attribution
- Change a quotation
- Replace terminology
- Add a new claim
- Create another editable copy of page text

If approved content does not fit an available component, the Visual Agent must:

1. Select a more suitable component.
2. Report a Content Fit Issue.
3. Recommend splitting the page.
4. Recommend shortening optional content.
5. Return the page to Packaging Review.
6. Block Design generation when necessary.

Example:

```json
{
  "type": "content_fit_issue",
  "page_id": "page_004",
  "severity": "blocking",
  "reason": "The approved page content exceeds all compatible component capacity limits.",
  "suggested_actions": [
    "split_page",
    "shorten_supporting_points",
    "remove_optional_example"
  ]
}
```

The Visual Agent may propose content changes, but the actual content modification must occur in the Xiaohongshu Content Working Copy.

---

## 5. Design Specification

The Design Specification is the authoritative contract between the Visual Agent and the Render Engine.

It is not:

- A natural-language design suggestion
- A generated image
- A screenshot
- An editable duplicate of the Xiaohongshu text
- A set of arbitrary coordinates
- An unrestricted CSS file

It is a structured object that describes:

- Canvas preset
- Page order
- Component selection
- Content bindings
- Visual hierarchy
- Theme tokens
- Emphasis
- Asset placement
- Attribution placement
- Overflow policy
- Dependency versions
- Render requirements

The transformation is:

```text
Approved Xiaohongshu Artifact
→ Structured visual configuration
→ Deterministic rendering
```

---

## 6. Design Specification Contract

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.design-spec/v1",

  "design_spec_id": "design_001",
  "design_version_id": "designver_001",
  "content_package_id": "cp_001",

  "version_number": 1,
  "parent_version_id": null,
  "status": "draft",

  "dependencies": {
    "xiaohongshu_version_id": "xhsver_003",
    "platform_profile_version": "xiaohongshu-content-profile/v1",
    "brand_theme_version": "contentos-default/1.0.0",
    "component_registry_version": "xhs-components/1.0.0",
    "asset_policy_version": "visual-asset-policy/v1"
  },

  "canvas": {
    "preset": "xiaohongshu_portrait",
    "width": 1080,
    "height": 1440,
    "pixel_ratio": 1
  },

  "pages": [],

  "assets": {
    "requests": [],
    "resolved_assets": []
  },

  "warnings": [],

  "generation": {
    "visual_agent_run_id": "run_visual_001"
  },

  "created_at": "2026-07-26T16:00:00Z"
}
```

This is a domain contract rather than a final database-table definition.

Canvas dimensions should ultimately come from the Platform Profile instead of being permanently embedded in the Visual Agent Prompt.

---

## 7. Page-level Design Specification

Recommended conceptual page structure:

```json
{
  "page_id": "page_003",
  "page_number": 3,

  "component": {
    "component_id": "single_point_with_diagram",
    "component_version": "1.0.0"
  },

  "content_bindings": {
    "heading": {
      "source_path": "pages[2].content.heading"
    },

    "primary_message": {
      "source_path": "pages[2].content.primary_message"
    },

    "supporting_points": {
      "source_path": "pages[2].content.supporting_points"
    },

    "attribution": {
      "source_path": "pages[2].public_attribution"
    }
  },

  "visual_hierarchy": {
    "primary": "heading",
    "secondary": "primary_message",
    "tertiary": "supporting_points"
  },

  "emphasis": [
    {
      "text": "重复集成",
      "token": "highlight_primary"
    }
  ],

  "asset_placement": {
    "slot": "diagram",
    "asset_ref": "assetver_004",
    "fit": "contain"
  },

  "theme_overrides": {},

  "attribution_placement": {
    "slot": "footer_attribution"
  },

  "overflow_policy": "block"
}
```

The Render Engine must not ask an LLM to reinterpret this page.

It should execute the selected component and bindings deterministically.

---

## 8. Content Binding

Design Specification references approved Xiaohongshu Artifact fields through structured bindings.

Recommended approach:

```text
Design Spec slot
→ Xiaohongshu Artifact field path
```

Example:

```json
{
  "heading": {
    "source_path": "pages[2].content.heading"
  }
}
```

The Design Specification should not store a second independently editable version of the heading.

This preserves:

- Single source of truth
- Reliable version dependency
- Diff clarity
- Consistent rendering
- Predictable invalidation
- Accurate provenance

If content changes, a new Xiaohongshu Version must be created and the Design Specification must be regenerated or migrated.

---

## 9. Component Registry

The Visual Agent may only choose components from a versioned Component Registry.

The MVP begins with a limited, code-implemented set of components.

Suggested initial components:

```text
cover_hero
single_point
bullet_explanation
comparison_split
process_flow
framework_grid
quote_focus
illustration_explanation
summary_takeaway
references_page
```

The actual initial Registry may contain fewer components if necessary for the first Vertical Slice.

---

## 10. Component Contract

Each component should define:

- Component ID
- Component version
- Supported Page Purposes
- Required slots
- Optional slots
- Slot capacity
- Supported Content Density
- Asset requirements
- Image aspect-ratio requirements
- Attribution support
- Supported Theme tokens
- Overflow behavior
- Rendering constraints

Example:

```json
{
  "component_id": "comparison_split",
  "version": "1.0.0",

  "supported_page_purposes": [
    "comparison"
  ],

  "supported_content_density": [
    "low",
    "medium"
  ],

  "slots": {
    "heading": {
      "required": true,
      "max_characters": 24
    },

    "left_title": {
      "required": true,
      "max_characters": 12
    },

    "left_points": {
      "required": true,
      "maximum_items": 3
    },

    "right_title": {
      "required": true,
      "max_characters": 12
    },

    "right_points": {
      "required": true,
      "maximum_items": 3
    },

    "attribution": {
      "required": false
    }
  }
}
```

---

## 11. Why the MVP Does Not Use Free-form AI Layout

Allowing the Visual Agent to freely generate arbitrary layout code would cause:

- Unstable output
- Difficult testing
- Inconsistent brand style
- Frequent content overflow
- Unpredictable rendering
- Difficult debugging
- Incompatible layout structures
- Hard-to-maintain generated CSS
- Unclear responsibility boundaries
- Large differences between repeated runs

The MVP therefore uses:

```text
AI component selection and configuration
+
Code-defined component behavior
```

rather than:

```text
AI-generated unrestricted layout
```

The Visual Agent acts as a component orchestrator.

It is not a free-canvas designer.

---

## 12. Component Selection

The Visual Agent selects components based on:

- Page Purpose
- Content Density
- Number of Supporting Points
- Presence of a quotation
- Presence of comparison structure
- Need for a diagram
- Need for an illustration
- Required Attribution
- Platform Profile
- Component capacity
- Available assets
- Brand Theme compatibility

Example mapping:

```text
page_purpose: comparison
→ comparison_split
```

```text
page_purpose: process
→ process_flow
```

```text
page_purpose: creator_opinion
→ quote_focus or single_point
```

Component selection must remain explainable and testable.

---

## 13. Visual Asset Categories

The Visual Agent may select among several visual-expression categories.

---

### 13.1 Typography-only

Uses:

- Heading
- Primary Message
- Supporting Points
- Emphasis
- Shapes
- Background
- Page number
- Attribution

Suitable for:

- Cover
- Opinion page
- Summary page
- Strong conclusion
- Short explanation

Typography-only is a valid first-class visual strategy.

A page does not require an illustration merely to appear complete.

---

### 13.2 System Icons

Uses approved icons from a stable icon source.

Suitable for:

- Bullet Points
- Feature categories
- Status
- Steps
- Simple concepts
- Repeated visual semantics

System icons should come from an approved icon set or internal registry.

They should not be regenerated through an image model for each page.

---

### 13.3 Deterministic Diagram

Generated from structured data using code.

Suitable for:

- Process flow
- Relationship graph
- Architecture overview
- Comparison
- Timeline
- Step sequence
- System connection
- Simple framework

Example:

```text
User
→ Agent
→ MCP
→ External Tool
```

The Visual Agent defines semantic nodes and connections.

A Diagram Renderer or Render Engine draws the diagram deterministically.

Technical and logical diagrams should prefer this method over image generation.

---

### 13.4 Screenshot or User-provided Asset

Includes:

- Product screenshots
- User-uploaded images
- Official UI captures
- Local reference graphics
- Approved Source images

Such assets should preserve:

- Original file
- Source or uploader
- Crop version
- Usage instructions
- Attribution requirement
- Basic permission or license state

Visual Agent may propose placement and crop behavior.

It must not alter the underlying factual meaning of a screenshot.

---

### 13.5 Reusable Asset Library

The system may reuse approved visual assets for recurring concepts.

Examples:

```text
AI Agent
RAG
MCP
Memory
Vector Database
Workflow
LLM
Prompt
Token
Embedding
```

Reusable assets support:

- Brand consistency
- Lower generation cost
- Faster content production
- Repeated concept recognition
- Stable visual language

The MVP may begin with a small Asset Registry rather than a complete semantic asset knowledge base.

---

### 13.6 Generated Illustration

Produced by an Image Generation Service.

Suitable for:

- Abstract metaphors
- Conceptual analogy
- Cover support
- Human-centered scenarios
- Educational illustration
- Situations difficult to express through icons or diagrams

Generated illustration should not be used merely as decorative filler.

Its purpose should be:

> Improve comprehension or strengthen an approved conceptual metaphor.

---

## 14. Visual Asset Selection Priority

Recommended selection order:

```text
Typography or standard component
        ↓
System icon
        ↓
Deterministic diagram
        ↓
Existing approved asset
        ↓
User-provided screenshot or image
        ↓
Generated illustration
```

Generated illustration is not the default.

It is selected only when it provides clear communication value.

The primary decision question is:

> Does the visual asset help the reader understand the content more quickly or accurately?

Not:

> Does the page need more decoration?

---

## 15. Generated Images Must Not Render Critical Text

Image Generation Service must not be responsible for producing:

- Chinese headings
- English headings requiring exact spelling
- Technical terms
- Numbers
- Process labels
- Direct quotations
- Attribution
- Page numbers
- Product names requiring accuracy
- Logo text
- UI button labels
- Code
- Data values

Correct flow:

```text
Image Generation Service
→ Creates text-free or non-critical visual asset

Render Engine
→ Places accurate text deterministically
```

Even when an image model can sometimes generate correct text, it must not be treated as a reliable rendering mechanism.

---

## 16. Generated Images Must Not Express Precise Logic

Image-generation models must not be used as the authoritative renderer for:

- Technical architecture
- Protocol topology
- Process direction
- Data relationships
- Exact timelines
- Numerical comparisons
- Product interface reproduction
- Official logos
- Factual diagrams

Example requiring deterministic rendering:

```text
Agent
→ MCP Client
→ MCP Server
→ Database
```

An image model may introduce:

- Incorrect arrows
- Missing nodes
- Duplicated nodes
- Incorrect labels
- Invented interfaces
- Misleading product logos
- Logical inconsistency

Precise information should therefore use deterministic diagrams.

---

## 17. Visual Asset Request

The Visual Agent creates a structured Visual Asset Request instead of sending an unrestricted image Prompt directly.

Recommended structure:

```json
{
  "asset_request_id": "assetreq_001",
  "page_id": "page_004",

  "asset_type": "generated_illustration",

  "purpose": "Use an office collaboration metaphor to explain how an Agent coordinates multiple tools.",

  "content_constraints": {
    "must_include": [
      "One coordinator assigning tasks",
      "Several assistants performing different tasks"
    ],

    "must_not_include": [
      "Readable text",
      "Real company logos",
      "Complex user interface",
      "Technical labels",
      "Watermark"
    ]
  },

  "style_constraints": {
    "style_profile": "brand-illustration/v1",
    "composition": "landscape",
    "background": "simple",
    "detail_level": "low"
  },

  "placement": {
    "target_component": "illustration_explanation",
    "target_slot": "illustration"
  },

  "status": "requested"
}
```

This allows the asset-generation layer to remain replaceable and auditable.

---

## 18. Image Generation Service Responsibility

Image Generation Service is infrastructure rather than an editorial decision-maker.

It is responsible for:

- Receiving a structured Asset Request
- Converting the request into a provider-specific Prompt
- Calling the configured image model
- Saving original generated outputs
- Creating previews and derivatives
- Recording provider and model metadata
- Recording request and generation parameters
- Handling retries
- Handling failures
- Producing asset candidates
- Creating versioned Asset records

It is not responsible for:

- Deciding whether a page needs an image
- Changing page content
- Choosing page layout
- Creating final page text
- Approving the asset
- Publishing the asset
- Replacing required diagrams with illustrations

---

## 19. Visual Asset Registry

Every non-trivial visual asset should be stored in a versioned Asset Registry.

Recommended structure:

```json
{
  "asset_id": "asset_004",
  "asset_version_id": "assetver_004",
  "version_number": 1,

  "asset_type": "generated_illustration",

  "origin": {
    "origin_type": "generated",
    "asset_request_id": "assetreq_001",
    "generation_run_id": "imgrun_001",
    "provider": "configured-image-provider",
    "model": "configured-model"
  },

  "storage": {
    "original_object_key": "assets/asset_004/v1/original.png",
    "preview_object_key": "assets/asset_004/v1/preview.png"
  },

  "metadata": {
    "width": 1536,
    "height": 1024,
    "mime_type": "image/png"
  },

  "rights": {
    "license_status": "generated_asset",
    "attribution_required": false,
    "attribution_text": null
  },

  "status": "pending_review"
}
```

This is a conceptual contract.

---

## 20. Asset Versioning

Assets are immutable and versioned.

Regeneration or replacement must not overwrite previous files.

Example:

```text
Asset v1
→ First generated candidate

Asset v2
→ Revised visual style

Asset v3
→ Approved crop
```

Alternatively, multiple candidate assets may share one Asset Request while retaining independent Asset IDs.

Historical Design Specifications must continue to reference the exact Asset Version they used.

---

## 21. Asset Review States

Recommended Asset states:

```text
requested
generating
generated
pending_review
approved
rejected
failed
superseded
```

Only an `approved` Asset Version may be used for final rendering.

A `pending_review` asset may appear in preview workflows, but final export must not depend on it.

---

## 22. Asset Origin and Attribution

The system should record the origin of each visual asset.

Possible `origin_type` values:

```text
generated
user_upload
source_snapshot
library
system_icon
screenshot
licensed_asset
deterministic_diagram
```

Recommended provenance fields:

- Origin type
- Source reference
- Uploader
- Generation run
- Model provider
- Storage location
- Attribution requirement
- License or permission status
- Crop or derivative relationship

Example:

```json
{
  "origin_type": "user_upload",
  "source_reference": null,
  "license_status": "user_asserted_permission",
  "attribution_required": false,
  "attribution_text": null
}
```

ContentOS does not perform complete legal copyright determination in the MVP.

However, it must not discard known origin and attribution information.

---

## 23. Brand Theme

Visual style should not be scattered across:

- Prompt text
- Agent instructions
- Component code
- Ad hoc CSS
- User conversation
- Image prompts

ContentOS uses a versioned Brand Theme.

Recommended conceptual structure:

```json
{
  "theme_id": "contentos-default",
  "theme_version": "1.0.0",

  "tokens": {
    "color": {
      "background_primary": "...",
      "background_secondary": "...",
      "text_primary": "...",
      "text_secondary": "...",
      "accent_primary": "...",
      "accent_secondary": "...",
      "warning": "..."
    },

    "typography": {
      "display": "...",
      "heading": "...",
      "body": "...",
      "caption": "..."
    },

    "spacing": {},
    "radius": {},
    "border": {},
    "shadow": {}
  },

  "illustration_profile": {
    "style": "minimal_editorial",
    "complexity": "low",
    "text_in_image": false
  }
}
```

The actual values remain unresolved until implementation and visual-brand design.

---

## 24. Theme Tokens

Visual Agent should refer to approved Token names instead of arbitrary values.

Example:

```json
{
  "text_token": "text_primary",
  "background_token": "background_primary",
  "emphasis_token": "accent_primary"
}
```

Visual Agent should not output:

```json
{
  "text_color": "#141414",
  "background_color": "#F8F8F8"
}
```

unless those values are resolved by the Theme system.

This keeps:

- Brand consistency
- Theme migration
- Testability
- Component portability
- Centralized style control

---

## 25. Component Registry and Brand Theme Separation

Component Registry and Brand Theme solve different problems.

### Component Registry

Defines:

- Page structure
- Available slots
- Content capacity
- Asset placement
- Supported Page Purposes
- Layout relationships
- Overflow behavior

### Brand Theme

Defines:

- Colors
- Typography
- Spacing
- Radius
- Border
- Shadow
- Illustration style
- Visual identity

The same component may eventually support multiple Brand Themes.

Example:

```text
comparison_split
+
ContentOS Default Theme
```

or later:

```text
comparison_split
+
Minimal Technical Theme
```

The MVP only needs one approved default Theme.

---

## 26. Visual Agent Input Contract

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.visual-input/v1",

  "content_package_id": "cp_001",
  "xiaohongshu_version_id": "xhsver_003",

  "dependencies": {
    "platform_profile_version": "xiaohongshu-content-profile/v1",
    "brand_theme_version": "contentos-default/1.0.0",
    "component_registry_version": "xhs-components/1.0.0",
    "asset_policy_version": "visual-asset-policy/v1"
  },

  "approved_xiaohongshu_artifact": {},
  "available_assets": [],
  "available_icons": [],

  "generation_policy": {
    "generated_images_allowed": true,
    "maximum_generated_assets": 3,
    "prefer_existing_assets": true
  }
}
```

The exact generation-policy fields remain subject to implementation design.

---

## 27. Visual Asset Policy

A versioned Asset Policy may define:

- Allowed Asset Types
- Maximum generated illustrations per carousel
- When deterministic diagrams are required
- When screenshots are allowed
- Whether text may appear inside generated images
- Minimum resolution
- Accepted formats
- Required attribution fields
- Approval requirements
- Fallback order
- Restricted content categories

The Visual Agent must follow the configured Asset Policy rather than making unrestricted asset decisions.

---

## 28. Design Working Copy and Versions

Design uses the same foundational editing model:

```text
Mutable Design Working Copy
+
Immutable Design Specification Versions
```

Recommended flow:

```text
Visual Agent generates Design Spec v1
        ↓
Create Design Working Copy
        ↓
Generate preview
        ↓
User reviews design
        ↓
User changes component, emphasis, or asset
        ↓
Save Design Spec v2
        ↓
Approve Design Spec v2
        ↓
Final Render
```

Normal design edits update the Working Copy.

Meaningful checkpoints create immutable Design Versions.

---

## 29. Design Approval

Only an Approved Design Specification Version may be used for final rendering and export.

A Design Specification may be:

```text
draft
in_review
approved
outdated
render_incompatible
superseded
archived
```

Preview rendering may be allowed for Draft or In-review Design Specifications.

Final export requires `approved`.

---

## 30. User-editable Design Properties

The MVP Design Workspace may allow the user to change:

- Component selection
- Asset candidate
- Whether an optional image is used
- Emphasis targets
- Content-density presentation
- Asset crop mode
- Allowed Theme variant
- Attribution placement
- Approved background token
- Approved emphasis token
- Optional decorative element

The user should not edit canonical Xiaohongshu text inside the Design Workspace.

If the user needs to change:

- Heading
- Primary Message
- Supporting Points
- Quote
- Attribution wording
- Caption
- Platform Title

the workflow must return to the Xiaohongshu Content Working Copy.

---

## 31. Content Change Invalidation

Example dependency:

```text
Xiaohongshu v3
→ Design Spec v2
→ Render Output v4
```

The user later approves:

```text
Xiaohongshu v4
```

The previous Design and Render outputs remain preserved but become:

```text
Design Spec v2
status: outdated
```

```text
Render Output v4
status: outdated
```

ContentOS may create a Design Migration Proposal.

The migration may attempt to:

- Preserve compatible components
- Preserve approved assets
- Preserve Theme choice
- Preserve attribution position
- Map unchanged Page IDs
- Identify changed pages

The migration must not silently treat the previous Design Specification as current.

---

## 32. Page Identity and Migration

Stable Xiaohongshu Page IDs are important for Design migration.

If:

```text
page_003
```

still exists in the new Xiaohongshu Version and its content has not materially changed, the system may reuse compatible design decisions.

If a page is:

- Deleted
- Split
- Merged
- Reordered
- Substantially rewritten
- Changed in Page Purpose

the Design migration must flag it for review.

---

## 33. Theme Updates

A new Brand Theme Version does not automatically rewrite historical Design Specifications.

Example:

```text
Design Spec v1
→ Theme v1
```

Theme v2 may later be released.

The historical Design remains reproducible with Theme v1.

The user may choose:

```text
Reapply latest theme
```

which creates a new Design Specification Version.

A Theme update alone does not make historical design invalid.

---

## 34. Component Registry Updates

A Design Specification records the exact Component Registry Version used.

Historical components remain available where feasible.

If a component becomes unavailable or incompatible, the Design Specification may become:

```text
render_incompatible
```

ContentOS should then offer:

- Component migration
- Replacement component
- Reapply latest Component Registry
- Manual design review

Registry updates must not silently change historical rendered output.

---

## 35. Asset Failure Fallback

A generated image or processed asset must not become an unnecessary single point of failure.

Possible fallback actions:

```text
retry
select_alternative_candidate
reuse_library_asset
use_system_icon
use_deterministic_diagram
use_typography_only_component
remove_optional_image
request_user_asset
block_design
```

The correct fallback depends on the page’s communication requirement.

Example:

### Optional cover illustration fails

Possible fallback:

```text
Typography-only Cover
```

### Required technical relationship diagram fails

Possible fallback:

```text
Use deterministic diagram
```

It must not fall back to an inaccurate generated illustration.

---

## 36. Asset Review

Generated and uploaded assets may require review before final use.

Review may inspect:

- Whether the asset supports the page purpose
- Whether it contains accidental text
- Whether it contains inaccurate symbols
- Whether it introduces unrelated elements
- Whether it contains a false product UI
- Whether visual style matches Brand Theme
- Whether the image is appropriate for crop
- Whether attribution is required
- Whether the resolution is sufficient
- Whether the asset is misleading

Approval applies to a specific Asset Version.

---

## 37. Design Validation Gate

Design Specification must pass deterministic validation before final Render.

Validation categories:

```text
Schema Validation
Content Binding Validation
Component Compatibility Validation
Theme Validation
Asset Validation
Fit Preflight
Attribution Validation
Dependency Validation
```

A valid JSON object is not automatically a valid or renderable design.

---

## 38. Schema Validation

Checks include:

- Design Spec Schema version
- Required identifiers
- Dependency versions
- Canvas fields
- Page list
- Stable Page IDs
- Component IDs
- Component versions
- Content bindings
- Theme tokens
- Asset references
- Overflow policy
- Generation metadata

Malformed Design Specifications cannot enter normal preview or final-render workflows.

---

## 39. Content Binding Validation

Checks include:

- Every binding resolves to the Approved Xiaohongshu Artifact
- No canonical content was silently rewritten
- Required content is not missing
- Page Count matches
- Page order matches
- Page IDs match
- Required Attribution remains bound
- Quote content remains unchanged
- Content Mode remains consistent

A Design Specification must not contain a hidden alternate copy of the content.

---

## 40. Component Compatibility Validation

Checks include:

- Page Purpose is supported by the component
- Required slots are bound
- Optional-slot rules are respected
- Content count is within component limits
- Heading length fits expected range
- Supporting Points do not exceed capacity
- Required Attribution slot exists
- Asset aspect ratio is supported
- Component version exists
- Component supports the selected Theme

---

## 41. Theme Validation

Checks include:

- Theme Version exists
- All referenced Tokens exist
- No unapproved arbitrary values are used
- Text and background Token combinations are valid
- Component supports the Theme
- Emphasis Tokens are allowed
- Optional Theme overrides are permitted
- Illustration Style Profile exists when required

Accessibility or contrast rules may later become part of Theme Validation.

---

## 42. Asset Validation

Checks include:

- Asset exists
- Asset Version exists
- Asset is approved
- Asset type is permitted
- Resolution is sufficient
- Aspect ratio is usable
- Origin metadata exists
- Required Attribution exists
- License or permission status is recorded
- Generated image does not contain critical text
- Screenshot meaning is not distorted
- Asset matches target slot
- Asset has not been superseded where policy prohibits use

---

## 43. Fit Preflight

Fit Preflight estimates whether content can fit safely before final rendering.

Checks may include:

- Heading length
- Primary Message length
- Supporting Point count
- Supporting Point length
- Quote length
- Attribution length
- Image-to-text balance
- Component capacity
- Minimum font-size constraints
- Cover density
- Footer density

Fit Preflight is an estimate.

Final overflow detection still occurs during actual rendering.

---

## 44. Attribution Validation

Checks include:

- Required Attribution remains present
- Attribution is placed in a supported slot
- Attribution text has not been altered incorrectly
- Direct Quote attribution remains visible
- Screenshot attribution is included when required
- Asset attribution is included when required
- Attribution is not hidden through styling
- Attribution is not cropped from the page

Visual design may change placement but may not remove required attribution.

---

## 45. Dependency Validation

Checks include:

- Xiaohongshu Version exists
- Xiaohongshu Version is approved
- Xiaohongshu Version is not outdated
- Platform Profile Version exists
- Brand Theme Version exists
- Component Registry Version exists
- Asset Policy Version exists
- Referenced Asset Versions exist
- Required assets are approved
- All dependencies remain accessible

Final rendering must not proceed with stale or missing dependencies.

---

## 46. Validation Severity

Validation findings are divided into two levels.

### Blocking Error

Examples:

- Missing component
- Missing required Slot Binding
- Silent content modification
- Missing required Attribution
- Unapproved asset
- Missing asset
- Unsupported component-purpose combination
- Content exceeds all allowed component capacity
- Outdated Xiaohongshu dependency
- Critical text embedded only inside generated image
- Invalid Theme Token
- Inaccessible dependency

Blocking Errors prevent approval or final rendering.

### Warning

Examples:

- Page is close to maximum capacity
- Generated illustration adds limited explanatory value
- Asset crop may remove important subject matter
- Attribution region is visually crowded
- Asset resolution is marginal
- Too many consecutive pages use the same component
- Too many generated illustrations are requested
- Page may render with reduced visual hierarchy
- Optional asset remains under review

Warnings may enter preview review but must remain visible.

---

## 47. Visual Agent Completion Status

Visual Agent execution may return:

```text
success
partial
blocked
```

### `success`

Design Specification is complete and passes all Blocking Validation.

### `partial`

A usable Design Specification or preview exists, but includes:

- Warnings
- Pending optional assets
- Near-capacity pages
- Alternative component suggestions
- Asset-review requirements

### `blocked`

A valid Design Specification cannot be completed.

Possible reasons:

- Approved Xiaohongshu Version is unavailable
- No component can safely fit the content
- Required attribution cannot be placed
- Essential asset generation failed
- Asset origin or permission status is insufficient
- Component Registry does not support the Page Purpose
- Required dependencies are missing
- Content must return to Packaging Review

---

## 48. End-to-End Visual Flow

```text
Approved Xiaohongshu Artifact Version
        ↓
Validate content dependency
        ↓
Visual Agent analyzes Page Purposes
        ↓
Select components from Component Registry
        ↓
Create Content Bindings
        ↓
Define visual hierarchy and emphasis
        ↓
Resolve existing assets
        ↓
Create Asset Requests where necessary
        ↓
Image Generation / Asset Processing
        ↓
Asset Review
        ↓
Complete Design Specification
        ↓
Design Validation Gate
        ↓
Create Design Working Copy
        ↓
Generate preview render
        ↓
User reviews design
        ↓
Save immutable Design Specification Version
        ↓
Approve Design Specification Version
        ↓
Final Render Engine
```

---

## 49. MVP Scope

### Included

- Approved Xiaohongshu input only
- Visual Agent
- Structured Design Specification
- Limited Component Registry
- One default Brand Theme
- Theme Tokens
- Content Bindings
- Typography-only pages
- System icons
- Deterministic diagrams
- User-provided assets
- Small reusable Asset Registry
- Optional generated illustrations
- Structured Asset Requests
- Image Generation Service boundary
- Asset versions and approval
- Design Working Copy
- Immutable Design Versions
- Preview rendering
- Design Validation
- Content-fit reporting
- Asset-failure fallbacks

### Deferred

- Figma-style free canvas
- Arbitrary CSS editing
- Unlimited custom components
- Multiple full Brand Themes
- Automatic brand-style learning
- Automatic internet image search
- Full copyright determination
- Complex asset-rights automation
- Automatic screenshot capture from authenticated products
- AI-generated final carousel images
- AI-generated critical text
- AI-generated technical diagrams
- Full semantic visual-asset knowledge base
- Collaborative multi-user design editing
- Automatic historical Design migration without review

---

# 50. Decisions

## DEC-098

### Status

Accepted

### Title

Visual Agent 将已批准内容转换为 Design Specification，而不直接生成最终图片

### Decision

Visual Agent is responsible for:

- Component selection
- Content Binding
- Visual hierarchy
- Emphasis
- Visual Asset requirements
- Attribution placement
- Design Specification generation

Visual Agent does not:

- Render final PNG files
- Modify approved content
- Perform final export
- Approve visual assets
- Publish output

### Reason

Visual planning, asset generation, and deterministic rendering have different responsibilities, dependencies, and failure modes.

### Impact

Visual Agent, Image Generation Service, and Render Engine remain separate system capabilities.

---

## DEC-099

### Status

Accepted

### Title

Design Specification 是 Visual Agent 与 Render Engine 之间的权威契约

### Decision

Design Specification must structurally describe:

- Canvas
- Page Component
- Content Binding
- Theme Tokens
- Visual hierarchy
- Emphasis
- Asset Placement
- Attribution Placement
- Overflow Policy
- Dependency Versions

Render Engine executes the Design Specification deterministically.

It must not ask an LLM to reinterpret page content during rendering.

### Reason

Natural-language design instructions cannot provide stable testing, reproducibility, or rendering behavior.

### Impact

Design Specification requires:

- Formal Schema
- Versioning
- Validation
- Approval
- Dependency tracking

---

## DEC-100

### Status

Accepted

### Title

Visual Agent 只能从版本化 Component Registry 中选择组件

### Decision

The MVP uses a limited, code-implemented Component Registry.

Visual Agent may select and configure registered components.

It may not freely create arbitrary layouts, coordinates, or unrestricted CSS.

### Reason

Component constraints support:

- Predictable rendering
- Brand consistency
- Content capacity control
- Automated validation
- Reusability
- Easier testing
- Easier debugging

### Impact

Each component must define:

- Supported Page Purposes
- Slots
- Capacity
- Asset requirements
- Attribution support
- Theme compatibility
- Overflow behavior

---

## DEC-101

### Status

Accepted

### Title

ContentOS 使用混合视觉资产策略

### Decision

Visual Agent may choose among:

- Typography
- System Icons
- Deterministic Diagrams
- Screenshots or User Assets
- Reusable Asset Library
- Generated Illustrations

Visual Agent should prefer deterministic and existing assets.

Generated illustration is used only when it provides meaningful comprehension value.

### Reason

Using generated images on every page would reduce:

- Information accuracy
- Production stability
- Brand consistency
- Content density
- Visual coherence

### Impact

Visual Agent must record:

- Selected Asset Type
- Communication purpose
- Asset request
- Fallback options

---

## DEC-102

### Status

Accepted

### Title

AI 图片不得承担关键文字或精确信息表达

### Decision

Generated images must not be responsible for:

- Titles
- Technical terms
- Numbers
- Process labels
- Direct quotations
- Attribution
- Page numbers
- Exact technical architecture
- Accurate product interfaces

Critical text is rendered deterministically by Render Engine.

Precise diagrams are rendered by deterministic Diagram components or a Diagram Renderer.

### Reason

Image-generation models cannot reliably preserve exact text and information structure.

### Impact

Visual Asset Policy and Design Validation must restrict image-generation usage.

---

## DEC-103

### Status

Accepted

### Title

Image Generation Service 与 Visual Agent、Render Engine 分离

### Decision

Visual Agent creates structured Asset Requests.

Image Generation Service is responsible for:

- Provider-specific Prompt generation
- Model invocation
- File storage
- Retry handling
- Candidate generation
- Asset Version creation
- Generation metadata

Render Engine only consumes approved Asset Versions.

### Reason

Visual decision-making, generative-model execution, and deterministic page rendering are separate responsibilities.

### Impact

ContentOS requires:

- Visual Asset Request Contract
- Image Generation Result Contract
- Asset Registry
- Asset approval workflow

---

## DEC-104

### Status

Accepted

### Title

所有视觉资产使用版本化 Asset Registry 并保留来源信息

### Decision

Images, screenshots, illustrations, reusable graphics, and uploaded assets record:

- Asset ID
- Asset Version
- Origin Type
- Storage Reference
- Approval Status
- Attribution requirements
- Basic permission or license state

Regeneration or replacement must not overwrite historical Asset Versions.

### Reason

Visual assets require the same traceability, reviewability, and reproducibility as text Artifacts.

### Impact

Object Storage and the domain model must support versioned visual assets.

---

## DEC-105

### Status

Accepted

### Title

Brand Theme 与 Component Registry 作为独立的版本化输入

### Decision

Component Registry defines layout and structural capability.

Brand Theme defines:

- Color Tokens
- Typography Tokens
- Spacing
- Borders
- Radius
- Shadow
- Illustration Profile

Visual Agent records the exact Component Registry and Brand Theme versions used.

### Reason

Layout structure and brand appearance are different concerns.

Combining them would reduce maintainability and future theme portability.

### Impact

The same component may later support multiple Themes.

The MVP requires only one approved default Theme.

---

## DEC-106

### Status

Accepted

### Title

Visual Agent 只消费 Approved Xiaohongshu Artifact Version

### Decision

Visual Agent does not consume a temporary Xiaohongshu Working Copy.

Every Design Specification must reference a specific Approved Xiaohongshu Artifact Version.

### Reason

Visual design requires stable:

- Page content
- Page order
- Page IDs
- Attribution
- Provenance
- Content dependencies

### Impact

When a newer Xiaohongshu Version is approved, dependent Design Specifications and Render Outputs may become `outdated`.

---

## DEC-107

### Status

Accepted

### Title

Design Specification 使用 Working Copy 与不可变版本

### Decision

Design editing occurs in a Mutable Design Working Copy.

Meaningful design checkpoints create immutable Design Specification Versions.

Only an Approved Design Specification Version may be used for final rendering.

### Reason

The product must support both:

- Flexible design editing
- Stable rendering and audit history

### Impact

Design Workspace needs:

- Autosave
- Version creation
- Preview
- Approval
- Rollback
- Version comparison

---

## DEC-108

### Status

Accepted

### Title

Visual Agent 不得静默修改 Xiaohongshu 内容

### Decision

If approved content does not fit available components, Visual Agent must:

- Select a different component
- Create a Content Fit Issue
- Recommend splitting the page
- Recommend shortening optional content
- Return to Packaging Review
- Block the Design workflow when necessary

The Design Specification must not maintain another independently editable copy of the Xiaohongshu text.

### Reason

Xiaohongshu Artifact must remain the single source of truth for page content.

### Impact

Design content is represented through Content Bindings rather than duplicated editable text.

---

## DEC-109

### Status

Accepted

### Title

视觉资产失败必须具有确定性降级路径

### Decision

When image generation or asset processing fails, the workflow may:

- Retry
- Select another candidate
- Reuse an approved library asset
- Use a system icon
- Use a deterministic diagram
- Use a Typography-only component
- Remove an optional image
- Request a user-provided asset
- Block the workflow when the asset is essential

### Reason

Generated visual assets must not become a single point of failure for the full carousel.

### Impact

Visual workflow and Chief Editor orchestration need asset-level fallback handling.

---

## DEC-110

### Status

Accepted

### Title

Design Specification 进入最终 Render 前必须通过确定性 Validation Gate

### Decision

Design Specification must pass:

- Schema Validation
- Content Binding Validation
- Component Compatibility Validation
- Theme Validation
- Asset Validation
- Fit Preflight
- Attribution Validation
- Dependency Validation

Blocking Errors must be resolved.

Warnings may enter Preview Review with visible disclosure.

### Reason

Schema-valid design output may still be visually invalid, unsafe, incompatible, or impossible to render.

### Impact

Independent Design Validators are required outside the Visual Agent.

---

## 51. Rejected or Deferred Approaches

### Visual Agent Directly Generating Final Images

Rejected because visual planning and rendering require separate, testable layers.

### AI-generated Complete Xiaohongshu Page Images

Rejected because image models cannot reliably render critical text, data, and layout.

### Arbitrary AI-generated Layout

Rejected because it creates unstable output and prevents deterministic validation.

### Duplicate Editable Content in Design Specification

Rejected because it would create competing content sources.

### Generated Images for Precise Technical Diagrams

Rejected because logical accuracy cannot be guaranteed.

### Generated Image on Every Page

Rejected because illustrations should serve comprehension rather than decoration.

### Automatic Internet Image Search

Deferred because the MVP requires controlled asset origin and approval.

### Unapproved Assets in Final Render

Rejected because final output must depend only on approved Asset Versions.

### Automatic Historical Theme Migration

Deferred because Theme changes should create a new Design Version rather than silently rewrite history.

### Figma-style Free Canvas

Deferred because it would significantly expand editor, layout, versioning, and rendering complexity.

### Full Automated Copyright Determination

Deferred because the MVP can preserve provenance but cannot guarantee legal rights analysis.

---

## 52. Open Questions

The following questions remain unresolved:

1. Which exact components belong in Component Registry v1?
2. How many components are sufficient for the first Vertical Slice?
3. Which components support Cover pages?
4. Which components support Public Attribution?
5. Which component-capacity rules should use character count?
6. Which capacity rules should use rendered measurement?
7. How should Chinese and English capacity differ?
8. How should component selection confidence be represented?
9. Can the user manually override a Visual Agent component choice?
10. Should a component override require revalidation?
11. Which Theme Tokens belong in Brand Theme v1?
12. Which fonts will be used?
13. How will font licensing be handled?
14. Which color contrast rules will apply?
15. Will the MVP allow Theme variants?
16. How many generated illustrations may one carousel contain?
17. Which page purposes may request a generated illustration?
18. Should cover illustration generation be enabled by default?
19. How should image candidate selection work?
20. How many image candidates should be generated?
21. Does rejecting an image create a new Asset Version or only change status?
22. How should crops be versioned?
23. Should a crop be a derivative Asset Version?
24. How should Source images be imported into Asset Registry?
25. How should screenshot attribution be represented?
26. How should user-upload permissions be confirmed?
27. Which image formats are accepted?
28. What minimum resolution is required?
29. How should transparent images be handled?
30. Which deterministic-diagram types belong in the MVP?
31. Should diagrams be rendered inside Render Engine or a separate Diagram Renderer?
32. How should diagram nodes and edges be modeled?
33. How should icons be sourced and versioned?
34. Should system icons be copied into Object Storage?
35. How should Content Fit Issues return to Packaging Agent?
36. Can Design Migration preserve component choices after content edits?
37. Which changes make a page materially different?
38. How should page splits and merges affect Design migration?
39. Should a Design Spec become outdated after a Platform Profile update?
40. Should a Design Spec become outdated after Brand Theme update?
41. When should a historical Design become `render_incompatible`?
42. Which validations run during Preview?
43. Which validations rerun during Final Render?
44. How should user design edits appear in Diff?
45. Should approved Designs be manually editable?
46. Does editing an approved Design always create a new Working Copy?
47. How should warnings appear in Design Workspace?
48. How should Asset-review warnings affect Design approval?
49. Can a Design be approved while an optional asset is pending?
50. How should final rendered output retain Asset and Theme provenance?

---

## 53. Documentation Updates

Create:

```text
docs/sessions/session-015.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-098
DEC-099
DEC-100
DEC-101
DEC-102
DEC-103
DEC-104
DEC-105
DEC-106
DEC-107
DEC-108
DEC-109
DEC-110
```

Future documents to create:

```text
docs/agents/visual-agent.md
docs/architecture/visual-input-contract.md
docs/architecture/design-specification.md
docs/architecture/component-registry.md
docs/architecture/brand-theme.md
docs/architecture/visual-asset-policy.md
docs/architecture/visual-asset-request.md
docs/architecture/asset-registry.md
docs/architecture/image-generation-service.md
docs/architecture/design-validation.md
docs/product/design-workspace.md
```

Possible future Schema files:

```text
schemas/visual-input-v1.json
schemas/design-specification-v1.json
schemas/design-page-v1.json
schemas/component-definition-v1.json
schemas/brand-theme-v1.json
schemas/visual-asset-policy-v1.json
schemas/visual-asset-request-v1.json
schemas/visual-asset-v1.json
schemas/design-validation-result-v1.json
schemas/content-fit-issue-v1.json
```

These paths are suggestions and are not yet final implementation decisions.

---

## 54. Documentation Sync Checklist

- [x] DEC-098 confirmed
- [x] DEC-099 confirmed
- [x] DEC-100 confirmed
- [x] DEC-101 confirmed
- [x] DEC-102 confirmed
- [x] DEC-103 confirmed
- [x] DEC-104 confirmed
- [x] DEC-105 confirmed
- [x] DEC-106 confirmed
- [x] DEC-107 confirmed
- [x] DEC-108 confirmed
- [x] DEC-109 confirmed
- [x] DEC-110 confirmed
- [ ] Save this document as `docs/sessions/session-015.md`
- [ ] Add DEC-098 through DEC-110 to `docs/decisions/decisions.md`
- [ ] Define Visual Agent Input Contract
- [ ] Define Design Specification Schema
- [ ] Define Page-level Design Schema
- [ ] Define Content Binding model
- [ ] Define Component Registry v1
- [ ] Define Brand Theme v1
- [ ] Define Asset Policy v1
- [ ] Define Visual Asset Request Contract
- [ ] Define Asset Registry Contract
- [ ] Define Image Generation Service Contract
- [ ] Define Asset Review workflow
- [ ] Define Content Fit Issue Contract
- [ ] Define Design Working Copy behavior
- [ ] Define Design Approval rules
- [ ] Define Design Validation results
- [ ] Define Design Migration behavior
- [ ] Review AGENTS.md after Visual and Render specifications become authoritative

---

## 55. Session Summary

The Visual Agent does not directly generate final Xiaohongshu images.

It converts a specific Approved Xiaohongshu Artifact Version into a structured Design Specification.

The Design Specification is the authoritative contract between Visual Agent and Render Engine.

It records:

- Canvas
- Component selection
- Content Bindings
- Visual hierarchy
- Theme Tokens
- Emphasis
- Asset placement
- Attribution placement
- Overflow policy
- Dependency versions

Visual Agent may only select from a versioned Component Registry.

It cannot freely generate arbitrary layouts or unrestricted CSS.

ContentOS uses a hybrid visual-asset strategy:

```text
Typography
→ Icons
→ Deterministic Diagrams
→ Existing Assets
→ Screenshots
→ Generated Illustrations
```

Generated illustrations are used only when they improve understanding.

They do not render critical text or precise technical information.

Visual Agent creates structured Asset Requests.

Image Generation Service executes image-model calls and creates versioned assets.

Render Engine consumes only Approved Asset Versions.

Every visual asset preserves origin, storage, approval, attribution, and basic rights information.

Brand Theme and Component Registry are independent versioned inputs.

The Xiaohongshu Artifact remains the single source of truth for content.

Design Specification binds to content fields and must not maintain a second editable copy of page text.

Design uses a Mutable Working Copy and immutable Design Specification Versions.

Only an Approved Design Specification Version may enter final rendering.

When upstream Xiaohongshu content changes, dependent Design Specifications and Render Outputs may become outdated.

Asset-generation failures must have deterministic fallback paths.

Before final rendering, the Design Specification must pass deterministic Schema, Content Binding, Component Compatibility, Theme, Asset, Fit, Attribution, and Dependency validation.