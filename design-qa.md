# V0.3-UX-001 Design QA

**Result:** passed
**Source:** Figma file `rB3oxJO3aBlGGmgY5E4PpE`, frames `2:3`, `24:2`, `24:89`
**Implementation:** branch `codex/v0-3-ux-001` on `main@3904bebbf257ded57ba45f2db0088c23330cdf61`
**Browser:** repository Playwright Chromium harness, Node.js 24.18.0

## Evidence

| State / viewport              | Reference                                                 | Implementation                                                                 | Comparison                                                        |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Blog 待审核，1440 × 1024      | `/private/tmp/contentos-v0-3-design-qa/figma-state-1.png` | `/private/tmp/contentos-v0-3-design-qa/assistant-state-blog-review-1440.png`   | `/private/tmp/contentos-v0-3-design-qa/compare-final-state-1.png` |
| 一条本地用户消息，1440 × 1024 | `/private/tmp/contentos-v0-3-design-qa/figma-state-2.png` | `/private/tmp/contentos-v0-3-design-qa/assistant-state-local-message-1440.png` | `/private/tmp/contentos-v0-3-design-qa/compare-final-state-2.png` |
| Blog 已批准，1440 × 1024      | `/private/tmp/contentos-v0-3-design-qa/figma-state-3.png` | `/private/tmp/contentos-v0-3-design-qa/assistant-state-blog-approved-1440.png` | `/private/tmp/contentos-v0-3-design-qa/compare-final-state-3.png` |
| Responsive 1024               | n/a（沿用同一 Figma 面板结构）                            | `/private/tmp/contentos-v0-3-design-qa/chief-editor-assistant-1024.png`        | 人工检查                                                          |
| Responsive 720                | n/a（沿用同一 Figma 面板结构）                            | `/private/tmp/contentos-v0-3-design-qa/chief-editor-assistant-720.png`         | 人工检查                                                          |

Figma 与实现均按精确 `1440 × 1024`、1× CSS pixel 检查；实现三态使用 `fullPage=false` 的同视口截图。三张实现图来自匹配的产品阶段或本地消息状态；第二态只验证非权威本地消息的视觉与交互，不伪造不存在的产品 diff 命令。`24:2` 的“查看差异 / 应用候选”安全语义另由纯函数测试固定，任何同名建议仍不能调用产品动作。

## Comparison history

1. **Iteration 1 — P2 persistent controls below the initial desktop fold.** V0.2 项目头比 Figma 样板更高，首版沿用 `100dvh - 48px` 后，composer 在 1440/1024 初始视口下需要页面滚动。修正为基于当前壳层高度的 bounded/clamped panel height，并保留消息区内部滚动。
2. **Iteration 2 — P2 latest assistant reply not visible after submit.** 本地消息正确追加，但首版未把内部消息区滚动到最新 turn。修正为消息变化后只滚动 assistant thread，不移动页面焦点或触发产品动作。
3. **Iteration 3 — P2 evidence viewport mismatch.** 初始 QA 记录错误地把 `1440 × 900` viewport 的 full-page capture 描述为与 Figma `1440 × 1024` 同视口。修正 Browser 证据为精确 `1440 × 1024`、`fullPage=false`，重新导出并逐态并排比较。
4. **Iteration 4 — final comparison.** 1440 三态均保留连续浅色画布、开放助手回复、右对齐用户气泡、紧凑建议、独立产品动作和双行 composer；1024/720 的操作与 composer 持续可见，无页面横向溢出。无 P0/P1/P2。

## Intentional product adaptations

- 保留 V0.2 的全局壳、横向阶段导航、288px 桌面上下文列和暖纸/深绿视觉语言；未复制 Figma 中已经被 V0.2 取代的左侧阶段 rail。
- Header 比视觉样板更密集，因为本 Work Item 必须保留权威状态原因以及依赖/版本事实；这些信息使用紧凑 definition list 呈现，不恢复旧大卡片层级。
- 产品主操作独立标记为“明确产品操作”；chat submit、建议 chip、添加上下文按钮均只改变页面内 React state。
- 图标来自 `@phosphor-icons/react@2.1.10`；没有 inline SVG、CSS 图标、emoji 或文本 glyph 伪装图标。

## Interaction and accessibility checks

- 精确一个 composer；空白发送 disabled；Enter 发送；Shift+Enter 换行；IME composing 不提交。
- 用户消息右对齐，助手回复开放显示；`role=log` + `aria-live=polite`；textarea、添加、发送和建议均有可访问名称。
- 建议与 chat submit 的 API mutation count 为 0；只有单独显式产品按钮调用现有 `contextAction.onAction`。
- 本地回复明确“不持久化 / 不调用真实模型”；loading、blocked、outdated 使用现有投影原因，不承诺不可用动作。
- 1440、1024、720 的 `documentElement.scrollWidth <= clientWidth`；persistent action/composer 可见；720 为单列上下文优先布局。
- Drawer 关闭后的资料新增行焦点契约保留；新增助手不会抢占成功操作后的焦点。

## Final result

**passed** — final comparison has no P0, P1, or P2 finding. No Provider, Agent Runtime, API, Domain, persistence, credential, paid-call, or product-data action was introduced or exercised by design QA.
