'use client';

import { createContext, type Dispatch, type SetStateAction, useContext, useEffect, useMemo, useRef } from 'react';

export interface WorkspacePrimaryAction {
  readonly label: string;
  readonly reason: string;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly onAction: () => void;
}

export const WorkspaceActionRegistrationContext = createContext<Dispatch<
  SetStateAction<WorkspacePrimaryAction | null>
> | null>(null);

export function useWorkspacePrimaryAction(action: WorkspacePrimaryAction | null): void {
  const register = useContext(WorkspaceActionRegistrationContext);
  const callbackRef = useRef(action?.onAction);
  const label = action?.label;
  const reason = action?.reason;
  const disabled = action?.disabled;
  const busy = action?.busy;
  useEffect(() => {
    callbackRef.current = action?.onAction;
  }, [action?.onAction]);
  const stable = useMemo<WorkspacePrimaryAction | null>(
    () =>
      label !== undefined && reason !== undefined && disabled !== undefined && busy !== undefined
        ? {
            label,
            reason,
            disabled,
            busy,
            onAction: () => callbackRef.current?.(),
          }
        : null,
    [busy, disabled, label, reason],
  );

  useEffect(() => {
    register?.(stable);
    return () => register?.(null);
  }, [register, stable]);
}
