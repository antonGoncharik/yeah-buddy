"use client";

import { Flame } from "lucide-react";

import { MarkBadge } from "@/components/layout/mark-badge";
import {
  earlyHabitFoodMilestone,
  earlyHabitLead,
  foodStreakLabel,
  type EarlyHabitSnapshot,
} from "@/lib/retention/habit";
import { cn } from "@/lib/utils";

export function EarlyHabitCard({
  snapshot,
  compact = false,
  showGymLine = true,
}: {
  snapshot: EarlyHabitSnapshot;
  compact?: boolean;
  showGymLine?: boolean;
}) {
  const foodMilestone = earlyHabitFoodMilestone(snapshot.foodLogStreak);
  const lead = earlyHabitLead(snapshot);

  return (
    <section
      className={cn(
        "card-surface flex flex-col border border-primary/15 bg-primary/5",
        compact ? "gap-2 px-4 py-3" : "gap-3 px-5 py-4",
      )}
    >
      <div className="flex items-start gap-3">
        <MarkBadge className="size-9 shrink-0 rounded-xl bg-primary/15 text-primary">
          <Flame className="size-5" aria-hidden />
        </MarkBadge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            День {snapshot.dayOfHabit} из 14
          </p>
          <p className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
            Привычка
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {lead}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2 text-sm leading-snug">
        <li>
          <span className="font-medium text-foreground">Еда · </span>
          <span className="text-muted-foreground">
            {foodStreakLabel(snapshot.foodLogStreak, snapshot.foodAtRisk)}
          </span>
        </li>
        {snapshot.proteinLine ? (
          <li>
            <span className="font-medium text-foreground">Белок · </span>
            <span className="text-muted-foreground">{snapshot.proteinLine}</span>
          </li>
        ) : null}
        {showGymLine ? (
          <li>
            <span className="font-medium text-foreground">Зал · </span>
            <span className="text-muted-foreground">
              {snapshot.gymSessionsWeek > 0
                ? `${snapshot.gymSessionsWeek} тренировок за 7 дней`
                : "Пока без записей — когда будешь готов, очередь в Тренировках."}
            </span>
          </li>
        ) : null}
      </ul>

      {foodMilestone ? (
        <p className="text-base font-medium text-foreground">{foodMilestone}</p>
      ) : null}
    </section>
  );
}
