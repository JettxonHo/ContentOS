
# Decisions（正式决策）

## DEC-001：ContentOS 的核心不是内容生成，而是内容再创造

### Decision

产品目标不是：

> AI 自动写文章。

而是：

> AI 辅助用户把外部信息转化为具有个人价值的内容资产。

### Reason

单纯 AI 摘要容易同质化。

### Impact

影响：

- Writer Agent 设计；
- Human-in-the-loop 设计；
- 内容数据库结构。

---

## DEC-002：保留 Source / AI Summary / Human Opinion 三层数据

### Decision

所有内容资产必须分离：

```text
Source

AI Analysis

Human Opinion
```

### Reason

保证：

- 来源透明；
- 内容可信；
- 保留个人价值。

---

## DEC-003：博客和小红书必须作为两个不同产品输出

### Decision

不能：

```text
Blog 自动缩短 = 小红书
```

而应该：

```text
同一个 Content Package

↓

Blog Version

↓

Xiaohongshu Version
```

---

## DEC-004：MVP 优先验证内容闭环，而不是自动化程度

### Decision

第一版：

人工参与。

不追求：

- 全自动抓取；
- 自动发布；
- 大规模生产。

