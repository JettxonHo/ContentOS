<div align="center">

# ContentOS

**私有素材进，人工批准的双平台成稿出。**

![Next.js](https://img.shields.io/badge/Next.js-React-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-严格合同-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-权威存储-4169E1?logo=postgresql&logoColor=white)

语言：简体中文 | [English](README.md)

[快速开始](#快速开始) · [Issues](https://github.com/JettxonHo/ContentOS/issues) · [决策注册表](docs/decisions/decisions.md)

</div>

> 这个项目回答的问题：**个人创作者用 AI 写东西，怎么不丢掉"自己的声音"？**——答案是分层：事实归素材、观点归你、AI 只做候选，三层混不到一起。

## 目录

- [它是什么](#它是什么)
- [功能特性](#功能特性)
- [真实运行界面](#真实运行界面)
- [验证状态](#验证状态)
- [它和其他 AI 写作工具的区别](#它和其他-ai-写作工具的区别)
- [快速开始](#快速开始)
- [常见问题](#常见问题)

## 它是什么

一个单用户、桌面优先的个人 AI 内容工作室。你给它私有的来源素材，它把素材整理成研究笔记，你在上面写下自己的观点，最后得到**经你批准**的博客 Markdown 与小红书文案，手工导出发布。

它不是批量写作工具，也不是自动发布系统——它的价值不在生成速度，而在审核与溯源结构。

<img src="docs/assets/readme/contentos-flow.png" alt="私有来源素材 → 研究整理 → 人工观点 → 双平台成稿" width="100%">

## 功能特性

- **来源 → 研究 → 观点 → 成稿**：四层流水线，每层的产物都是独立可审阅的资源
- **不可变版本与批准**：内容版本一旦批准即不可变；上游素材过期时旧版本自动关闭导出
- **防 AI 冒充亲历**：Research-based 模式被禁止编造第一人称经历；个人观点只能由你显式写下
- **主编助手面板**：对话式查看当前阶段状态与下一步（V0.3）——只读建议，不能替你保存或批准
- **小红书分页编辑器**：八页结构的专注编辑体验（V0.2 中文工作台）
- **手工导出**：`article.md` / `post.md` / `pages.json` 便携文本导出，发布动作永远在你手里

## 真实运行界面

| 中文创作工作台 | 主编助手面板 | 小红书分页编辑器 |
|---|---|---|
| <img src="docs/assets/readme/workbench-zh-01.png" alt="中文创作工作台全景" width="100%"> | <img src="docs/assets/readme/chief-editor-02.png" alt="主编助手对话面板" width="100%"> | <img src="docs/assets/readme/xiaohongshu-editor-03.png" alt="小红书八页分页编辑器" width="100%"> |

## 验证状态

> 截至 2026-09-02，与 M5 验收记录及 Roadmap 口径一致。

| 验证 | 状态 |
|---|---|
| text-first MVP | M0–M5 全部完成，正式验收记录已在主分支生效（首轮必需 CI 通过） |
| UX 迭代 | 基于外部观察完成 V0.1–V0.3 三轮：真实引导、中文工作台重设计、主编助手面板；V0.3 单轮 628 项本地 + 188 项集成 + 20 项浏览器测试全过 |
| 未实现边界 | 真实 Provider、生产部署、自动发布仍未实现；对话与建议不能保存、批准、导出或调用模型 |

## 它和其他 AI 写作工具的区别

- **三层分离**：事实、观点、AI 候选各有归属，AI 不能冒认你的经历
- **来源过期就锁死导出**：防止把基于旧素材的内容发出去
- **版本不可变**：批准与驳回都留下痕迹，没有"悄悄改掉"这回事

## 快速开始

见下方"Current setup / 当前设置"（pnpm 工作区，含基础设施与迁移步骤）。

## 常见问题

**它会自动帮我发布吗？**
不会。导出是手工的便携文本，发布动作永远由你完成。自动发布明确不在产品范围内。

**支持多人协作吗？**
不支持。它是刻意单用户、桌面优先的设计；多用户与公开注册属于明确的范围外。

**主编助手能替我批准内容吗？**
不能。它只解释当前状态和建议下一步，没有保存、批准、导出或调用模型的能力。

---

> 以下为产品与治理文档（原 README 内容保留不变，从"## 当前状态"开始）

## 当前状态

仓库已完成 **M0–M5** 与正式私有 text-first MVP。[M5 Acceptance Record 001](docs/implementation/m5-acceptance-record-001.md) 已通过 PR #296、首轮必需 CI 与 squash `987eb7a051a97f1522069a9673e976e0cf06b901` 生效；Issue #295 已 Closed/Completed。

当前仓库提供 Source/Workflow/Fetcher 基础、Research、Human Opinion，以及可独立 Approval 的 Blog/Xiaohongshu 文本和合格 `article.md`、`post.md`、`pages.json` 下载。已生效的 M5 记录在当前 main 验证这条完整私有 text-first 路径。PostgreSQL 与 API 保持权威，Raw Provider output 仅保存在服务端。真实 Provider、通用 Agent Runtime、Render、图片/ZIP Export Package、自动发布和生产部署仍未实现。

`M2-WEB-001B` 现在已接入活动 Workspace：它允许显式保存标准化 Working Copy、审核不可变 Version、确认当前准确 Review Candidate 的人工 Approval，并通过既有 SSE/Polling 恢复控制器显示有界安全 REST Timeline。Source Approval 不会推进 `source_review`，也不会追加 Workflow Timeline Event；归档 Package 仍不提供这些命令。

## MVP 之后的三轮 UX 迭代（V0.1–V0.3）

M5 验收生效后，仓库基于有界外部观察完成了三轮纯表现层迭代（均不改变 Domain / API / 持久化事实与 Fake Provider 边界）：

| 版本 | 内容 | 合并 |
|---|---|---|
| V0.1 | 真实可信的工作台引导：阶段状态与下一步动作由既有资源派生，过期 Opinion 恢复显式化；新增版本化的外部人工 Blog / 小红书 Prompt 与评测资产 | PR #301，CI 四项全绿 |
| V0.2 | 中文创作工作台与信息架构重设计：全局中文外壳、横向阶段导航、渐进披露的 Run Log、响应式四面板编辑 | PR #303，CI 四项全绿 |
| V0.3 | 主编助手对话面板：Figma 审定、确定性的会话外壳；本地 628 项测试 + 集成 188 + 浏览器 20 全过 | PR #304，CI 四项全绿 |

对话与建议不能保存、应用、批准、导出或调用 Provider；真实 Provider、生产部署与自动发布仍未实现。

## 对访客的一句话

这是一个把"AI 生成内容"约束为**来源可追溯、版本不可变、人工批准才算数**的单用户内容工作室——它的价值主张不在生成速度，而在审核与溯源结构。

<img src="docs/assets/readme/contentos-flow.png" alt="私有素材进，人工批准的双平台成稿出" width="100%">

<img src="docs/assets/readme/workbench-zh-01.png" alt="中文创作工作台：五阶段导航与主编助手" width="32%"> <img src="docs/assets/readme/chief-editor-02.png" alt="主编助手对话面板：本地受控预览" width="32%"> <img src="docs/assets/readme/xiaohongshu-editor-03.png" alt="小红书分页编辑器：八页候选与逐页编辑" width="32%">

以上均为本地实跑截图（2026-09，deterministic Fake Provider）：资料录入 → 批准 → 研究 → 观点确认 → 文章批准 → 小红书八页候选批准，全流程不调用真实模型。

## MVP 边界

正式 MVP 是一个私有、单用户、桌面优先、有人类审阅的 Web 应用。它从共享的 Content Foundation 独立生成已批准的 Blog Markdown 和 Xiaohongshu 文本，并支持手工可移植文本导出与发布。Design、图片生成、PNG Render、复杂资产包、生产部署、公开注册、自动发布、多用户协作以及不受支持的媒体输入属于 post-MVP 或明确不在范围内。请阅读完整的 [MVP Scope](docs/product/mvp-scope.md) 与已批准的执行 [Goal](GOAL.md)。

## 仓库内容

仓库当前包含：

- 历史 [Sessions](docs/sessions/)；
- [Canonical Decision Register](docs/decisions/decisions.md)；
- 产品、架构、安全和质量的 Current-truth Specifications；
- 实施治理文档：[Roadmap](docs/implementation/roadmap.md)、[Milestone Exit Criteria](docs/implementation/milestone-exit-criteria.md) 与 [Work Item template](docs/implementation/work-item-template.md)。

当前 Workspace 包含五个应用和六个包。G1–G3 未增加新包或应用：Research、Opinion、Blog 与 Xiaohongshu 规则位于 `core`，严格 HTTP contracts 位于 `contracts`，增量持久化位于 `database`，受保护组合位于 `api`，私有审阅流程位于 `web`。其余计划中的包在受限 post-MVP Work Item 真正需要前保持不存在。

## 权威文档地图

- [Agent 与仓库规则](AGENTS.md)
- 产品：[definition](docs/product/product-definition.md)、[users and jobs](docs/product/user-and-jobs.md)、[MVP scope](docs/product/mvp-scope.md)
- 架构：[domain overview](docs/architecture/domain-overview.md)、[Content Package foundation](docs/architecture/content-package-foundation.md)、[Source foundation](docs/architecture/source-foundation.md)、[technical architecture](docs/architecture/technical-architecture.md)、[repository structure](docs/architecture/repository-structure.md)、[workflow overview](docs/architecture/workflow-overview.md)
- 安全：[security baseline](docs/security/security-baseline.md)、[authentication foundation](docs/security/authentication-foundation.md)
- 质量：[test strategy](docs/quality/test-strategy.md)、[release gates](docs/quality/release-gates.md)、[Research Eval baseline](docs/quality/evals/research-core-v1.json)、[local quality toolchain](docs/quality/local-quality-toolchain.md)、[integration smoke harness](docs/quality/integration-smoke-harness.md)、[browser acceptance](docs/quality/browser-thin-slice.md)、[M2 acceptance harness](docs/quality/m2-acceptance-harness.md)、[CI skeleton](docs/quality/ci-skeleton.md)
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

构建成功后，可使用 `corepack pnpm start:web`、`start:api`、`start:worker`、`start:fetcher` 或 `start:renderer` 启动相应进程。Web 提供登录、Dashboard、Content Package/Source/Research 审阅、Human Opinion 确认、显式 Creator-led/Research-based 选择、独立 Blog/Xiaohongshu 编辑、checkpoint、精确 Approval、provenance 审阅与可移植文本下载。API 提供对应的 owner-scoped Content Package/Source/Workflow/Research/Opinion/Blog/Xiaohongshu 路由、私有 Fetcher Gateway 和 `/openapi.json`。本地 deterministic Fake Provider 不暴露 Raw Provider output；Worker 与 Fetcher 保持各自受限的投递身份。Web 与 API 启动要求提供 `.env.example` 记录的已验证值。

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

该命令会启动隔离的 `contentos-smoke-*` Compose 项目：它用 `tmpfs` 替换持久卷、仅将临时端口绑定到 `127.0.0.1`、在仓库外使用每次运行唯一的临时目录和凭据、应用经审查的迁移，并演练从 Source、Research、Opinion 到 Blog/Xiaohongshu、精确 Approval、Outdated、owner/archive denial 与可移植导出的私有 API/PostgreSQL 路径。它绝不会读取、挂载或修改 `contentos-local` named volumes。

运行 `corepack pnpm test:integration:concurrent` 可并发启动两个完整、由 token 所有的 smoke run，并验证它们的目录、状态、Compose 项目、端口、凭据和清理操作彼此隔离，也与无关 harness run 隔离。

安装固定的 Chromium revision（`corepack pnpm exec playwright install chromium`）后，运行 `corepack pnpm test:browser` 以演练当前 owner-browser suite，包括两条已批准文本分支和三个下载。其安全、清理和范围边界请阅读 [Browser Acceptance](docs/quality/browser-thin-slice.md) 和 [M2 Acceptance Harness](docs/quality/m2-acceptance-harness.md)。

这些命令覆盖私有 text-first MVP，并保留 M2 delivery/recovery 边界。当前没有 `dev`、真实 Provider 执行、通用 Agent Runtime、Design/Render/图片包、自动发布、生产部署或广泛的 post-MVP 运维套件。

## 持续集成

位于 [.github/workflows/ci.yml](.github/workflows/ci.yml) 的受限 GitHub Actions workflow 会在 Pull Request、推送到 `main` 和手动触发时运行。它使用 GitHub-hosted `ubuntu-24.04` runner，具有只读权限；将仅有的两个 reusable actions 固定到不可变 commit SHA；从 `.node-version` 解析 Node；激活 Corepack pnpm `11.17.0`；并使用 frozen lockfile 安装。它运行三个必需 Job：

- 一个 Docker-independent Job：Workspace 解析、`corepack pnpm check` 和 `corepack pnpm repository:check`（Markdown 本地链接、Canonical Decision Register 和 Secret 检查）；
- 一个 Docker-dependent Job：通过现有隔离 smoke harness 执行 `corepack pnpm test:integration`；
- 一个当前 text-first browser Job：固定的 Playwright Chromium 针对隔离运行时运行 `corepack pnpm test:browser`。

该 workflow 不引用 repository Secrets、不持久化凭据、不上传 artifacts，也不进行部署或发布。它是受限基线，而非完整发布门禁。变更合并前三个 Job 必须全部通过。完整范围请阅读 [CI Skeleton](docs/quality/ci-skeleton.md)。

## 下一步实施工作

1. 真实 Provider、生产部署、Design/Render、复杂包、备份恢复与自动发布继续由单独批准的 post-MVP Goal 和 Work Item 管理。
2. 未经明确人工批准，不启动 M6 或其他 post-MVP Goal。

本仓库不承诺完成日期。

## 贡献

开始变更前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[Work Item template](docs/implementation/work-item-template.md) 和 [AGENTS.md](AGENTS.md)。

## 历史文档

[Sessions](docs/sessions/) 保存讨论历史，[vision.md](docs/product/vision.md) 保存产品背景。实施应从 Current-truth Specifications 和 Decision Register 开始。历史文档不会自动覆盖较晚接受的 DEC。
