# 109. Decisions

## DEC-199

### Status

Accepted

### Title

ContentOS 采用 Private by Default、Least Privilege 与 Deny by Default

### Decision

Content Packages, Artifacts, Assets, Render Outputs, and Export Packages are private by default.

Users, Services, and Agents receive only the minimum permissions required for their responsibilities.

Capabilities and access not explicitly allowed are denied.

### Reason

ContentOS processes unpublished content, personal opinion, credentials, and derived files.

These objects cannot be assumed to be public or safe for broad access.

### Impact

All core resources and APIs require explicit ownership and access checks.

---

## DEC-200

### Status

Accepted

### Title

单用户 MVP 仍然使用正式认证、服务端授权与 Owner 字段

### Decision

A network-accessible MVP requires authentication and secure user sessions.

User-owned root objects store `owner_user_id`.

Authorization is enforced on the server.

### Reason

Single-user mode does not mean anonymous access or trusted network requests.

### Impact

Content Package, Artifact, Asset, Workflow, Render, Export, and other private root objects require an Ownership Contract.

---

## DEC-201

### Status

Accepted

### Title

用户、Agent、System 与 Service Principal 使用独立身份和权限边界

### Decision

Security Principal and Domain Actor are separate concepts.

Agents do not receive general database, Secret Store, or Workflow API credentials.

Background Services use separate, least-privilege Service Identities.

### Reason

A shared universal identity would expand the impact of configuration errors and security incidents.

### Impact

Source Fetcher, Agent Runtime, Render Worker, Export Service, and Workflow Executor receive separate permissions.

---

## DEC-202

### Status

Accepted

### Title

ContentOS 使用版本化数据分级与 Provider Data Policy

### Decision

ContentOS classifies data as:

- Public
- Internal Metadata
- Private Content
- Sensitive User Data
- Secret

Agent Runs record the data classes sent to a Provider and the Provider Data Policy Version.

### Reason

Storage, logging, Provider transmission, access, retention, and deletion requirements differ by data type.

### Impact

Package, Source, Human Opinion, Input Snapshot, and Provider configuration require privacy metadata.

---

## DEC-203

### Status

Accepted

### Title

Agent Runtime 向 Provider 发送最小必要数据

### Decision

Context Builder sends only information required for the Agent Task.

It does not send unrelated Packages, complete Workflow History, user account information, Secrets, or unrelated Raw Snapshots.

Sensitive data may be blocked or require confirmation according to Provider Data Policy.

### Reason

Data minimization reduces exposure, cost, Prompt Injection surface, and privacy risk.

### Impact

Every Agent Spec must define allowed input categories and required context.

---

## DEC-204

### Status

Accepted

### Title

Prompt Injection 通过多层防护控制，而不是依赖单一 Prompt

### Decision

ContentOS uses:

- Untrusted-content isolation
- Tool Access disabled by default
- Least privilege
- Context minimization
- Structured output
- Domain Validation
- Capability Gateway
- Human Approval
- Adversarial security testing

Source, file, external Tool Result, and third-party content are treated as untrusted data.

### Reason

A model cannot be assumed to distinguish malicious instructions reliably in every case.

### Impact

Prompt Builder, Agent Runtime, Validators, authorization, and security tests share responsibility for containment.

---

## DEC-205

### Status

Accepted

### Title

模型输出始终是无权限候选，不能直接成为执行指令

### Decision

Model output passes:

```text
Parse
→ Schema Validation
→ Domain Validation
→ Candidate
→ Promotion or Proposal
```

It cannot directly approve content, modify Workflow, execute SQL, access Secrets, delete data, publish, or create Public Share.

### Reason

Model output may be incorrect, injected, incomplete, or malicious even when its structure is valid.

### Impact

All high-impact actions require structured Commands and Deterministic Executor validation.

---

## DEC-206

### Status

Accepted

### Title

URL Source Capture 使用隔离的 Fetcher 与严格 SSRF 防护

### Decision

Source Fetcher:

- Allows only approved public HTTP and HTTPS destinations
- Blocks loopback, private, link-local, metadata, and reserved destinations
- Revalidates DNS and redirects
- Limits ports, size, duration, and redirect count
- Uses an isolated Service Identity and network boundary

### Reason

A user-controlled URL must not become a path into private infrastructure.

### Impact

Source Fetching is separated from the main application process and general credentials.

---

## DEC-207

### Status

Accepted

### Title

Raw Source 与安全展示内容分离

### Decision

Raw Snapshot may be preserved immutably.

It is not executed directly inside the main application.

Source Review uses parsed and sanitized content without active scripts, iframe, event handlers, or uncontrolled remote resources.

### Reason

Evidence retention and safe content presentation have different trust requirements.

### Impact

Source Module requires clear boundaries among Raw Snapshot, Extracted Content, and Safe Review Representation.

---

## DEC-208

### Status

Accepted

### Title

上传文件使用 Allowlist、Quarantine 与内容验证

### Decision

The MVP supports only explicitly allowed `.md` and `.txt` uploads.

Files enter quarantine before extension, MIME, size, encoding, filename, and content validation.

Rejected or unvalidated files cannot enter Agent Context.

### Reason

Uploaded files and extensions cannot be trusted automatically.

### Impact

Adding PDF, Office, archive, audio, video, or other formats requires a separate security review.

---

## DEC-209

### Status

Accepted

### Title

Markdown、HTML、远程图片和 Export 均使用安全 Allowlist

### Decision

Markdown disables executable HTML by default.

Remote resources are fetched through controlled infrastructure or converted to internal Assets.

Export Pipeline includes only explicitly allowed files and fields.

It excludes Secrets, Prompt, Raw Output, temporary URLs, and internal diagnostics.

### Reason

Content rendering and export packaging can become code-execution or data-leakage paths.

### Impact

Markdown Viewer, Source Review, Renderer, and Export Pipeline require dedicated safety validation.

---

## DEC-210

### Status

Accepted

### Title

Provider Secret 通过独立 Secret Layer 和 Credential Reference 管理

### Decision

Provider keys, database credentials, session secrets, Object Storage credentials, and encryption keys remain in a dedicated Secret Layer.

Model Configuration stores only a Credential Reference.

### Reason

Secrets are infrastructure credentials and do not belong in normal domain or Agent data.

### Impact

Service Identity controls which credentials each Service may resolve, rotate, or revoke.

---

## DEC-211

### Status

Accepted

### Title

ContentOS 使用传输加密、存储加密和受控临时访问 URL

### Decision

Protected transport is used between users, Services, storage, and Providers.

PostgreSQL, Object Storage, Backup, and Secret Storage use appropriate at-rest encryption.

Formal file references use Object Keys.

Downloads use short-lived scoped URLs.

### Reason

Private content and credentials cannot rely on network or storage environments being inherently trusted.

### Impact

Field-level encryption for selected Sensitive User Data remains a deployment-specific decision.

---

## DEC-212

### Status

Accepted

### Title

日志与 Trace 默认不保存完整用户内容或 Secret

### Decision

Logs and Traces record IDs, status, errors, duration, and Usage by default.

They do not store full Source, Prompt, Human Opinion, Raw Output, credentials, cookies, or signed URLs.

Content diagnostics require a controlled, audited, time-limited mechanism.

### Reason

Monitoring systems must not become uncontrolled copies of private content.

### Impact

ContentOS requires centralized Redaction, Correlation IDs, and Secure Diagnostics Policy.

---

## DEC-213

### Status

Accepted

### Title

Raw Model Output 属于受限诊断数据并使用独立保留与访问策略

### Decision

Raw Model Output is excluded from normal Workspace, Publishing Export, and Public Share.

Access requires authorization and creates a Security Audit Event.

Related Raw Output is included in Package Purge.

### Reason

Raw Output may contain private content, injected text, Provider metadata, or incorrect sensitive output.

### Impact

Agent Runtime requires Raw Output Access and Retention Policies.

---

## DEC-214

### Status

Accepted

### Title

Security Audit Event 与 Workflow Event 概念分离

### Decision

Workflow Event records content-production progress.

Security Audit Event records security-relevant access and configuration actions.

They may share append-only infrastructure but retain separate Contracts and access policies.

### Reason

Content history and security accountability answer different questions.

### Impact

ContentOS requires a Security Audit Event catalog and restricted query capability.

---

## DEC-215

### Status

Accepted

### Title

ContentOS 使用版本化 Retention Policy 管理不同数据生命周期

### Decision

Artifact Versions, Approvals, Raw Outputs, Previews, temporary files, logs, Backups, and Exports use different retention rules.

Relevant objects or Runs reference the applicable Retention Policy Version.

### Reason

Keeping all data forever expands privacy and cost risk, while deleting all data quickly breaks versioning and audit.

### Impact

Exact retention durations are defined during deployment planning and evaluation.

---

## DEC-216

### Status

Accepted

### Title

Archive、Delete Request 与 Purge 使用不同语义

### Decision

Archive hides an object from active views while preserving history.

Delete Request initiates impact analysis and confirmation.

Purge removes active database, Object Storage, derived files, cache, indexes, and Share access.

These states are not represented by one generic `deleted` Boolean.

### Reason

Normal content management and permanent data removal have different scope, risk, and recovery requirements.

### Impact

Deletion requires a dedicated workflow, status model, audit, and failure-recovery process.

---

## DEC-217

### Status

Accepted

### Title

永久删除使用 Dependency-aware 异步清除流程

### Decision

Deleting a Content Package calculates and removes its complete owned and derived data scope, including:

- Source
- Artifact
- Human Opinion
- Asset
- Render
- Export
- Raw Output
- Cache
- Search Index
- Share

Shared resources and objects still referenced elsewhere are not deleted incorrectly.

### Reason

Deleting only the Package record does not remove the complete data footprint.

### Impact

ContentOS requires Deletion Request, Deletion Job, Deletion Ledger, dependency analysis, and minimal Tombstone.

---

## DEC-218

### Status

Accepted

### Title

Backup Restore 必须重新应用 Deletion Ledger

### Decision

Deleted data becomes unavailable in the active system after Purge and expires from Backups according to Backup Retention.

Every Backup Restore reapplies the Deletion Ledger before the restored system becomes active.

### Reason

Historical Backups cannot normally be rewritten immediately for every deletion request.

### Impact

Backup, Restore, and Purge share a coordinated data-deletion recovery process.

---

## DEC-219

### Status

Accepted

### Title

Export、User Data Export 与 Public Share 是三个独立能力

### Decision

Publishing Export creates a platform delivery package.

User Data Export exports the user’s ContentOS data.

Public Share grants a third party scoped read access to an exact Version or Export.

These capabilities do not trigger one another automatically.

### Reason

They have different audiences, data scopes, permission models, and revocation semantics.

### Impact

The MVP may implement Publishing Export first while deferring Public Share and full User Data Export UX.

---

## DEC-220

### Status

Accepted

### Title

新增高风险能力必须通过专门安全评审和对抗测试

### Decision

A dedicated security review is required before introducing:

- New Agent Tool
- New Provider
- New file format
- Public Share
- Automatic publishing
- OAuth
- Webhook
- External search
- Database-query capability
- Shell or code execution
- Multi-user collaboration

The MVP test plan includes authentication, authorization, Prompt Injection, SSRF, upload safety, Secret leakage, log redaction, Export safety, and deletion testing.

### Reason

These features alter the system’s trust boundaries and attack surface.

### Impact

Security review and adversarial tests become formal delivery gates.
