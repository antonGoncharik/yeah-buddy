"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatBodyWeight } from "@/lib/day/body-weight";
import { todayHistoryDayHref } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { DAY_TYPE_LABELS, formatKcal } from "@/lib/nutrition";
import type { DayHistoryRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NutritionHistoryDayRow({
  item,
  fromSettings,
}: {
  item: DayHistoryRow;
  fromSettings: boolean;
}) {
  return (
    <Link
      href={todayHistoryDayHref(item.date, fromSettings)}
      className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base font-medium">
            {formatIsoDate(item.date, "EEEE, d MMMM")}
          </span>
          <span className="text-sm text-muted-foreground">
            {item.is_training_day
              ? DAY_TYPE_LABELS.training
              : DAY_TYPE_LABELS.rest}
          </span>
        </div>
        <p className="text-sm">
          {formatKcal(item.fact_kcal)}
          <span className="text-muted-foreground">
            {" "}
            / {formatKcal(item.target_kcal)} ккал
          </span>
          {item.body_weight == null
            ? null
            : ` · ${formatBodyWeight(item.body_weight)} кг`}
        </p>
        <div className="flex flex-col gap-1.5">
          <MiniBar
            fact={item.fact_protein}
            plan={item.target_protein}
            barClass="bg-[var(--macro-protein)]"
          />
          <MiniBar
            fact={item.fact_fat}
            plan={item.target_fat}
            barClass="bg-[var(--macro-fat)]"
          />
          <MiniBar
            fact={item.fact_carbs}
            plan={item.target_carbs}
            barClass="bg-[var(--macro-carbs)]"
          />
        </div>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

function MiniBar({
  fact,
  plan,
  barClass,
}: {
  fact: number;
  plan: number;
  barClass: string;
}) {
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;
  const overflow = plan > 0 && fact > plan;

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-[width,opacity] duration-500 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          barClass,
          overflow && "opacity-90",
        )}
        style={{ width: `${Math.max(ratio * 100, fact > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}
