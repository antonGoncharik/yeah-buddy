"use client";

import { ReviewFactsCard } from "@/components/ai/review-facts-card";
import { ReviewSignalsCard } from "@/components/ai/review-signals-card";
import { ReviewTextCard } from "@/components/ai/review-text-card";
import {
  type ReviewRangeId,
  useReviewScreen,
} from "@/components/ai/use-review-screen";
import { AppHeader } from "@/components/layout/app-header";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { reviewDetailSignals } from "@/lib/ai/signal-lines";
import { AI_REVIEW_EMPTY, AI_REVIEW_NO_KEY } from "@/lib/messages";
import { REVIEW_LABEL } from "@/lib/workout/labels";

const RANGE_OPTIONS: Array<{ id: ReviewRangeId; label: string }> = [
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
];

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
  } = useReviewScreen();

  const details = brief ? reviewDetailSignals(brief.signals) : [];

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={REVIEW_LABEL} backHref={backHref} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        <div className="animate-rise">
          <Segmented
            value={range}
            options={RANGE_OPTIONS}
            onChange={changeRange}
          />
        </div>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !brief ? (
          <ScreenError message={error} onRetry={() => void load(range)} />
        ) : null}

        {!loading && brief ? (
          <>
            <ReviewFactsCard brief={brief} />
            {details.length > 0 ? (
              <ReviewSignalsCard signals={details} />
            ) : null}
            {review ? <ReviewTextCard review={review} /> : null}
            {previous ? (
              <ReviewTextCard review={previous} label="Прошлый раз" muted />
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {empty ? (
              <p className="text-base text-muted-foreground">
                {AI_REVIEW_EMPTY}
              </p>
            ) : snapshot?.configured ? (
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={writing}
                onClick={() => void writeReview()}
              >
                {writing ? "Разбираю…" : review ? "Ещё раз" : "Разобрать"}
              </Button>
            ) : (
              <p className="text-base text-muted-foreground">
                {AI_REVIEW_NO_KEY}
              </p>
            )}

            {brief.coverage === "thin" && !empty ? (
              <p className="text-sm text-muted-foreground">
                Записей пока мало.
              </p>
            ) : null}

            <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
              <NavRow
                href="/today/history"
                title="История еды"
                hint="БЖУ и вес по дням"
              />
              <NavRow
                href="/workouts/progress"
                title="Рабочие веса"
                hint="С первых записей"
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
