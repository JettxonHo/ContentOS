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
