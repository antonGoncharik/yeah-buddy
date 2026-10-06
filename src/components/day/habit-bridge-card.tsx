"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  habitBridgeLead,
  type HabitBridgeSnapshot,
} from "@/lib/retention/habit-bridge";
import { cn } from "@/lib/utils";

export function HabitBridgeCard({
  snapshot,
  compact = false,
}: {
  snapshot: HabitBridgeSnapshot;
  compact?: boolean;
}) {
  const lead = habitBridgeLead(snapshot);

  return (
    <section
      className={cn(
        "card-surface flex flex-col border border-border/80",
        compact ? "gap-2 px-4 py-3" : "gap-3 px-5 py-4",
      )}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Вторая половина месяца
        </p>
        <p className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
          Неделя в цифрах
        </p>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{lead}</p>
      </div>

      <ul className="text-sm leading-snug text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Еда · </span>
          {snapshot.foodDaysWeek} из 7 дней с записью
        </li>
        <li>
          <span className="font-medium text-foreground">Белок · </span>
          {snapshot.proteinHitDaysWeek} дней в цели
        </li>
        <li>
          <span className="font-medium text-foreground">Зал · </span>
          {snapshot.gymSessionsWeek} тренировок за 7 дней
        </li>
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/today/week"
          className={cn(buttonVariants({ variant: "secondary" }), "h-12 flex-1 text-base")}
        >
          Неделя
        </Link>
        {snapshot.reviewReady ? (
          <Link
            href="/progress"
            className={cn(buttonVariants({ variant: "default" }), "h-12 flex-1 text-base")}
          >
            Как прошло
          </Link>
        ) : null}
      </div>
    </section>
  );
}
