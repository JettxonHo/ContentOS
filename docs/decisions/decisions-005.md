# Decisions（正式决策）

---

# DEC-018：ContentOS 最终产品形态为 Web App

## Decision

ContentOS 不作为 Codex 工作流产品存在。

---

## Reason

需要独立产品体验和长期数据资产。

---

# DEC-019：ContentOS MVP 定位为 Personal AI Content Studio

## Decision

第一阶段服务个人创作者。

---

## Reason

降低复杂度，验证内容闭环。

---

# DEC-020：Agent 与 LLM Provider 解耦

## Decision

采用 Model Router。

---

## Reason

不同 Agent 对模型能力要求不同。

---

# DEC-021：Platform Intelligence 成为系统知识层

## Decision

平台规则不属于单一 Agent。

作为共享知识。

---

## Reason

多个 Agent 都需要理解平台。

---

# DEC-022：标题字段必须分离

## Decision

系统保存：

- Platform Title
- Cover Title
- Page Heading

三个字段。

---

## Reason

不同位置承担不同传播任务。
