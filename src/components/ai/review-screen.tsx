"use client";

import { ReviewFactsCard } from "@/components/ai/review-facts-card";
import { ReviewTextCard } from "@/components/ai/review-text-card";
import { useReviewScreen } from "@/components/ai/use-review-screen";
import { AppHeader } from "@/components/layout/app-header";
import {
  BarbellDoodle,
  DumbbellDoodle,
  MealDayDoodle,
} from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { WeekProgressShare } from "@/components/share/week-progress-share";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { DIARY_RANGE_OPTIONS } from "@/lib/diary-range";
import {
  AI_REVIEW_EMPTY,
  AI_REVIEW_NO_KEY,
  AI_REVIEW_QUOTA,
} from "@/lib/messages";
import { REVIEW_LABEL } from "@/lib/workout/labels";

export function ReviewScreen() {
  const {
    backHref,
    range,
    snapshot,
    loading,
    writing,
    error,
    brief,
    review,
    previous,
    empty,
    load,
    writeReview,
    changeRange,
    openedAt,
  } = useReviewScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={REVIEW_LABEL} backHref={backHref} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        <div className="animate-rise">
          <Segmented
            value={range}
            options={DIARY_RANGE_OPTIONS}
            onChange={changeRange}
          />
        </div>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !brief ? (
          <ScreenError message={error} onRetry={() => void load(range)} />
        ) : null}

        {!loading && brief ? (
          <>
            <ReviewFactsCard
              brief={brief}
              afterOverview={
                <>
                  {review ? (
                    <ReviewTextCard
                      key={review.written_at}
                      review={review}
                      defaultOpen={openedAt === review.written_at}
                    />
                  ) : null}
                  {previous ? (
                    <ReviewTextCard
                      review={previous}
                      label="Прошлый раз"
                      muted
                    />
                  ) : null}
                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                  {empty ? (
                    <p className="text-base text-muted-foreground">
                      {AI_REVIEW_EMPTY}
                    </p>
                  ) : (
                    <>
                      {brief.coverage === "thin" ? (
                        <p className="text-sm text-muted-foreground">
                          Записей пока мало.
                        </p>
                      ) : null}
                      {snapshot?.configured &&
                      (snapshot.remaining == null || snapshot.remaining > 0) ? (
                        <Button
                          type="button"
                          className="h-14 w-full text-lg"
                          disabled={writing}
                          onClick={() => void writeReview()}
                        >
                          {writing
                            ? "Разбираю…"
                            : review
                              ? "Ещё раз разбор от ИИ"
                              : "Разбор от ИИ"}
                        </Button>
                      ) : snapshot?.configured ? (
                        <p className="text-base text-muted-foreground">
                          {AI_REVIEW_QUOTA}
                        </p>
                      ) : (
                        <p className="text-base text-muted-foreground">
                          {AI_REVIEW_NO_KEY}
                        </p>
                      )}
                    </>
                  )}
                </>
              }
            />

            <WeekProgressShare tone="card" />

            <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
              <NavRow
                href="/today/history"
                title="История еды"
                hint="БЖУ и вес по дням"
                icon={<MealDayDoodle />}
              />
              <NavRow
                href="/workouts/history"
                title="История тренировок"
                hint="Какие были занятия"
                icon={<DumbbellDoodle />}
              />
              <NavRow
                href="/workouts/progress"
                title="Рабочие веса"
                hint="Как менялись за 90 дней"
                icon={<BarbellDoodle />}
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
