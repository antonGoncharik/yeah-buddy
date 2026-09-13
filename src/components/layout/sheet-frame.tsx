"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export function SheetFrame({
  title,
  label,
  onCancel,
  children,
}: {
  title?: string;
  label?: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const accessibleName = title ?? label ?? "Меню";

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

  const frame = (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(var(--app-chrome-bottom)+var(--app-nav-clearance))] sm:items-center sm:pb-0">
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
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : accessibleName}
        tabIndex={-1}
        className="card-surface animate-rise relative z-10 mx-auto max-h-[min(32rem,calc(100dvh-var(--app-chrome-bottom)-var(--app-nav-clearance)-1.5rem))] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] px-5 py-5 outline-none sm:mb-10 sm:max-h-[min(32rem,calc(100dvh-3rem))] sm:rounded-[1.75rem] sm:pt-6"
      >
        {title ? (
          <p id={titleId} className="text-lg font-medium leading-snug">
            {title}
          </p>
        ) : null}
        <div
          className={title ? "mt-5 flex flex-col gap-2" : "flex flex-col gap-2"}
        >
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return frame;
  }

  return createPortal(frame, document.body);
}
