"use client";

import { ReviewFactsCard } from "@/components/ai/review-facts-card";
import { ReviewSignalsCard } from "@/components/ai/review-signals-card";
import { ReviewTextCard } from "@/components/ai/review-text-card";
import {
  type ReviewRangeId,
  reviewBackHref,
  useReviewScreen,
} from "@/components/ai/use-review-screen";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { AI_REVIEW_EMPTY, AI_REVIEW_NO_KEY } from "@/lib/messages";
import { REVIEW_LABEL } from "@/lib/workout/labels";

const RANGE_OPTIONS: Array<{ id: ReviewRangeId; label: string }> = [
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
];

export function ReviewScreen() {
  const {
    from,
    range,
    snapshot,
    loading,
    writing,
    error,
    brief,
    review,
    empty,
    load,
    writeReview,
    changeRange,
  } = useReviewScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={REVIEW_LABEL} backHref={reviewBackHref(from)} />

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
            {brief.signals.length > 0 ? (
              <ReviewSignalsCard signals={brief.signals} />
            ) : null}
            {review ? <ReviewTextCard review={review} /> : null}

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
                {writing ? "Пишу…" : review ? "Написать ещё раз" : "Написать"}
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

            <p className="text-sm text-muted-foreground">
              По записям. Не врач.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
