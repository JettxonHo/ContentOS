import { describe, expect, it } from 'vitest';

import {
  deriveChiefEditorAssistantReply,
  deriveChiefEditorAssistantView,
  type ChiefEditorAssistantViewInput,
} from './chief-editor-assistant-view';

const input = (overrides: Partial<ChiefEditorAssistantViewInput> = {}): ChiefEditorAssistantViewInput => ({
  packageTitle: 'AI 治理内容包',
  stageId: 'opinion-blog',
  stageTitle: '观点与文章',
  stage: {
    status: 'in_review',
    label: '待审核',
    nextAction: '审核文章候选',
    reason: '保存当前草稿，保存为不可变版本，再由你批准。',
  },
  actionLabel: '保存为版本',
  ...overrides,
});

describe('chief editor assistant view', () => {
  it('matches the in-review Blog state without claiming a product write', () => {
    const view = deriveChiefEditorAssistantView(input());
    expect(view.contextLine).toBe('观点与文章 · 待审核');
    expect(view.openingMessage).toContain('治理分工');
    expect(view.openingMessage).toContain('不会修改文章');
    expect(view.suggestions.map((item) => item.label)).toEqual(['强调治理分工', '强调落地执行']);
  });

  it('keeps review and apply semantics behind the explicit existing action', () => {
    const value = input({ actionLabel: '应用候选' });
    const view = deriveChiefEditorAssistantView(value);
    expect(view.openingMessage).toContain('Working Copy 才会变化');
    expect(view.suggestions.map((item) => item.label)).toEqual(['查看差异', '应用候选']);
    expect(deriveChiefEditorAssistantReply(value, '应用候选')).toContain('不会自动执行');
  });

  it('uses approved Blog and Xiaohongshu next-step copy without inventing generation', () => {
    const approved = deriveChiefEditorAssistantView(
      input({
        stage: { status: 'approved', label: '已批准', nextAction: '导出 article.md', reason: '精确版本有效。' },
        actionLabel: '导出 article.md',
      }),
    );
    expect(approved.openingMessage).toContain('已批准并锁定');

    const xhs = deriveChiefEditorAssistantView(
      input({
        stageId: 'xiaohongshu',
        stageTitle: '小红书',
        stage: { status: 'ready', label: '可开始', nextAction: '生成小红书候选', reason: '内容基础就绪。' },
        actionLabel: '生成小红书候选',
      }),
    );
    expect(xhs.openingMessage).toContain('当前小红书阶段状态已同步');
    expect(xhs.openingMessage).not.toContain('Blog 基础已经锁定');
    expect(xhs.suggestions.map((item) => item.label)).toEqual(['比较平台差异', '生成候选']);
  });

  it.each([
    ['loading', '状态明确前'],
    ['blocked', '不会承诺不可用的操作'],
    ['outdated', '历史版本仍会保留'],
  ] as const)('keeps %s copy truthful', (status, copy) => {
    const view = deriveChiefEditorAssistantView(
      input({
        stage: { status, label: status, nextAction: '等待', reason: '权威状态原因。' },
        actionLabel: undefined,
      }),
    );
    expect(view.openingMessage).toContain(copy);
    expect(view.openingMessage).toContain('权威状态原因');
  });

  it('returns deterministic local replies that never imply persistence', () => {
    expect(deriveChiefEditorAssistantReply(input(), '强调治理分工')).toContain('不会改写文章');
    expect(deriveChiefEditorAssistantReply(input(), '补充一个例子')).toContain('不会持久化');
  });

  it('does not present projected next-action copy as an executable action when none is registered', () => {
    const blocked = input({
      stage: { status: 'blocked', label: '未就绪', nextAction: '等待依赖', reason: '依赖尚未就绪。' },
      actionLabel: undefined,
    });
    expect(deriveChiefEditorAssistantReply(blocked, '说明下一步')).toContain('没有已注册的产品操作');
    expect(deriveChiefEditorAssistantReply(blocked, '生成候选')).toContain('没有已注册的产品操作');
    expect(deriveChiefEditorAssistantReply(blocked, '说明下一步')).not.toContain('当前可用');
  });
});
