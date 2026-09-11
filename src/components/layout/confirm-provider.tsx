"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { ConfirmSheet } from "@/components/layout/confirm-sheet";
import type {
  ConfirmFn,
  ConfirmOptions,
  PromptFn,
  PromptOptions,
} from "@/components/layout/confirm-types";
import { PromptSheet } from "@/components/layout/prompt-sheet";
import { haptic } from "@/lib/telegram/haptic";

export type {
  ConfirmOptions,
  PromptOptions,
} from "@/components/layout/confirm-types";

const ConfirmContext = createContext<ConfirmFn | null>(null);
const PromptContext = createContext<PromptFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return confirm;
}

export function usePrompt(): PromptFn {
  const prompt = useContext(PromptContext);
  if (!prompt) {
    throw new Error("usePrompt must be used within ConfirmProvider");
  }
  return prompt;
}

interface PendingConfirm {
  kind: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface PendingPrompt {
  kind: "prompt";
  options: PromptOptions;
  resolve: (value: string | null) => void;
}

type Pending = PendingConfirm | PendingPrompt;

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const dismissPending = useCallback(() => {
    const current = pendingRef.current;
    if (!current) {
      return;
    }
    if (current.kind === "confirm") {
      current.resolve(false);
    } else {
      current.resolve(null);
    }
    pendingRef.current = null;
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (input) => {
      const options = typeof input === "string" ? { message: input } : input;
      if (options.destructive) {
        haptic("warn");
      }
      return new Promise<boolean>((resolve) => {
        dismissPending();
        const next: PendingConfirm = { kind: "confirm", options, resolve };
        pendingRef.current = next;
        setPending(next);
      });
    },
    [dismissPending],
  );

  const prompt = useCallback<PromptFn>(
    (options) => {
      return new Promise<string | null>((resolve) => {
        dismissPending();
        const next: PendingPrompt = { kind: "prompt", options, resolve };
        pendingRef.current = next;
        setPending(next);
      });
    },
    [dismissPending],
  );

  const closeConfirm = useCallback((value: boolean) => {
    const current = pendingRef.current;
    if (current?.kind !== "confirm") {
      return;
    }
    current.resolve(value);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const closePrompt = useCallback((value: string | null) => {
    const current = pendingRef.current;
    if (current?.kind !== "prompt") {
      return;
    }
    current.resolve(value);
    pendingRef.current = null;
    setPending(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      <PromptContext.Provider value={prompt}>
        {children}
        {pending?.kind === "confirm" ? (
          <ConfirmSheet
            options={pending.options}
            onConfirm={() => closeConfirm(true)}
            onCancel={() => closeConfirm(false)}
          />
        ) : null}
        {pending?.kind === "prompt" ? (
          <PromptSheet
            options={pending.options}
            onConfirm={(value) => closePrompt(value)}
            onCancel={() => closePrompt(null)}
          />
        ) : null}
      </PromptContext.Provider>
    </ConfirmContext.Provider>
  );
}
