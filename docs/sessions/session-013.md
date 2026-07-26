# ContentOS Session-013

**Status:** Formalized  
**Session Type:** Agent Contract and Content Generation Architecture  
**Topic:** Writer Agent Contract, Blog Generation Rules, Provenance, and Citation Strategy  
**Date:** 2026-07-26

---

## 1. Context

Previous Sessions established the complete upstream content foundation:

```text
Approved Normalized Source Versions
→ Approved Research Result Version
→ Confirmed Human Opinion Version
→ Output Generation
```

Session-009 defined the Blog Artifact and export contract.

Session-010 defined the Blog Editor, mutable Working Copy, immutable Versions, Revision Proposals, Approval, and Export eligibility.

Session-011 defined Source capture, immutable Raw Snapshots, Normalized Source Versions, Research Agent inputs, and evidence references.

Session-012 defined Research Review, item-level approval, Human Opinion collection, Originality Provenance, first-person restrictions, and dependency propagation.

The unresolved questions were:

1. What is the Writer Agent responsible for?
2. Which approved content may it consume?
3. Can it search the internet or add facts from model memory?
4. How should it transform a Content Foundation into a Blog rather than paraphrase the Source?
5. How should Creator-led and Research-based modes differ?
6. How should facts, Human Opinion, direct quotations, and citations be handled?
7. How should internal Provenance remain separate from public references?
8. What should the Writer Agent output?
9. Which deterministic validations must run before a Blog Draft enters the Editor?

This Session defines the Writer Agent contract and the initial Blog generation pipeline.

---

## 2. Writer Agent Responsibility

The Writer Agent converts an approved Content Foundation into a reviewable Blog Draft.

The primary transformation is:

```text
Approved Content Foundation
→ Blog Plan
→ Blog Markdown Draft
```

The Writer Agent is responsible for:

- Selecting an article angle
- Defining the target-reader journey
- Creating a new article structure
- Organizing approved Research
- Integrating Confirmed Human Opinion
- Generating Blog Markdown
- Producing title and metadata suggestions
- Recording internal Provenance
- Identifying Research gaps
- Identifying generation warnings
- Returning structured generation status

The Writer Agent is not responsible for:

- Capturing webpages
- Extracting Source content
- Searching the public internet
- Adding new Sources
- Modifying approved Research
- Independently approving facts
- Inferring unconfirmed user opinions
- Inventing personal experience
- Approving a Blog Version
- Publishing a Blog
- Choosing the final public URL

The responsibility boundary is:

```text
Research Agent
→ Establishes an approved content foundation

Writer Agent
→ Converts that foundation into an editorial expression

User
→ Reviews, edits, and approves the result

PersonalBlog
→ Publishes the approved result
```

---

## 3. Writer Agent Input Contract

The Writer Agent receives a versioned and explicit input contract.

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.writer-input/v1",

  "content_package_id": "cp_001",

  "dependencies": {
    "research_result_version_id": "researchver_002",
    "human_opinion_version_id": "opinionver_001"
  },

  "content_mode": "creator_led",

  "research_bundle": {},
  "human_opinion_bundle": {},
  "source_evidence_bundle": {},

  "generation_request": {
    "purpose": "explain_and_comment",
    "target_audience": "AI 产品经理初学者",
    "language": "zh-CN",
    "tone": "professional_conversational",
    "length": "medium"
  },

  "brand_rules": {}
}
```

Every formal generation must record the exact Research and Human Opinion versions used.

---

## 4. Approved Research Input

The Writer Agent may use Research items with the following review states:

```text
accepted
corrected
needs_verification
```

Their usage differs.

### Accepted Items

The Writer Agent may use the reviewed statement.

### Corrected Items

The Writer Agent must use the user-corrected representation rather than the original AI-generated statement.

### Needs Verification Items

The Writer Agent may only:

- State that the matter remains uncertain
- Present it as a claim or prediction
- Explain that current evidence is insufficient
- Exclude it from the Draft

It must not present the item as a confirmed fact.

The Writer Agent must not use:

```text
unreviewed
excluded
incorrect
```

Research items with these states are unavailable for formal Draft generation.

---

## 5. Confirmed Human Opinion Input

In Creator-led Mode, the Writer Agent may use:

- Confirmed Opinion Statements
- Confirmed Editorial Expressions
- Confirmed Personal Experiences
- Confirmed Personal Recommendations
- Confirmed first-person judgments

It must not use:

- Unconfirmed AI Interpretations
- Skipped Opinion Questions
- AI-inferred personal positions
- Raw Responses whose meaning is unconfirmed
- Historical Memory treated as current opinion
- AI-generated personal experience
- Rejected Editorial Expressions

Raw Responses may be available for contextual understanding, but they cannot override the Confirmed Statement.

---

## 6. Source Evidence Bundle

The Writer Agent primarily consumes approved Research rather than unrestricted Source content.

However, it may need to inspect Source Evidence in order to:

- Confirm terminology
- Preserve quotation accuracy
- Understand context
- Validate attribution
- Avoid distorting a Source position
- Check a Research item before expression

Recommended access model:

```text
Approved Research Result
+
Referenced Evidence Bundle
+
Read-only approved Source lookup
```

The Writer Agent may inspect only approved Normalized Source Versions.

Read-only Source access does not grant permission to introduce new unreviewed facts.

If the Writer Agent identifies important material absent from the approved Research Result, it must create a Research Gap rather than silently include the material.

---

## 7. Research Gap

The Writer Agent may return a structured Research Gap when the available Content Foundation cannot safely support part of the requested article.

Example:

```json
{
  "type": "research_gap",
  "description": "当前材料无法支持关于 MCP 市场采用率的具体判断。",
  "required_information": "可靠的采用率数据或官方统计",
  "affected_section": "MCP 的普及速度",
  "severity": "blocking"
}
```

Chief Editor may then:

- Return to the Research stage
- Ask the user for another Source
- Remove the unsupported section
- Reframe it as uncertainty
- Adjust the Blog Generation Request

The Writer Agent must not hide Research gaps by using model memory.

---

## 8. Blog Generation Request

Every Writer Agent execution receives an explicit generation request.

Recommended fields include:

```json
{
  "content_mode": "creator_led",
  "purpose": "explain_and_comment",
  "target_audience": "AI 产品经理初学者",
  "language": "zh-CN",
  "tone": "professional_conversational",
  "length": "medium",
  "citation_style": "inline_attribution_with_references"
}
```

The MVP should use a limited set of understandable options.

### Purpose

Recommended values:

```text
explain
analyze
compare
comment
practical_guide
explain_and_comment
```

### Tone

Recommended values:

```text
neutral
professional
conversational
professional_conversational
opinionated
```

### Length

Recommended values:

```text
short
medium
long
```

The final implementation may map these values to approximate word-count ranges.

---

## 9. Brand Rules

The MVP may provide a limited set of Brand Rules.

Possible fields include:

- Whether first-person language is preferred
- Default target audience
- Preferred paragraph length
- Preferred title style
- Terms to avoid
- Tone constraints
- Whether conclusions should include recommendations
- Whether rhetorical questions are allowed

Brand Rules influence expression.

They must not override:

- Research evidence
- Confirmed Human Opinion
- Citation requirements
- First-person provenance
- Safety and factuality rules

Full Brand Memory remains outside the first Vertical Slice.

---

## 10. No Autonomous Web Research

The MVP Writer Agent does not search the internet.

The separation remains:

```text
Source Adapter
→ Captures material

Research Agent
→ Reviews and structures material

Writer Agent
→ Expresses approved material
```

Allowing Writer Agent web access would make it difficult to know:

- Which facts were reviewed
- Which Source version was used
- Whether a claim has evidence
- Why a new statement entered the article
- Whether Research Review remains authoritative

Any new external knowledge must enter through the Source and Research pipeline.

---

## 11. Content Re-creation Principle

The Writer Agent must not perform Source-order paraphrasing.

Rejected generation pattern:

```text
Source paragraph 1
→ Synonym replacement

Source paragraph 2
→ Synonym replacement

Source paragraph 3
→ Synonym replacement
```

Required generation pattern:

```text
Approved Research
+
Confirmed Human Opinion
+
Target-reader need
+
Article purpose
+
Brand Rules
→ New editorial structure
```

The Blog must be organized around the new article’s reader and purpose rather than the Primary Source’s original sequence.

---

## 12. Synthesis-first Generation

The Writer Agent follows:

```text
Synthesis First
Source Wording Only When Necessary and Attributed
```

The Writer Agent should:

- Combine related Claims from multiple Sources
- Reframe information for the target audience
- Introduce the creator’s confirmed perspective
- Build a new explanatory sequence
- Preserve uncertainty and disagreement
- Separate Source opinion from creator opinion
- Avoid unique Source wording unless quoting

This supports ContentOS’s Content Re-creation positioning.

---

## 13. Example of Structural Re-creation

Primary Source structure:

```text
1. History
2. Definition
3. Technical architecture
4. Future prediction
```

ContentOS Blog for AI product managers:

```text
1. Why product managers are hearing about MCP
2. What problem MCP actually addresses
3. What it changes in Agent product design
4. Whether ordinary users need to understand it
5. The creator’s judgment and recommendation
```

The second structure is not a chapter-by-chapter rewrite.

It is a new editorial expression created from the shared Content Foundation.

---

## 14. Two-stage Writer Generation

The Writer Agent uses a Plan-first process.

```text
Phase 1
Blog Plan

Phase 2
Blog Draft
```

This separation improves structure, Provenance planning, and validation.

---

## 15. Blog Plan

A Blog Plan may contain:

- Working thesis
- Target audience
- Article angle
- Reader problem
- Section outline
- Section purpose
- Research-item allocation
- Human Opinion allocation
- Citation plan
- First-person plan
- Research gaps
- Generation warnings

Example:

```json
{
  "schema_version": "contentos.blog-plan/v1",

  "thesis": "MCP 的价值不在于让普通用户理解协议，而在于降低 Agent 与工具连接的成本。",

  "sections": [
    {
      "section_id": "section_001",
      "heading": "为什么 MCP 最近频繁出现",
      "purpose": "提供行业背景",
      "research_item_refs": [
        "claim_001",
        "fact_002"
      ],
      "opinion_refs": [],
      "citation_required": true
    },
    {
      "section_id": "section_002",
      "heading": "普通用户需要理解 MCP 吗",
      "purpose": "表达创作者判断",
      "research_item_refs": [
        "claim_004"
      ],
      "opinion_refs": [
        "opresp_001"
      ],
      "citation_required": false
    }
  ],

  "research_gaps": [],
  "warnings": []
}
```

---

## 16. Blog Plan Is Not Canonical Body Content

The Blog Plan belongs to Generation Metadata.

It helps produce and explain the Draft, but it is not a second editable Blog body.

The canonical Blog body remains:

```text
editorial.body.content
```

in Markdown form.

If the final Markdown diverges from the Plan, the Markdown remains authoritative.

---

## 17. Outline Review

Outline Review is optional.

Default flow:

```text
Generate Blog Plan
→ Validate Plan
→ Generate Blog Draft
```

Optional user-directed flow:

```text
Generate Outline First
→ User reviews Plan
→ User modifies direction
→ Generate Blog Draft
```

The MVP does not require every article to pass a mandatory Plan approval checkpoint.

This avoids adding unnecessary friction to routine generation.

---

## 18. Creator-led Blog Mode

Creator-led Mode requires Confirmed Human Opinion.

It may:

- Express a creator position
- Use confirmed first-person language
- Include confirmed personal experience
- Organize Research around creator judgment
- Make creator-specific recommendations
- Present stronger editorial conclusions

Every first-person use must be traceable to a Confirmed Human Opinion Response.

Creator-led Mode does not allow AI to expand a limited user statement into an unrelated or stronger position.

---

## 19. Research-based Blog Mode

Research-based Mode is used when no Confirmed Human Opinion is available.

It may:

- Summarize Sources
- Compare Source positions
- Explain concepts
- Synthesize approved Research
- Present uncertainty
- Offer Research-supported general recommendations

It must not fabricate:

```text
我认为……
我在使用中发现……
我的经验是……
我的团队曾经……
我们都知道……
我们经常会遇到……
```

Collective first-person language must not be used to hide the absence of confirmed experience.

---

## 20. Factual Claim Provenance

A concrete external factual claim must originate from an Accepted or Corrected Research item.

Required dependency path:

```text
Blog factual statement
→ Research item
→ Source Evidence
→ Approved Normalized Source Version
→ Raw Snapshot
```

Examples of factual content requiring Provenance include:

- Dates
- Numbers
- Product capabilities
- Organization actions
- Public announcements
- Technical definitions
- Market events
- Attributed expert positions
- Direct quotations
- Specific comparative claims

The Writer Agent must not add these facts based only on pretrained model knowledge.

---

## 21. Editorial Synthesis

Not every sentence requires an external Source Reference.

The Writer Agent may produce:

- Transitions
- Structural summaries
- Reader framing
- Questions
- Logical connections
- Non-factual explanatory language
- Editorial synthesis

Recommended internal usage categories:

```text
factual_claim
source_opinion
creator_opinion
personal_experience
editorial_synthesis
transition
direct_quote
```

Validators should focus on high-risk claim types rather than attempting to Source every sentence.

---

## 22. Human Opinion Usage

The Writer Agent may paraphrase a Confirmed Opinion.

Confirmed Statement:

> 普通用户不需要理解协议细节，更应该关注它能带来的能力。

Possible Blog expression:

> 对多数普通用户而言，理解 MCP 的协议结构并不是第一优先级。更实际的问题是，它最终能否让 AI 工具变得更易用。

The internal relationship must remain:

```text
Generated expression
→ Confirmed Opinion Response
```

If the generated expression materially changes the user’s stance, the output must receive a warning or fail validation.

---

## 23. Human Opinion Restrictions

The Writer Agent may:

- Improve clarity
- Adapt tone
- Add Research context around an Opinion
- Combine semantically compatible Confirmed Opinions
- Place an Opinion in a stronger article structure
- Generate a platform-appropriate expression

The Writer Agent must not:

- Turn uncertainty into certainty
- Turn a preference into a fact
- Change a moderate view into an absolute claim
- Invent reasons the user did not provide
- Invent personal examples
- Generalize one experience into a permanent identity
- Convert a conditional judgment into a universal conclusion

---

## 24. Internal Provenance

Internal Provenance records how generated Blog content relates to:

- Research items
- Source Evidence
- Confirmed Human Opinion
- Personal Experience
- Direct quotations
- Generation request
- Writer Agent execution

It supports:

- Validation
- Review
- Revision
- Dependency propagation
- Re-generation
- Quality evaluation
- Future audit

Internal Provenance is not intended for public readers.

---

## 25. Public Citation

Public Citation is the reader-facing representation of attribution.

It may include:

- Inline links
- “According to…” language
- Named Source attribution
- Markdown blockquotes
- References section
- Direct-quote attribution

Public Citation serves:

- Reader trust
- External attribution
- Source discovery
- Publication quality
- Citation responsibility

It must not expose internal IDs such as:

```text
claim_001
researchver_002
opresp_001
evidence_004
```

---

## 26. Public Citation Strategy

The MVP uses:

```text
Inline or sentence-level Attribution
+
Markdown References section
```

Example body attribution:

```markdown
根据 MCP 官方文档，MCP 的目标是提供一种标准方式，让 AI 应用连接外部工具和数据源。
```

Example references:

```markdown
## 参考资料

- [Model Context Protocol 官方文档](https://example.com)
- [相关产品公告](https://example.com)
```

The MVP does not require:

- Academic citation styles
- Framework-specific footnote components
- MDX citation plugins
- Automatic APA or MLA formatting
- Bibliography-management software

---

## 27. Required Public Attribution

Public attribution should be included for:

- Direct quotations
- Specific statistics
- Statements attributed to a person or organization
- Product announcements
- Important claims supported by only one Source
- Disputed factual claims
- Source-author opinions
- Cases where the Source itself is being analyzed

Ordinary transitions and editorial structure do not require a citation after every sentence.

---

## 28. Direct Quotations

Direct quotations require strict handling.

A Direct Quote must:

1. Exist in approved Source Evidence.
2. Preserve the quoted wording.
3. Not be reconstructed from memory.
4. Not place a paraphrase inside quotation marks.
5. Record a Source Evidence Reference.
6. Include public Source attribution.
7. Remain reasonably short.
8. Trigger warning when quotation length is excessive.

When exact wording cannot be confirmed, the Writer Agent must use:

```text
Paraphrase
+
Source Attribution
```

rather than an approximate quotation.

---

## 29. Blog Draft Output Contract

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.blog-draft/v1",

  "artifact": {
    "artifact_id": "blog_001",
    "version_id": "blogver_001",
    "content_package_id": "cp_001",
    "status": "draft"
  },

  "generation_request": {
    "content_mode": "creator_led",
    "purpose": "explain_and_comment",
    "target_audience": "AI 产品经理初学者",
    "tone": "professional_conversational",
    "length": "medium"
  },

  "editorial": {
    "title": "普通用户需要理解 MCP 吗？",
    "subtitle": null,
    "summary": "从产品视角解释 MCP 的价值，以及普通用户真正需要关注的内容。",
    "body": {
      "format": "markdown",
      "schema_version": "contentos.blog-body/markdown-v1",
      "content": "# 普通用户需要理解 MCP 吗？\n\n..."
    },
    "language": "zh-CN"
  },

  "publishing_metadata": {
    "title_candidates": [],
    "suggested_slug": "do-users-need-to-understand-mcp",
    "excerpt": "",
    "tags": [],
    "seo_title": "",
    "seo_description": ""
  },

  "dependencies": {
    "research_result_version_id": "researchver_002",
    "human_opinion_version_id": "opinionver_001"
  },

  "provenance": {
    "factual_claims": [],
    "source_attributions": [],
    "opinion_usages": [],
    "first_person_usages": [],
    "direct_quotes": []
  },

  "warnings": [],

  "generation": {
    "plan_id": "blogplan_001",
    "agent_run_id": "run_001"
  }
}
```

This is a domain contract, not a final database table.

---

## 30. Provenance Sidecar

Because the MVP Blog body is Markdown rather than Blocks, Provenance is stored in a Sidecar structure.

Recommended output locator:

```text
Heading Path
+
Generated Text Snippet
+
Generated Text Hash
+
Upstream References
```

Example:

```json
{
  "usage_id": "usage_001",
  "usage_type": "factual_claim",

  "output_locator": {
    "heading_path": [
      "MCP 实际解决了什么问题"
    ],
    "generated_text_snippet": "MCP 提供了一种标准化的连接方式……",
    "generated_text_hash": "sha256:..."
  },

  "research_item_refs": [
    "claim_001",
    "fact_003"
  ],

  "source_evidence_refs": [
    "evidence_004"
  ]
}
```

If the user edits the generated content and its hash no longer matches, the Provenance entry may become:

```text
needs_revalidation
```

The historical Provenance record remains preserved.

---

## 31. Source-overlap Risk

The Writer Agent must avoid:

- Source-order rewriting
- Long unmarked reused passages
- Repeated use of unique Source wording
- Sentence-by-sentence synonym replacement
- Combining many direct quotations into a Draft
- Reproducing a Primary Source’s structure too closely

The MVP may use heuristic checks for:

- Long matching sequences
- Repeated distinctive phrases
- Structural similarity
- Unmarked quotation-like text
- Excessive quotation density

These checks produce:

```text
Source-overlap warning
```

They do not constitute legal plagiarism detection.

---

## 32. Validation Gate

The Writer Agent output must pass deterministic validation before entering the Blog Editor.

Validation categories:

```text
Schema Validation
Research Usage Validation
Human Opinion Validation
First-person Validation
Citation Validation
Dependency Validation
Content Validation
Source-overlap Warning
```

The LLM’s successful completion does not by itself make the result a valid Blog Artifact.

---

## 33. Schema Validation

Schema Validation checks:

- Required fields
- Schema version
- Markdown body format
- Valid enum values
- Artifact identifiers
- Dependency identifiers
- Generation references
- Provenance structure
- Warning structure

Malformed output cannot enter the Blog Editor.

---

## 34. Research Usage Validation

Research Usage Validation checks:

- No excluded item was used
- No unreviewed important item was used
- Corrected items use corrected representations
- `needs_verification` content is not expressed as confirmed fact
- Specific factual claims include Research references
- Referenced Research items exist
- Source Evidence references exist
- Research Result is approved and not stale

---

## 35. Human Opinion Validation

Human Opinion Validation checks:

- Creator-led Mode has Confirmed Human Opinion
- No unconfirmed AI Interpretation is used
- No skipped Opinion is represented
- No personal experience is invented
- Opinion expression remains semantically aligned
- Referenced Opinion Responses exist
- Human Opinion Version is confirmed and not awaiting review

---

## 36. First-person Validation

First-person Validation identifies language such as:

```text
我认为
我发现
我使用过
我的经验
我的团队
我们经常
```

Each first-person position or experience must have a Confirmed Human Opinion reference.

Unsupported first-person experience is a Blocking Error.

---

## 37. Citation Validation

Citation Validation checks:

- Direct Quotes have precise Evidence
- Quoted wording matches the Evidence
- Public attribution exists
- Referenced Source metadata exists
- Reference entries are not duplicated
- Source links are available where required
- Important statistics and attributed claims have public attribution
- Excessive quotation length triggers warning

---

## 38. Dependency Validation

Dependency Validation checks:

- Research Result Version exists
- Research Result is approved
- Research Result is not stale
- Human Opinion Version exists when required
- Human Opinion is confirmed
- Human Opinion is not `review_required`
- Output mode matches available dependencies
- Referenced Source Versions remain accessible

---

## 39. Content Validation

Content Validation checks:

- Title exists
- Body is not empty
- Required sections are present when applicable
- No unfinished placeholders remain
- Markdown parses successfully
- No severe repetition exists
- Research gaps are surfaced
- Article length is within acceptable tolerance
- Article does not promise unsupported conclusions
- References section is generated when required

---

## 40. Validation Severity

Validation findings are divided into two levels.

### Blocking Error

Examples:

- Excluded fact used
- Missing required dependency
- Fabricated first-person experience
- Invalid Direct Quote
- Stale Research dependency
- Invalid Markdown contract
- Creator-led Mode without Confirmed Opinion

Blocking Errors must be resolved before the Draft enters the normal Blog Editor workflow.

### Warning

Examples:

- Long Direct Quote
- Important claim supported by one Source
- Primary Source structure appears highly similar
- Title may overpromise
- One section depends on uncertain material
- Provenance entry requires revalidation
- Article length differs from request

Warnings may enter the Editor with visible user notification.

---

## 41. Writer Agent Completion Status

Writer Agent execution may return:

```text
success
partial
blocked
```

### `success`

A complete Blog Draft passed all Blocking Validation.

### `partial`

A usable Draft exists but contains visible warnings or incomplete optional content.

### `blocked`

The Writer Agent cannot safely create a usable Draft.

Possible causes:

- Research is not approved
- Research is stale
- Creator-led Mode lacks Confirmed Opinion
- Necessary factual support is absent
- All relevant Research items are excluded
- Direct quotation cannot be verified
- Required Source Evidence is unavailable

Chief Editor determines the next workflow action based on this status.

---

## 42. End-to-End Writer Flow

```text
Chief Editor creates Blog Generation Request
        ↓
Validate Research and Human Opinion dependencies
        ↓
Writer Agent generates Blog Plan
        ↓
Validate Plan
        ↓
Optional Outline Review
        ↓
Writer Agent generates Markdown Draft
        ↓
Schema Validation
        ↓
Research and Provenance Validation
        ↓
Human Opinion and First-person Validation
        ↓
Citation Validation
        ↓
Dependency Validation
        ↓
Source-overlap Warning
        ↓
Create immutable Blog Draft v1
        ↓
Create mutable Blog Working Copy
        ↓
User review, AI Proposals, Approval, and Export
```

---

## 43. MVP Exclusions

The first Writer Agent implementation does not require:

- Autonomous internet research
- Automatic Source discovery
- Automatic Research modification
- Automatic Blog approval
- Automatic publishing
- Legal plagiarism determination
- Full academic citation systems
- Framework-specific MDX components
- Automatic use of long-term Memory as user opinion
- Unlimited autonomous rewriting loops
- Precise semantic Provenance for every sentence
- Multi-Agent debate during every Draft
- Automatic keyword-ranking research
- Real-time SEO competition analysis

---

# 44. Decisions

## DEC-076

### Status

Accepted

### Title

Writer Agent 只负责从已批准内容基础生成 Blog Draft

### Decision

Writer Agent 负责：

- Blog Plan
- 文章结构
- 内容组织
- Markdown Draft
- 标题和元数据建议
- Internal Provenance
- Research Gap 和 Warning 输出

Writer Agent 不负责：

- Source 抓取
- 外部搜索
- Research 修改
- Blog 审批
- Blog 发布
- 最终公开 URL

### Reason

Source、Research、Writing、Review 和 Publishing 具有不同的职责、权限与风险。

将这些职责合并到 Writer Agent 会破坏审核链路和内容可追溯性。

### Impact

Writer Agent 不能自行把 Approved Research 之外的外部事实加入正式 Draft。

发现内容缺口时必须返回 Research Gap。

---

## DEC-077

### Status

Accepted

### Title

Writer Agent 输入必须引用具体 Research 与 Human Opinion Version

### Decision

Writer Agent 的正式输入包含：

- Approved Research Result Version
- Confirmed Human Opinion Version，或明确 Research-based Mode
- Source Evidence Bundle
- Blog Generation Request
- Available Brand Rules

### Reason

版本化输入可以保证生成结果：

- 可重复
- 可追踪
- 可验证
- 可比较
- 可参与依赖失效传播

### Impact

Blog Artifact 必须保存具体的：

```text
research_result_version_id
human_opinion_version_id
```

以及对应 Generation Request。

---

## DEC-078

### Status

Accepted

### Title

Writer Agent 采用 Plan-first 两阶段生成

### Decision

Writer Agent 先生成 Blog Plan，再根据 Plan 生成 Markdown Draft。

Blog Plan 属于 Generation Metadata，不成为第二份 Canonical Blog Body。

Outline Review 是可选步骤，不作为每篇 Blog 的强制审批点。

### Reason

Plan-first 可以降低：

- 文章结构混乱
- 内容重复
- Research 遗漏
- Human Opinion 放置错误
- Provenance 丢失
- 引用规划失败

### Impact

Writer Agent Runtime 需要支持：

```text
Plan Generation
→ Plan Validation
→ Draft Generation
```

---

## DEC-079

### Status

Accepted

### Title

Blog 必须采用 Synthesis-first，而不是 Source 顺序改写

### Decision

Writer Agent 根据：

- 文章目的
- 目标读者
- Approved Research
- Confirmed Human Opinion
- Brand Rules

创建新的文章结构。

默认不得沿用 Primary Source 的章节顺序进行逐段同义改写。

### Reason

ContentOS 的核心价值是 Content Re-creation，而不是自动摘要、同义替换或洗稿。

### Impact

Blog Plan、Writer Prompt、Validator 和 Source-overlap 检查需要关注：

- 结构重组
- Source 独特措辞
- 长文本重合
- 逐段改写风险

---

## DEC-080

### Status

Accepted

### Title

所有具体事实必须可追溯到已审核 Research 与 Source Evidence

### Decision

Writer Agent 不得仅依靠模型记忆加入具体事实。

Blog 中的外部事实必须引用：

```text
Accepted Research Item
或
Corrected Research Item
```

并能够追溯至 Source Evidence。

`needs_verification` 内容只能以明确不确定的方式表达。

### Reason

模型知识未经本次 Source 与 Research 流程审核，不能作为当前 Content Package 的正式事实来源。

### Impact

Blog Provenance、Research Usage Validation 和 Source Evidence Reference 成为 Draft 生成的必要组成部分。

---

## DEC-081

### Status

Accepted

### Title

Creator-led 与 Research-based Blog 使用不同生成约束

### Decision

Creator-led Blog 可以使用：

- Confirmed Human Opinion
- Confirmed Personal Experience
- Confirmed first-person expression

Research-based Blog 不得包含未经确认的：

- 第一人称立场
- 第一人称经历
- 共同经验
- Creator-specific conclusion

### Reason

输出模式必须真实反映用户是否提供了可追溯的人类贡献。

### Impact

Writer Agent Prompt、Blog Artifact 和 Validators 必须读取：

```text
content_mode
```

---

## DEC-082

### Status

Accepted

### Title

内部 Provenance 与公开 Citation 分离

### Decision

ContentOS 内部保存：

- Blog Statement
- Research Item
- Source Evidence
- Confirmed Human Opinion

之间的依赖关系。

公开 Blog 只输出读者需要的 Attribution、Links 和 References，不公开内部对象 ID。

### Reason

内部审计和公开阅读具有不同目标。

内部需要精确依赖，公开内容需要清晰、自然和可理解的引用。

### Impact

Blog Artifact 使用 Provenance Sidecar。

Blog Export Mapper 负责将适当内容转换成公开引用格式。

---

## DEC-083

### Status

Accepted

### Title

MVP 使用正文 Attribution 加文末 References 的公开引用策略

### Decision

直接引用、具体数据、来源观点和重要争议性事实在正文中进行 Attribution。

文章末尾生成通用 Markdown References Section。

MVP 不依赖特定博客框架的脚注、MDX 或 Citation 组件。

### Reason

该方式兼顾：

- Markdown 可移植性
- 读者体验
- 来源透明度
- PersonalBlog 框架独立性

### Impact

Writer Agent 和 Blog Export Mapper 需要生成：

- 通用 Markdown Links
- Inline Attribution
- References Section

---

## DEC-084

### Status

Accepted

### Title

Direct Quote 必须来自精确 Evidence，并保留公开来源归属

### Decision

引号中的内容必须与 Approved Source Evidence 一致。

无法确认准确原文时，Writer Agent 必须使用意译和来源归属，不得生成近似直接引语。

过长 Direct Quote 触发人工审核 Warning。

### Reason

错误引用和伪造引用会严重损害：

- 内容可信度
- 用户品牌
- 来源关系
- 审核可靠性
- 潜在版权风险控制

### Impact

Quote Validator 必须检查：

- Source Evidence
- Quoted wording
- Public Attribution
- Quote length

---

## DEC-085

### Status

Accepted

### Title

Blog Draft 在进入 Editor 前必须通过确定性 Validation Gate

### Decision

Writer Agent 输出必须经过：

- Schema Validation
- Research Usage Validation
- Human Opinion Validation
- First-person Validation
- Citation Validation
- Dependency Validation
- Content Validation
- Source-overlap Warning

Blocking Error 必须先解决。

Warning 可以携带可见提示进入 Blog Editor。

### Reason

LLM 输出不能直接被视为可靠且符合领域规则的正式对象。

### Impact

Writer Agent 之外需要独立的确定性 Validators。

Chief Editor 根据验证结果执行：

- Continue
- Retry
- Repair
- Return to Research
- Ask for Human Opinion
- Block workflow

---

## 45. Rejected or Deferred Approaches

### Writer Agent Searching the Internet

Rejected for the MVP because new external facts must enter through the Source and Research pipeline.

### Writer Agent Using Model Memory as Formal Evidence

Rejected because pretrained knowledge is not an approved Source.

### Source-order Paraphrasing

Rejected because it conflicts with Content Re-creation.

### Mandatory Outline Approval for Every Blog

Rejected because it introduces unnecessary workflow friction.

Outline Review remains optional.

### Unconfirmed Human Opinion Usage

Rejected because AI interpretation cannot represent the creator without approval.

### First-person Language Without Opinion Provenance

Rejected because it may fabricate the creator’s position or experience.

### Public Exposure of Internal Provenance IDs

Rejected because internal audit metadata is not reader-facing content.

### Approximate Direct Quotations

Rejected because paraphrased meaning must not appear inside quotation marks.

### Draft Entering Editor Without Validation

Rejected because invalid LLM output must not become a normal Artifact state.

### Legal Plagiarism Determination

Deferred because Source-overlap heuristics cannot provide a legal conclusion.

---

## 46. Open Questions

The following questions remain unresolved:

1. Which Blog Plan fields are mandatory?
2. Should users be able to edit the Blog Plan directly?
3. Should a modified Blog Plan be versioned?
4. Which length ranges correspond to short, medium, and long?
5. How many title candidates should Writer Agent generate?
6. Should title selection occur before or after full Draft generation?
7. How should Writer Agent balance multiple conflicting Sources?
8. Which `needs_verification` statements may appear in a Blog?
9. Can the user explicitly authorize a model-memory fact?
10. Should such a fact be converted into a new Research task first?
11. How should Source Evidence lookup be exposed to Writer Agent?
12. How much Evidence context should be included?
13. How should Public References be deduplicated?
14. Should every Source used internally appear in the public References section?
15. Which types of facts require inline Attribution?
16. How should links be handled when the Source URL is unavailable?
17. How should translated Direct Quotes be represented?
18. Should the original-language quote also be preserved?
19. What maximum Direct Quote length triggers warning?
20. How should Source-overlap similarity be measured?
21. Which similarity threshold should trigger a Warning?
22. How should the Validator distinguish fact from editorial synthesis?
23. How should first-person validation work across Chinese and English?
24. Should a Warning reduce Originality Readiness?
25. Can a partial Draft be approved after manual correction?
26. Should an export snapshot rerun all Writer Validators?
27. How should Provenance be updated after manual Blog editing?
28. Which edits require Provenance revalidation?
29. Should users be able to manually attach a Research or Opinion Reference?
30. How should future Blocks migration transform the Provenance Sidecar?
31. Should Writer Agent generate multiple complete Draft candidates?
32. When should a full alternative Draft be created?
33. How should Blog quality be evaluated beyond factual validation?
34. Which Brand Rules enter the MVP?
35. Should SEO metadata be generated during Writer execution or Export?

---

## 47. Documentation Updates

Create:

```text
docs/sessions/session-013.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-076
DEC-077
DEC-078
DEC-079
DEC-080
DEC-081
DEC-082
DEC-083
DEC-084
DEC-085
```

Future documents to create:

```text
docs/agents/writer-agent.md
docs/architecture/writer-input-contract.md
docs/architecture/blog-plan-contract.md
docs/architecture/blog-draft-contract.md
docs/architecture/blog-provenance.md
docs/architecture/blog-citation-strategy.md
docs/architecture/writer-validation.md
docs/product/blog-generation.md
```

Possible future Schema files:

```text
schemas/writer-input-v1.json
schemas/blog-plan-v1.json
schemas/blog-draft-v1.json
schemas/blog-provenance-v1.json
schemas/research-gap-v1.json
schemas/writer-validation-result-v1.json
```

These paths are suggestions rather than final implementation decisions.

---

## 48. Documentation Sync Checklist

- [x] DEC-076 confirmed
- [x] DEC-077 confirmed
- [x] DEC-078 confirmed
- [x] DEC-079 confirmed
- [x] DEC-080 confirmed
- [x] DEC-081 confirmed
- [x] DEC-082 confirmed
- [x] DEC-083 confirmed
- [x] DEC-084 confirmed
- [x] DEC-085 confirmed
- [ ] Save this document as `docs/sessions/session-013.md`
- [ ] Add DEC-076 through DEC-085 to `docs/decisions/decisions.md`
- [ ] Define Writer Agent Input Contract
- [ ] Define Blog Plan Contract
- [ ] Define Blog Draft Contract
- [ ] Define Provenance Sidecar Contract
- [ ] Define Research Gap Contract
- [ ] Define public Citation rules
- [ ] Define Direct Quote validation
- [ ] Define Source-overlap heuristics
- [ ] Define Writer Validation results
- [ ] Define Creator-led and Research-based Writer prompts
- [ ] Review AGENTS.md after Writer specifications become authoritative

---

## 49. Session Summary

The Writer Agent converts approved Research and confirmed Human Opinion into a Blog Draft.

It does not capture Sources, search the internet, change Research, approve content, or publish articles.

Every Writer execution references specific Research and Human Opinion versions.

The Writer Agent uses a Plan-first process:

```text
Blog Plan
→ Markdown Draft
```

The Plan supports structure, Research allocation, Human Opinion allocation, citations, and Research-gap detection, but it does not become a second canonical Blog body.

Blog generation follows Synthesis-first rather than Source-order paraphrasing.

Concrete facts must originate from Accepted or Corrected Research items and remain traceable to Source Evidence.

Creator-led and Research-based Blogs follow different first-person and Human Opinion constraints.

Internal Provenance is stored separately from reader-facing Citations.

The MVP uses inline Attribution and a Markdown References section.

Direct Quotations require exact approved Evidence and public Source attribution.

Writer output must pass deterministic Schema, Research, Human Opinion, first-person, Citation, dependency, and content validation before entering the Blog Editor.

Validation failures may return `success`, `partial`, or `blocked`, allowing Chief Editor to deterministically choose the next workflow action.