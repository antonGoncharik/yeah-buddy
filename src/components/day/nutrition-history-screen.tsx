"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NutritionTrendChart } from "@/components/day/nutrition-trend-chart";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, fetchJson } from "@/lib/api-cache";
import { todayHistoryDayHref } from "@/lib/day/dates";
import {
  LOAD_FAILED,
  NUTRITION_HISTORY_EMPTY,
  REVIEW_CTA_HINT,
} from "@/lib/messages";
import { DAY_TYPE_LABELS, formatKcal, formatMacro } from "@/lib/nutrition";
import {
  chronological,
  hasOlderThanRange,
  isNutritionRange,
  type MacroAverages,
  type NutritionHits,
  type NutritionMetric,
  type NutritionRange,
  nutritionHits,
  pluralDays,
  splitAverages,
  windowDays,
} from "@/lib/nutrition-stats";
import { isRecord, mapRecordList } from "@/lib/read";
import type { DayHistoryRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type RangeId = "14" | "30";

const RANGE_OPTIONS: Array<{ id: RangeId; label: string }> = [
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
];

const METRIC_OPTIONS: Array<{ id: NutritionMetric; label: string }> = [
  { id: "protein", label: "Б" },
  { id: "fat", label: "Ж" },
  { id: "carbs", label: "У" },
  { id: "kcal", label: "ккал" },
];

export function NutritionHistoryScreen() {
  const today = format(new Date(), "yyyy-MM-dd");
  const fromSettings = useSearchParams().get("from") === "settings";
  const [items, setItems] = useState<DayHistoryRow[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>("14");
  const [metric, setMetric] = useState<NutritionMetric>("protein");

  const load = useCallback(async (before?: string) => {
    const appending = Boolean(before);
    if (appending) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const query = before ? `?before=${encodeURIComponent(before)}` : "";
      const url = `/api/days/history${query}`;
      if (appending) {
        const data = await fetchJson(url);
        const page = readPage(data);
        setItems((current) => [...current, ...page.items]);
        setNextBefore(page.next_before);
      } else {
        await cachedGet(url, (data) => {
          const page = readPage(data);
          setItems(page.items);
          setNextBefore(page.next_before);
          return true;
        });
      }
    } catch {
      setError(LOAD_FAILED);
      if (!appending) {
        setItems([]);
        setNextBefore(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const parsedRange = Number(range);
  const rangeDays = isNutritionRange(parsedRange) ? parsedRange : 14;
  const windowed = useMemo(
    () => windowDays(items, rangeDays, today),
    [items, rangeDays, today],
  );
  const averages = useMemo(() => splitAverages(windowed), [windowed]);
  const hits = useMemo(() => nutritionHits(windowed), [windowed]);
  const chartDays = useMemo(() => chronological(windowed), [windowed]);
  const groups = useMemo(() => groupByMonth(items), [items]);
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
              options={RANGE_OPTIONS}
              onChange={setRange}
            />
          </div>
        ) : null}

        {showStats ? (
          <StatsCard
            days={rangeDays}
            count={windowed.length}
            rest={averages.rest}
            training={averages.training}
            hits={hits}
          />
        ) : null}

        {showStats ? (
          <Link
            href="/settings/review?from=food"
            className="card-surface animate-rise flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">
                Разбор еды и зала
              </span>
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
                      <Link
                        href={todayHistoryDayHref(item.date, fromSettings)}
                        className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-base font-medium">
                              {formatDay(item.date)}
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

function StatsCard({
  days,
  count,
  rest,
  training,
  hits,
}: {
  days: NutritionRange;
  count: number;
  rest: MacroAverages | null;
  training: MacroAverages | null;
  hits: NutritionHits;
}) {
  const showHits = hits.proteinTotal > 0 || hits.kcalTotal > 0;

  return (
    <section className="card-surface animate-rise flex flex-col gap-5 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {days} дней
      </p>
      <p className="text-3xl font-semibold tracking-tight">
        {count}
        <span className="ml-2 text-lg font-medium text-muted-foreground">
          {pluralDays(count)}
        </span>
      </p>
      {rest ? <TypeAverage label={DAY_TYPE_LABELS.rest} stats={rest} /> : null}
      {training ? (
        <TypeAverage label={DAY_TYPE_LABELS.training} stats={training} />
      ) : null}
      {showHits ? (
        <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
          <HitRow
            label="Белок дотянули"
            hit={hits.proteinHit}
            total={hits.proteinTotal}
            barClass="bg-[var(--macro-protein)]"
          />
          <HitRow
            label="Калории около цели"
            hit={hits.kcalHit}
            total={hits.kcalTotal}
            barClass="bg-primary"
          />
        </div>
      ) : null}
    </section>
  );
}

function TypeAverage({
  label,
  stats,
}: {
  label: string;
  stats: MacroAverages;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-muted-foreground">
        {label} · {stats.count} {pluralDays(stats.count)}
      </p>
      <p className="text-xl font-semibold tracking-tight tabular-nums">
        {formatKcal(stats.fact.kcal)}
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          / {formatKcal(stats.target.kcal)} ккал
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        Б {formatMacro(stats.fact.protein)} /{" "}
        {formatMacro(stats.target.protein)} · Ж {formatMacro(stats.fact.fat)} /{" "}
        {formatMacro(stats.target.fat)} · У {formatMacro(stats.fact.carbs)} /{" "}
        {formatMacro(stats.target.carbs)}
      </p>
    </div>
  );
}

function HitRow({
  label,
  hit,
  total,
  barClass,
}: {
  label: string;
  hit: number;
  total: number;
  barClass: string;
}) {
  if (total === 0) {
    return null;
  }

  const ratio = hit / total;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {hit} из {total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
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

function readPage(data: unknown): {
  items: DayHistoryRow[];
  next_before: string | null;
} {
  if (!isRecord(data)) {
    return { items: [], next_before: null };
  }

  return {
    items: mapRecordList(data.items, parseDayHistoryRow),
    next_before: typeof data.next_before === "string" ? data.next_before : null,
  };
}

function parseDayHistoryRow(
  row: Record<string, unknown>,
): DayHistoryRow | null {
  if (typeof row.date !== "string") {
    return null;
  }

  return {
    date: row.date,
    is_training_day: Boolean(row.is_training_day),
    target_protein: Number(row.target_protein) || 0,
    target_fat: Number(row.target_fat) || 0,
    target_carbs: Number(row.target_carbs) || 0,
    target_kcal: Number(row.target_kcal) || 0,
    fact_protein: Number(row.fact_protein) || 0,
    fact_fat: Number(row.fact_fat) || 0,
    fact_carbs: Number(row.fact_carbs) || 0,
    fact_kcal: Number(row.fact_kcal) || 0,
  };
}

function groupByMonth(items: DayHistoryRow[]): Array<{
  key: string;
  label: string;
  items: DayHistoryRow[];
}> {
  const groups: Array<{
    key: string;
    label: string;
    items: DayHistoryRow[];
  }> = [];

  for (const item of items) {
    const key = item.date.slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.items.push(item);
      continue;
    }
    groups.push({
      key,
      label: formatMonth(key),
      items: [item],
    });
  }

  return groups;
}

function formatMonth(yearMonth: string): string {
  try {
    return format(parseISO(`${yearMonth}-01`), "LLLL yyyy", { locale: ru });
  } catch {
    return yearMonth;
  }
}

function formatDay(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "EEEE, d MMMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
