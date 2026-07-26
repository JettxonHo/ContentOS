## DEC-036

### Status

Accepted

### Title

MVP 采用端到端 Vertical Slice

### Decision

ContentOS MVP 优先完成从信息源输入，到 Blog Draft、小红书内容和渲染图片导出的完整闭环。

MVP 不采用同时开发所有长期模块、但每个模块只完成一部分的横向方式。

### Reason

完整闭环可以验证 ContentOS 最核心的用户价值：

- 是否能减少内容研究和整理成本
- 是否能融合用户真实观点
- 是否能复用同一 Content Package
- 是否能生成不同平台内容
- 是否能输出可使用的最终资产

仅实现大量分散模块不能验证用户是否真正需要该产品。

### Impact

MVP 的：

- 产品范围
- 开发计划
- 数据实体
- Agent 实现顺序
- 验收标准

都应围绕一条完整内容生产链路组织。

---

## DEC-037

### Status

Accepted

### Title

MVP 保留 Blog 与小红书双输出

### Decision

第一个 ContentOS MVP 同时支持：

- Blog Draft
- Xiaohongshu Carousel

两个输出共享同一个 Source、Research Result 和 Human Opinion，但拥有不同的内容结构和表达方式。

### Reason

ContentOS 的核心假设之一是：

> 一个 Content Package 可以支持多个平台的不同内容表达。

如果 MVP 只实现一个平台，就无法验证：

- Content Package 的复用价值
- Blog 与小红书的差异化输出
- Packaging Agent 的独立价值
- 多平台内容资产模型

### Impact

MVP 必须包含：

- Writer Agent
- Packaging Agent
- Blog Artifact
- Xiaohongshu Artifact
- Blog 编辑和导出能力
- 小红书基础视觉渲染能力

---

## DEC-038

### Status

Accepted

### Title

MVP 使用确定性工作流和有限 LLM 规划

### Decision

MVP 的 Chief Editor 使用明确状态机控制工作流。

LLM 可以负责有限的内容判断、任务建议和用户沟通，但不运行开放式、无限制的自主 Agent 循环。

### Reason

确定性状态机更容易：

- 测试
- 调试
- 暂停和恢复
- 展示进度
- 处理审批
- 控制失败重试
- 保证下一步行为可预测

开放式自主 Agent 会增加早期产品的不确定性和故障复杂度。

### Impact

Chief Editor 的 MVP 定位首先是：

```text
Deterministic Orchestrator
+
Limited LLM Assistance
```

而不是完全自主的 AI 主管。

---

## DEC-039

### Status

Accepted

### Title

Agent 在 MVP 中作为逻辑边界而非独立服务

### Decision

Research、Writer、Packaging 和 Visual Agent 使用独立的：

- Prompt
- Input Schema
- Output Schema
- Validation
- Tests

但它们部署在同一个后端应用中，不作为独立微服务运行。

### Reason

独立服务会提前引入：

- 网络通信
- 服务发现
- 部署管理
- 分布式日志
- 消息队列
- 数据一致性
- 故障恢复

这些复杂度不能直接提高 MVP 的核心价值验证能力。

### Impact

MVP 采用模块化单体架构，同时保留 Agent 的职责和契约边界。

未来可以在真实规模和性能需求出现后拆分服务。

---

## DEC-040

### Status

Accepted

### Title

MVP Web App 使用三个核心 Surface

### Decision

ContentOS MVP 包含三个核心产品 Surface：

1. Dashboard
2. New Content Package
3. Content Package Workspace

Chief Editor Chat 集成在 Content Package Workspace 中。

Chat 不作为项目事实和工作流状态的唯一界面。

### Reason

用户既需要自然语言协作，也需要：

- 可见的工作流阶段
- 可编辑的结构化内容
- Artifact 版本
- 审批状态
- 页面级预览
- 明确的导出结果

纯 Chat 交互难以稳定表达这些状态。

### Impact

MVP 产品设计应围绕 Content Package Workspace 展开。

Dashboard 负责项目入口，Workspace 负责内容和状态，Chat 负责协作。

---

## DEC-041

### Status

Accepted

### Title

MVP 仅支持人工导出，不支持自动发布

### Decision

ContentOS MVP 输出：

- Blog Markdown
- Xiaohongshu PNG
- Caption
- Hashtags

用户手动将内容发布到个人 Blog 或小红书。

MVP 不连接平台账号，也不执行自动发布。

### Reason

自动发布会引入：

- 平台授权
- 登录状态
- 风控
- API 限制
- 发布失败处理
- 状态同步
- 平台兼容性维护

这些能力不能直接验证 ContentOS 的内容生产价值。

### Impact

以下能力推迟：

- Publisher Agent
- 平台账号连接
- 自动 Blog 发布
- 自动小红书发布
- 发布状态同步

MVP 需要提供稳定的复制、下载和导出能力。

---

## DEC-042

### Status

Accepted

### Title

Analytics 与高级 Memory 能力推迟到内容生产闭环验证后

### Decision

首个 Vertical Slice 不实现：

- Analytics Agent
- Performance Memory
- 完整 Platform Intelligence
- 完整 RAG
- 向量检索
- 独立向量数据库

这些能力在内容生产闭环和真实发布流程验证后再评估。

### Reason

Analytics 和 Performance Memory 依赖真实发布数据。

RAG 和向量检索依赖足够规模的历史内容和非结构化知识。

在数据规模和使用需求出现前实现这些能力，会造成过度设计。

### Impact

MVP 聚焦：

- 内容输入
- 研究
- 人类观点
- 内容生成
- 审核
- 视觉渲染
- 人工导出

未来架构仍为高级 Memory 和 Retrieval 能力保留扩展空间。
