# Decisions（正式决策）

---

# DEC-009：ContentOS 采用 Multi-Agent 架构

## Decision

ContentOS 不采用单一 AI Workflow。

采用：

多个专业 Agent 协作。

---

## Reason

内容生产包含多个专业领域：

- 研究；
- 写作；
- 包装；
- 视觉；
- 数据分析。

---

## Impact

需要：

- Agent Spec；
- Agent Interface；
- Orchestration Layer。

---

# DEC-010：Agent 必须职责单一

## Decision

每个 Agent 只负责一个明确领域。

---

## Reason

提高：

- 可维护性；
- 可测试性；
- 可替换性。

---

# DEC-011：Packaging Agent 作为独立核心 Agent

## Decision

内容包装不能作为 Writer Agent 的附属功能。

---

## Reason

内容质量 ≠ 内容传播。

---

## Impact

需要独立：

- 标题策略；
- 封面系统；
- 平台规则。

---

# DEC-012：ContentOS 需要 Human-in-the-loop

## Decision

关键节点必须人工确认。

包括：

- 内容观点；
- 发布内容；
- 品牌表达。

---

# Rejected Ideas（暂不采用）

---

## 1. 一个超级 Agent 完成所有事情

拒绝原因：

职责混乱。

---

## 2. 完全自动发布

拒绝原因：

平台风险和内容质量不可控。

---

## 3. Agent 之间自由聊天协作

拒绝原因：

难以控制。

采用：

结构化数据交换。
