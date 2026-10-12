"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { UndoToast } from "@/components/layout/undo-toast";

const UNDO_MS = 5_000;

type UndoAction = {
  message: string;
  actionLabel: string;
  onUndo: () => void | Promise<void>;
};

type ShowUndoFn = (action: UndoAction) => void;

const UndoContext = createContext<ShowUndoFn | null>(null);

export function useUndoToast(): ShowUndoFn {
  const show = useContext(UndoContext);
  if (!show) {
    throw new Error("useUndoToast must be used within UndoToastProvider");
  }
  return show;
}

export function UndoToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<UndoAction | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showUndo = useCallback<ShowUndoFn>(
    (action) => {
      clearTimer();
      setToast(action);
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, UNDO_MS);
    },
    [clearTimer],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <UndoContext.Provider value={showUndo}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-[30] mx-auto flex max-w-lg justify-center px-4"
          style={{
            bottom:
              "calc(var(--app-bottom-nav-block) + var(--app-fixed-bottom) + 0.75rem)",
          }}
        >
          <UndoToast
            message={toast.message}
            actionLabel={toast.actionLabel}
            onAction={() => {
              void (async () => {
                dismiss();
                await toast.onUndo();
              })();
            }}
          />
        </div>
      ) : null}
    </UndoContext.Provider>
  );
}
