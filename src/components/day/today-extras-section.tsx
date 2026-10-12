"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TITLE = "Ещё на сегодня";

export function TodayExtrasSection({
  children,
  defaultOpen = false,
  className,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "card-surface group animate-rise overflow-hidden rounded-2xl",
        className,
      )}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold">
        {TITLE}
        <span
          aria-hidden
          className="text-xl font-normal text-muted-foreground transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4">
        {children}
      </div>
    </details>
  );
}
