"use client";

import { useEffect, useId, useRef } from "react";

export function SheetFrame({
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
