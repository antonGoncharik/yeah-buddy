"use client";

import { haptic } from "@/lib/telegram/haptic";
import type { SessionFeel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SESSION_FEEL_LABELS, SESSION_FEELS } from "@/lib/workout/labels";

export function SessionFeelPicker({
  value,
  disabled,
  onChange,
}: {
  value: SessionFeel | null;
  disabled?: boolean;
  onChange: (value: SessionFeel | null) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SESSION_FEELS.map((feel) => {
        const pressed = value === feel;
        return (
          <button
            key={feel}
            type="button"
            aria-pressed={pressed}
            disabled={disabled}
            className={cn(
              "h-12 rounded-xl border text-base font-medium transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.97] disabled:opacity-50",
              pressed
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
            onClick={() => {
              haptic("tick");
              onChange(pressed ? null : feel);
            }}
          >
            {SESSION_FEEL_LABELS[feel]}
          </button>
        );
      })}
    </div>
  );
}
