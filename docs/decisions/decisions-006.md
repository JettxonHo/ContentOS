## DEC-023

### Title

Chief Editor Agent 作为 ContentOS 的协调核心


### Decision

ContentOS 使用 Chief Editor Agent 管理 Agent Team。

Chief Editor Agent 负责：

- 理解用户目标；
- 制定任务计划；
- 调度专业 Agent；
- 进行质量检查。


### Reason

Multi-Agent 系统如果没有协调层，会导致：

- 用户需要自己管理 Agent；
- Agent 调用流程混乱；
- 缺少任务规划和质量控制。


### Impact

影响：

- 增加 Orchestration Layer；
- 需要 Chief Editor Agent Spec；
- Web App 需要支持任务状态展示。

----

## DEC-024

### Title

Chief Editor 采用 LLM Planner + Deterministic Executor 架构


### Decision

Chief Editor 内部分为：

- Planner
- Executor
- Validator


其中：

Planner 使用 LLM。

Executor 使用确定性代码。


### Reason

纯 LLM Agent：

- 不稳定；
- 难调试。

纯 Workflow：

- 缺少判断能力。


混合架构可以同时获得：

- 智能规划；
- 可控执行。


### Impact

影响：

- Orchestration Architecture；
- Agent Runtime Design；
- Error Handling。
---
## DEC-025

### Title

MVP 阶段采用 Human-in-the-loop


### Decision

关键节点需要人工确认。

包括：

- 内容观点；
- 发布内容；
- 视觉方向。


### Reason

早期阶段 Agent 自主决策风险较高。

需要验证：

- 内容质量；
- 用户偏好；
- Agent 判断能力。


### Impact

影响：

- Web App 需要审核节点；
- Workflow 需要暂停/恢复能力。
---
## DEC-026

### Title

使用 Design Specification 驱动视觉生产


### Decision

AI 不直接生成最终图片。

AI 输出：

- 内容；
- 布局；
- 视觉意图；
- 图片需求。


Render Engine 负责：

- 模板渲染；
- 页面生成；
- PNG 输出。


Image Generation Service 负责：

- 图片资产生成。


### Reason

将视觉生产拆分后：

- 图片可替换；
- 模板可复用；
- 品牌风格可统一；
- 渲染流程可测试。


### Impact

新增：

- Visual Agent；
- Image Generation Service；
- Render Engine 三层架构。
---
## DEC-027

### Title

采用 Component-based Rendering System


### Decision

小红书渲染系统采用：

React Components

+

Template System

+

Rendering Pipeline


### Reason

相比简单 HTML：

组件化更适合：

- 多模板；
- 样式复用；
- 长期维护。


### Impact

影响：

- Frontend Architecture；
- Template Repository；
- Render Engine。
---
## DEC-028

### Title

Blog 与 Xiaohongshu 属于 Content Package Output Layer


### Decision

Blog 和小红书不是独立内容生产系统。

它们都是：

Content Package 的不同 Renderer。


### Reason

同一个主题应该保留：

统一内容资产。

不同平台只负责不同表达。


### Impact

影响：

- Content Package Schema；
- Publishing Layer；
- Renderer Architecture。
---
## DEC-029

### Title

统一 Decision Record 格式


### Decision

所有正式决策必须包含：

- Title
- Decision
- Reason
- Impact


### Reason

保证未来开发者和 AI Agent 可以理解：

不仅知道结论，也知道决策依据。


### Impact

影响：

- decisions.md
- Session 固化流程
- 文档治理规范