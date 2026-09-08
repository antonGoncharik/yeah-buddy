"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, fetchJson } from "@/lib/api-cache";
import { LOAD_FAILED, SESSION_HISTORY_EMPTY } from "@/lib/messages";
import type { RecentWorkoutSession } from "@/lib/types";
import {
  hasOlderThanRange,
  pluralWorkouts,
  summarizeWorkoutHistory,
  type WorkoutHistoryRange,
  type WorkoutHistoryStats,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

type RangeId = "14" | "30";

const RANGE_OPTIONS: Array<{ id: RangeId; label: string }> = [
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
];

function todayIsoDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function WorkoutHistoryScreen() {
  const today = todayIsoDate();
  const [items, setItems] = useState<RecentWorkoutSession[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>("14");

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
      const url = `/api/sessions/history${query}`;
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

  const rangeDays = Number(range) as WorkoutHistoryRange;
  const windowed = useMemo(
    () => windowGymSessions(items, rangeDays, today),
    [items, rangeDays, today],
  );
  const stats = useMemo(() => summarizeWorkoutHistory(windowed), [windowed]);
  const groups = useMemo(() => groupByMonth(items), [items]);
  const showRange = hasOlderThanRange(items, 14, today);
  const showStats = !loading && stats.count > 0;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История тренировок" backHref="/workouts" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error && items.length === 0 ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <section className="card-surface animate-rise px-5 py-5">
            <p className="text-lg font-medium">{SESSION_HISTORY_EMPTY}</p>
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

        {showStats ? <StatsCard days={rangeDays} stats={stats} /> : null}

        {!loading && groups.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium capitalize text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.session.id}>
                      <Link
                        href={`/workouts/sessions/${item.session.id}`}
                        className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-medium">
                            {item.template_name ??
                              WORKOUT_KIND_LABELS[item.session.workout_type]}
                          </span>
                          {item.summary ? (
                            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                              {item.summary}
                            </span>
                          ) : item.session.status !== "completed" ? (
                            <span className="text-sm text-muted-foreground">
                              {SESSION_STATUS_LABELS[item.session.status]}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                          {formatDay(item.session.session_date)}
                          <ChevronRight className="size-4" aria-hidden />
                        </span>
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
  stats,
}: {
  days: WorkoutHistoryRange;
  stats: WorkoutHistoryStats;
}) {
  const kinds = [
    stats.dynamic > 0
      ? `${WORKOUT_KIND_LABELS.dynamic} · ${stats.dynamic}`
      : null,
    stats.static > 0 ? `${WORKOUT_KIND_LABELS.static} · ${stats.static}` : null,
  ].filter((value): value is string => value != null);

  return (
    <section className="card-surface animate-rise flex flex-col gap-5 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          За {days} дней
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {stats.count}
          <span className="ml-2 text-lg font-medium text-muted-foreground">
            {pluralWorkouts(stats.count)}
          </span>
        </p>
        {kinds.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {kinds.join(" · ")}
          </p>
        ) : null}
        {stats.templates.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.templates
              .map((item) => `${item.name} · ${item.count}`)
              .join(", ")}
          </p>
        ) : null}
      </div>
      {stats.planTotal > 0 ? (
        <HitRow
          label="Факт ≥ плана"
          hit={stats.planHit}
          total={stats.planTotal}
        />
      ) : null}
    </section>
  );
}

function HitRow({
  label,
  hit,
  total,
}: {
  label: string;
  hit: number;
  total: number;
}) {
  const ratio = hit / total;

  return (
    <div className="flex flex-col gap-1.5 border-t border-border/70 pt-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {hit} из {total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function readPage(data: unknown): {
  items: RecentWorkoutSession[];
  next_before: string | null;
} {
  if (!data || typeof data !== "object") {
    return { items: [], next_before: null };
  }

  const record = data as {
    items?: unknown;
    next_before?: unknown;
  };

  return {
    items: Array.isArray(record.items) ? record.items.map(readHistoryItem) : [],
    next_before:
      typeof record.next_before === "string" ? record.next_before : null,
  };
}

function readHistoryItem(value: unknown): RecentWorkoutSession {
  const record = value as RecentWorkoutSession;
  return {
    session: record.session,
    template_name: record.template_name ?? null,
    summary: record.summary ?? null,
    plan_hit: Number.isFinite(record.plan_hit) ? record.plan_hit : 0,
    plan_total: Number.isFinite(record.plan_total) ? record.plan_total : 0,
  };
}

function groupByMonth(items: RecentWorkoutSession[]): Array<{
  key: string;
  label: string;
  items: RecentWorkoutSession[];
}> {
  const groups: Array<{
    key: string;
    label: string;
    items: RecentWorkoutSession[];
  }> = [];

  for (const item of items) {
    const key = item.session.session_date.slice(0, 7);
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
    return format(parseISO(isoDate), "d MMMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
