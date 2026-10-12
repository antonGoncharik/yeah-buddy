"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UndoToast({
  message,
  actionLabel,
  onAction,
  className,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg",
        className,
      )}
      role="status"
    >
      <p className="min-w-0 text-sm leading-snug text-foreground">{message}</p>
      <Button
        type="button"
        variant="secondary"
        className="h-10 shrink-0 px-3 text-sm"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
