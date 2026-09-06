"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { cachedGet, fetchJson } from "@/lib/api-cache";
import { LOAD_FAILED, NUTRITION_HISTORY_EMPTY } from "@/lib/messages";
import { DAY_TYPE_LABELS, formatKcal, formatMacro } from "@/lib/nutrition";
import type { DayHistoryRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NutritionHistoryScreen() {
  const [items, setItems] = useState<DayHistoryRow[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const week = useMemo(() => averageDays(items.slice(0, 7)), [items]);
  const groups = useMemo(() => groupByMonth(items), [items]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История еды" backHref="/today" />

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

        {!loading && week && week.count > 0 ? (
          <section className="card-surface animate-rise px-5 py-5">
            <p className="text-sm font-medium text-muted-foreground">
              Среднее за {week.count}{" "}
              {week.count === 1 ? "день" : week.count < 5 ? "дня" : "дней"}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatKcal(week.kcal)}
              <span className="ml-1.5 text-lg font-medium text-muted-foreground">
                ккал
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Б {formatMacro(week.protein)} · Ж {formatMacro(week.fat)} · У{" "}
              {formatMacro(week.carbs)}
            </p>
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
                        href={`/today?date=${encodeURIComponent(item.date)}`}
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

function averageDays(items: DayHistoryRow[]): {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  count: number;
} | null {
  if (items.length === 0) {
    return null;
  }

  const count = items.length;
  return {
    protein: items.reduce((sum, item) => sum + item.fact_protein, 0) / count,
    fat: items.reduce((sum, item) => sum + item.fact_fat, 0) / count,
    carbs: items.reduce((sum, item) => sum + item.fact_carbs, 0) / count,
    kcal: items.reduce((sum, item) => sum + item.fact_kcal, 0) / count,
    count,
  };
}

function readPage(data: unknown): {
  items: DayHistoryRow[];
  next_before: string | null;
} {
  if (!data || typeof data !== "object") {
    return { items: [], next_before: null };
  }

  const record = data as { items?: unknown; next_before?: unknown };
  return {
    items: Array.isArray(record.items) ? (record.items as DayHistoryRow[]) : [],
    next_before:
      typeof record.next_before === "string" ? record.next_before : null,
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
