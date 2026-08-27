# V0.3-UX-001 — 主编助手 ChatGPT 式对话面板

**Status:** Completed
**Base:** `main@3904bebbf257ded57ba45f2db0088c23330cdf61`
**Branch:** `codex/v0-3-ux-001`

## Goal

把当前 Workspace 右侧的上下文卡片改造成 Figma 已确认的连续对话式“主编助手”：它只基于浏览器已经读取到的 Package、阶段投影、状态原因、依赖事实和现有主操作生成确定性本地提示，允许本页会话内输入与建议交互，同时不伪装真实模型、不自动执行任何产品命令。

## In Scope

- Figma `rB3oxJO3aBlGGmgY5E4PpE` 的 `2:3`、`24:2`、`24:89` 三种视觉状态与 controller 合成截图 `/private/tmp/contentos-figma-section-chatgpt-after.png`。
- 用连续浅色画布、开放式助手回复、右对齐用户气泡、紧凑建议和双行圆角 composer 取代旧 `workspace-context-panel` 卡片呈现。
- 基于现有 `WorkspaceStageProjection`、`WorkspacePrimaryAction` 与上下文事实的纯 client-side 消息和建议派生。
- 本页 React state 内的临时对话；空输入禁用、Enter 发送、Shift+Enter 换行、ARIA live/status、键盘焦点和响应式布局。
- 现有产品主操作作为独立明确按钮保留；只有用户点击该按钮时才调用已经注册的 `contextAction.onAction`。
- 一个官方轻量图标包 `@phosphor-icons/react@2.1.10`，仅用于 composer 的添加与发送控件；官方 npm 元数据确认 MIT、React 16.8+ peer compatibility 与 `phosphor-icons/react` upstream。
- 聚焦单元/Browser 测试、1440/1024/720 Product Design QA、项目根 `design-qa.md`、本 Work Item 与 Roadmap。

## Out of Scope

- 真实 Provider、模型调用、Credential、费用、联网搜索、Agent Runtime、Agent Spec、Queue 或 Workflow 新语义。
- Domain Core、public contracts、API/controller/service、数据库/schema/migration、持久化对话或产品数据 reset/seed。
- 由对话或建议自动保存 Working Copy、创建/批准 Version、应用候选、导出、发布或触发任何产品命令。
- 修改 Fake Provider 输出、扩展现有主操作、部署、M6、通用聊天平台、附件上传或跨页面会话历史。
- 新 Goal、Issue、DEC、recovery 或 postmerge reconciliation。

## Relevant DEC / Specifications

- DEC-267：单用户、桌面优先的 Personal AI Content Studio。
- DEC-269：Blog 与 Xiaohongshu 独立双输出。
- DEC-287–DEC-292：有界 Work Item、Current-truth、DoR/DoD 与可审阅 PR。
- DEC-295：text-first 私有双输出 MVP；本变更不启动 M6。
- [Artifact Versioning](../../architecture/artifact-versioning.md)
- [Agent Runtime](../../architecture/agent-runtime.md)
- [Test Strategy](../../quality/test-strategy.md)
- [V0.2 Chinese workspace Work Item](v0-2-ux-001-chinese-creator-workspace-redesign.md)

## Contracts

- 主编助手是确定性 frontend presentation projection，不是 Agent、Provider、Workflow、Artifact 或持久化状态真相。
- 输入只来自当前页面已经持有的 Package 标题、当前 section、阶段 `status/label/reason`、依赖/版本 facts 与现有 `WorkspacePrimaryAction`；不新增网络读取。
- 对话提交和建议只追加本地 user/assistant message，不调用 `contextAction.onAction`。建议即使与真实动作同名，也只解释或聚焦该明确动作。
- 产品动作按钮与对话控件在视觉、语义和事件处理上分离；只有明确产品按钮点击调用原 `onAction`。
- Working Copy、immutable Version、exact Human Approval、Outdated、查看差异、应用候选和导出语义保持不变。
- Loading/read-error/outdated/blocked copy 必须逐字依据现有投影，不承诺不可用操作；当前预览明确不调用真实模型且不改变内容。

## Allowed Files or Modules

- `apps/web/components/chief-editor-assistant.tsx`
- `apps/web/lib/chief-editor-assistant-view.ts` 及聚焦测试
- `apps/web/components/workspace-client.tsx`
- `apps/web/components/source-intake-panel.tsx`（在 Drawer 恢复 opener 后保留既有的新增资料行焦点契约）
- `apps/web/app/styles.css`
- `apps/web/package.json`, `pnpm-lock.yaml`（仅 `@phosphor-icons/react@2.1.10`）
- 一个聚焦的 `packages/testing/src/browser/*chief-editor*` Browser 场景，以及受新呈现 selector 直接影响的现有 Browser 断言
- 项目根 `design-qa.md`
- 本 Work Item 与 `docs/implementation/roadmap.md`

禁止修改 `packages/core`, `packages/contracts`, API、database、migration、现有 Provider 或产品 fixture 语义。若实现需要这些边界，停止并进入 Decision Review。

## Acceptance Criteria

1. 1440 下右侧面板忠实呈现 Figma 三态：标题/阶段上下文、开放助手回复、右对齐用户消息、紧凑建议、底部双行 composer。
2. 每个已渲染助手面板精确一个 composer；空白发送禁用；Enter 提交，Shift+Enter 保留换行；本地消息只存在于当前页面会话。
3. 对话提交与所有建议均不触发产品 mutation；显式产品动作按钮继续调用原 `contextAction.onAction` 且保持 busy/disabled/reason。
4. Blog 待审核、差异判断、Blog 已批准/进入 Xiaohongshu、outdated、blocked、loading/read-error 使用确定性且真实的阶段 copy。
5. 当前 status、exact reason、依赖/版本 facts 和单一产品主操作保留；旧大卡片和重复层级移除。
6. 使用真实 Phosphor 图标；无 inline/custom SVG、CSS 图标、emoji 或文本符号替代。
7. `aria-live`/status、textarea label、建议和动作按钮可键盘访问；1024/720 无页面横向溢出或隐藏持久控件。
8. 全部现有路由、编辑器、drawer、Version/Approval/Outdated 与命令边界无行为变化。
9. Product Design `design-qa.md` 对源设计和匹配状态实现做同视口比较；P0/P1/P2 清零，`final result: passed`。

## Tests

- 纯模块矩阵：三种 Figma 代表态、loading/read-error/outdated/blocked、suggestion 与 local response、真实动作不被隐式映射。
- 组件/Browser：唯一 composer、blank/send/Enter/Shift+Enter、右对齐用户消息、本地助手回复、建议不触发 mutation、显式 action 触发一次。
- Browser：stage-aware copy、1440/1024/720 布局及无横向溢出；现有 Workspace/Research/Blog/XHS 回归保持通过。
- Node 24.18.0：frozen install、focused tests、root `check`、`repository:check`、`test:integration`、`test:browser`、`git diff --check`。
- 独立 reviewer 按 correctness/readability/architecture/security/performance 审阅 corrected head 并通过；required CI 不跳过。

## Documentation Updates

- 本 Work Item、Roadmap 与项目根 `design-qa.md`。
- 不修改 Domain/API/Agent Current-truth，因为本变更只增加确定性 frontend shell，未实现真实 Agent 或 Provider。

## Security / Migration / Observability Impact

- S0：无 Secret、Provider、外部网络、数据分类或权限变化。临时对话只在 React state，不写日志、数据库、Issue 或导出。
- Migration：无 schema、migration 或数据 backfill。
- Observability：沿用现有 UI 状态与命令错误；不新增 Agent/Provider telemetry，也不把本地消息冒充运行记录。

## Definition of Ready

Figma 三节点、controller 截图、状态/动作输入、唯一图标依赖、文件 allowlist、测试层、QA 与安全/迁移边界均已明确；现有 API/domain 足以完成 truthful shell，不存在 Blocking Design Question。

## Definition of Done

代码和文档只在 allowlist 内；所有 Acceptance Criteria 与 Node 24 质量门有证据；`design-qa.md` 为 passed；无 Secret、产品数据或 Provider 调用；独立审阅与 required CI 通过，包含该实现的 PR squash merge 后才对 `main` 生效。

## Current evidence

- Node 24 frozen install PASS；聚焦纯模块 `7/7` PASS。
- Root `check` PASS：65 test files / 628 tests，五个应用 build PASS。
- `repository:check` PASS；Integration 29 files / 188 tests PASS；Browser 20/20 PASS。
- `git diff --check` PASS；1440/1024/720 无横向溢出。
- [Design QA](../../../design-qa.md) final result `passed`：首轮两个 P2（首屏 composer、高度；最新回复可见性）均已修正，最终无 P0/P1/P2。
- 独立终审 `/root/v0_3_ux_final_review`：首轮 4 个阻塞 finding（XHS 状态文案、action-null truth、textarea focus-visible、exact-viewport QA）均已修正；corrected-head 五轴复核 PASS / no blocking findings。
- Provider attempts/cost：`0 / ¥0`。PR [#304](https://github.com/JettxonHo/ContentOS/pull/304) 的 required CI run [33059999697](https://github.com/JettxonHo/ContentOS/actions/runs/33059999697) 四个 jobs 全部成功；PR 于 `2026-08-27T09:48:55Z` squash merge 为 `45c5cccd9933383c57c24e08f6aaf9a0d94bcfae`，本实现已对 `main` 生效。
