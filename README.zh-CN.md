# ContentOS

语言： [English](README.md) | 简体中文

ContentOS 是一个单用户、桌面优先的 Personal AI Content Studio（个人 AI 内容工作室）。它将私有、可审阅的来源材料转化为可追溯的内容流程：

```text
Source → Research → Human Opinion 或 Research-based Mode
→ 已批准 Blog Markdown + 已批准 Xiaohongshu 文本
→ 手工文本导出
```

它不是批量写作工具，也不是自动化发布系统。

## 当前状态

仓库已完成 **M0**、**M1 — 产品骨架与领域基础** 和 **M2 — 来源与工作流基础**。[M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md) 记录了首个私有 Login → Dashboard → Workspace 闭环的通过决定。[M2 Acceptance Record 002](docs/implementation/m2-acceptance-record-002.md) 记录了基于当前 main 的私有 Source/Workflow 基础通过决定。G1/M3 Research 与 G2 Human Opinion/Blog 已经生效；当前受审候选实现 G3 Xiaohongshu 文本薄切片。

当前仓库提供 Source/Workflow/Fetcher 基础、G1 Research、已生效的 G2 Human Opinion/Blog，以及当前 G3 Xiaohongshu 文本候选。活动 Workspace 可从同一 Content Foundation 独立生成并审阅带 provenance 的 Blog 与 Xiaohongshu 文本；G3 支持确定性的八页 Packaging Plan、显式 Creator-led/Research-based 模式、结构化编辑与排序、不变 Version checkpoint、精确 Approval、Outdated 状态，以及合格 Approved Version 的 `post.md` / `pages.json` 下载。PostgreSQL 与 API 保持权威，Raw Provider output 仅保存在服务端。真实 Provider、通用 Agent Runtime、Render、图片/ZIP Export Package、发布和生产部署仍未实现。

`M2-WEB-001B` 现在已接入活动 Workspace：它允许显式保存标准化 Working Copy、审核不可变 Version、确认当前准确 Review Candidate 的人工 Approval，并通过既有 SSE/Polling 恢复控制器显示有界安全 REST Timeline。Source Approval 不会推进 `source_review`，也不会追加 Workflow Timeline Event；归档 Package 仍不提供这些命令。

## MVP 边界

正式 MVP 是一个私有、单用户、桌面优先、有人类审阅的 Web 应用。它从共享的 Content Foundation 独立生成已批准的 Blog Markdown 和 Xiaohongshu 文本，并支持手工可移植文本导出与发布。Design、图片生成、PNG Render、复杂资产包、生产部署、公开注册、自动发布、多用户协作以及不受支持的媒体输入属于 post-MVP 或明确不在范围内。请阅读完整的 [MVP Scope](docs/product/mvp-scope.md) 与已批准的执行 [Goal](GOAL.md)。

## 仓库内容

仓库当前包含：

- 历史 [Sessions](docs/sessions/)；
- [Canonical Decision Register](docs/decisions/decisions.md)；
- 产品、架构、安全和质量的 Current-truth Specifications；
- 实施治理文档：[Roadmap](docs/implementation/roadmap.md)、[Milestone Exit Criteria](docs/implementation/milestone-exit-criteria.md) 与 [Work Item template](docs/implementation/work-item-template.md)。

当前 Workspace 包含五个应用和六个包。`M1-SEC-001` 新增了 `packages/database` 与认证基础。`M1-CP-001` 新增了第二个经审查的迁移、与框架无关的 Content Package 和 Artifact 身份规则、共享 HTTP Contracts、Drizzle Repository，以及现有包中的受保护 API 组合。`M2-SRC-001` 新增了 `packages/object-storage`、首个 Source 迁移、与框架无关的 Source 领域和应用规则、共享 Source Contracts、Drizzle Source Repository、S3-compatible Adapter，以及受保护的 Source API 组合。其余计划中的包在有受限 Work Item 需要前仍保持不存在。

## 权威文档地图

- [Agent 与仓库规则](AGENTS.md)
- 产品：[definition](docs/product/product-definition.md)、[users and jobs](docs/product/user-and-jobs.md)、[MVP scope](docs/product/mvp-scope.md)
- 架构：[domain overview](docs/architecture/domain-overview.md)、[Content Package foundation](docs/architecture/content-package-foundation.md)、[Source foundation](docs/architecture/source-foundation.md)、[technical architecture](docs/architecture/technical-architecture.md)、[repository structure](docs/architecture/repository-structure.md)、[workflow overview](docs/architecture/workflow-overview.md)
- 安全：[security baseline](docs/security/security-baseline.md)、[authentication foundation](docs/security/authentication-foundation.md)
- 质量：[test strategy](docs/quality/test-strategy.md)、[release gates](docs/quality/release-gates.md)、[local quality toolchain](docs/quality/local-quality-toolchain.md)、[integration smoke harness](docs/quality/integration-smoke-harness.md)、[M1 browser thin slice](docs/quality/browser-thin-slice.md)、[M2 acceptance harness](docs/quality/m2-acceptance-harness.md)、[CI skeleton](docs/quality/ci-skeleton.md)
- 实施：[roadmap](docs/implementation/roadmap.md)、[exit criteria](docs/implementation/milestone-exit-criteria.md)、[M1 Acceptance Record 001](docs/implementation/m1-acceptance-record-001.md)、[M2 Acceptance Record 002](docs/implementation/m2-acceptance-record-002.md)、[Work Item template](docs/implementation/work-item-template.md)，以及 [agent collaboration workflow](docs/implementation/agent-collaboration-workflow.md)
- [Decision Register](docs/decisions/decisions.md)
- [Contribution guide](CONTRIBUTING.md)

## 开发生命周期

```text
Work Item → Plan → Implementation → Verification → Review → Commit
```

实施前，Work Item 必须处于 Ready 状态；Commit 绝不隐含发生。若 Work Item 与已接受的 DEC 或 Current-truth Specifications 冲突，后两者优先。

## GitHub 工作流

仓库私有托管在 GitHub 上。请使用匹配的 [GitHub Issue Form](.github/ISSUE_TEMPLATE/) 创建受限的 Work Item、Bug 或 Decision Review；在关联该 Issue 的分支上工作；然后使用 [GitHub PR template](.github/pull_request_template.md) 创建 Pull Request。GitHub 表单只是适配层：[Work Item contract](docs/implementation/work-item-template.md) 与平台无关模板仍然是权威来源。

## 当前环境设置

使用 Node.js 24.18.0（由 `.node-version` 声明）和由 Corepack 管理的 pnpm 11.17.0：

```bash
corepack pnpm install
corepack pnpm install --frozen-lockfile
corepack pnpm format
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:integration
corepack pnpm test:integration:concurrent
corepack pnpm test:browser
corepack pnpm build
corepack pnpm check
corepack pnpm workspace:check
corepack pnpm check:docs
corepack pnpm check:decisions
corepack pnpm check:secrets
corepack pnpm repository:check
```

在 Commit 前运行 `corepack pnpm check`。它会按顺序执行 `format:check`、`lint`、`typecheck`、`test` 和 `build`，不会启动 Docker 服务、访问网络或读取 Secrets。依赖 Docker 的 `test:integration`、`test:integration:concurrent` 和 `test:browser` 不属于 `check`。`corepack pnpm repository:check`（以及聚焦的 `check:docs`、`check:decisions` 和 `check:secrets`）会对 Git 跟踪文件执行无依赖的仓库完整性检查。

构建成功后，可使用 `corepack pnpm start:web`、`start:api`、`start:worker`、`start:fetcher` 或 `start:renderer` 启动相应进程。Web 提供登录、活跃／已归档 Dashboard、Content Package 创建、元数据／归档 Workspace，以及活动 Package 的 Source intake、Working Copy/Version/Approval 审核和安全 Timeline。API 提供存活检查、三个 `/v1/auth/*` 端点、受保护的 `/v1/content-packages` 路由、受保护的 `/v1/content-packages/:packageId/sources` 路由（粘贴文本捕获、`.md`／`.txt` 文件上传捕获、列表、读取、Working Copy 编辑、Version 创建、Version 列表、批准）、受保护的 URL-capture request 路由、私有且不进入 OpenAPI 的 Fetcher Gateway Claim/Heartbeat/Result 路由，以及 `/openapi.json`；Worker 运行有界的 Outbox Dispatcher 和 lease/delivery reconciliation，只发布固定的最小 BullMQ envelope。Fetcher 需要 Gateway Secret/origin、`CONTENTOS_FETCHER_REDIS_URL` 和 Fetcher-scoped Object Storage 配置；它只消费固定的 Fetcher Job、调用私有 Gateway，且没有 PostgreSQL 凭据。Web 与 API 的启动要求提供 `.env.example` 所记录的已验证值。

交互式生成本地 owner-password hash，然后仅在通过环境变量提供目标 PostgreSQL URL 后应用已提交的数据库迁移：

```bash
corepack pnpm auth:hash-password
corepack pnpm db:migrate
```

密码哈希命令不接受通过命令行参数提供的明文。迁移命令不会在 API 启动时自动运行。

要准备本地状态服务，将 `.env.example` 复制为不受跟踪的 `.env`，替换其中所有占位符，然后运行：

```bash
corepack pnpm infra:config
corepack pnpm infra:pull
corepack pnpm infra:up
corepack pnpm infra:status
corepack pnpm infra:logs
corepack pnpm infra:down
```

除非在 `.env` 中覆盖，Compose 基线会在 `127.0.0.1:5432` 运行 PostgreSQL、在 `127.0.0.1:6379` 运行 Redis，并在 `127.0.0.1:8333` 运行 SeaweedFS `weed mini` S3-compatible Object Storage。其余内部组件端口不会暴露给 Host。本地镜像固定为 SeaweedFS `4.29` 及其已验证的 manifest digest。`infra:down` 会保留 named volumes。API 在应用迁移后连接 PostgreSQL 以处理 server-side Sessions、Content Package metadata、Source metadata 和 API-owned Fetcher Task lease，并连接 S3-compatible Object Storage 以处理不可变的 Raw Snapshot bytes；Worker 连接 PostgreSQL 和 Redis 仅用于投递边界。Fetcher 只连接独立的 Redis/Object Storage 身份、配置的 literal-loopback Gateway origin 和受控的公网 HTTP/HTTPS；它从不接收 `DATABASE_URL`。当前仍不存在 Agent、Render 或生产部署。

要通过真实入口点和容器验证五个应用骨架及本地状态服务协同工作，请运行：

```bash
corepack pnpm test:integration
```

该命令会启动隔离的 `contentos-smoke-*` Compose 项目：它用 `tmpfs` 替换持久卷、仅将临时端口绑定到 `127.0.0.1`、在仓库外使用每次运行唯一的临时目录和凭据、应用经审查的迁移，并演练 Session、Content Package 和粘贴文本 Source API 行为。它绝不会读取、挂载或修改 `contentos-local` named volumes。

运行 `corepack pnpm test:integration:concurrent` 可并发启动两个完整、由 token 所有的 smoke run，并验证它们的目录、状态、Compose 项目、端口、凭据和清理操作彼此隔离，也与无关 harness run 隔离。

安装固定的 Chromium revision（`corepack pnpm exec playwright install chromium`）后，运行 `corepack pnpm test:browser` 以演练 M1/M2/G1 owner-browser suite。其安全、清理和范围边界请阅读 [M1 Browser Thin Slice](docs/quality/browser-thin-slice.md) 和 [M2 Acceptance Harness](docs/quality/m2-acceptance-harness.md)。

这些命令仍只是受限的 M1 基础，加上当前已实现的 M2 Source、delivery、Fetcher execution 和 Source-evidence slices。当前没有 `dev`、广泛的产品 E2E suite、持久 request/delivery/lease/recovery/result 边界之外的 Workflow Engine、Agent、Render 或内容发布功能。

## 持续集成

位于 [.github/workflows/ci.yml](.github/workflows/ci.yml) 的受限 GitHub Actions workflow 会在 Pull Request、推送到 `main` 和手动触发时运行。它使用 GitHub-hosted `ubuntu-24.04` runner，具有只读权限；将仅有的两个 reusable actions 固定到不可变 commit SHA；从 `.node-version` 解析 Node；激活 Corepack pnpm `11.17.0`；并使用 frozen lockfile 安装。它运行三个必需 Job：

- 一个 Docker-independent Job：Workspace 解析、`corepack pnpm check` 和 `corepack pnpm repository:check`（Markdown 本地链接、Canonical Decision Register 和 Secret 检查）；
- 一个 Docker-dependent Job：通过现有隔离 smoke harness 执行 `corepack pnpm test:integration`；
- 一个 M1/M2/G1 browser Job：固定的 Playwright Chromium 针对隔离运行时运行 `corepack pnpm test:browser`。

该 workflow 不引用 repository Secrets、不持久化凭据、不上传 artifacts，也不进行部署或发布。它是受限基线，而非完整发布门禁。变更合并前三个 Job 必须全部通过。完整范围请阅读 [CI Skeleton](docs/quality/ci-skeleton.md)。

## 下一步实施工作

1. 审阅、通过 CI 并合并受限的 [G1 Research Work Item](docs/implementation/work-packets/g1-research-thin-slice.md)。
2. G1 生效后再启动 G2 Human Opinion/Research-based Mode 与 Blog；真实 Provider 调用仍需单独授权。

本仓库不承诺完成日期。

## 贡献

开始变更前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[Work Item template](docs/implementation/work-item-template.md) 和 [AGENTS.md](AGENTS.md)。

## 历史文档

[Sessions](docs/sessions/) 保存讨论历史，[vision.md](docs/product/vision.md) 保存产品背景。实施应从 Current-truth Specifications 和 Decision Register 开始。历史文档不会自动覆盖较晚接受的 DEC。
