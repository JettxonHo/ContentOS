
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
