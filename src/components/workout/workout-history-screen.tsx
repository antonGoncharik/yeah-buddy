"use client";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useWorkoutHistoryScreen } from "@/components/workout/use-workout-history-screen";
import { WorkoutHistoryNavLinks } from "@/components/workout/workout-history-nav-links";
import { WorkoutHistoryRow } from "@/components/workout/workout-history-row";
import { WorkoutHistoryStats } from "@/components/workout/workout-history-stats";
import {
  SESSION_HISTORY_EMPTY,
  SESSION_HISTORY_EMPTY_HINT,
} from "@/lib/messages";
import { HISTORY_RANGE_OPTIONS } from "@/lib/use-cursor-history";

export function WorkoutHistoryScreen() {
  const screen = useWorkoutHistoryScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История тренировок" backHref="/workouts" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {screen.loading ? <ScreenLoading /> : null}

        {!screen.loading && screen.error && screen.items.length === 0 ? (
          <ScreenError
            message={screen.error}
            onRetry={() => void screen.load()}
          />
        ) : null}

        {!screen.loading && !screen.error && screen.items.length === 0 ? (
          <EmptyNote
            icon={<DumbbellDoodle className="h-5 w-10" />}
            title={SESSION_HISTORY_EMPTY}
            hint={SESSION_HISTORY_EMPTY_HINT}
          />
        ) : null}

        {!screen.loading && screen.showRange ? (
          <div className="animate-rise">
            <Segmented
              value={screen.range}
              options={HISTORY_RANGE_OPTIONS}
              onChange={screen.setRange}
            />
          </div>
        ) : null}

        {screen.showStats ? (
          <WorkoutHistoryStats
            days={screen.rangeDays}
            stats={screen.stats}
            from={screen.from}
            to={screen.today}
            dates={screen.windowed.map((item) => item.session.session_date)}
          />
        ) : null}

        {!screen.loading &&
        screen.items.length > 0 &&
        screen.listed.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            За эти дни зала не было.
          </p>
        ) : null}

        {!screen.loading && screen.groups.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
            {screen.groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium capitalize text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="card-surface divide-y divide-border/70 px-5 py-1">
                  {group.items.map((item) => (
                    <li key={item.session.id}>
                      <WorkoutHistoryRow item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {!screen.loading && screen.items.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-base"
            onClick={() => {
              window.location.assign("/api/sessions/export");
            }}
          >
            Скачать CSV
          </Button>
        ) : null}

        {screen.needsMore ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-base"
            disabled={screen.loadingMore}
            onClick={() => {
              if (screen.nextBefore) {
                void screen.load(screen.nextBefore);
              }
            }}
          >
            {screen.loadingMore ? "Загрузка…" : "Ещё"}
          </Button>
        ) : null}

        {screen.showStats ? (
          <>
            <ReviewCta from="gym" />
            <WorkoutHistoryNavLinks />
          </>
        ) : null}
      </div>
    </div>
  );
}
