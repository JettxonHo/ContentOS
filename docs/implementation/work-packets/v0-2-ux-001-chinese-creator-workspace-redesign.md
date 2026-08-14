# V0.2-UX-001 — 中文创作工作台与信息架构重设计

**Status:** Implementation Complete — publication governed by the containing PR
**Base:** `main@9c5899000a5c1527bb9f403c8b7d07c6de782011`
**Branch:** `codex/v0-2-ux-001`

## Goal

把现有英文为主、双重阶段导航、表单纵向堆叠的 Workspace 重构为中文优先的个人内容创作工作台：保留一个全局导航、一个项目阶段导航、每阶段一个明确主操作，以及可逐步展开的运行记录，同时完整保留现有 Working Copy、Version、Approval、Outdated 与依赖语义。

## In Scope

- 中文全局 Shell、工作台、项目面包屑、横向阶段导航和右侧/折叠式上下文状态面板。
- 只基于现有权威读取的 client-only 阶段状态与主操作呈现；旧 Approved + 新鲜 Review Candidate 继续显示“待审核”。
- 资料表格、统一行尾操作、添加资料抽屉、资料用途容量卡，以及现有粘贴/上传/URL Intake 和恢复行为。
- 将 Workflow Activity 移入“运行记录”抽屉，保留 Timeline 读取、通知与重试语义。
- 研究、观点与文章、小红书面板的中文文案、状态/版本解释、单主操作和响应式布局。
- 小红书八页固定顺序、单页聚焦编辑、只读可追溯信息，以及 720px 下 4×2 导航。
- 无新依赖的 warm-paper 中文视觉系统、键盘焦点、加载/空/错误/禁用状态和 1440/1024/720 视觉 QA。

## Out of Scope

- Domain Core、API/controller/service、public contracts、数据库/schema/migration、Queue/Workflow 语义、Agent Runtime 或 M6。
- Fake Provider 输出、真实 Provider、Adapter、凭证、付费调用、产品数据 reset/seed、自动 Human Approval 或公共发布。
- 新 Goal、Issue、DEC、部署或 postmerge reconciliation。

## Relevant DEC / Specifications

- DEC-267：单用户、桌面优先的 Personal AI Content Studio。
- DEC-269：Blog 与 Xiaohongshu 是独立双输出。
- DEC-287–DEC-292：有界 Work Item、可审阅 PR、Current-truth、DoR/DoD 与 scope-change 治理。
- DEC-295：text-first 私有双输出 MVP 边界。
- [Artifact Versioning](../../architecture/artifact-versioning.md)
- [Workflow Overview](../../architecture/workflow-overview.md)
- [Test Strategy](../../quality/test-strategy.md)
- [V0.1 truthful guidance Work Item](v0-1-ux-001-truthful-workspace-guidance-and-differentiated-content-contract.md)

## Contracts

- 所有阶段/下一步均为 client-only presentation projection，不写入新的 Workflow、Artifact 或状态真相。
- API-owned mutation、Working Copy → immutable Version → exact Human Approval 与 Outdated 传播保持不变。
- Source Intake、URL ambiguity/fallback、role capacity、review dirty/busy、Timeline recovery 继续调用现有 API/domain 路径。
- 小红书保留八个 page ID、顺序、Plan 与只读 traceability；Blog/Xiaohongshu 仍使用当前 Fake Provider。
- 中文 copy 仅改变呈现与可访问名称，不改变 public API 或错误代码。

## Allowed Files or Modules

- `apps/web/app/layout.tsx`, `apps/web/app/styles.css`
- `apps/web/components/*` 中现有 Shell、Dashboard、Workspace、Source、Timeline、Research、Opinion/Blog、Xiaohongshu 组件及一个小型 Drawer/Context 辅助组件
- `apps/web/lib/ui-copy.ts`, `workspace-stage-view.ts`, `source-intake-view.ts` 及其聚焦测试
- 受影响的 `packages/testing/src/browser/*` 场景
- 本 Work Item 与 `docs/implementation/roadmap.md`

不允许修改 `packages/core`, `packages/contracts`, API、database 或 migration。若实现需要这些边界，停止并进入 Decision Review。

## Acceptance Criteria

1. `<html lang="zh-CN">`；全局 Shell、Dashboard、五阶段导航、加载/空/错误/成功/禁用文案以中文为主。
2. 全局左 rail 与项目横向阶段导航职责唯一；桌面显示约 288px 上下文面板，窄屏按要求折叠且无页面横向溢出。
3. 上下文只呈现当前阶段的真实状态、原因、依赖/版本和一个视觉主操作；旧 Approved + 新鲜 Candidate 为“待审核”。
4. 资料以固定语义列对齐显示；行尾操作随状态为审核/继续编辑/查看/查看进度；“+ 添加资料”打开抽屉。
5. 资料方式是粘贴/上传/URL segmented control；主资料 1/1、补充资料 5/5 的用途卡显示已用容量和禁用原因；radio/checkbox 保持原生尺寸与 label 关联。
6. 运行记录不再永久占据资料表单底部；抽屉覆盖空、成功、错误和重试状态，并保留现有 Timeline recovery。
7. 研究明确当前草稿、不可变版本与 Approval；观点与文章保留 Creator-led stale re-interpret/re-confirm 与 Research-based 隐藏 Opinion；不出现重复确认诱导。
8. 小红书精确保留八页 ID/顺序和 metadata；720px 为 4×2，窄屏无竖排挤压或横向溢出。
9. 所有覆盖命令错误使用精确中文 inline copy；不新增 `window.alert`。
10. 1440、1024、720 视觉 QA、键盘焦点、hover/pressed/loading/empty/error/disabled 状态通过。

## Verification

- `workspace-stage-view` 与中文 copy/日期的聚焦单元测试。
- 更新 M1、M2 Source、Research、Opinion/Blog/XHS Browser 场景；新增阶段 IA、行对齐、用途容量、运行记录抽屉、无溢出断言。
- Node 24.18.0：开发期 focused tests；最终 root `check`、`repository:check`、完整 Browser、受影响 Integration、`git diff --check`。
- 1440/1024/720 before/after 截图并人工检查。
- 最终真实 diff 由独立 reviewer 按 correctness/readability/architecture/security/performance 审阅并通过。

### Local implementation evidence

- Node `24.18.0` root `corepack pnpm check`: PASS；64 个测试文件、620 项测试及 5 个应用构建完成。
- `corepack pnpm test:integration`: PASS；29 个文件、188 项测试。
- `corepack pnpm test:browser`: PASS；19/19，包括加载期无提前 mutation、资料表 Head 真值、资料审核单一主操作、抽屉焦点圈定/恢复及 720px 小红书 4×2 导航。
- `corepack pnpm repository:check` 与 `git diff --check`: PASS。
- 视觉 QA 已人工检查桌面、1024px 与 720px；三档均无页面横向溢出，1024px 上下文栏与八页编辑布局保持可用：
  - before: `/private/tmp/contentos-v0-1-ux-001-visual-qa/xiaohongshu-desktop.png`, `/private/tmp/contentos-v0-1-ux-001-visual-qa/xiaohongshu-720.png`
  - after: `/private/tmp/contentos-v0-2-ux-001-visual/xiaohongshu-desktop.png`, `/private/tmp/contentos-v0-2-ux-001-visual/xiaohongshu-1024.png`, `/private/tmp/contentos-v0-2-ux-001-visual/xiaohongshu-720.png`
- 独立审阅首轮提出的 5 项阻塞（加载期动作、资料 Head/更新时间、资料审核上下文动作、Drawer 键盘契约、资料审核中文化）及后续 3 项精确缺口均已修正并加入回归覆盖；最终 corrected-head 独立审阅 PASS，无阻塞 finding。
- Provider attempts/cost: `0 / ¥0`。

Publication truth 不由本地状态推断：只有包含该实现的 PR 在 required CI 成功后 squash merge，变更才对 `main` 生效。本 Work Item 不创建额外 recovery 或 postmerge reconciliation。

## Documentation Updates

- 本 Work Item 与 Roadmap 当前状态。
- 不修改 Current-truth Domain/API 文档，因为接受语义与公开合同不变。

## Security / Migration Impact

S0 — 无新边界。变更仅重组已认证 owner Workspace 的呈现和现有命令入口；不新增输入类型、Secret、存储、网络权限、schema 或 migration。

## Definition of Ready

方案 A、范围、现有命令、client-only 状态合同、文件边界、响应式验收与测试层均已明确；不存在 Blocking Design Question。

## Definition of Done

实现与验收全部完成；无相关测试跳过、无 Secret/产品数据写入或无关 diff；独立审阅 PASS；required CI 绿色；PR squash merge 后记录最终 main SHA。
