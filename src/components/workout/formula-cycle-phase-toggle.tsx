"use client";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function FormulaCyclePhaseToggle({
  on,
  label,
  hint,
  onClick,
}: {
  on: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-left"
      onClick={() => {
        haptic("tap");
        onClick();
      }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
            on ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
