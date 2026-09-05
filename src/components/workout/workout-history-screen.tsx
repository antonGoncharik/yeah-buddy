"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { cachedGet, fetchJson } from "@/lib/api-cache";
import { LOAD_FAILED, SESSION_HISTORY_EMPTY } from "@/lib/messages";
import type { RecentWorkoutSession } from "@/lib/types";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function WorkoutHistoryScreen() {
  const [items, setItems] = useState<RecentWorkoutSession[]>([]);
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

  const groups = useMemo(() => groupByMonth(items), [items]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История" backHref="/workouts" />

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
                        className="card-surface flex items-baseline justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <span className="min-w-0">
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
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatDay(item.session.session_date)}
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
    items: Array.isArray(record.items)
      ? (record.items as RecentWorkoutSession[])
      : [],
    next_before:
      typeof record.next_before === "string" ? record.next_before : null,
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
