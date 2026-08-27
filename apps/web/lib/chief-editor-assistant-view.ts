import type { WorkspaceStageId, WorkspaceStageStatus, WorkspaceStageView } from './workspace-stage-view';

export interface ChiefEditorAssistantSuggestion {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
}

export interface ChiefEditorAssistantViewInput {
  readonly packageTitle: string;
  readonly stageId: WorkspaceStageId;
  readonly stageTitle: string;
  readonly stage: WorkspaceStageView;
  readonly actionLabel?: string | undefined;
}

export interface ChiefEditorAssistantView {
  readonly contextLine: string;
  readonly openingMessage: string;
  readonly suggestions: readonly ChiefEditorAssistantSuggestion[];
}

function suggestion(id: string, label: string, prompt = label): ChiefEditorAssistantSuggestion {
  return { id, label, prompt };
}

function isDiffAction(label: string | undefined): boolean {
  return Boolean(label && /(查看差异|应用候选|差异)/u.test(label));
}

export function deriveChiefEditorAssistantView(input: ChiefEditorAssistantViewInput): ChiefEditorAssistantView {
  const { stage, stageId, stageTitle, actionLabel } = input;
  const contextLine = `${stageTitle} · ${stage.label}`;

  if (stage.status === 'loading') {
    return {
      contextLine,
      openingMessage: `${stage.reason} 状态明确前，我不会建议或触发任何产品操作。`,
      suggestions: [suggestion('explain-loading', '说明正在读取什么')],
    };
  }

  if (stage.status === 'blocked') {
    return {
      contextLine,
      openingMessage: `当前阶段未就绪：${stage.reason} 我不会承诺不可用的操作。`,
      suggestions: [suggestion('explain-blocked', '解释未就绪原因')],
    };
  }

  if (stage.status === 'outdated') {
    return {
      contextLine,
      openingMessage: `当前内容需要更新：${stage.reason} 历史版本仍会保留，更新必须通过下方明确操作完成。`,
      suggestions: [suggestion('explain-outdated', '解释需更新原因'), suggestion('show-next-action', '说明明确下一步')],
    };
  }

  if (isDiffAction(actionLabel)) {
    return {
      contextLine,
      openingMessage: `候选与当前草稿存在待判断差异。只有你完成审阅并点击下方明确的“${actionLabel}”后，Working Copy 才会变化。`,
      suggestions: [suggestion('review-diff', '查看差异'), suggestion('explain-apply', '应用候选')],
    };
  }

  if (stageId === 'opinion-blog' && stage.status === 'in_review') {
    return {
      contextLine,
      openingMessage:
        '我已经读完当前已批准的 Research。你希望这篇文章更强调治理分工，还是落地执行？这里的讨论只用于本页审阅，不会修改文章。',
      suggestions: [suggestion('governance', '强调治理分工'), suggestion('execution', '强调落地执行')],
    };
  }

  if ((stageId === 'opinion-blog' && stage.status === 'approved') || stageId === 'xiaohongshu') {
    return {
      contextLine,
      openingMessage:
        stageId === 'opinion-blog'
          ? '当前精确版本已批准并锁定。可以比较 Blog 与小红书的表达差异；任何新候选仍需通过明确产品操作生成。'
          : `当前小红书阶段状态已同步：${stage.reason} 你可以先比较平台表达，再决定是否使用下方明确操作。`,
      suggestions: [suggestion('compare-platforms', '比较平台差异'), suggestion('explain-generate', '生成候选')],
    };
  }

  return {
    contextLine,
    openingMessage: `当前${stageTitle}状态为“${stage.label}”：${stage.reason} 我可以解释状态和下一步，但不会自动修改内容。`,
    suggestions: [suggestion('explain-status', '解释当前状态'), suggestion('explain-next', '说明下一步')],
  };
}

export function deriveChiefEditorAssistantReply(input: ChiefEditorAssistantViewInput, prompt: string): string {
  const normalized = prompt.trim();
  const action = input.actionLabel;

  if (/(应用候选|生成候选|生成新版|保存|批准|导出|发布)/u.test(normalized)) {
    return action
      ? `我不会自动执行“${normalized}”。只有你点击下方单独标记的“${action}”产品操作后，现有命令才会运行。`
      : `我不会自动执行“${normalized}”。当前没有已注册的产品操作；请等待权威状态和依赖就绪。`;
  }
  if (/差异/u.test(normalized)) {
    return '差异必须在现有审阅界面中查看和判断；这段本地对话不会替你应用候选，也不会改变 Working Copy。';
  }
  if (/治理分工/u.test(normalized)) {
    return '可以优先检查责任边界、规则适用对象和协同关系是否清楚。这里只给出审阅方向，不会改写文章。';
  }
  if (/落地执行/u.test(normalized)) {
    return '可以优先检查步骤、限制条件和可执行判断是否具体。这里只给出审阅方向，不会改写文章。';
  }
  if (/平台/u.test(normalized)) {
    return 'Blog 适合完整论证，小红书更依赖逐页功能分工。两者仍是独立候选、独立版本和独立人工批准。';
  }
  if (input.stage.status === 'blocked' || input.stage.status === 'outdated' || input.stage.status === 'loading') {
    return action
      ? `${input.stage.reason} 当前已注册的明确产品操作是“${action}”；本地对话不会绕过依赖或状态门。`
      : `${input.stage.reason} 当前没有已注册的产品操作；本地对话不会把投影提示当作可执行命令。`;
  }
  return action
    ? `我会把“${normalized}”作为本页审阅上下文保留。它不会持久化，也不会触发“${action}”或其他产品操作。`
    : `我会把“${normalized}”作为本页审阅上下文保留。它不会持久化，也不会触发任何产品操作。`;
}

export function assistantStatusCopy(status: WorkspaceStageStatus): string {
  return status === 'loading'
    ? '正在读取'
    : status === 'blocked'
      ? '未就绪'
      : status === 'outdated'
        ? '需更新'
        : '已同步';
}
