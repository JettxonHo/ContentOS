# 10. Decisions

## DEC-030

### Title

Content Package 作为系统聚合根，而不是单一 JSON 文档

### Decision

Content Package 负责关联 Sources、Research Results、Human Opinions、Output Artifacts、Design Specifications、Visual Assets、Workflow Runs、Approvals 和 Analytics Snapshots。

Content Package 不直接把所有内容存储在一个巨大 JSON 字段中。

### Reason

内容生产会产生多个来源、多个版本、多个平台产物、多个审批记录和多次工作流执行。

将全部数据塞入一个 JSON 文档会导致：

- 修改历史难以追踪
- Agent 容易互相覆盖结果
- 独立回滚困难
- 数据分析困难
- 并发更新风险增加

### Impact

影响：

- 数据库实体设计
- API 设计
- Agent 数据契约
- Dashboard 页面结构
- 内容版本管理方式

---

## DEC-031

### Title

MVP 数据层采用 PostgreSQL 与 Object Storage

### Decision

ContentOS 的结构化数据、实体关系、工作流状态、版本、审批和分析记录保存在 PostgreSQL 中。

图片、截图、源文件、生成资产和渲染输出保存在 Object Storage 中。

### Reason

ContentOS 同时需要：

- 可靠的实体关系
- 灵活的平台内容结构
- 事务和状态管理
- 大型二进制文件存储

PostgreSQL 的关系能力和 JSONB 灵活性适合 ContentOS，而 Object Storage 更适合管理图片与导出文件。

### Impact

后续架构应：

- 使用关系型数据模型
- 将二进制文件与业务数据分离
- 在数据库中保存文件元数据和引用
- 避免把大型文件直接存进 PostgreSQL

---

## DEC-032

### Title

关键内容资产采用追加式版本管理

### Decision

Source、Research Result、Human Opinion、Output Artifact、Design Specification 和发布内容的重要修改创建新版本，不直接覆盖历史版本。

系统应保存版本号、父版本引用、创建者、创建时间和状态。

### Reason

ContentOS 需要支持：

- 来源追踪
- 人工修改历史
- Agent 输出审计
- 版本比较
- 回滚
- 发布内容留档

直接覆盖会破坏可追溯性，并使错误难以定位。

### Impact

相关实体需要支持：

- `version`
- `parent_version_id`
- `created_by`
- `created_at`
- `status`

Content Package 需要能够引用当前激活版本。

---

## DEC-033

### Title

Memory Layer 按职责拆分

### Decision

ContentOS 的 Memory Layer 拆分为：

- Working Memory
- Content Memory
- Brand Memory
- Platform Intelligence
- Performance Memory

不将所有记忆统一放入一个模糊的向量数据库或 Agent Prompt。

### Reason

不同类型的记忆具有不同的：

- 数据来源
- 生命周期
- 更新机制
- 准确性要求
- 查询方式
- 使用权限

例如工作流状态需要确定性读取，而历史文章可能需要语义检索。

### Impact

后续 Memory Architecture 和 Agent Specs 必须分别定义：

- 每类记忆保存什么
- 谁负责更新
- 哪些 Agent 可以读取
- 如何进行版本管理
- 使用结构化查询还是语义检索

---

## DEC-034

### Title

RAG 只用于非结构化知识的相关性检索

### Decision

RAG 用于平台资料、历史内容、品牌样本和补充研究的相关性检索。

当前工作流状态、审批、明确品牌规则、指标计算、权限和当前 Content Package 字段使用确定性的数据库查询或应用逻辑。

### Reason

RAG 适合从大量非结构化材料中查找相关上下文，但不适合作为所有数据读取的统一方案。

滥用 RAG 会降低：

- 准确性
- 可解释性
- 稳定性
- 可测试性

### Impact

每个 Agent Spec 必须明确：

- 读取结构化数据库
- 使用全文搜索
- 使用语义检索
- 使用确定性规则

中的哪一种或哪几种方式。

---

## DEC-035

### Title

MVP 不引入独立向量数据库

### Decision

MVP 首先使用 PostgreSQL、JSONB、标签、元数据过滤和全文搜索。

只有在真实的语义检索需求被验证后，才增加向量检索能力。

### Reason

当前内容规模和产品阶段不足以证明独立向量数据库带来的基础设施复杂度。

过早引入会增加：

- 部署成本
- 数据同步问题
- 调试难度
- 检索评估工作
- 系统维护负担

### Impact

MVP 架构保持简单。

未来需要向量检索时，优先评估 PostgreSQL 兼容的向量能力，再决定是否引入独立向量数据库。
