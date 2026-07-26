# Decisions（正式决策）

---

# DEC-005：ContentOS 的核心数据对象是 Content Package

## Decision

系统核心对象不是 Article。

而是：

Content Package。

---

## Reason

一个信息源可以产生：

- Blog；
- 小红书；
- 图片；
- 数据分析。

---

## Impact

影响：

- 数据库设计；
- Agent 输入输出；
- Web App 页面设计。

---

# DEC-006：AI 输出必须结构化

## Decision

Agent 之间不能依靠自然语言传递。

需要：

Structured Output。

例如：

JSON Schema。

---

## Reason

方便：

- 校验；
- 修改；
- 渲染；
- 后续 Agent 使用。

---

# DEC-007：视觉生成采用“AI素材 + 模板渲染”

## Decision

图片模型不负责最终页面。

负责：

视觉资产。

模板负责：

布局和文字。

---

## Reason

保证：

- 稳定；
- 品牌一致；
- 可自动化。

---

# DEC-008：Blog 与 Xiaohongshu 是同一内容资产的不同表达

## Decision

不是：

Blog → 压缩 → Xiaohongshu。

而是：

Content Package → 两种不同输出。
