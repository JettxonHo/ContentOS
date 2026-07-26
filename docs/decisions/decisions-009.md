
# 26. Decisions

## DEC-043

### Status

Accepted

### Title

Blog Artifact 与 Public Blog Post 分离

### Decision

ContentOS 的 Blog Artifact 是内容生产、编辑、审核和版本管理对象。

PersonalBlog 的 Blog Post 是公开发布、网站展示和网站路由对象。

两者通过版本化的 Blog Export Contract 连接，不共享内部数据库模型。

### Reason

内容生产与公开发布具有不同的：

- 职责
- 数据模型
- 状态
- 生命周期
- 安全要求
- 迭代节奏

将两者合并会使 ContentOS 绑定特定网站实现，并增加双方演进成本。

### Impact

ContentOS 和 PersonalBlog 可以作为两个独立项目开发。

两个项目需要通过 Adapter 和版本化交换契约集成。

---

## DEC-044

### Status

Accepted — Revised

### Title

MVP 使用 Markdown 作为 Blog 正文的唯一事实来源，并保留向 Blocks 迁移的边界

### Decision

ContentOS MVP 使用 Markdown 作为 Blog 正文的唯一权威表示。

Blog Body 使用带格式标识和 Schema Version 的容器：

```json
{
  "body": {
    "format": "markdown",
    "schema_version": "contentos.blog-body/markdown-v1",
    "content": ""
  }
}
```

Outline、Table of Contents、章节索引和阅读时长等数据从 Markdown 派生，不作为第二份可独立编辑的正文。

未来当结构化编辑、Block 级 AI 操作、富媒体组件或多渠道内容复用需求得到验证后，ContentOS 可以将新的 Blog 版本迁移为 Blocks Canonical Model。

迁移后：

- Blocks 成为唯一内部正文事实来源
- Markdown 由 Blocks 派生并用于导出
- Markdown 和 Blocks 不允许同时作为两份可编辑事实来源
- 历史 Markdown 版本可以原样保留
- 每个版本记录自己的 Body Format 和 Schema Version

### Reason

Markdown 可以显著降低 MVP 的：

- 编辑器复杂度
- Agent 输出复杂度
- 版本管理复杂度
- 导出复杂度
- PersonalBlog 对接成本

格式标识与 Schema Version 可以防止 ContentOS 永久绑定 Markdown，并为未来 Blocks 迁移建立明确边界。

### Impact

MVP 需要：

- Markdown Editor
- Markdown Parser
- Markdown Preview
- Derived Outline
- Markdown Export

MVP 暂不需要：

- Block Editor
- Block Schema
- Block Renderer
- Block-level collaboration
- Markdown-to-Blocks Migration Tool

未来迁移时需要新增：

- Block Schema
- Structured Editor
- Markdown Importer
- Markdown Exporter
- Migration Tool
- Fallback strategy
- Human review process

---

## DEC-045

### Status

Accepted

### Title

Blog Markdown 使用平台无关的 GFM-compatible 子集

### Decision

ContentOS 导出平台无关的通用 Markdown。

导出内容不包含：

- MDX
- JSX
- Astro Components
- Hugo Shortcodes
- React Components
- CMS-specific tags
- Framework-specific directives

### Reason

Blog Artifact 和 Blog Export Contract 不应该绑定 PersonalBlog 的技术框架。

平台无关 Markdown 更容易：

- 迁移
- 审核
- 版本控制
- 手动使用
- 被不同博客系统导入

### Impact

PersonalBlog Import Adapter 负责将通用 Markdown 和通用 Frontmatter 转换为网站框架需要的结构。

---

## DEC-046

### Status

Accepted

### Title

正式 Blog 交换格式采用 Blog Export Package

### Decision

ContentOS 的正式 Blog 交换格式包含：

```text
article.md
manifest.json
assets/
```

ContentOS 同时保留：

```text
Copy Markdown
```

作为便捷操作。

### Reason

单个 Markdown 文件无法完整、可靠地携带：

- 图片资产
- Artifact 版本
- Export 版本
- 文件校验信息
- 机器导入信息
- 未来同步信息

### Impact

ContentOS 需要实现：

- Blog Export Mapper
- YAML Frontmatter
- Export Manifest
- Relative asset paths
- Package or ZIP generation
- File checksums

---

## DEC-047

### Status

Accepted

### Title

ContentOS 提供推荐 slug，PersonalBlog 拥有最终公开地址

### Decision

ContentOS 输出：

```text
suggested_slug
```

PersonalBlog 负责：

- 最终 slug
- Slug 唯一性
- 最终公开 URL
- 网站路由

### Reason

只有发布网站知道：

- 当前路由规则
- 已存在的 slug
- 重定向策略
- 网站语言路径
- URL 迁移规则

### Impact

未来 PersonalBlog Import Result 需要返回：

- `resolved_slug`
- `public_url`
- `publication_status`

---

## DEC-048

### Status

Accepted

### Title

ContentOS 与 PersonalBlog 禁止直接数据库耦合

### Decision

ContentOS 和 PersonalBlog 通过：

- Versioned Export Contract
- Import Adapter
- Import API
- Optional publishing adapter

进行集成。

两个项目不直接读取或写入对方数据库表。

### Reason

直接数据库耦合会：

- 暴露内部实现
- 限制独立演进
- 增加迁移风险
- 破坏领域边界
- 增加安全风险
- 使测试和部署复杂化

### Impact

两个项目分别维护自己的领域模型。

Blog Export Contract 成为稳定集成边界。

---

## DEC-049

### Status

Accepted

### Title

PersonalBlog 集成采用分阶段策略

### Decision

ContentOS 与 PersonalBlog 的集成顺序为：

```text
File Export
→ Manual or Script Import
→ HTTP Import API
→ Optional Git Adapter
```

ContentOS MVP 不要求 PersonalBlog API。

### Reason

文件导出可以最早验证：

- Blog Artifact Schema
- Markdown compatibility
- Frontmatter
- Asset packaging
- Version identity
- PersonalBlog import assumptions

API 和 Git 权限应在两个项目的领域模型稳定后实现。

### Impact

ContentOS MVP 优先实现稳定的 Blog Export Package。

PersonalBlog 初版可以先使用手动导入或本地脚本。

---

## DEC-050

### Status

Accepted

### Title

未来 Blog Import API 必须版本化且幂等

### Decision

未来 PersonalBlog Import API 使用版本化 Contract。

API 根据：

```text
artifact_id + version_id
```

识别同一个 Blog 版本，防止重复导入。

新版本默认创建：

```text
Pending Revision
```

不得自动覆盖已发布版本。

### Reason

网络重试可能重复发送相同请求。

Blog 更新也可能包含错误内容。

系统必须避免：

- 重复文章
- 重复导入
- 未经审核的线上覆盖
- 无法追踪的版本更新

### Impact

未来 PersonalBlog 需要支持：

- Import records
- Contract version
- Idempotency
- Version comparison
- Pending Revision
- Human approval
- Publication update workflow
- Import conflict handling
