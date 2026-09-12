"use client";

import { useSearchParams } from "next/navigation";
import { useWeekScreen } from "@/components/day/use-week-screen";
import { WeekDayRow } from "@/components/day/week-day-row";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { weekHasEntries } from "@/lib/day/week";
import { WEEK_EMPTY } from "@/lib/messages";

export function WeekScreen() {
  const fromSettings = useSearchParams().get("from") === "settings";
  const { week, loading, error, load } = useWeekScreen();
  const items = week?.items ?? [];
  const empty = !loading && !error && week != null && !weekHasEntries(items);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Неделя"
        backHref={fromSettings ? "/settings" : "/today"}
      />

      <div className="flex flex-col gap-2 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && week == null ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {empty ? (
          <section className="card-surface animate-rise px-5 py-5">
            <p className="text-lg font-medium">{WEEK_EMPTY}</p>
          </section>
        ) : null}

        {!loading && week && weekHasEntries(week.items) ? (
          <ul className="animate-rise flex flex-col gap-2">
            {week.items.map((item) => (
              <li key={item.date}>
                <WeekDayRow
                  slot={item}
                  today={week.today}
                  fromSettings={fromSettings}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
