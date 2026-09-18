"use client";

import { useSearchParams } from "next/navigation";

import { ReviewCta } from "@/components/ai/review-cta";
import { useWeekScreen } from "@/components/day/use-week-screen";
import { WeekDayRow } from "@/components/day/week-day-row";
import { AppHeader } from "@/components/layout/app-header";
import { CookieDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { FlavorNote } from "@/components/layout/flavor-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { weekHasEntries } from "@/lib/day/week";
import { consecutiveProteinHits, proteinWeekLine } from "@/lib/flavor";
import { WEEK_EMPTY } from "@/lib/messages";

export function WeekScreen() {
  const fromSettings = useSearchParams().get("from") === "settings";
  const { week, loading, error, load } = useWeekScreen();
  const items = week?.items ?? [];
  const empty = !loading && !error && week != null && !weekHasEntries(items);
  const proteinLine = proteinWeekLine(consecutiveProteinHits(items));

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Неделя"
        backHref={fromSettings ? "/settings" : "/today"}
      />

      <div className="flex flex-col gap-3 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && week == null ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {empty ? (
          <EmptyNote
            icon={<CookieDoodle className="size-6" />}
            title={WEEK_EMPTY}
          />
        ) : null}

        {!loading && week && weekHasEntries(week.items) ? (
          <>
            <FlavorNote
              line={proteinLine}
              className="px-1 text-muted-foreground"
            />
            <ReviewCta from="week" />
            <ul className="card-surface animate-rise divide-y divide-border/70 px-5 py-1">
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
          </>
        ) : null}
      </div>
    </div>
  );
}
