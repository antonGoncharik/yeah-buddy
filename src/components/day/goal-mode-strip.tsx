"use client";

import {
  BARBELL_VIEWBOX,
  BarbellMark,
  Doodle,
} from "@/components/layout/doodles";
import { goalModeLine } from "@/lib/flavor";
import type { UserGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GoalModeStrip({
  goal,
  date,
}: {
  goal: UserGoal | null;
  date: string;
}) {
  const line = goalModeLine(goal, date);
  if (line == null || (goal !== "lose" && goal !== "gain")) {
    return null;
  }

  const cut = goal === "lose";

  return (
    <div
      className={cn(
        "animate-rise flex items-center gap-3 px-4 py-3",
        cut ? "goal-cut" : "goal-bulk",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          cut ? "goal-cut-mark" : "goal-bulk-mark",
        )}
      >
        <Doodle className="h-5 w-10" viewBox={BARBELL_VIEWBOX}>
          <BarbellMark plates={cut ? 1 : 3} extra={!cut} />
        </Doodle>
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            cut ? "goal-cut-ink" : "goal-bulk-ink",
          )}
        >
          {cut ? "Сушка" : "Набор"}
        </p>
        <p className="text-base leading-snug">{line}</p>
      </div>
    </div>
  );
}
