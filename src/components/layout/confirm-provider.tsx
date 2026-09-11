"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { haptic } from "@/lib/telegram/haptic";

export interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
  defaultValue?: string;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;
type PromptFn = (options: PromptOptions) => Promise<string | null>;

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

function ConfirmSheet({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <SheetFrame title={options.message} onCancel={onCancel}>
      <Button
        type="button"
        variant={options.destructive ? "destructive" : "default"}
        className="h-14 text-lg"
        onClick={onConfirm}
      >
        {options.confirmLabel ?? "Да"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={onCancel}
      >
        {options.cancelLabel ?? "Оставить"}
      </Button>
    </SheetFrame>
  );
}

function PromptSheet({
  options,
  onConfirm,
  onCancel,
}: {
  options: PromptOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(options.defaultValue ?? "");
  const trimmed = value.trim();

  return (
    <SheetFrame title={options.message} onCancel={onCancel}>
      <Input
        autoFocus
        value={value}
        placeholder={options.placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && trimmed !== "") {
            event.preventDefault();
            onConfirm(trimmed);
          }
        }}
        className="h-12 text-base"
      />
      <Button
        type="button"
        className="h-14 text-lg"
        disabled={trimmed === ""}
        onClick={() => onConfirm(trimmed)}
      >
        {options.confirmLabel ?? "Сохранить"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={onCancel}
      >
        {options.cancelLabel ?? "Отмена"}
      </Button>
    </SheetFrame>
  );
}

function SheetFrame({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[var(--app-chrome-bottom)] sm:items-center sm:pb-0">
      <button
        type="button"
        className="absolute inset-0 animate-fade bg-black/45"
        aria-label="Закрыть"
        onClick={onCancel}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-surface animate-rise relative z-10 mx-auto w-full max-w-lg rounded-t-[1.75rem] px-5 pt-3 pb-[calc(1.25rem+var(--app-safe-bottom))] outline-none sm:mb-10 sm:rounded-[1.75rem] sm:pt-6"
      >
        <div
          aria-hidden
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25 sm:hidden"
        />
        <p id={titleId} className="text-lg font-medium leading-snug">
          {title}
        </p>
        <div className="mt-5 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
