"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { MeterBar } from "@/components/ui/meter-bar";
import { formatBodyWeight } from "@/lib/day/body-weight";
import { todayHistoryDayHref } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { CATCH_UP_MARK } from "@/lib/messages";
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
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  return (
    <Link
      href={todayHistoryDayHref(item.date, fromSettings)}
      className={cn(
        "card-surface flex items-center gap-3 px-5 transition-colors hover:bg-muted/40",
        compact ? "py-3" : "py-4",
      )}
    >
      <MarkBadge className="size-9 rounded-xl">
        {item.is_training_day ? <DumbbellDoodle /> : <CookieDoodle />}
      </MarkBadge>
      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          compact ? "gap-1" : "gap-3",
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base font-medium">
            {formatIsoDate(item.date, "EEEE, d MMMM")}
          </span>
          <span className="text-sm text-muted-foreground">
            {item.is_training_day
              ? DAY_TYPE_LABELS.training
              : DAY_TYPE_LABELS.rest}
            {item.caught_up ? ` · ${CATCH_UP_MARK}` : null}
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
          {item.waist_cm == null
            ? null
            : ` · ${formatBodyWeight(item.waist_cm)} см`}
        </p>
        {compact ? null : (
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
        )}
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
    <MeterBar
      ratio={Math.max(ratio, fact > 0 ? 0.04 : 0)}
      barClass={barClass}
      overflow={overflow}
      size="sm"
    />
  );
}
