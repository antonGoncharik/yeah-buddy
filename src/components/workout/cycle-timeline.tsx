"use client";

import { cn } from "@/lib/utils";
import type { CycleTimelineStep } from "@/lib/workout/hints";

export function CycleTimeline({ steps }: { steps: CycleTimelineStep[] }) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              step.state === "current"
                ? "bg-primary/12 font-medium text-primary"
                : step.state === "completed"
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted/60 text-muted-foreground",
            )}
          >
            {step.name}
          </span>
        </li>
      ))}
    </ol>
  );
}
