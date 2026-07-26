# ContentOS Session-012

**Status:** Formalized  
**Session Type:** Research Review, Human Contribution, and Content Integrity Architecture  
**Topic:** Research Review, Human Opinion Collection, Originality Provenance, and Dependency Propagation  
**Date:** 2026-07-26

---

## 1. Context

Session-011 defined the upstream Source and Research pipeline:

```text
Source Reference
→ Raw Snapshot
→ Extracted Content
→ Approved Normalized Source Version
→ Research Result Version
```

The Research Agent consumes only approved Normalized Source Versions and produces structured Research Results containing:

- Source Summaries
- Key Claims
- Supported Facts
- Unsupported or Uncertain Claims
- Tensions
- Important Terms
- Content Opportunities
- Questions for Human Opinion
- Source Evidence References

The next unresolved questions were:

1. How should users review and correct Research Results?
2. Should AI-generated Research Results be directly editable?
3. How should ContentOS collect real user opinions?
4. How should raw user responses remain separate from AI interpretation?
5. When may AI-polished text represent the user’s position?
6. Can a user skip the Human Opinion stage?
7. How should first-person statements be controlled?
8. How do Blog and Xiaohongshu reuse the same Human Opinion?
9. What happens when Research or Human Opinion changes?
10. What can ContentOS truthfully claim about content originality?

This Session defines the Research Review workflow, Human Opinion data model, originality boundary, and downstream dependency rules.

---

## 2. Foundational Separation

ContentOS must preserve three different categories of content:

```text
Source Content
≠
AI Analysis
≠
Human Opinion
```

These categories have different origins, authority, and downstream permissions.

---

### 2.1 Source Content

Source Content represents what an external source actually states.

It may include:

- Facts presented by the source
- Source-author opinions
- Predictions
- Data
- Quotations
- Cases
- Definitions
- Recommendations

Source Content answers:

> What did the source say?

A statement made by a Source is not automatically an independently verified fact.

---

### 2.2 AI Analysis

AI Analysis represents how the Research Agent organizes and interprets approved Sources.

It may include:

- Summaries
- Claim extraction
- Fact classification
- Unsupported-claim detection
- Tension identification
- Content opportunities
- Questions for Human Opinion

AI Analysis answers:

> How did the AI understand and organize the Sources?

AI Analysis must not be presented as direct Source Content or as the creator’s personal opinion.

---

### 2.3 Human Opinion

Human Opinion represents content explicitly provided or confirmed by the user.

It may include:

- Personal position
- Judgment
- Experience
- Agreement
- Disagreement
- Uncertainty
- Recommendation
- Value preference
- Practical observation

Human Opinion answers:

> What does the creator actually think or know from personal experience?

AI may assist with interpretation and wording, but it must not silently create or alter the creator’s position.

---

## 3. Research Review Model

Research Agent output remains immutable after generation.

Users must be able to correct AI analysis without overwriting the original generated result.

The Research Review workflow therefore uses:

```text
Immutable Research Result Version
+
Mutable Research Review Working Copy
```

---

## 4. Research Review Working Copy

When the user opens an unapproved Research Result, ContentOS may create a Research Review Working Copy.

Conceptual structure:

```json
{
  "review_working_copy_id": "researchwork_001",
  "research_result_id": "research_001",
  "base_research_version_id": "researchver_001",
  "revision_number": 12,
  "review_items": [],
  "document_hash": "sha256:...",
  "autosaved_at": "2026-07-26T15:00:00Z"
}
```

The Working Copy may contain:

- User corrections
- Item exclusions
- Verification flags
- Notes
- Classification changes
- Evidence-review results

The underlying generated Research Result Version remains unchanged.

---

## 5. Research Correction Flow

If the user approves the original generated result without modification:

```text
Research Result v1
→ Approved
```

If the user makes corrections:

```text
Research Result v1
AI-generated and immutable
        ↓
Research Review Working Copy
        ↓
User corrections and exclusions
        ↓
Research Result v2
Human-corrected and immutable
        ↓
Approved
```

This preserves both:

- The original Research Agent output
- The user-approved research state

---

## 6. Research Review Workspace

The Research Review Workspace should present structured sections rather than one long AI-generated report.

Recommended sections:

```text
Research Review
├── Source Summaries
├── Key Claims
├── Supported Facts
├── Unsupported or Uncertain Claims
├── Tensions and Alternative Views
├── Important Terms
├── Content Opportunities
└── Questions for Human Opinion
```

Each important item should display:

- Item statement
- Item type
- Source dependencies
- Evidence Snippet
- Evidence locator
- AI confidence or classification
- User review status
- User notes or corrections

---

## 7. Item-Level Review States

Important research items use explicit review states.

Recommended values:

```text
unreviewed
accepted
corrected
excluded
needs_verification
```

### `unreviewed`

The user has not yet reviewed the item.

### `accepted`

The user accepts the item for downstream use.

### `corrected`

The user has corrected the statement, classification, or interpretation.

Downstream Agents must use the corrected representation.

### `excluded`

The item must not be used in downstream content generation.

It remains in historical research records.

### `needs_verification`

The item remains visible but cannot be represented as a confirmed fact.

Downstream Agents may mention uncertainty only when explicitly appropriate.

---

## 8. Example Reviewed Claim

```json
{
  "claim_id": "claim_001",

  "generated_statement": "MCP 已经成为行业统一标准。",

  "review": {
    "status": "corrected",
    "corrected_statement": "MCP 正在获得行业关注，但目前还不能被称为统一标准。",
    "reviewed_by": "user_001",
    "reviewed_at": "2026-07-26T15:10:00Z"
  },

  "source_refs": [
    {
      "source_id": "src_001",
      "normalized_source_version_id": "sourcever_001"
    }
  ]
}
```

The generated statement remains preserved for audit and Agent evaluation.

---

## 9. Research Approval Conditions

A Research Result may contain:

- Predictions
- Conflicting Source positions
- Weakly supported statements
- Unresolved uncertainty

These conditions do not automatically prevent approval.

Approval means:

> The uncertainty and classifications have been reviewed and are represented honestly.

Recommended approval blockers include:

- Important items remaining `unreviewed`
- Supported Facts without Source Evidence
- Items marked incorrect without a correction or exclusion
- Missing Source dependencies
- Broken Evidence References
- Research based on stale Source versions

Research approval applies to a specific immutable Research Result Version.

---

## 10. Human Opinion Collection Principle

Human Opinion should not be collected only through a generic large text box.

A blank prompt such as:

```text
What do you think?
```

creates several problems:

- Users may not know what to say
- Answers may be vague
- AI may over-interpret limited input
- Experiences and positions become difficult to distinguish
- Downstream platform reuse becomes inconsistent

The Human Opinion stage therefore uses:

```text
Structured Question Cards
+
Optional Chief Editor Conversation
```

---

## 11. Questions for Human Opinion

The Research Agent generates a limited set of contextual questions from the approved Research Result.

Recommended MVP range:

```text
3–7 questions
```

Question categories may include:

```text
position
experience
agreement
disagreement
implication
recommendation
uncertainty
```

---

## 12. Position Questions

Position Questions ask whether the creator agrees with or rejects a central argument.

Example:

> 你是否认同作者认为 MCP 会快速普及的判断？

The user may answer positively, negatively, conditionally, or remain uncertain.

---

## 13. Experience Questions

Experience Questions ask about actual personal experience.

Example:

> 你在使用 AI Agent 时，是否遇到过工具集成碎片化的问题？

If the user has no relevant experience, the user may explicitly state that.

ContentOS must not fabricate an experience to improve the article.

---

## 14. Agreement and Disagreement Questions

Example:

> 文章中哪一部分最符合你的理解？哪一部分你不同意？

These questions help identify differentiated personal contribution without forcing a completely independent theory.

---

## 15. Implication Questions

Example:

> 你认为这个变化对 AI 产品经理最大的影响是什么？

These questions help transform research into practical or role-specific analysis.

---

## 16. Recommendation Questions

Example:

> 如果是刚接触 Agent 的产品经理，你建议先关注协议还是先关注使用场景？

These questions may provide actionable creator-led content.

---

## 17. Uncertainty Responses

Users must be allowed to answer:

```text
不知道
没有相关经验
暂时没有明确立场
这个问题与我无关
我需要更多信息
```

AI must preserve uncertainty rather than converting it into a confident opinion.

---

## 18. Human Opinion Data Layers

Each Human Opinion Response separates four possible layers:

```text
Raw Response
→ AI Interpretation
→ Confirmed Opinion Statement
→ Optional Editorial Expression
```

These layers must not be collapsed.

---

## 19. Raw Response

The Raw Response preserves the user’s original words.

Example:

```json
{
  "raw_response": {
    "text": "我觉得不用吧，普通人其实只要知道这个工具能干嘛就好了，协议细节应该是开发者关心的。",
    "created_at": "2026-07-26T15:20:00Z"
  }
}
```

The Raw Response:

- Is user-authored evidence
- Must not be overwritten by AI
- Remains available after later correction
- May contain informal, incomplete, or uncertain wording

---

## 20. AI Interpretation

AI Interpretation is a structured proposal describing how the system understands the user’s answer.

Example:

```json
{
  "ai_interpretation": {
    "stance": "ordinary_users_do_not_need_protocol_details",
    "summary": "普通用户更应该关注产品能力，而不是协议实现细节。",
    "confidence": "high",
    "status": "pending_confirmation"
  }
}
```

AI Interpretation is not yet the creator’s confirmed position.

The user may:

- Confirm
- Correct
- Reject
- Ask for clarification
- Add missing nuance

---

## 21. Confirmed Opinion Statement

A Confirmed Opinion Statement is a structured position explicitly accepted by the user.

Example:

```json
{
  "confirmed_statement": {
    "text": "普通用户不需要理解 MCP 的协议细节，更应该关注它能带来什么实际能力。",
    "confirmed_by_user": true,
    "confirmed_at": "2026-07-26T15:22:00Z"
  }
}
```

This is the primary Human Opinion representation used by downstream Agents.

---

## 22. Editorial Expression

AI may propose a polished expression suitable for an article or social post.

Example:

```json
{
  "editorial_expression": {
    "text": "对普通用户而言，协议本身并不是重点，真正重要的是它能否降低使用 AI 工具的门槛。",
    "generated_by": "opinion_assistant",
    "status": "confirmed"
  }
}
```

An Editorial Expression:

- May improve clarity and style
- Must preserve the Confirmed Opinion Statement
- Must not introduce a new position
- Requires user confirmation before representing the creator

The relationship is:

```text
User’s original words
≠
AI interpretation
≠
AI-polished expression
```

---

## 23. Recommended Human Opinion Schema

```json
{
  "schema_version": "contentos.human-opinion/v1",

  "opinion_set_id": "opset_001",
  "opinion_version_id": "opinionver_001",
  "content_package_id": "cp_001",
  "research_result_version_id": "researchver_002",

  "version_number": 1,
  "parent_version_id": null,
  "status": "collecting",

  "responses": [
    {
      "response_id": "opresp_001",

      "question": {
        "question_id": "question_001",
        "type": "position",
        "text": "你认为普通用户需要了解 MCP 吗？",
        "related_claim_ids": [
          "claim_003"
        ]
      },

      "raw_response": {
        "text": "我觉得不用吧，普通人只要知道工具能做什么就好了。",
        "created_at": "2026-07-26T15:20:00Z"
      },

      "ai_interpretation": {
        "stance": "ordinary_users_do_not_need_protocol_details",
        "summary": "普通用户更应该关注实际能力。",
        "confidence": "high",
        "status": "confirmed"
      },

      "confirmed_statement": {
        "text": "普通用户不需要理解协议细节，更应该关注它能带来的实际能力。",
        "confirmed_by_user": true,
        "confirmed_at": "2026-07-26T15:22:00Z"
      },

      "editorial_expression": {
        "text": "对普通用户而言，协议本身并不是重点，真正重要的是它能否降低使用 AI 工具的门槛。",
        "status": "confirmed"
      },

      "response_status": "confirmed"
    }
  ],

  "confirmed_at": null,
  "created_at": "2026-07-26T15:00:00Z"
}
```

This is a conceptual domain schema rather than a final database-table definition.

---

## 24. Human Opinion Workspace

The Human Opinion Workspace may display Question Cards.

Each card may include:

- Question
- Question type
- Why the question matters
- Related Research Claims
- User Raw Response
- AI Interpretation
- Confirmed Statement
- Optional Editorial Expression
- Confirmation state

Possible actions:

```text
Answer
Skip
Confirm interpretation
Correct interpretation
Generate editorial expression
Confirm editorial expression
Ask for explanation
Request follow-up
```

---

## 25. Chief Editor Conversation

Chief Editor Chat supports clarification and natural conversation.

Examples:

```text
I do not know how to answer this question.

Explain why the author believes this.

I am not against MCP itself. I only think ordinary users do not need to care about the protocol.

Ask me one more question to clarify my position.
```

Chat may help create or update a structured Opinion Proposal.

However, the authoritative Human Opinion state must be displayed and confirmed in the Opinion Workspace.

The relationship remains:

```text
Chat
= Clarification and collaboration

Opinion Workspace
= Confirmed Human Opinion state
```

---

## 26. Limited Follow-Up Questions

AI may ask a limited number of follow-up questions when a response is ambiguous.

Recommended MVP limit:

```text
0–2 follow-up questions per Opinion Question
```

The user must be able to select:

```text
Skip
Enough
Use my current answer
```

The Human Opinion stage must not become an uncontrolled autonomous interview.

---

## 27. Human Opinion Participation Modes

Human Opinion is valuable but is not mandatory for every Content Package.

ContentOS distinguishes two output modes:

```text
creator_led
research_based
```

---

### 27.1 Creator-led Mode

Creator-led Mode requires at least one Confirmed Human Opinion Statement.

It may include:

- Personal position
- Personal judgment
- Confirmed experience
- Personal recommendations
- First-person expression

Creator-led content should emphasize the creator’s actual contribution.

---

### 27.2 Research-based Mode

Research-based Mode is used when the user explicitly skips Human Opinion or confirms no meaningful personal contribution.

It may include:

- Source summarization
- Source comparison
- Explanation
- Research synthesis
- Non-personal recommendations supported by Research

Research-based content must not fabricate:

```text
I believe...
In my experience...
I discovered...
My team encountered...
```

The UI should communicate:

```text
No confirmed Human Opinion is available.
The output will be research-based rather than creator-led.
```

---

## 28. Originality Provenance

ContentOS must not claim that AI rewriting automatically creates legally original work.

The system can preserve:

- Source history
- AI Analysis
- User Raw Responses
- Confirmed Human Opinion
- Editorial transformations
- Artifact dependencies
- Review and approval records

This forms:

```text
Originality Provenance
```

Originality Provenance answers:

> What human contribution and transformation history can be traced in this content?

It does not determine:

- Legal copyright ownership
- Plagiarism status
- Fair-use status
- Platform original-content certification
- Compliance with every citation rule

---

## 29. Originality Readiness

ContentOS may expose an internal readiness state.

Recommended values:

```text
research_only
human_input_present
creator_led_ready
```

### `research_only`

No Confirmed Human Opinion exists.

Only Research-based content may be generated.

### `human_input_present`

The user has provided responses, but one or more interpretations or statements remain unconfirmed.

These unconfirmed responses cannot represent the user downstream.

### `creator_led_ready`

At least one relevant Confirmed Human Opinion Statement exists.

All first-person experiences and positions intended for downstream use have been confirmed.

Originality Readiness describes traceable user contribution, not legal originality.

---

## 30. Downstream Agent Input Rules

Writer Agent and Packaging Agent consume:

```text
Approved Research Result Version
+
Confirmed Human Opinion Version
+
Output Instructions
```

When the user selects Research-based Mode, the Human Opinion input may be absent.

---

## 31. Permitted Downstream Inputs

Downstream Agents may use:

- Accepted Research Claims
- Corrected Research Claims
- Supported Facts
- Explicitly represented uncertainty
- Reviewed Tensions
- Confirmed Human Opinion Statements
- Confirmed Editorial Expressions
- Confirmed Personal Experiences
- Approved Brand Rules

---

## 32. Prohibited Downstream Inputs

Downstream Agents must not use:

- Excluded Research items
- Important unreviewed Claims
- Unconfirmed AI Interpretations
- Skipped Opinion Questions
- AI-invented personal experience
- AI-inferred personal position
- Research items marked as incorrect
- Unsupported Claims represented as confirmed Facts

---

## 33. First-Person Expression Rule

First-person statements must be traceable to Confirmed Human Opinion.

Examples requiring Opinion provenance:

```text
我认为……
我的判断是……
我使用过……
我的经验是……
我在工作中发现……
我的团队曾经……
```

A downstream representation may include:

```json
{
  "allow_first_person": true,
  "confirmed_opinion_refs": [
    "opresp_001"
  ],
  "confirmed_experience_refs": [
    "opresp_003"
  ]
}
```

If no confirmed personal experience exists, the Agent may write:

```text
一种常见问题是……
```

but must not write:

```text
我在使用中发现……
```

---

## 34. Shared Human Opinion Across Outputs

Human Opinion belongs to the Content Package Content Foundation.

It does not belong exclusively to Blog or Xiaohongshu.

The dependency model is:

```text
Approved Research
+
Confirmed Human Opinion
        ↓
Writer Agent
→ Blog Artifact
```

and:

```text
Approved Research
+
Confirmed Human Opinion
        ↓
Packaging Agent
→ Xiaohongshu Artifact
```

Both Agents may express the same opinion differently while preserving its meaning.

---

## 35. Cross-Platform Expression Example

Confirmed Opinion:

> 普通用户不需要理解 MCP 的协议细节，更应该关注它能带来什么实际能力。

Possible Blog expression:

> 从用户视角看，协议并不是理解 MCP 的最佳入口。相比底层机制，普通用户更需要知道它能够解决什么问题。

Possible Xiaohongshu expression:

> 普通用户真的要学懂 MCP 吗？  
> 我的答案是：不用。先看它能帮你做什么。

The expressions are platform-specific, but both must reference the same Confirmed Opinion Statement.

---

## 36. Human Opinion Versioning

Human Opinion Sets are immutable and versioned.

A new version may be created when:

- The user changes a position
- The user adds experience
- A statement is corrected
- A Research Result changes
- The user confirms a different interpretation
- The user approves a new Editorial Expression
- A previously skipped question is answered

Example:

```text
Human Opinion v1
→ Initial confirmed opinions

Human Opinion v2
→ Adds personal experience

Human Opinion v3
→ Reconfirms opinions after Research update
```

Downstream Artifacts must reference the specific Opinion Version used.

---

## 37. Research-to-Opinion Dependency

A Human Opinion Version records the Research Result Version that provided its question context.

Example:

```json
{
  "research_result_version_id": "researchver_002",
  "opinion_version_id": "opinionver_003"
}
```

This allows ContentOS to determine whether the user’s answers were provided under the current Research context.

---

## 38. Research Changes and Opinion Review

When a new Research Result Version is approved, existing Human Opinion is not deleted.

It may remain valid, become partially affected, or require reconsideration.

Recommended state:

```text
review_required
```

Workflow:

```text
Research v1
→ Human Opinion v1 confirmed

Research v2 approved
→ Human Opinion v1 review_required
→ Identify affected responses
→ User keeps, modifies, or reanswers them
→ Human Opinion v2 confirmed
```

Only affected responses need to be reviewed when dependency analysis is possible.

Raw Responses remain preserved.

---

## 39. Opinion Changes and Artifact Status

Example:

```text
Blog v3 depends on:
Research v2
Human Opinion v1
```

The user later confirms:

```text
Human Opinion v2
```

Blog v3 remains immutable and available.

However, ContentOS marks it:

```text
dependency_status: outdated
```

The UI may display:

```text
A newer confirmed Human Opinion version is available.
Review or regenerate this output.
```

The same rule applies to Xiaohongshu Artifacts.

---

## 40. Dependency Propagation

Recommended dependency propagation:

```text
Source changes
→ Dependent Research becomes stale
```

```text
Approved Research changes
→ Related Human Opinion becomes review_required
→ Dependent output Artifacts become outdated
```

```text
Confirmed Human Opinion changes
→ Dependent output Artifacts become outdated
```

Historical objects are never automatically deleted.

Dependency-state changes are metadata updates, not destructive rewrites.

---

## 41. Human Opinion States

Recommended Opinion Set states:

```text
collecting
→ needs_confirmation
→ confirmed
```

When upstream Research changes:

```text
confirmed
→ review_required
```

After review:

```text
review_required
→ confirmed
```

Additional lifecycle states:

```text
superseded
archived
```

---

## 42. Human Opinion Response States

Recommended Response states:

```text
unanswered
answered
interpreted
confirmed
skipped
review_required
```

A Response must not be used downstream unless its required representation is confirmed.

---

## 43. End-to-End Review and Opinion Workflow

```text
Research Agent generates Research v1
        ↓
User reviews Research items and Evidence
        ↓
User accepts, corrects, excludes, or flags items
        ↓
Corrected Research v2 created
        ↓
User approves Research v2
        ↓
Research Questions become Opinion Cards
        ↓
User provides Raw Responses
        ↓
AI creates Interpretation Proposals
        ↓
User confirms or corrects interpretations
        ↓
AI may create Editorial Expressions
        ↓
User confirms selected expressions
        ↓
Human Opinion v1 confirmed
        ↓
Originality Readiness evaluated
        ↓
Writer and Packaging Agents generate outputs
        ↓
Each output records Research and Opinion dependencies
```

---

## 44. MVP Exclusions

The MVP does not require:

- Legal originality determination
- Automatic plagiarism certification
- Guaranteed platform originality status
- Mandatory answers to every question
- Unlimited AI interviewing
- Autonomous AI confirmation of user opinions
- AI-generated personal experiences
- Exact sentence-level provenance for every output sentence
- Multi-user Human Opinion collaboration
- Long-term personality simulation
- Automatic use of historical memory as current opinion
- Automatic copyright advice
- Autonomous external fact-checking

Long-term Memory may suggest possible past preferences, but any opinion used in the current Content Package still requires current confirmation.

---

# 45. Decisions

## DEC-067

### Status

Accepted

### Title

Research Result 通过 Review Working Copy 修正，不直接覆盖生成版本

### Decision

Research Agent 生成的 Research Result Version 保持不可变。

用户可以在 Research Review 中进行类似直接编辑的操作，但底层修改发生在 Research Review Working Copy 中。

如果用户进行了修改，保存后创建新的不可变 Research Result Version。

### Reason

ContentOS 既需要允许用户高效修正 AI 分析，也需要保存：

- AI 原始输出
- 用户修正记录
- Research Agent 的真实表现
- 版本差异
- 最终批准状态

直接覆盖生成版本会破坏可追溯性。

### Impact

Research Review 数据模型和 UI 需要支持：

- Review Working Copy
- Autosave
- Diff
- Version creation
- Immutable Research Results
- Correction provenance

---

## DEC-068

### Status

Accepted

### Title

Research Review 使用条目级审核与 Evidence Verification

### Decision

Key Claim、Supported Fact、Uncertain Claim 和其他重要 Research 条目拥有独立审核状态：

```text
unreviewed
accepted
corrected
excluded
needs_verification
```

用户能够查看相应 Source Evidence，并对条目进行审核和修正。

### Reason

Research Result 中的不同内容可能拥有不同可信程度和使用权限。

单一全局 Approve 状态无法表达：

- 部分内容正确
- 部分内容需要修正
- 部分内容不能使用
- 部分内容仍有不确定性

### Impact

Research Result Schema、Research Review UI 和下游 Agent Input Contract 都需要支持条目级审核状态。

---

## DEC-069

### Status

Accepted

### Title

Human Opinion 分离 Raw Response、AI Interpretation 与 Confirmed Statement

### Decision

ContentOS 分别保存：

- 用户 Raw Response
- AI Interpretation
- 用户确认后的 Confirmed Opinion Statement
- 可选的 AI-assisted Editorial Expression

未经用户确认的 AI Interpretation 不得代表用户立场。

AI-assisted Editorial Expression 必须保持 Confirmed Opinion 的语义，并经过用户确认后才能使用。

### Reason

AI 可能：

- 误解用户
- 忽略语气和条件
- 过度概括
- 改变立场
- 将不确定回答解释成明确观点

分层保存可以保护用户原意和内容真实性。

### Impact

Human Opinion Schema 和 Opinion Workspace 需要支持多层表示及逐层确认。

---

## DEC-070

### Status

Accepted

### Title

Human Opinion 使用结构化问题卡片与可选对话共同采集

### Decision

Research Agent 生成有限数量的 Human Opinion Questions。

用户主要通过结构化 Question Cards 回答，并可使用 Chief Editor Chat 进行解释、澄清和有限追问。

最终确认结果保存在 Opinion Workspace，而不是只保存在 Chat History 中。

### Reason

Question Cards 适合：

- 结构化状态
- 下游复用
- 明确确认
- 版本依赖

Chat 适合：

- 自然表达
- 解释问题
- 澄清立场
- 有限追问

两者组合能够同时保证体验和数据可靠性。

### Impact

Human Opinion 阶段采用 Workspace 与 Chat 的组合交互。

Chief Editor Chat 不成为 Human Opinion 的唯一事实来源。

---

## DEC-071

### Status

Accepted

### Title

允许跳过 Human Opinion，但必须区分 Creator-led 与 Research-based 内容

### Decision

用户可以显式跳过 Human Opinion。

存在已确认用户观点时，内容可以进入：

```text
creator_led
```

没有已确认 Human Opinion 时，只能生成：

```text
research_based
```

Research-based 内容不得伪造第一人称立场、判断或个人经历。

### Reason

强制用户提供观点可能导致低质量、敷衍或虚假的回答。

完全忽略 Human Opinion 状态又可能使普通 AI 摘要被包装成个人原创内容。

明确区分内容模式可以同时保持流程灵活性和真实性。

### Impact

Content Package 和 Output Artifact 需要保存：

- Content Mode
- Originality Readiness
- Human Opinion dependencies

生成与验证规则需要根据模式变化。

---

## DEC-072

### Status

Accepted

### Title

下游 Agent 只能使用 Approved Research 与 Confirmed Human Opinion

### Decision

Writer Agent 和 Packaging Agent 的正式输入只能包含：

- Approved Research Result 中允许使用的条目
- 用户修正后的 Research 条目
- Confirmed Human Opinion Statements
- Confirmed Editorial Expressions
- Confirmed Personal Experiences

不得使用：

- Excluded Claims
- 重要但未审核的 Claims
- 未确认的 AI Interpretation
- AI 猜测的用户经历
- 用户跳过的问题
- 标记为错误的 Research 条目

### Reason

下游输出必须基于经过审核和确认的内容基础。

否则 AI 分析错误、虚构观点或未经确认的信息可能进入最终内容。

### Impact

Writer Agent 和 Packaging Agent 的 Input Contract 必须携带：

- Research Version
- Opinion Version
- Item review status
- Opinion confirmation status
- Provenance references

---

## DEC-073

### Status

Accepted

### Title

第一人称立场和经历必须可追溯到 Confirmed Human Opinion

### Decision

最终 Blog 或 Xiaohongshu 内容中的第一人称：

- 立场
- 判断
- 经验
- 使用经历
- 团队经历
- 个人建议

必须引用具体 Confirmed Human Opinion Response。

AI 不得为了增强个人表达感而自行生成第一人称经历。

### Reason

第一人称内容会使读者合理地认为该内容来自用户本人。

错误生成会损害：

- 内容真实性
- 用户信任
- 个人品牌
- 事实完整性
- 平台信誉

### Impact

Writer Agent、Packaging Agent 和 Output Validator 需要检查第一人称表达及对应 Opinion References。

---

## DEC-074

### Status

Accepted

### Title

Human Opinion 版本化并参与依赖失效传播

### Decision

Human Opinion 使用不可变版本。

当其依赖的 Research Result 更新时，相关 Human Opinion 标记为：

```text
review_required
```

当新的 Human Opinion Version 被确认时，依赖旧 Opinion Version 的 Blog 和 Xiaohongshu Artifacts 标记为：

```text
outdated
```

旧对象和旧版本不被删除。

### Reason

Human Opinion 可能依赖特定研究问题和背景。

下游 Artifact 必须明确知道自己使用的是哪个 Research Version 和 Human Opinion Version。

### Impact

系统需要：

- Opinion versioning
- Research-to-Opinion dependencies
- Opinion-to-Artifact dependencies
- Review-required propagation
- Outdated Artifact detection
- Dependency status UI

---

## DEC-075

### Status

Accepted

### Title

ContentOS 使用 Originality Provenance，而不承诺法律原创认证

### Decision

ContentOS 通过记录：

- Source
- AI Analysis
- Human Raw Response
- Confirmed Human Opinion
- Editorial Expression
- Artifact dependencies
- Review and approval history

描述内容形成过程和可追溯的用户贡献。

系统不宣称自动完成：

- 法律版权认定
- 抄袭检测
- 平台原创认证
- 100% 原创保证

### Reason

可追踪的人类贡献和法律原创性是不同概念。

ContentOS 可以提供透明的内容形成证据，但不能替代法律、平台或专业检测结论。

### Impact

产品文案、状态和营销材料应使用：

```text
Originality Provenance
Creator Contribution
Creator-led Readiness
```

避免使用无法验证的：

```text
Guaranteed Original
100% Original
Legally Original
```

---

## 46. Rejected or Deferred Approaches

### Directly Editing Generated Research Result Versions

Rejected because generated versions must remain available for audit and Agent evaluation.

### Research Approval Only at the Global Document Level

Rejected because individual Claims and Facts may have different review outcomes.

### AI Interpretation Automatically Becoming User Opinion

Rejected because AI may misunderstand or overstate user meaning.

### One Generic Human Opinion Text Box

Rejected as the only interaction because it produces weak structure and encourages AI over-interpretation.

### Mandatory Human Opinion for Every Content Package

Rejected because some content may legitimately be Research-based.

### Human Opinion as Entirely Optional Without Mode Distinction

Rejected because the system must not present AI-generated synthesis as creator-led content.

### AI-generated Personal Experience

Rejected because AI cannot invent first-person evidence.

### Separate Human Opinion for Every Platform

Rejected because Human Opinion belongs to the shared Content Foundation.

Platform-specific Agents may adapt expression but must preserve the same confirmed meaning.

### Automatically Invalidating and Deleting Old Opinions

Rejected because old opinions remain historically valid in their original Research context.

### Automatically Treating All Old Opinions as Current

Rejected because a changed Research context may require user review.

### Legal Originality Certification

Rejected from the product contract because ContentOS cannot make such a determination automatically.

---

## 47. Open Questions

The following questions remain unresolved:

1. Which Research items require mandatory user review?
2. Can low-risk Research items be batch accepted?
3. How should Research corrections be displayed in Diff?
4. Should corrected Research statements preserve both generated and corrected text?
5. How should corrected classifications be represented?
6. Can users add entirely new Research Claims manually?
7. Does adding a manual Research Claim require Source Evidence?
8. How should `needs_verification` content be handled by downstream Agents?
9. How many Human Opinion Questions should be generated by default?
10. Can users manually add their own Opinion Questions?
11. Should the user select question categories before generation?
12. How should irrelevant questions be reported to improve the Research Agent?
13. How should AI Interpretation confidence be presented?
14. Should Editorial Expressions be generated automatically or on demand?
15. Can one Raw Response create multiple Confirmed Opinion Statements?
16. Can multiple Raw Responses support one Confirmed Opinion Statement?
17. How should conflicting Human Opinions be represented?
18. Should users be allowed to intentionally preserve nuanced contradictions?
19. How should Opinion Version comparison work?
20. Which Research changes should trigger full Opinion review?
21. Can dependency analysis identify only affected Opinion Responses?
22. Should all new Opinion Versions mark every downstream Artifact as outdated?
23. How should Creator-led readiness be calculated?
24. How many Confirmed Opinions are sufficient for Creator-led Mode?
25. Should personal experience require an additional explicit confirmation?
26. How should first-person Validator rules work in Chinese and English?
27. How should Brand Voice interact with Confirmed Opinion?
28. Should public Blog packages expose Originality Provenance metadata?
29. Which provenance details must remain private?
30. How should future Memory propose previous opinions without treating them as current facts?
31. When should plagiarism checking be considered as a separate capability?
32. Should ContentOS later support citation or attribution recommendations?

---

## 48. Documentation Updates

Create:

```text
docs/sessions/session-012.md
```

Update:

```text
docs/decisions/decisions.md
```

Add:

```text
DEC-067
DEC-068
DEC-069
DEC-070
DEC-071
DEC-072
DEC-073
DEC-074
DEC-075
```

Future documents to create:

```text
docs/product/research-review.md
docs/product/human-opinion-workspace.md
docs/product/originality-readiness.md
docs/architecture/research-review-working-copy.md
docs/architecture/human-opinion-contract.md
docs/architecture/originality-provenance.md
docs/architecture/dependency-propagation.md
docs/architecture/downstream-content-input.md
```

Possible future Schema files:

```text
schemas/research-review-working-copy-v1.json
schemas/research-item-review-v1.json
schemas/human-opinion-v1.json
schemas/human-opinion-response-v1.json
schemas/originality-readiness-v1.json
schemas/content-dependency-v1.json
```

These paths are suggestions and are not yet formal implementation decisions.

---

## 49. Documentation Sync Checklist

- [x] DEC-067 confirmed
- [x] DEC-068 confirmed
- [x] DEC-069 confirmed
- [x] DEC-070 confirmed
- [x] DEC-071 confirmed
- [x] DEC-072 confirmed
- [x] DEC-073 confirmed
- [x] DEC-074 confirmed
- [x] DEC-075 confirmed
- [ ] Save this document as `docs/sessions/session-012.md`
- [ ] Add DEC-067 through DEC-075 to `docs/decisions/decisions.md`
- [ ] Define Research Review Working Copy Schema
- [ ] Define item-level Research Review states
- [ ] Define Human Opinion Set Schema
- [ ] Define Human Opinion Response Schema
- [ ] Define Opinion Workspace interaction
- [ ] Define limited follow-up behavior
- [ ] Define Creator-led and Research-based generation rules
- [ ] Define first-person provenance validation
- [ ] Define Originality Readiness calculation
- [ ] Define dependency propagation rules
- [ ] Define downstream Agent input filtering
- [ ] Review AGENTS.md after Human Opinion and provenance specifications become authoritative

---

## 50. Session Summary

ContentOS permanently separates Source Content, AI Analysis, and Human Opinion.

AI-generated Research Result Versions remain immutable. Users correct them through a Research Review Working Copy, producing a new Research Result Version when changes are saved.

Research Review uses item-level states and Source Evidence, allowing Claims and Facts to be accepted, corrected, excluded, or marked for verification.

Human Opinion is collected through structured Question Cards with optional Chief Editor conversation.

Each Human Opinion Response separates:

```text
Raw Response
AI Interpretation
Confirmed Opinion Statement
Optional Editorial Expression
```

Only user-confirmed representations may be used as the creator’s position.

Users may skip Human Opinion, but outputs must then be classified as Research-based rather than Creator-led. Research-based outputs cannot contain fabricated first-person positions or experiences.

Writer Agent and Packaging Agent may only use approved Research and confirmed Human Opinion.

First-person statements must remain traceable to specific confirmed Opinion Responses.

Human Opinion is shared by Blog and Xiaohongshu as part of the Content Package Content Foundation.

Research, Human Opinion, and downstream Artifacts are versioned and connected through explicit dependencies. Upstream changes do not delete historical content but may mark dependent objects as `review_required`, `stale`, or `outdated`.

ContentOS records Originality Provenance and traceable creator contribution, but it does not promise legal originality, plagiarism certification, or platform original-content approval.