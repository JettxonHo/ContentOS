# ContentOS Session-014

**Status:** Formalized  
**Session Type:** Platform Packaging and Content Contract Architecture  
**Topic:** Packaging Agent, Xiaohongshu Artifact Contract, Narrative Structure, and Content Validation  
**Date:** 2026-07-26

---

## 1. Context

ContentOS has established the following upstream content foundation:

```text
Approved Normalized Source Versions
→ Approved Research Result Version
→ Confirmed Human Opinion Version
→ Platform-specific Output Agents
```

Session-013 defined the Writer Agent and Blog-generation contract.

The Blog and Xiaohongshu outputs share the same approved Research and Human Opinion foundation, but serve different reader behaviors and require different structures.

The Xiaohongshu output must not be treated as a shortened Blog.

The unresolved questions were:

1. What is the Packaging Agent responsible for?
2. Should Xiaohongshu content depend on the Blog Artifact?
3. How should Platform Title, Cover Title, Cover Subtitle, and Page Headings be separated?
4. How should a carousel form a coherent narrative?
5. What information belongs to Packaging Agent versus Visual Agent?
6. How should Caption, CTA, and Hashtags be represented?
7. How should Creator-led and Research-based modes differ?
8. Which content validations must run before the Visual stage?
9. Which Xiaohongshu Artifact Version may be consumed by the Visual Agent?

This Session defines the Packaging Agent contract and the Xiaohongshu content object.

---

## 2. Core Output Relationship

Blog and Xiaohongshu are parallel outputs of the same Content Foundation.

```text
Approved Research
+
Confirmed Human Opinion
        ↓
┌───────────────────────────────┐
│                               │
▼                               ▼
Writer Agent              Packaging Agent
│                               │
▼                               ▼
Blog Artifact             Xiaohongshu Artifact
```

The default architecture is not:

```text
Blog
→ Shorten
→ Split into pages
→ Xiaohongshu
```

Instead:

```text
Approved Content Foundation
+
Xiaohongshu Generation Request
+
Platform Profile
→ Platform-native Xiaohongshu Artifact
```

Blog and Xiaohongshu may express the same topic and confirmed opinions differently, but neither output becomes the other output’s canonical source.

---

## 3. Why Packaging Does Not Depend on Blog by Default

Making Blog the default upstream dependency would create:

```text
Source
→ Research
→ Human Opinion
→ Blog
→ Xiaohongshu
```

This introduces several problems:

- Blog structure errors propagate into Xiaohongshu.
- Xiaohongshu becomes a secondary summary.
- Blog revisions unnecessarily invalidate Xiaohongshu.
- Provenance must pass through another derived Artifact.
- Packaging Agent loses direct access to reviewed Research structure.
- Platform-native narrative becomes harder to achieve.

The preferred relationship is:

```text
Research v2 + Human Opinion v1
→ Blog v3
```

and independently:

```text
Research v2 + Human Opinion v1
→ Xiaohongshu v2
```

A future explicit feature may convert an approved Blog into Xiaohongshu content, but this is not the MVP default.

---

## 4. Packaging Agent Responsibility

The Packaging Agent converts approved content foundations into a Xiaohongshu-native content package.

It is responsible for:

- Selecting a platform-specific angle
- Creating a carousel narrative
- Generating Platform Title candidates
- Generating Cover Title and Cover Subtitle
- Defining each page’s communication purpose
- Generating page-level copy
- Generating Caption
- Recommending CTA
- Recommending Hashtags
- Assigning Research and Human Opinion references
- Defining public attribution needs
- Producing a content-side Visual Brief
- Identifying packaging risks
- Returning structured validation status

The Packaging Agent is not responsible for:

- Source capture
- External web research
- Research Result modification
- Human Opinion modification
- Pixel-level visual design
- Font or color selection
- Final layout rendering
- Image generation execution
- PNG export
- Automatic publishing
- Traffic prediction
- Guaranteed growth results

---

## 5. Packaging Agent Input Contract

Recommended conceptual input:

```json
{
  "schema_version": "contentos.packaging-input/v1",

  "content_package_id": "cp_001",

  "dependencies": {
    "research_result_version_id": "researchver_002",
    "human_opinion_version_id": "opinionver_001",
    "platform_profile_version": "xiaohongshu-content-profile/v1"
  },

  "content_mode": "creator_led",

  "research_bundle": {},
  "human_opinion_bundle": {},
  "source_evidence_bundle": {},

  "generation_request": {
    "purpose": "explain_and_comment",
    "target_audience": "刚接触 AI Agent 的产品经理",
    "tone": "conversational_professional",
    "requested_page_count": 8,
    "interaction_goal": "invite_discussion",
    "language": "zh-CN"
  },

  "platform_profile": {},
  "brand_rules": {}
}
```

Every generated Xiaohongshu Artifact must record the exact input versions used.

---

## 6. Approved Research Input

Packaging Agent may use Research items with the following states:

```text
accepted
corrected
needs_verification
```

Usage rules:

### Accepted

The reviewed Research statement may be used.

### Corrected

The user-corrected representation must be used.

### Needs Verification

The statement may only be represented as:

- Uncertain
- Unconfirmed
- A prediction
- A disputed claim
- A question requiring further evidence

It must not be represented as an established fact.

Packaging Agent must not use:

```text
unreviewed
excluded
incorrect
```

---

## 7. Confirmed Human Opinion Input

In Creator-led Mode, Packaging Agent may use:

- Confirmed Opinion Statements
- Confirmed Editorial Expressions
- Confirmed Personal Experiences
- Confirmed recommendations
- Confirmed first-person judgments

It must not use:

- Unconfirmed AI Interpretations
- Skipped answers
- AI-inferred user positions
- Historical Memory without current confirmation
- Invented personal experience
- Rejected Editorial Expressions

Research-based Mode does not require Human Opinion.

---

## 8. Xiaohongshu Generation Request

The Generation Request defines the requested communication goal.

Recommended fields:

```json
{
  "content_mode": "creator_led",
  "purpose": "explain_and_comment",
  "target_audience": "AI 产品经理初学者",
  "tone": "conversational_professional",
  "requested_page_count": 8,
  "interaction_goal": "invite_discussion",
  "language": "zh-CN"
}
```

Recommended MVP purposes:

```text
explain
compare
comment
practical_guide
mistake_breakdown
framework
experience_share
explain_and_comment
```

Recommended interaction goals:

```text
none
invite_discussion
save_for_reference
read_full_blog
```

The MVP should expose a limited, understandable set of options rather than unrestricted style prompts.

---

## 9. Platform Profile

Platform-specific constraints are provided through a versioned Platform Profile.

Conceptual structure:

```json
{
  "platform": "xiaohongshu",
  "profile_version": "xiaohongshu-content-profile/v1",

  "page_count": {
    "minimum": 6,
    "maximum": 10,
    "default": 8
  },

  "title_constraints": {},
  "caption_constraints": {},
  "content_density_rules": {},
  "attribution_rules": {},
  "prohibited_patterns": []
}
```

The MVP uses a manually maintained static Platform Profile.

The Platform Profile may later evolve independently from the Packaging Agent Prompt.

The MVP does not require:

- Real-time trend retrieval
- Live recommendation-algorithm analysis
- Automated platform-policy crawling
- Performance-based profile optimization

---

## 10. Brand Rules

Packaging Agent may receive limited Brand Rules, including:

- Default tone
- Whether Emoji are allowed
- Whether first-person language is preferred
- Preferred title intensity
- Prohibited marketing language
- Default target audience
- Default ending style
- Preferred paragraph length
- Preferred punctuation style

Brand Rules affect expression but may not override:

- Approved Research
- Confirmed Human Opinion
- Citation requirements
- First-person provenance
- Platform safety constraints
- Validation rules

---

## 11. Plan-first Packaging

Packaging Agent uses two stages:

```text
Phase 1
Packaging Plan

Phase 2
Xiaohongshu Artifact
```

The Plan is generated and validated before complete page copy is produced.

This reduces:

- Repeated pages
- Narrative gaps
- Uneven information density
- Incorrect placement of Human Opinion
- Caption duplication
- Missing attribution
- Weak cover-to-content consistency

---

## 12. Packaging Plan

The Packaging Plan may include:

- Core message
- Target audience
- Platform angle
- Narrative pattern
- Page count
- Page purposes
- Research allocation
- Human Opinion allocation
- Public attribution plan
- Content-density expectation
- Content-side Visual Brief
- Risks
- Research gaps

Example:

```json
{
  "schema_version": "contentos.xhs-plan/v1",

  "core_message": "普通用户不需要理解 MCP 的技术细节，但需要理解它带来的产品能力.",

  "narrative_pattern": "question_to_answer",

  "pages": [
    {
      "page_number": 1,
      "page_purpose": "cover",
      "message": "普通用户真的要学懂 MCP 吗？",
      "research_item_refs": [],
      "opinion_refs": [
        "opresp_001"
      ]
    },
    {
      "page_number": 2,
      "page_purpose": "context",
      "message": "为什么最近到处都在讨论 MCP",
      "research_item_refs": [
        "claim_001"
      ],
      "opinion_refs": []
    },
    {
      "page_number": 3,
      "page_purpose": "problem",
      "message": "Agent 连接工具时面临什么问题",
      "research_item_refs": [
        "fact_002"
      ],
      "opinion_refs": []
    }
  ],

  "warnings": [],
  "research_gaps": []
}
```

The Packaging Plan belongs to Generation Metadata.

It is not the final publishable Artifact.

---

## 13. Carousel Narrative

A Xiaohongshu carousel must form a coherent reading chain rather than a collection of unrelated cards.

Possible narrative flow:

```text
Hook
→ Context
→ Problem
→ Explanation
→ Insight
→ Creator Position
→ Practical Takeaway
→ Summary or CTA
```

Possible Narrative Patterns include:

```text
question_to_answer
problem_to_solution
myth_to_reality
comparison
step_by_step
framework
story_to_insight
```

Not every carousel must use the same pattern.

However, every carousel must have one identifiable narrative pattern and a clear reader journey.

---

## 14. One Primary Purpose per Page

Each page should communicate one primary message.

A page may contain:

- One heading
- One primary message
- A small number of supporting points
- One quote or attribution
- One visual relationship

A page should not simultaneously contain:

```text
Definition
+
History
+
Three examples
+
Creator Opinion
+
Action recommendation
```

Recommended page model:

```json
{
  "page_purpose": "explanation",
  "primary_message": "MCP 解决的是重复集成问题。",
  "supporting_points": [
    "不同 Agent 不必为每个工具重新设计连接方式",
    "工具和数据源可以使用统一接口"
  ]
}
```

This provides a stable content unit for Visual Agent and Render Engine.

---

## 15. Page Count

The MVP supports:

```text
6–10 pages
```

Recommended default:

```text
8 pages
```

The actual page count depends on:

- Available Research
- Human Opinion
- Narrative Pattern
- User request
- Information density
- Platform Profile
- Content purpose

Packaging Agent must not repeat content merely to reach the requested page count.

If the available content cannot support six meaningful pages, Packaging Agent should:

- Narrow the topic
- Return a partial result
- Report a Research Gap
- Recommend a different output form
- Block generation when necessary

It must not create filler pages.

---

## 16. Title Hierarchy

The Xiaohongshu Artifact separates:

```text
Platform Title
≠
Cover Title
≠
Cover Subtitle
≠
Page Heading
```

These fields serve different surfaces.

---

## 17. Platform Title

The Platform Title is used as the post title in the platform interface.

It may:

- Be more complete
- Include searchable concepts
- Use a clear content angle
- Include a controlled curiosity gap
- Be longer than the Cover Title

Example:

> 普通用户到底要不要学 MCP？我更关心的是这件事

The Platform Title is not rendered as the only title on the cover by default.

---

## 18. Cover Title

The Cover Title is the largest visible message on the first image.

It should:

- Be shorter
- Be visually scannable
- Express the core conflict or question
- Match the actual carousel content
- Avoid unsupported overstatement

Example:

```text
普通用户
要学 MCP 吗？
```

---

## 19. Cover Subtitle

The Cover Subtitle adds context without replacing the main hook.

Example:

> 先别急着学协议，看看它到底解决什么问题

The Cover Subtitle is stored independently from the Platform Title and Cover Title.

---

## 20. Page Heading

Each inner page has its own heading.

Examples:

```text
为什么 MCP 突然火了？
一句话理解 MCP
它真正解决了什么？
产品经理需要关注什么？
```

A carousel page must not consist only of a long body paragraph without a clear heading.

---

## 21. Title Candidates

Packaging Agent may generate a limited number of Platform Title candidates.

Example:

```json
{
  "platform_title_candidates": [
    {
      "candidate_id": "title_001",
      "text": "普通用户到底要不要学 MCP？",
      "angle": "question",
      "recommended": true,
      "warnings": []
    },
    {
      "candidate_id": "title_002",
      "text": "MCP 很火，但普通用户可能学错了重点",
      "angle": "contrarian",
      "recommended": false,
      "warnings": []
    }
  ]
}
```

Candidate strategies may include:

```text
question
contrast
outcome
mistake
explanation
experience
framework
```

Packaging Agent must not generate unsupported statements such as:

- “90% 的人都不知道”
- “所有人都必须学”
- “保证提高效率”
- “我用了一个月” without confirmed experience
- “行业已经统一” without reviewed evidence

---

## 22. Xiaohongshu Artifact Contract

Recommended conceptual structure:

```json
{
  "schema_version": "contentos.xhs-artifact/v1",

  "artifact_id": "xhs_001",
  "version_id": "xhsver_001",
  "content_package_id": "cp_001",
  "version_number": 1,
  "status": "draft",

  "generation_request": {
    "content_mode": "creator_led",
    "purpose": "explain_and_comment",
    "target_audience": "AI 产品经理初学者",
    "tone": "conversational_professional",
    "requested_page_count": 8
  },

  "titles": {
    "platform_title_candidates": [],
    "selected_platform_title": "",
    "cover_title": "",
    "cover_subtitle": ""
  },

  "pages": [],

  "caption": {
    "body_markdown": "",
    "call_to_action": {
      "type": "invite_discussion",
      "text": ""
    },
    "public_references": []
  },

  "hashtags": [],

  "dependencies": {
    "research_result_version_id": "researchver_002",
    "human_opinion_version_id": "opinionver_001",
    "platform_profile_version": "xiaohongshu-content-profile/v1"
  },

  "provenance": {
    "page_usages": [],
    "first_person_usages": [],
    "direct_quotes": [],
    "public_attributions": []
  },

  "visual_brief": {},
  "warnings": [],

  "generation": {
    "plan_id": "xhsplan_001",
    "agent_run_id": "run_001"
  }
}
```

This is a domain contract rather than a final database table.

---

## 23. Page Contract

Recommended page structure:

```json
{
  "page_id": "page_003",
  "page_number": 3,
  "page_purpose": "explanation",

  "content": {
    "heading": "MCP 真正解决的问题",
    "primary_message": "它试图减少 Agent 与工具之间的重复集成。",
    "supporting_points": [
      "统一连接方式",
      "降低工具接入成本",
      "减少重复开发"
    ],
    "quote": null,
    "footer_note": null
  },

  "content_density": "medium",

  "emphasis": [
    "重复集成"
  ],

  "research_item_refs": [
    "claim_002",
    "fact_003"
  ],

  "opinion_refs": [],

  "public_attribution": null
}
```

A stable `page_id` supports:

- Editing
- Reordering
- Version comparison
- Design Specification references
- Rendered Output references
- Provenance
- Revision Proposals

---

## 24. Page Purpose

Possible initial `page_purpose` values include:

```text
cover
hook
context
problem
explanation
comparison
framework
example
creator_opinion
practical_action
summary
cta
reference
```

Page Purpose describes communication intent.

It does not select a pixel-level visual component.

---

## 25. Content and Visual Separation

The cross-Agent boundary is:

```text
Packaging Agent
→ Page purpose and content semantics

Visual Agent
→ Component, layout, hierarchy, and visual asset decisions

Render Engine
→ Deterministic pixel output
```

Packaging Agent may output:

- Page Purpose
- Content payload
- Emphasis
- Content density
- Relationship type
- Content-side Visual Brief

Packaging Agent must not decide:

- Exact font size
- Exact color
- Exact spacing
- Pixel coordinates
- Final template implementation
- Final image crop
- Rendering technology

---

## 26. Visual Brief

Packaging Agent may provide content-side visual requirements.

Example:

```json
{
  "visual_brief": {
    "overall_mood": "clear_technical_editorial",

    "priority_pages": [
      "page_001",
      "page_005"
    ],

    "asset_requests": [
      {
        "page_id": "page_004",
        "asset_type": "simple_diagram",
        "description": "Agent、MCP 和外部工具之间的连接关系"
      }
    ]
  }
}
```

The Visual Brief may communicate:

- Important pages
- Required relationships
- Pages that need diagrams
- Pages that may use illustrations
- Content that must remain together
- High-density pages
- Words requiring emphasis
- Required public attribution

The Visual Brief is not a Design Specification.

---

## 27. Caption

Caption is a separate platform expression.

It may:

- Add context
- Summarize the core takeaway
- Include a confirmed creator perspective
- Invite discussion
- Provide References
- Clarify uncertainty
- Link to a full Blog
- Add information that does not fit on the pages

Caption must not simply reproduce the complete carousel text.

Recommended flow:

```text
Opening context
→ Core takeaway
→ Creator perspective when available
→ Discussion question or CTA
→ Public References
```

Research-based Mode cannot introduce unconfirmed first-person content through Caption.

---

## 28. Call to Action

Supported MVP CTA types may include:

```text
none
invite_discussion
save_for_reference
read_full_blog
```

CTA must remain relevant to the content.

It must not:

- Promise unavailable resources
- Use fabricated urgency
- Guarantee benefits
- Create fake scarcity
- Claim an unpublished Blog exists
- Manipulate readers through unrelated engagement prompts

---

## 29. Hashtags

Hashtags are publishing recommendations rather than content facts.

Recommended structure:

```json
[
  {
    "text": "AI产品经理",
    "category": "audience"
  },
  {
    "text": "AIAgent",
    "category": "topic"
  },
  {
    "text": "MCP",
    "category": "concept"
  }
]
```

Possible categories:

```text
topic
concept
audience
content_type
industry
tool
```

Without real-time Platform Intelligence, Packaging Agent must not claim that:

- A Hashtag is currently trending
- A Hashtag guarantees discovery
- A Hashtag will increase traffic
- A Hashtag represents current algorithm preference

---

## 30. Creator-led Mode

Creator-led Xiaohongshu content may include:

- Confirmed creator position
- Confirmed first-person judgment
- Confirmed personal experience
- Confirmed recommendation
- Stronger creator-specific conclusion

Every first-person usage must reference a Confirmed Human Opinion Response.

Creator-led Mode does not permit AI to intensify or invent the creator’s position.

---

## 31. Research-based Mode

Research-based content may include:

- Explanation
- Source comparison
- Structured synthesis
- Definitions
- Research-supported recommendations
- Explicit uncertainty
- Multiple Source perspectives

It must not fabricate:

```text
我认为……
我踩过这个坑……
我用了一个月……
我在工作中发现……
我的团队遇到过……
我们都知道……
```

Packaging Agent cannot use first-person style merely because it appears more suitable for social media.

---

## 32. Internal Provenance

Every page may preserve relationships such as:

```text
Page factual content
→ Research Items
→ Source Evidence
```

and:

```text
Page creator opinion
→ Confirmed Human Opinion Response
```

Internal Provenance supports:

- Validation
- Editing
- Dependency propagation
- Re-generation
- Audit
- Future evaluation

Internal IDs are not displayed publicly.

---

## 33. Public Attribution

Public Attribution may be displayed in:

- Page content
- Page footer
- Quote attribution
- Caption
- Caption References

Public Attribution is required for:

- Direct quotations
- Specific data
- Source-author positions
- Organization announcements
- Important disputed claims
- Important single-source conclusions

Visual Agent may determine where approved attribution text is placed, but it may not remove required attribution.

---

## 34. Direct Quotations

Packaging Agent may use a Direct Quote only when:

1. It exists in Approved Source Evidence.
2. The wording is preserved accurately.
3. A Source Reference is recorded.
4. Public Attribution is planned.
5. The text fits the page or is shortened safely.
6. A paraphrase is not placed inside quotation marks.
7. The quote does not create a misleading cover claim.

If the exact wording cannot be preserved, Packaging Agent must use attributed paraphrase.

---

## 35. Content Density

Packaging Agent may classify pages as:

```text
low
medium
high
```

Initial density checks may consider:

- Heading length
- Primary-message length
- Supporting-point count
- Quote length
- Footer-note length
- Number of distinct concepts
- Page purpose
- Platform Profile limits

This is an initial content-density classification.

Final overflow validation occurs after Visual Agent selects components and Render Engine measures actual layout.

---

## 36. Artifact Editing and Versioning

Xiaohongshu Artifact follows the same core editing model as Blog:

```text
Mutable Working Copy
+
Immutable Artifact Versions
```

User actions may include:

- Edit Platform Title
- Select a title candidate
- Edit Cover Title
- Edit Cover Subtitle
- Edit page copy
- Reorder pages
- Add or remove pages
- Edit Caption
- Change CTA
- Edit Hashtags
- Request AI Revision Proposal

Meaningful checkpoints create immutable Versions.

Normal typing updates the Working Copy.

---

## 37. Content Approval

Visual Agent consumes only an Approved Xiaohongshu Artifact Version.

Recommended flow:

```text
Packaging Agent generates XHS Draft v1
→ Create XHS Working Copy
→ User edits and reviews content
→ Save immutable Version
→ Submit content review
→ Approve XHS Version
→ Visual Agent generates Design Specification
```

Visual Agent must not consume an unstable temporary Working Copy.

This preserves:

- Stable page IDs
- Stable content
- Stable attribution
- Reliable Design Specification
- Predictable rendering
- Clear dependency tracking

---

## 38. Packaging Validation Gate

Packaging output must pass deterministic validation before content approval and Visual Agent handoff.

Validation categories:

```text
Schema Validation
Narrative Validation
Research Validation
Human Opinion Validation
Title Validation
Density Validation
Citation Validation
Dependency Validation
```

---

## 39. Schema Validation

Checks include:

- Required title fields
- Valid Artifact identifiers
- Stable Page IDs
- Continuous Page Numbers
- Page Count
- Caption structure
- CTA structure
- Hashtag structure
- Dependency versions
- Platform Profile version
- Provenance structure
- Generation references

Malformed output cannot enter the standard content-review flow.

---

## 40. Narrative Validation

Checks include:

- A Narrative Pattern exists
- The cover promise is addressed later
- Page order is understandable
- Pages do not repeat the same message
- The content reaches a conclusion
- The flow does not contain unexplained jumps
- Human Opinion appears in a logical position
- CTA is consistent with the content
- Supporting points belong to the page’s primary message

---

## 41. Research Validation

Checks include:

- No excluded item is used
- No important unreviewed item is used
- Corrected items use corrected text
- Specific facts have Research references
- Uncertain content is not represented as fact
- Direct Quotes have Source Evidence
- Research dependency is approved
- Research dependency is not stale

---

## 42. Human Opinion Validation

Checks include:

- Creator-led Mode has Confirmed Human Opinion
- First-person content has Opinion references
- No unconfirmed AI Interpretation is used
- No skipped answer is represented
- No personal experience is invented
- Opinion expression remains aligned
- Human Opinion dependency is confirmed
- Human Opinion dependency is not `review_required`

---

## 43. Title Validation

Checks include:

- Platform Title is separate from Cover Title
- Cover Subtitle is separate from Cover Title
- Inner pages have headings
- Title claims match page content
- The cover promise is answered
- Unsupported numbers are absent
- Unsupported absolutes are absent
- Fabricated first-person experience is absent
- Cover Title is within acceptable length
- Platform Title preserves the core topic

---

## 44. Density Validation

Checks include:

- Page Count is between 6 and 10
- Pages do not contain too many supporting points
- Pages do not contain multiple unrelated purposes
- Quotes are not excessively long
- Caption does not reproduce the full carousel
- Cover is not overloaded
- High-density pages receive warnings
- Required attribution has not made a page impractical

Final rendering overflow remains a Render Pipeline responsibility.

---

## 45. Citation Validation

Checks include:

- Direct Quote wording matches Evidence
- Public Attribution is present
- Important statistics have Source attribution
- Source References exist
- References are deduplicated
- Attribution text has not been dropped
- Source links are available when required

---

## 46. Dependency Validation

Checks include:

- Research Result Version exists
- Research Result is approved
- Research Result is not stale
- Human Opinion Version exists when required
- Human Opinion is confirmed
- Human Opinion is not `review_required`
- Platform Profile Version exists
- Content Mode matches available dependencies
- Referenced Source Evidence remains accessible

---

## 47. Packaging Completion Status

Packaging Agent may return:

```text
success
partial
blocked
```

### `success`

A complete Artifact passes all Blocking Validation.

### `partial`

A usable Artifact exists but includes visible warnings.

Examples:

- One page is dense
- Caption partially repeats the carousel
- A title may overpromise
- One important claim has only one Source
- One page may be difficult to render

### `blocked`

The Artifact cannot safely enter content review.

Examples:

- Research is stale
- Creator-led Mode lacks Confirmed Human Opinion
- First-person experience lacks provenance
- Excluded Research is used
- Page Count is invalid and cannot be repaired
- Direct Quote lacks Evidence
- The carousel lacks a coherent narrative
- A required dependency is missing

---

## 48. End-to-End Packaging Flow

```text
Chief Editor creates Xiaohongshu Generation Request
        ↓
Validate Research and Human Opinion dependencies
        ↓
Packaging Agent generates Packaging Plan
        ↓
Validate Narrative Plan
        ↓
Packaging Agent generates Xiaohongshu Artifact v1
        ↓
Schema Validation
        ↓
Narrative Validation
        ↓
Research and Human Opinion Validation
        ↓
Title and Citation Validation
        ↓
Density and Dependency Validation
        ↓
Create XHS Working Copy
        ↓
User edits and reviews content
        ↓
Save immutable XHS Version
        ↓
Approve XHS content Version
        ↓
Visual Agent generates Design Specification
        ↓
Render Engine generates final images
```

---

## 49. MVP Exclusions

The Packaging MVP does not include:

- Blog-to-Xiaohongshu conversion as the default flow
- Real-time trend retrieval
- Real-time algorithm analysis
- Viral-probability prediction
- Traffic guarantees
- Automatic publishing
- Video scripts
- Animation
- Unlimited page counts
- Arbitrary page components
- Pixel-level layout selection
- AI modification of Research
- AI modification of Human Opinion
- Unconfirmed first-person content
- Automatic performance optimization
- Title-performance learning
- Full Platform Intelligence

---

# 50. Decisions

## DEC-086

### Status

Accepted

### Title

Packaging Agent 直接消费共同 Content Foundation，而不是依赖 Blog

### Decision

Packaging Agent 默认从以下内容生成 Xiaohongshu Artifact：

- Approved Research Result Version
- Confirmed Human Opinion Version，或明确的 Research-based Mode
- Xiaohongshu Generation Request
- Platform Profile
- Available Brand Rules

Blog Artifact 不作为 Packaging Agent 的默认上游事实来源。

### Reason

Blog 和 Xiaohongshu 是同一个 Content Package 的并列输出。

将 Blog 设为默认上游会让小红书变成长文缩写，并引入不必要的间接依赖。

### Impact

Blog 和 Xiaohongshu 分别记录自己的 Research 与 Human Opinion 依赖。

---

## DEC-087

### Status

Accepted

### Title

Packaging Agent 使用版本化输入契约

### Decision

Packaging Agent 的正式输入必须包含：

- Approved Research Result Version
- Confirmed Human Opinion Version，或 Research-based Mode
- Source Evidence Bundle
- Xiaohongshu Generation Request
- Platform Profile Version
- Available Brand Rules

### Reason

明确的版本化输入支持：

- 可重复生成
- 结果验证
- 依赖失效传播
- Agent 调试
- 版本比较
- 审计

### Impact

Xiaohongshu Artifact 必须记录所有上游依赖版本。

---

## DEC-088

### Status

Accepted

### Title

Packaging Agent 使用 Plan-first 两阶段生成

### Decision

Packaging Agent 先生成 Packaging Plan，再生成 Xiaohongshu Artifact。

Packaging Plan 定义：

- Narrative Pattern
- Page Purpose
- Research allocation
- Opinion allocation
- Attribution plan
- Content density
- Visual Brief

Packaging Plan 不成为最终发布内容。

### Reason

Plan-first 可以减少：

- 页面重复
- 叙事断裂
- 信息密度不均
- Human Opinion 放置错误
- Caption 重复
- 来源归属遗漏

### Impact

Packaging Runtime 需要支持：

```text
Plan Generation
→ Plan Validation
→ Artifact Generation
```

---

## DEC-089

### Status

Accepted

### Title

Xiaohongshu Artifact 分离平台标题、封面文案、页面内容、Caption 与 Hashtags

### Decision

Xiaohongshu Artifact 独立保存：

- Platform Title Candidates
- Selected Platform Title
- Cover Title
- Cover Subtitle
- Page-level Content
- Caption
- CTA
- Hashtags

这些字段不得合并为一个通用文案字段。

### Reason

这些字段服务于不同的展示位置、传播任务和长度约束。

### Impact

Workspace、Schema、Versioning、Validation 和 Export 必须支持这些字段独立编辑。

---

## DEC-090

### Status

Accepted

### Title

Carousel 采用 6～10 页的叙事链，每页承担一个主要信息目的

### Decision

MVP Xiaohongshu Carousel 使用 6～10 页，默认建议为 8 页。

每页必须拥有明确 `page_purpose` 和一个主要信息任务。

Packaging Agent 不得为了达到页数而重复内容，也不得在一页中堆积多个无关主题。

### Reason

清晰的页面职责有利于：

- 阅读节奏
- 内容编辑
- 视觉设计
- 模板选择
- Provenance
- Render 稳定性

### Impact

Narrative Validator 和 Density Validator 必须检查页数、重复、断裂和页面过载。

---

## DEC-091

### Status

Accepted

### Title

页面语义 Contract 与视觉组件分离

### Decision

Packaging Agent 输出：

- Page Purpose
- Content Payload
- Emphasis
- Content Density
- Research and Opinion references
- Content-side Visual Brief

Visual Agent 决定：

- Component
- Layout
- Visual hierarchy
- Asset requirement
- Theme usage

Render Engine 负责确定性像素输出。

### Reason

内容语义不应绑定单一视觉模板，Packaging Agent 也不应承担视觉设计职责。

### Impact

Xiaohongshu Page Contract 和 Design Specification 之间建立明确的 Agent 边界。

---

## DEC-092

### Status

Accepted

### Title

Caption 是独立内容表达，不重复整个 Carousel

### Decision

Caption 用于：

- 补充背景
- 总结核心观点
- 表达已确认的创作者判断
- 邀请讨论
- 提供 References
- 补充无法放入页面的信息

Caption 不得完整复制 Carousel 页面正文。

### Reason

Caption 和 Carousel 承担不同的阅读任务。

完整重复会降低信息价值并增加发布内容冗余。

### Impact

Packaging Validator 需要进行基础重复检测。

---

## DEC-093

### Status

Accepted

### Title

Creator-led 与 Research-based 小红书遵循不同第一人称约束

### Decision

Creator-led 内容可以使用具有 Confirmed Human Opinion Reference 的第一人称观点和经历。

Research-based 内容不得虚构：

- 第一人称立场
- 第一人称经历
- 团队经历
- 共同经验
- Creator-specific judgment

### Reason

平台化表达不能突破 Human Opinion 和 Originality Provenance 边界。

### Impact

Packaging Prompt、Xiaohongshu Artifact 和 Validators 必须读取 `content_mode`。

---

## DEC-094

### Status

Accepted

### Title

Platform Profile 作为版本化输入，而不是永久硬编码在 Prompt 中

### Decision

小红书内容约束通过版本化 Platform Profile 提供。

MVP 使用人工维护的静态 Platform Profile。

完整 Platform Intelligence 和实时趋势系统不进入首个 Vertical Slice。

### Reason

平台规范和创作习惯会变化。

将规则永久写死在 Prompt 中会降低：

- 可维护性
- 可审计性
- 可测试性
- 规则更新能力

### Impact

Packaging Agent Input 和 Xiaohongshu Artifact 必须记录：

```text
platform_profile_version
```

---

## DEC-095

### Status

Accepted

### Title

Packaging Agent 不预测或承诺流量结果

### Decision

Packaging Agent 可以提供：

- Title suggestions
- Cover suggestions
- Page narrative
- CTA recommendations
- Hashtag recommendations

但不得声称：

- 某标题必然成为爆款
- 某方案保证点击率
- 某标签保证流量
- 某表达代表实时趋势

没有实时数据支持时，Hashtags 仅根据主题、受众和内容类型推荐。

### Reason

内容包装建议与实际平台分发结果之间不存在可保证的因果关系。

### Impact

Agent 输出、产品文案和 UI 不得使用未经支持的流量承诺。

---

## DEC-096

### Status

Accepted

### Title

Xiaohongshu Artifact 通过内容审批后才能进入 Visual Agent

### Decision

Xiaohongshu 内容使用：

```text
Mutable Working Copy
+
Immutable Artifact Versions
```

Visual Agent 只消费具体的 Approved Xiaohongshu Artifact Version。

Visual Agent 不直接消费临时 Working Copy。

### Reason

视觉设计必须建立在稳定内容上。

未确认内容持续变化会导致：

- Design Specification 失效
- Asset 需求变化
- Rendered Output 失效
- Provenance 不一致
- 重复设计和渲染

### Impact

工作流保持：

```text
xhs_generated
→ xhs_review
→ xhs_approved
→ design_generated
```

---

## DEC-097

### Status

Accepted

### Title

Xiaohongshu Artifact 进入 Visual Agent 前必须通过确定性 Validation Gate

### Decision

Packaging 输出必须经过：

- Schema Validation
- Narrative Validation
- Research Validation
- Human Opinion Validation
- Title Validation
- Density Validation
- Citation Validation
- Dependency Validation

Blocking Error 必须解决。

Warning 可以携带可见提示进入内容审核。

### Reason

LLM 生成的页面组合不能直接被视为可设计、可渲染的正式内容对象。

### Impact

Packaging Agent 之外需要独立 Validators。

Chief Editor 根据验证结果决定：

- Continue
- Repair
- Retry
- Return to Research
- Return to Human Opinion
- Block workflow

---

## 51. Rejected or Deferred Approaches

### Packaging Agent Depending on Blog by Default

Rejected because Blog and Xiaohongshu are parallel outputs.

### Splitting a Blog into Equal-sized Pages

Rejected because carousel pages require platform-native narrative purposes.

### One Shared Title Field

Rejected because Platform Title, Cover Title, Cover Subtitle, and Page Headings serve different surfaces.

### Packaging Agent Selecting Pixel-level Layout

Rejected because visual layout belongs to Visual Agent and Render Engine.

### Caption Repeating the Entire Carousel

Rejected because it provides little additional reader value.

### Unlimited Page Count

Rejected for the MVP because it increases content, validation, visual, and rendering complexity.

### Real-time Viral Prediction

Deferred because the MVP lacks reliable real-time platform and account-performance data.

### Traffic Guarantees

Rejected because ContentOS cannot guarantee platform distribution outcomes.

### Visual Agent Consuming a Temporary Working Copy

Rejected because design requires a stable approved content version.

### Packaging Output Without Validation

Rejected because invalid content must not enter the Visual pipeline.

---

## 52. Open Questions

The following questions remain unresolved:

1. How many Platform Title candidates should be generated?
2. Should the user approve a title before page generation?
3. Which title strategies belong in the MVP?
4. What length limits apply to Platform Title?
5. What length limits apply to Cover Title?
6. What length limits apply to Cover Subtitle?
7. How should Chinese and English title limits differ?
8. Which Narrative Patterns belong in Platform Profile v1?
9. Can users manually select a Narrative Pattern?
10. Which Page Purposes are required in every carousel?
11. Must every carousel contain a creator-opinion page in Creator-led Mode?
12. Can a page contain multiple Research claims?
13. How should page-level Provenance be updated after manual editing?
14. When should a page be split automatically?
15. When should two pages be merged?
16. Can users add more than ten pages manually?
17. Should page-number constraints remain strict after manual editing?
18. How should alternative complete carousel drafts be handled?
19. Should accepted AI page revisions create immediate Versions?
20. How should XHS Working Copy autosave?
21. How should page reordering appear in Diff?
22. How should Caption duplication be measured?
23. How many Hashtags should the MVP recommend?
24. Should Hashtags be user-editable?
25. How should invalid or unsupported Hashtags be detected?
26. Should Caption References include every Source?
27. Where should public attribution appear on dense pages?
28. Can Visual Agent move attribution into Caption?
29. Which required attribution must remain visible on the page?
30. What content-density thresholds belong in Platform Profile v1?
31. Which page-content fields are mandatory?
32. How should quotations be shortened safely?
33. How should translated quotations be represented?
34. Should Packaging Agent generate alternative Cover Titles independently from Platform Titles?
35. Should title candidates be scored?
36. If scored, which scores are deterministic and which are subjective?
37. How should future Analytics influence Platform Profile?
38. How should Platform Profile changes affect old Artifacts?
39. Should an old approved Artifact become outdated after Profile updates?
40. How will ContentOS communicate that Platform Profiles are guidance rather than guaranteed platform rules?

---

## 53. Documentation Updates

Create:

```text
docs/sessions/session-014.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-086
DEC-087
DEC-088
DEC-089
DEC-090
DEC-091
DEC-092
DEC-093
DEC-094
DEC-095
DEC-096
DEC-097
```

Future documents to create:

```text
docs/agents/packaging-agent.md
docs/product/xiaohongshu-content-workspace.md
docs/architecture/packaging-input-contract.md
docs/architecture/xiaohongshu-plan-contract.md
docs/architecture/xiaohongshu-artifact-contract.md
docs/architecture/xiaohongshu-page-contract.md
docs/architecture/platform-profile.md
docs/architecture/packaging-validation.md
```

Possible future Schema files:

```text
schemas/packaging-input-v1.json
schemas/xiaohongshu-plan-v1.json
schemas/xiaohongshu-artifact-v1.json
schemas/xiaohongshu-page-v1.json
schemas/xiaohongshu-caption-v1.json
schemas/platform-profile-v1.json
schemas/packaging-validation-result-v1.json
```

These paths are suggestions rather than final implementation decisions.

---

## 54. Documentation Sync Checklist

- [x] DEC-086 confirmed
- [x] DEC-087 confirmed
- [x] DEC-088 confirmed
- [x] DEC-089 confirmed
- [x] DEC-090 confirmed
- [x] DEC-091 confirmed
- [x] DEC-092 confirmed
- [x] DEC-093 confirmed
- [x] DEC-094 confirmed
- [x] DEC-095 confirmed
- [x] DEC-096 confirmed
- [x] DEC-097 confirmed
- [ ] Save this document as `docs/sessions/session-014.md`
- [ ] Add DEC-086 through DEC-097 to `docs/decisions/decisions.md`
- [ ] Define Packaging Agent Input Contract
- [ ] Define Packaging Plan Contract
- [ ] Define Xiaohongshu Artifact Contract
- [ ] Define Page Contract
- [ ] Define Caption and CTA Contract
- [ ] Define Platform Profile v1
- [ ] Define Narrative Validation
- [ ] Define Title Validation
- [ ] Define Density Validation
- [ ] Define Packaging content-review interaction
- [ ] Review AGENTS.md after Packaging specifications become authoritative

---

## 55. Session Summary

Packaging Agent generates Xiaohongshu content directly from the approved Content Foundation rather than shortening the Blog.

Blog and Xiaohongshu are parallel Output Artifacts with independent version dependencies.

Packaging Agent uses a Plan-first process:

```text
Packaging Plan
→ Xiaohongshu Artifact
```

The carousel is a platform-native narrative containing 6–10 pages, with one primary communication purpose per page.

The Artifact separately stores:

- Platform Title candidates
- Selected Platform Title
- Cover Title
- Cover Subtitle
- Page-level content
- Caption
- CTA
- Hashtags

Packaging Agent defines content semantics and a content-side Visual Brief.

Visual Agent defines components and layout.

Render Engine produces deterministic final images.

Caption supplements rather than duplicates the carousel.

Creator-led and Research-based modes follow different first-person constraints.

Platform rules enter as a versioned Platform Profile rather than permanent Prompt text.

Packaging Agent may recommend packaging strategies but does not predict or guarantee traffic.

Only an Approved Xiaohongshu Artifact Version may enter the Visual stage.

Before Visual Agent handoff, the Artifact must pass deterministic Schema, Narrative, Research, Human Opinion, Title, Density, Citation, and Dependency validation.