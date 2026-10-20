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
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const accessibleName = title ?? label ?? "Меню";

  useEffect(() => {
    const panel = panelRef.current;
    const field = panel?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled])",
    );
    if (field) {
      if (document.activeElement !== field) {
        field.focus();
      }
    } else if (document.activeElement !== panel) {
      panel?.focus();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const nodes = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const focusable = [...nodes].filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const frame = (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(var(--app-fixed-bottom)+var(--app-nav-clearance))] sm:items-center sm:pb-0">
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
        className="card-surface animate-rise relative z-10 mx-auto max-h-[min(32rem,calc(100dvh-var(--app-fixed-bottom)-var(--app-nav-clearance)-1.5rem))] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] px-5 py-5 outline-none sm:mb-10 sm:max-h-[min(32rem,calc(100dvh-3rem))] sm:rounded-[1.75rem] sm:pt-6"
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
