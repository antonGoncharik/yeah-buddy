"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function SessionSetDoneButton({
  done,
  label,
  onClick,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center"
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full border-2",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/45",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
