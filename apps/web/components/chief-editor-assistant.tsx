'use client';

import { ArrowUp, Plus } from '@phosphor-icons/react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  assistantStatusCopy,
  deriveChiefEditorAssistantReply,
  deriveChiefEditorAssistantView,
} from '../lib/chief-editor-assistant-view';
import type { WorkspaceStageId, WorkspaceStageView } from '../lib/workspace-stage-view';
import type { WorkspacePrimaryAction } from './workspace-action-context';

interface LocalMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export function ChiefEditorAssistant({
  packageTitle,
  stageId,
  stageTitle,
  stage,
  action,
  facts,
  active,
  onOpenActivity,
  onArchive,
}: {
  readonly packageTitle: string;
  readonly stageId: WorkspaceStageId;
  readonly stageTitle: string;
  readonly stage: WorkspaceStageView;
  readonly action: WorkspacePrimaryAction | null;
  readonly facts: readonly { readonly label: string; readonly value: string }[];
  readonly active: boolean;
  readonly onOpenActivity: () => void;
  readonly onArchive: () => void;
}) {
  const titleId = useId();
  const inputId = useId();
  const actionReasonId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<readonly LocalMessage[]>([]);
  const viewInput = useMemo(
    () => ({ packageTitle, stageId, stageTitle, stage, actionLabel: action?.label }),
    [action?.label, packageTitle, stage, stageId, stageTitle],
  );
  const view = useMemo(() => deriveChiefEditorAssistantView(viewInput), [viewInput]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages]);

  function appendExchange(prompt: string): void {
    const content = prompt.trim();
    if (!content) return;
    setMessages((current) => {
      const nextIndex = current.length;
      return [
        ...current,
        { id: `user-${nextIndex}`, role: 'user', content },
        {
          id: `assistant-${nextIndex + 1}`,
          role: 'assistant',
          content: deriveChiefEditorAssistantReply(viewInput, content),
        },
      ];
    });
    setDraft('');
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    appendExchange(draft);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      appendExchange(draft);
    }
  }

  function prepareContextNote(): void {
    setDraft((current) => current || '补充说明：');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <aside className="workspace-context-panel chief-editor-assistant" aria-labelledby={titleId}>
      <header className="assistant-header">
        <p className="assistant-package-line">
          <span aria-hidden="true" /> 当前 Package
        </p>
        <h2 id={titleId}>主编助手</h2>
        <p className="assistant-context-line">{view.contextLine}</p>
        <p className={`assistant-status status-${stage.status}`}>
          {assistantStatusCopy(stage.status)} · {stage.reason}
        </p>
        {facts.length ? (
          <dl className="assistant-context-facts" aria-label="当前依赖与版本">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      <div ref={threadRef} className="assistant-thread" role="log" aria-live="polite" aria-relevant="additions text">
        <article className="assistant-turn assistant-turn-assistant">
          <p>{view.openingMessage}</p>
        </article>
        {messages.map((message) => (
          <article
            key={message.id}
            className={`assistant-turn assistant-turn-${message.role}`}
            data-message-role={message.role}
          >
            <p>{message.content}</p>
          </article>
        ))}
        <div className="assistant-suggestions" aria-label="本地对话建议">
          {view.suggestions.map((item) => (
            <button key={item.id} type="button" onClick={() => appendExchange(item.prompt)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="assistant-product-action">
        <div>
          <p className="eyebrow">明确产品操作</p>
          <p id={actionReasonId}>{action?.reason ?? stage.reason}</p>
        </div>
        {action ? (
          <button
            className="primary-button next-action-button"
            type="button"
            aria-describedby={actionReasonId}
            disabled={action.disabled || action.busy}
            onClick={action.onAction}
          >
            {action.busy ? '处理中…' : action.label}
          </button>
        ) : null}
      </div>

      <div className="assistant-utility-actions">
        <button className="text-button" type="button" onClick={onOpenActivity}>
          运行记录
        </button>
        {active ? (
          <button className="danger-text-button" type="button" onClick={onArchive}>
            归档项目
          </button>
        ) : (
          <span>项目已归档，只读保留。</span>
        )}
      </div>

      <form className="assistant-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor={inputId}>
          给主编助手的本地消息
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          rows={2}
          value={draft}
          placeholder="询问主编，或说明你想怎样修改…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <div className="assistant-composer-controls">
          <button
            className="assistant-icon-button"
            type="button"
            aria-label="添加本地上下文说明"
            onClick={prepareContextNote}
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
          </button>
          <span>本地受控预览 · 不调用真实模型</span>
          <button className="assistant-send-button" type="submit" aria-label="发送本地消息" disabled={!draft.trim()}>
            <ArrowUp size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </form>
    </aside>
  );
}
