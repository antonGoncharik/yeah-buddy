"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { NutritionHistoryDayRow } from "@/components/day/nutrition-history-day-row";
import { NutritionHistoryStats } from "@/components/day/nutrition-history-stats";
import { NutritionTrendChart } from "@/components/day/nutrition-trend-chart";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { calendarToday } from "@/lib/day/dates";
import { groupByMonth } from "@/lib/day/format";
import { parseDayHistoryPayload } from "@/lib/day/map";
import { NUTRITION_HISTORY_EMPTY, REVIEW_CTA_HINT } from "@/lib/messages";
import {
  chronological,
  hasOlderThanRange,
  isNutritionRange,
  type NutritionMetric,
  nutritionHits,
  proteinPerKgStats,
  splitAverages,
  windowDays,
} from "@/lib/nutrition-stats";
import {
  HISTORY_RANGE_OPTIONS,
  useCursorHistory,
} from "@/lib/use-cursor-history";

type RangeId = "14" | "30";

const METRIC_OPTIONS: Array<{ id: NutritionMetric; label: string }> = [
  { id: "protein", label: "Б" },
  { id: "fat", label: "Ж" },
  { id: "carbs", label: "У" },
  { id: "kcal", label: "ккал" },
];

export function NutritionHistoryScreen() {
  const today = calendarToday();
  const fromSettings = useSearchParams().get("from") === "settings";
  const { items, nextBefore, loading, loadingMore, error, load } =
    useCursorHistory("/api/days/history", parseDayHistoryPayload);
  const [range, setRange] = useState<RangeId>("14");
  const [metric, setMetric] = useState<NutritionMetric>("protein");

  const parsedRange = Number(range);
  const rangeDays = isNutritionRange(parsedRange) ? parsedRange : 14;
  const windowed = useMemo(
    () => windowDays(items, rangeDays, today),
    [items, rangeDays, today],
  );
  const averages = useMemo(() => splitAverages(windowed), [windowed]);
  const hits = useMemo(() => nutritionHits(windowed), [windowed]);
  const perKg = useMemo(() => proteinPerKgStats(windowed), [windowed]);
  const chartDays = useMemo(() => chronological(windowed), [windowed]);
  const groups = useMemo(
    () => groupByMonth(items, (item) => item.date),
    [items],
  );
  const showStats = !loading && windowed.length > 0;
  const showRange = hasOlderThanRange(items, 14, today);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="История еды"
        backHref={fromSettings ? "/settings" : "/today"}
      />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && items.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <section className="card-surface animate-rise px-5 py-5">
            <p className="text-lg font-medium">{NUTRITION_HISTORY_EMPTY}</p>
          </section>
        ) : null}

        {showStats && showRange ? (
          <div className="animate-rise">
            <Segmented
              value={range}
              options={HISTORY_RANGE_OPTIONS}
              onChange={setRange}
            />
          </div>
        ) : null}

        {showStats ? (
          <NutritionHistoryStats
            days={rangeDays}
            count={windowed.length}
            rest={averages.rest}
            training={averages.training}
            hits={hits}
            perKg={perKg}
          />
        ) : null}

        {showStats ? (
          <Link
            href="/settings/review?from=food"
            className="card-surface animate-rise flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">Как прошло</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {REVIEW_CTA_HINT}
              </span>
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ) : null}

        {showStats && chartDays.length >= 2 ? (
          <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
            <Segmented
              value={metric}
              options={METRIC_OPTIONS}
              onChange={setMetric}
            />
            <NutritionTrendChart
              key={`${range}-${metric}`}
              days={chartDays}
              metric={metric}
            />
          </section>
        ) : null}

        {!loading && groups.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium capitalize text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.date}>
                      <NutritionHistoryDayRow
                        item={item}
                        fromSettings={fromSettings}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {nextBefore ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-base"
            disabled={loadingMore}
            onClick={() => void load(nextBefore)}
          >
            {loadingMore ? "Загрузка…" : "Ещё"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
