# ContentOS Session-011

**Status:** Formalized\
&#x2A;*Session Type:** Source Pipeline and Research Architecture\
&#x2A;*Topic:** Source Input, Immutable Snapshots, Normalized Content, and Research Agent Contract\
&#x2A;*Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the downstream ContentOS workflow:

```text
Approved Research Result
→ Human Opinion
→ Blog and Xiaohongshu Artifacts
→ Review
→ Export
```

Session-010 defined how Blog content is edited, versioned, revised with AI, approved, and exported.

The unresolved upstream questions were:

1. Which Source types should the MVP support?
2. Is a URL sufficient to represent a Source?
3. How should original web content be preserved?
4. Can users correct incorrectly extracted content?
5. Which Source representation should the Research Agent consume?
6. How should research claims remain traceable to evidence?
7. What happens when Source content changes?
8. How should the workflow recover when automatic capture fails?

This Session defines the Source Pipeline and the initial Research Agent contract.

---

## 2. Core Source Pipeline

ContentOS separates the following objects:

```text
Source Reference
→ Raw Snapshot
→ Extracted Content
→ Normalized Source Version
→ Research Result Version
```

These objects serve different purposes and must not be collapsed into one mutable Source record.

### Source Reference

Identifies where the material came from.

### Raw Snapshot

Preserves what ContentOS actually captured at a specific time.

### Extracted Content

Represents machine-processed readable content derived from a Raw Snapshot.

### Normalized Source Version

Represents content approved for Research Agent use, including any user corrections.

### Research Result Version

Represents structured analysis generated from specific approved Source versions.

---

## 3. A URL Is Not the Source Content

A URL is only a location reference.

Example:

```text
https://example.com/article
```

A webpage may later:

- Change
- Be deleted
- Redirect
- Require authentication
- Display different regional content
- Become unavailable
- Add or remove sections
- Change its DOM structure
- Contain advertisements and navigation unrelated to the article

ContentOS must therefore not treat the URL alone as sufficient evidence.

The system should preserve:

```text
Where the content came from
+
What was captured
+
What content was extracted
+
What content was approved for research
```

---

## 4. Source Reference

The Source Reference stores source identity and submission context.

Recommended conceptual structure:

```json
{
  "source_id": "src_001",
  "content_package_id": "cp_001",
  "source_type": "web_url",
  "source_role": "primary",
  "original_url": "https://example.com/article",
  "submitted_by": "user",
  "submitted_at": "2026-07-26T13:00:00Z"
}
```

Possible MVP `source_type` values:

```text
web_url
pasted_text
markdown_file
text_file
```

Possible `source_role` values:

```text
primary
supporting
```

The Source Reference remains stable while snapshots and normalized versions may accumulate beneath it.

---

## 5. Raw Snapshot

A Raw Snapshot preserves the original material captured by ContentOS.

For a webpage, it may contain:

- Original HTML
- Capture time
- Final redirected URL
- Content type
- Page title
- Capture status
- Optional screenshot
- Optional response metadata

Recommended conceptual structure:

```json
{
  "snapshot_id": "snapshot_001",
  "source_id": "src_001",
  "snapshot_version": 1,
  "captured_at": "2026-07-26T13:01:00Z",
  "final_url": "https://example.com/article",
  "content_type": "text/html",
  "raw_object_key": "sources/src_001/snapshot_001/page.html",
  "screenshot_object_key": null,
  "capture_status": "completed"
}
```

Raw Snapshots are immutable.

A new capture creates another Snapshot:

```text
snapshot v1
snapshot v2
snapshot v3
```

A later capture must not overwrite an earlier Snapshot.

---

## 6. Why Raw Snapshots Are Preserved

Raw Snapshots support:

- Historical traceability
- Re-extraction with an improved extractor
- Diagnosis of extraction failures
- Evidence preservation after webpage deletion
- Comparison of webpage changes
- Reconstruction of the content used by a past Research Result
- Reduced dependence on repeated access to external websites

The MVP does not need to become a complete digital-forensics or web-archiving system.

---

## 7. MVP Snapshot Requirements

### Required

The MVP should preserve:

- Original submitted URL or text
- Capture timestamp
- Final URL after redirect
- Raw HTML or raw text
- Capture status
- Extracted Markdown
- Extractor version
- Extraction status

### Optional or Deferred

The MVP may defer:

- Full-page screenshots
- JavaScript execution logs
- Browser network archives
- Every external image
- Complete response-header archives
- Browser-session replay
- Scheduled recapture
- Long-term webpage change monitoring

---

## 8. Extracted Content

Extracted Content is a machine-generated, readable representation derived from a Raw Snapshot.

It may include:

- Title
- Author
- Published date
- Headings
- Main body
- Images
- Links
- Quotes
- Language
- Page metadata

Recommended conceptual structure:

```json
{
  "extraction_id": "extract_001",
  "source_id": "src_001",
  "snapshot_id": "snapshot_001",
  "extractor_version": "web-extractor/v1",

  "title": "Article title",
  "author": "Author",
  "published_at": null,
  "content_markdown": "# Article title\n\n...",
  "language": "en",

  "quality_status": "needs_review",
  "created_at": "2026-07-26T13:02:00Z"
}
```

Extracted Content is not the Raw Snapshot.

The relationship is:

```text
Raw Snapshot
= Original captured evidence

Extracted Content
= Machine-readable interpretation
```

---

## 9. Normalized Source Version

Users may correct Extracted Content when:

- Navigation was included
- Important paragraphs were omitted
- The title was incorrect
- Text order was incorrect
- Captions were mixed into the body
- Formatting was broken
- The user needs to add authorized missing content

Users must not modify the Raw Snapshot.

Instead, ContentOS creates a Normalized Source Version.

Recommended conceptual structure:

```json
{
  "normalized_source_version_id": "sourcever_001",
  "source_id": "src_001",
  "based_on_extraction_id": "extract_001",
  "version_number": 1,

  "title": "Corrected article title",
  "content_markdown": "# Corrected article title\n\n...",
  "language": "en",

  "created_by": {
    "type": "user",
    "id": "user_001"
  },

  "status": "approved_for_research",
  "created_at": "2026-07-26T13:10:00Z"
}
```

This preserves three separate layers:

```text
Original captured material
Machine extraction
User-approved normalized content
```

---

## 10. Source Versioning

Normalized Source Content is versioned.

Example:

```text
Normalized Source v1
→ Initial extraction approved

Normalized Source v2
→ User restores an omitted paragraph

Normalized Source v3
→ A newer webpage snapshot is normalized
```

Older Source versions remain available because Research Results and downstream Artifacts may depend on them.

A Source version should record:

- Source identity
- Version number
- Parent version
- Base Snapshot or Extraction
- Content hash
- Creation reason
- Approval status
- Creation time
- Creator type

---

## 11. MVP Source Types

The first Vertical Slice supports four input forms.

### Web URL

The user submits a public URL.

Pipeline:

```text
Submit URL
→ Capture
→ Create Raw Snapshot
→ Extract readable content
→ User review
→ Approve Normalized Source
```

ContentOS does not guarantee successful extraction from every webpage.

### Pasted Text

The user directly pastes source content.

This supports:

- Social media posts
- Restricted pages the user can legally access
- Notes
- Meeting records
- Copied report sections
- Content from unsupported websites

The original pasted text is preserved as Raw Source content.

### Markdown File

The MVP supports `.md` files.

Markdown can usually enter the Normalization stage with limited transformation.

### Text File

The MVP supports `.txt` files.

Plain text is normalized into Markdown-compatible content.

---

## 12. Deferred Source Types

The first Vertical Slice does not support:

- PDF
- Scanned PDF
- OCR
- Audio
- Video
- Automatic transcription
- Office documents
- Email import
- Browser extensions
- Authenticated website capture
- Paywall bypass
- Automated full-web search

PDF is intentionally deferred because it introduces:

- Page-level location requirements
- Multi-column extraction
- Tables
- Figures
- Scanned pages
- OCR
- Incorrect reading order
- More complex evidence references

PDF may later be added as a separate Source Adapter.

---

## 13. Multiple Sources Per Content Package

A Content Package supports:

```text
Exactly 1 Primary Source
+
0 to 5 Supporting Sources
```

### Primary Source

Defines the main topic or argument being recreated.

### Supporting Sources

May provide:

- Official documentation
- Additional context
- Alternative opinions
- Contradicting evidence
- Definitions
- Updated information
- User notes

This model preserves a clear content center while allowing genuine research.

---

## 14. Why the MVP Does Not Use Unlimited Sources

Unlimited Sources would increase:

- Context size
- Research cost
- Citation complexity
- User-interface complexity
- Duplicate-content handling
- Contradiction resolution
- Source-quality review requirements

A limit of five Supporting Sources is an MVP product constraint.

It may be reconsidered after real workflows demonstrate a need for larger research collections.

---

## 15. Source Processing States

Recommended Source processing states:

```text
submitted
→ capturing
→ captured
→ extracting
→ extracted
→ needs_review
→ approved_for_research
```

Possible failure or partial states:

```text
capture_failed
extraction_failed
partially_extracted
unsupported
access_restricted
```

A Source must not be represented only as success or failure.

The interface should communicate which stage failed and what the user can do next.

---

## 16. Capture Failure Recovery

When automatic capture fails, ContentOS provides deterministic fallback actions.

The user may:

1. Retry capture.
2. Paste the article text.
3. Upload Markdown.
4. Upload a TXT file.
5. Preserve only the URL and continue later.
6. Remove the Source.

A failed webpage capture must not permanently block the entire Content Package.

Example:

```text
URL capture failed
→ User pastes authorized content
→ Create a new Raw Text Snapshot
→ Normalize content
→ Continue Research workflow
```

---

## 17. Restricted and Dynamic Webpages

The MVP does not promise automatic capture of:

- Login-protected pages
- CAPTCHA-protected pages
- Subscription paywalls
- Highly dynamic JavaScript applications
- Region-restricted pages
- Anti-bot protected pages

These situations should use explicit statuses such as:

```text
access_restricted
unsupported
```

ContentOS should allow the user to paste content they are authorized to use.

Bypassing access controls is not part of the MVP.

---

## 18. Source Review Interface

Before a Source becomes available to the Research Agent, the user should review its normalized content.

The Source Review interface may display:

- Source title
- Source role
- Original URL
- Capture status
- Extraction warnings
- Extracted Markdown
- Original-versus-extracted view
- Edit action
- Approve for Research action

Possible actions:

```text
Edit normalized content
Approve for Research
Recapture
Re-extract
Replace with pasted text
Remove Source
```

The MVP may begin with a simple Markdown editor rather than an advanced extraction comparison interface.

---

## 19. Research Agent Responsibility Boundary

The Research Agent does not own webpage capture or extraction.

The responsibility boundary is:

```text
Source Adapter
→ Capture and normalize material

Research Agent
→ Analyze approved material
```

The Research Agent must not directly treat a URL as its canonical input.

It consumes specific approved Normalized Source Versions.

---

## 20. Research Agent Input Contract

Recommended conceptual input:

```json
{
  "schema_version": "contentos.research-input/v1",
  "content_package_id": "cp_001",

  "sources": [
    {
      "source_id": "src_001",
      "normalized_source_version_id": "sourcever_001",
      "role": "primary",

      "title": "Article title",
      "author": "Author",
      "published_at": null,
      "source_url": "https://example.com/article",
      "content_markdown": "..."
    }
  ],

  "research_goal": "Understand the core argument and identify claims requiring verification.",
  "output_language": "zh-CN"
}
```

Each Source input references the exact normalized version used.

---

## 21. Research Result Is Not a Generic Summary

The Research Result should contain structured analysis rather than one free-form summary.

Recommended sections include:

```text
Source Summaries
Key Claims
Supported Facts
Unsupported or Uncertain Claims
Tensions and Alternative Views
Important Terms
Content Opportunities
Questions for Human Opinion
```

The Research Result supports both downstream content generation and human review.

---

## 22. Source Summaries

Each Source receives its own summary.

Example:

```json
{
  "source_id": "src_001",
  "normalized_source_version_id": "sourcever_001",
  "summary": "The author argues that..."
}
```

Source Summaries must represent the Source rather than the user’s opinion or the Research Agent’s preferred conclusion.

---

## 23. Key Claims

Key Claims represent important statements made by a Source.

Example:

```json
{
  "claim_id": "claim_001",
  "statement": "MCP reduces integration fragmentation.",
  "claim_type": "source_claim",

  "source_refs": [
    {
      "source_id": "src_001",
      "normalized_source_version_id": "sourcever_001",
      "locator": {
        "heading_path": [
          "Why MCP matters"
        ],
        "paragraph_index": 3
      },
      "evidence_snippet": "MCP provides a standardized way..."
    }
  ]
}
```

A Source Claim is not automatically an independently verified fact.

---

## 24. Supported Facts

The Research Result may identify facts supported by the currently approved Sources.

Recommended terminology:

```text
supported_facts
```

rather than:

```text
verified_truth
```

A supported fact means:

> The current Source set contains evidence supporting this statement.

It does not necessarily mean the statement has been independently confirmed through external fact-checking.

Example:

```json
{
  "fact_id": "fact_001",
  "statement": "...",
  "supporting_source_refs": [],
  "confidence": "high"
}
```

---

## 25. Unsupported and Uncertain Claims

The Research Agent should identify claims that are:

- Opinions
- Predictions
- Weakly supported
- Contradicted
- Ambiguous
- Missing evidence

Example:

```json
{
  "claim_id": "claim_007",
  "statement": "MCP will become the universal AI protocol.",
  "status": "unsupported_prediction",
  "reason": "The Source presents this as a forecast rather than an established fact."
}
```

This prevents downstream Agents from converting speculation into factual statements.

---

## 26. Tensions and Alternative Views

When Sources disagree, the Research Agent should preserve the disagreement.

Example:

```json
{
  "topic": "MCP adoption speed",
  "positions": [
    {
      "source_id": "src_001",
      "position": "Rapid industry adoption"
    },
    {
      "source_id": "src_002",
      "position": "Adoption remains early"
    }
  ]
}
```

The Research Agent must not silently select one view when the approved Source set contains meaningful tension.

---

## 27. Questions for Human Opinion

One of the Research Agent’s central responsibilities is generating questions that help the creator add original value.

Examples:

```text
Do you believe ordinary users need to understand MCP?

Have you experienced integration fragmentation when using Agent tools?

Do you agree with the author’s predicted adoption speed?

What does this change mean for an AI product manager?

Which part of the Source conflicts with your own experience?
```

These questions become inputs to the Human Opinion stage.

---

## 28. Evidence References

A reference containing only a Source ID is too broad.

Exact character offsets are often too fragile because content corrections may invalidate them.

The MVP uses a combined evidence locator:

```text
Source Version
+
Heading Path or Paragraph Index
+
Short Evidence Snippet
```

Recommended structure:

```json
{
  "source_id": "src_001",
  "normalized_source_version_id": "sourcever_001",

  "locator": {
    "heading_path": [
      "Why MCP matters"
    ],
    "paragraph_index": 3
  },

  "evidence_snippet": "MCP provides a standardized way...",
  "evidence_hash": "sha256:..."
}
```

The Evidence Snippet allows the user to inspect why a claim was produced.

---

## 29. Recommended Research Result Schema

```json
{
  "schema_version": "contentos.research-result/v1",

  "research_result_id": "research_001",
  "content_package_id": "cp_001",
  "version_number": 1,
  "parent_version_id": null,

  "source_dependencies": [
    {
      "source_id": "src_001",
      "normalized_source_version_id": "sourcever_001",
      "role": "primary"
    }
  ],

  "source_summaries": [],
  "key_claims": [],
  "supported_facts": [],
  "unsupported_or_uncertain_claims": [],
  "tensions": [],
  "important_terms": [],
  "content_opportunities": [],
  "questions_for_human": [],

  "generation": {
    "agent_run_id": "run_001"
  },

  "status": "draft",
  "created_at": "2026-07-26T14:00:00Z"
}
```

This is a conceptual domain contract rather than a final database table.

---

## 30. Research Result Versioning

Research Results are immutable and versioned.

A new Research Result Version may be created when:

- A Source is added
- A Source is removed
- A Source role changes
- A Normalized Source Version changes
- The Research goal changes
- The user requests regeneration
- The Research Agent contract changes materially
- The user accepts a corrected research result

Example:

```text
Research Result v1
→ Based on Primary Source v1

Research Result v2
→ Adds Supporting Source 2

Research Result v3
→ Based on corrected Primary Source v2
```

Previous Research Results remain available for comparison and traceability.

---

## 31. Research Approval

A Research Result must be reviewed before downstream content generation.

The user may:

- Approve
- Request regeneration
- Correct an interpretation
- Remove an unsupported claim
- Add a Source
- Replace a Source
- Change the research goal
- Mark a claim for verification

Approval applies to a specific Research Result Version.

The downstream Human Opinion and Writer workflows should reference the approved version.

---

## 32. Stale Dependency Detection

If a Source dependency changes, the corresponding Research Result may no longer represent the current material.

Example:

```text
Normalized Source v1
→ Research Result v1
```

The user later creates:

```text
Normalized Source v2
```

ContentOS should mark:

```text
Research Result v1
status: stale
```

The system should explain why:

```text
Primary Source has a newer approved version.
Regenerate research before continuing.
```

Adding or removing a Supporting Source may also make the current Research Result stale.

---

## 33. Dependency Chain

The authoritative dependency chain is:

```text
Source Reference
        ↓
Raw Snapshot
        ↓
Extracted Content
        ↓
Approved Normalized Source Version
        ↓
Research Result Version
        ↓
Approved Research Result Version
        ↓
Human Opinion
        ↓
Blog and Xiaohongshu Artifacts
```

Every downstream object should reference the specific upstream versions used.

This allows ContentOS to detect:

- Research based on an outdated Source
- Blog based on outdated Research
- Output generated before a new Human Opinion
- Export based on a superseded Artifact

---

## 34. MVP Scope

### Included

- Public URL input
- Pasted text input
- Markdown upload
- TXT upload
- One Primary Source
- Zero to five Supporting Sources
- Raw content preservation
- Basic HTML or text extraction
- Normalized Markdown content
- User Source review and correction
- Source approval
- Structured Research Result
- Evidence references
- Research review and approval
- Source dependency tracking
- Stale Research detection
- Capture-failure fallback

### Deferred

- PDF
- OCR
- Audio transcription
- Video transcription
- Login-protected capture
- Paywall bypass
- Browser extension
- Automatic full-web research
- Large-scale crawling
- Scheduled capture
- Page-change monitoring
- Automated source-authority scoring
- Independent external fact-checking
- Academic citation-style formatting

---

# 35. Decisions

## DEC-059

### Status

Accepted

### Title

Source 分为 Reference、Raw Snapshot、Extracted Content 与 Normalized Source Version

### Decision

ContentOS 将 Source Pipeline 分为：

```text
Source Reference
→ Raw Snapshot
→ Extracted Content
→ Normalized Source Version
```

不同对象分别保存来源身份、原始证据、机器提取结果和用户确认后的研究输入。

### Reason

URL、原始网页、机器提取正文和用户修正正文具有不同的用途与可信状态。

将它们合并成一个可变对象会破坏：

- 来源追踪
- 提取诊断
- 用户修正记录
- 版本依赖
- Research 可重复性

### Impact

Source 数据模型和 Workspace 需要明确展示不同 Source 层级。

Research Agent 不直接消费 Source Reference 或未经确认的 Raw Snapshot。

---

## DEC-060

### Status

Accepted

### Title

Raw Snapshot 不可变，重新抓取创建新 Snapshot

### Decision

Raw Snapshot 创建后不得被覆盖或编辑。

重新抓取同一 Source 时创建新的 Snapshot Version。

### Reason

网页内容可能发生变化。

覆盖旧 Snapshot 会导致系统无法确认历史 Research 和 Artifact 当时使用了什么原始材料。

### Impact

Source Storage 需要支持多个 Snapshot，并由后续 Extraction 明确引用具体 Snapshot。

---

## DEC-061

### Status

Accepted

### Title

MVP 支持 URL、Pasted Text、Markdown 和 TXT Source

### Decision

首个 ContentOS MVP 支持：

- Public URL
- Pasted Text
- `.md`
- `.txt`

PDF、OCR、音频和视频暂不进入首个 Vertical Slice。

### Reason

这四类输入可以覆盖主要内容研究场景，同时保持 Source Pipeline 的可控复杂度。

PDF 会额外引入页码、表格、多栏布局、图片和 OCR 等问题。

### Impact

MVP 需要实现 URL Capture、Text Input 和基础文件读取。

PDF 应作为后续独立 Source Adapter 设计。

---

## DEC-062

### Status

Accepted

### Title

Content Package 支持一个 Primary Source 和最多五个 Supporting Sources

### Decision

一个 Content Package 包含：

```text
1 Primary Source
+
0–5 Supporting Sources
```

Primary Source 定义主要内容中心，Supporting Sources 提供补充、验证或不同观点。

### Reason

只支持单 Source 无法充分验证 Research Agent 和跨来源内容重构的价值。

无限 Source 又会增加上下文、引用、成本和交互复杂度。

### Impact

Source Workspace、Research Input 和 Evidence References 需要支持多 Source 及 Source Role。

Supporting Source 数量限制可在后续根据真实使用需求调整。

---

## DEC-063

### Status

Accepted

### Title

Research Agent 只消费已批准的 Normalized Source Version

### Decision

Research Agent 的正式输入必须是具体的：

```text
approved Normalized Source Version
```

Research Agent 不负责网页抓取，也不直接使用未经确认的原始 HTML。

### Reason

抓取与分析是不同职责。

让 Research Agent 直接处理不稳定或未经审核的材料会降低结果可重复性和可追溯性。

### Impact

Source 必须先通过 Capture、Extraction、Normalization 和 Approval，才能进入 Research 阶段。

Research Input 需要记录每个 Source 的具体 Version ID。

---

## DEC-064

### Status

Accepted

### Title

Research Result 使用结构化输出并保留 Source Evidence

### Decision

Research Result 至少包含：

- Source Summaries
- Key Claims
- Supported Facts
- Unsupported or Uncertain Claims
- Tensions
- Important Terms
- Content Opportunities
- Questions for Human Opinion
- Source Evidence References

Evidence Reference 使用：

```text
Source Version
+
Heading Path or Paragraph Index
+
Evidence Snippet
```

### Reason

普通摘要无法支持：

- 事实与观点分离
- 来源核查
- 多 Source 冲突
- 下游写作约束
- Human Opinion 引导
- Claim 级追踪

### Impact

Research Agent 必须输出符合 Schema 的结构化结果。

Research Review UI 需要支持查看 Claim 与对应证据。

---

## DEC-065

### Status

Accepted

### Title

Source 变化后依赖的 Research Result 标记为 Stale

### Decision

当 Research Result 依赖的 Source Version发生变化，或者 Source 被添加、删除或替换时，已有 Research Result 标记为：

```text
stale
```

旧 Research Result 不被删除，但不能继续被视为当前研究结果。

### Reason

研究结论只对其实际使用的 Source 集合和版本有效。

如果上游材料变化而研究状态保持不变，用户可能基于过时分析继续生成内容。

### Impact

系统需要保存 Source Dependency，并实现确定性的 Stale Detection。

用户需要重新生成并批准新的 Research Result Version。

---

## DEC-066

### Status

Accepted

### Title

网页抓取失败必须提供人工降级路径

### Decision

URL Capture 失败时，用户可以：

- Retry
- Paste Text
- Upload Markdown
- Upload TXT
- Preserve URL for later
- Remove Source

一个 Source 抓取失败不得永久阻断整个 Content Package。

### Reason

公开网页可能因登录、验证码、JavaScript、反爬、地区限制或页面结构而无法自动获取。

用户仍然需要一种可控方式继续内容生产。

### Impact

Source Workspace 必须显示明确失败原因和下一步操作。

自动绕过访问限制不属于 MVP。

---

## 36. Rejected or Deferred Approaches

### Saving Only the URL

Rejected because a URL does not preserve the content used by Research.

### Overwriting a Raw Snapshot

Rejected because it destroys historical evidence.

### Allowing Users to Edit Raw Snapshots

Rejected because Raw Snapshots must represent captured evidence.

Users edit a Normalized Source Version instead.

### Research Agent Performing Web Capture

Rejected because capture, extraction, and research require different responsibilities and failure handling.

### Research Agent Reading Unapproved Extraction

Rejected because extraction may be incomplete or incorrect.

### One Source Only

Rejected because it does not sufficiently validate multi-source research and source tension.

### Unlimited Supporting Sources

Deferred because it increases cost and complexity before real demand is validated.

### PDF in the First Vertical Slice

Deferred because PDF extraction requires a separate set of parsing, page-location, OCR, image, and table capabilities.

### Automatic Paywall or Authentication Bypass

Rejected from the MVP because ContentOS should not bypass access controls.

### Exact Character Offsets as the Only Evidence Locator

Rejected because offsets are fragile after Source corrections.

### Source ID as the Only Evidence Locator

Rejected because it is too broad for practical verification.

---

## 37. Open Questions

The following questions remain unresolved:

1. Which capture mechanism will the MVP use?
2. Should all successful webpage captures save original HTML?
3. Should screenshots be generated only after extraction failure?
4. Which HTML-to-Markdown extractor should be used?
5. How should duplicate Sources be detected?
6. Can the same Source be used by multiple Content Packages?
7. Should Source References exist globally or only inside one Content Package?
8. How should redirected URLs affect Source identity?
9. How should canonical URLs be stored?
10. Can a user change a Source from Primary to Supporting after Research?
11. Should supporting-source limits be configurable?
12. How should the Source Review UI show original and normalized content?
13. Should user corrections produce a Source Diff?
14. How should images in Source Markdown be represented?
15. Which Markdown subset is allowed in Normalized Source Content?
16. How should tables extracted from webpages be handled?
17. How long should failed capture logs be retained?
18. How should citation Evidence Snippets be sized?
19. Should Evidence Snippets be generated deterministically or by the Research Agent?
20. How should conflicting Sources be presented in the Research Review UI?
21. Can users edit a Research Result directly?
22. Does correcting a Research Result create a new immutable version?
23. Which Research Result fields are required for downstream generation?
24. How should Research Result approval interact with Stale status?
25. When should PDF support be reconsidered?

---

## 38. Documentation Updates

Create:

```text
docs/sessions/session-011.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-059
DEC-060
DEC-061
DEC-062
DEC-063
DEC-064
DEC-065
DEC-066
```

Future documents to create:

```text
docs/product/source-workspace.md
docs/product/research-review.md
docs/architecture/source-pipeline.md
docs/architecture/source-versioning.md
docs/architecture/research-agent-contract.md
docs/architecture/evidence-reference.md
```

Possible future Schema files:

```text
schemas/source-reference-v1.json
schemas/source-snapshot-v1.json
schemas/source-extraction-v1.json
schemas/normalized-source-v1.json
schemas/research-input-v1.json
schemas/research-result-v1.json
schemas/evidence-reference-v1.json
```

These paths are suggestions and are not yet implementation decisions.

---

## 39. Documentation Sync Checklist

- [x] DEC-059 confirmed
- [x] DEC-060 confirmed
- [x] DEC-061 confirmed
- [x] DEC-062 confirmed
- [x] DEC-063 confirmed
- [x] DEC-064 confirmed
- [x] DEC-065 confirmed
- [x] DEC-066 confirmed
- [ ] Save this document as `docs/sessions/session-011.md`
- [ ] Add DEC-059 through DEC-066 to `docs/decisions/decisions.md`
- [ ] Define Source Reference Schema
- [ ] Define Raw Snapshot Schema
- [ ] Define Normalized Source Version Schema
- [ ] Define Research Input Contract
- [ ] Define Research Result Contract
- [ ] Define Evidence Reference Contract
- [ ] Define Source Workspace interaction
- [ ] Define Research Review interaction
- [ ] Define Stale dependency rules
- [ ] Define capture-failure UX
- [ ] Reconsider PDF only after the initial Vertical Slice is validated
- [ ] Review AGENTS.md after Source and Research specifications become authoritative

---

## 40. Session Summary

ContentOS does not treat a URL as complete Source content.

The Source Pipeline separates Source Reference, immutable Raw Snapshot, machine-generated Extracted Content, and user-approved Normalized Source Versions.

The MVP supports public URLs, pasted text, Markdown files, and TXT files. PDF, OCR, audio, video, authenticated capture, and large-scale web research are deferred.

Each Content Package supports one Primary Source and up to five Supporting Sources.

The Research Agent does not perform webpage capture. It consumes specific approved Normalized Source Versions and produces a versioned, structured Research Result.

Research Results preserve Source Summaries, Claims, Supported Facts, Uncertain Claims, Tensions, Content Opportunities, Human Opinion Questions, and evidence references.

When an approved Source changes, dependent Research Results become stale rather than being silently treated as current.

Automatic capture failures must provide manual fallback paths so that one inaccessible website does not block the complete content-production workflow.
