# 30. Decisions

## DEC-051

### Status

Accepted

### Title

Blog Editor 使用 Mutable Working Copy 与 Immutable Versions

### Decision

用户的日常 Markdown 编辑发生在可自动保存的 Mutable Working Copy 中。

有意义的内容 Checkpoint 创建不可变 Blog Version。

Working Copy 与正式 Blog Version 是不同的数据对象。

### Reason

如果每次编辑都创建版本，版本历史会被大量无意义记录污染。

如果正式版本可以直接修改，又会破坏：

- 可追溯性
- 审批状态
- 版本比较
- 导出稳定性
- 恢复能力

### Impact

Blog 数据模型必须区分：

- Working Copy
- Immutable Blog Version

Editor、Approval 和 Export 流程需要引用正确的对象类型。

---

## DEC-052

### Status

Accepted

### Title

Blog 版本只在有意义的 Checkpoint 创建

### Decision

以下操作可以创建正式 Blog Version：

- Writer Agent 首次完整生成
- 用户手动保存版本
- 接受重要 AI 修改
- 提交审核
- 批准文章
- 恢复历史版本
- 完整重新生成
- 正式导出快照

普通键盘输入和自动保存只更新 Working Copy。

### Reason

版本历史应该表达有意义的内容状态，而不是记录每一次键盘操作。

### Impact

系统需要：

- 定义版本 Checkpoint
- 保存 `creation_reason`
- 将 Autosave 与 Version Creation 分离
- 在 UI 中区分 Saved Working Copy 和 Saved Version

---

## DEC-053

### Status

Accepted

### Title

AI 修改以 Revision Proposal 形式呈现

### Decision

AI 对 Blog 正文的修改必须先创建 Revision Proposal。

用户查看 Before 和 After 后，可以：

- Accept
- Reject
- Regenerate
- Edit before applying

AI 不得静默覆盖 canonical Markdown。

### Reason

用户需要：

- 理解 AI 修改内容
- 保持最终编辑控制权
- 防止观点被静默改变
- 防止重要信息被意外删除
- 对内容修改负责

### Impact

Blog Editor 需要实现：

- Proposal 状态
- Before/After Diff
- Accept/Reject 操作
- Proposal 应用逻辑
- Proposal 审计信息

---

## DEC-054

### Status

Accepted

### Title

AI 局部修改使用 Revision 与 Hash 保护

### Decision

Revision Proposal 必须引用：

- Working Copy Revision
- Target Selection Hash
- 必要时引用完整 Document Hash

如果正文在 Proposal 生成期间发生变化，旧 Proposal 不得自动应用。

### Reason

AI 返回修改结果前，用户可能已经编辑了相同内容。

缺少并发保护可能导致 AI 覆盖用户的新修改。

### Impact

应用层必须实现乐观并发控制。

冲突检测由确定性程序负责，而不是由 LLM 判断。

---

## DEC-055

### Status

Accepted

### Title

Blog 审批针对不可变 Version

### Decision

Approval 的目标是一个具体的 Blog Version，而不是整个 Blog Artifact。

编辑已批准 Version 时，系统创建新的 Draft Working Copy。

原批准 Version 保持不可变且继续保留批准状态。

### Reason

同一篇 Blog 的不同版本可能处于不同审核状态。

Artifact 级全局 Approval 无法准确表达版本生命周期。

### Impact

以下对象必须引用 `version_id`：

- Approval
- Export
- Future PersonalBlog Import
- Future Publication
- Version Comparison

---

## DEC-056

### Status

Accepted

### Title

恢复旧版本通过创建新版本完成

### Decision

恢复历史版本时，不删除、覆盖或重写后续版本。

系统从历史 Version 创建新的 Working Copy，并在保存后生成一个新的 Blog Version。

### Reason

版本恢复本身也是一次新的编辑决策。

保留完整历史有助于：

- 审计
- 回滚
- 比较
- 理解文章演化
- 避免误删后续内容

### Impact

新版本需要记录：

- `parent_version_id`
- `restored_from_version_id`
- `creation_reason`

或等价信息。

---

## DEC-057

### Status

Accepted

### Title

正式 Blog Export Package 仅从 Approved Version 生成

### Decision

用户可以复制当前 Draft Markdown，但正式 Blog Export Package 只能从 Approved Version 生成。

未批准内容必须明确标记为 Draft。

### Reason

正式项目间交换需要一个：

- 稳定
- 不可变
- 已审核
- 可追踪

的内容身份。

### Impact

Blog Export Manifest 必须引用被导出的具体 `version_id`。

Export UI 必须区分：

- Copy Current Markdown
- Download Approved Blog Package

---

## DEC-058

### Status

Accepted

### Title

MVP Blog Editor 采用结构化 Workspace 与协作式 AI

### Decision

MVP Blog Editor 包含：

- Derived Outline
- Markdown Editor
- Preview
- Version History
- Contextual AI Assistant

Chat 可以发起修改，但修改结果必须在 Blog Editor 中展示并由用户确认。

### Reason

Chat 适合：

- 表达意图
- 请求解释
- 发起修改

Editor 适合：

- 表示 canonical content
- 展示差异
- 编辑正文
- 管理版本
- 管理审批
- 管理导出

### Impact

Blog 阶段不采用纯 Chat 交互。

Content Package Workspace 仍然是 Blog 状态的权威界面。
