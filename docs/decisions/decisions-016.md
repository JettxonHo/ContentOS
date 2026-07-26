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
