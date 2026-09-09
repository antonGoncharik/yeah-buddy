"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { parseReviewSnapshot } from "@/lib/ai/parse-review";
import type { ReviewBrief, ReviewSnapshot, ReviewText } from "@/lib/ai/types";
import {
  AI_REVIEW_EMPTY,
  AI_REVIEW_FAILED,
  AI_REVIEW_NO_KEY,
  LOAD_FAILED,
  readApiError,
} from "@/lib/messages";
import { pluralDays } from "@/lib/nutrition-stats";
import { pluralWorkouts } from "@/lib/workout/history-stats";

type RangeId = "14" | "30";

const RANGE_OPTIONS: Array<{ id: RangeId; label: string }> = [
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
];

export function ReviewScreen() {
  const from = useSearchParams().get("from");
  const [range, setRange] = useState<RangeId>("14");
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days: RangeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/review?days=${days}`, {
        cache: "no-store",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        setSnapshot(null);
        return;
      }
      const next = readSnapshot(data);
      if (!next) {
        setError(LOAD_FAILED);
        setSnapshot(null);
        return;
      }
      setSnapshot(next);
    } catch {
      setError(LOAD_FAILED);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  async function writeReview() {
    setWriting(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: Number(range) }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? AI_REVIEW_FAILED);
        return;
      }
      const next = readSnapshot(data);
      if (!next) {
        setError(AI_REVIEW_FAILED);
        return;
      }
      setSnapshot(next);
    } catch {
      setError(AI_REVIEW_FAILED);
    } finally {
      setWriting(false);
    }
  }

  const brief = snapshot?.brief ?? null;
  const review = snapshot?.review ?? null;
  const empty = brief?.coverage === "empty";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Разбор" backHref={backHref(from)} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        <div className="animate-rise">
          <Segmented
            value={range}
            options={RANGE_OPTIONS}
            onChange={(id) => {
              setRange(id);
              setSnapshot(null);
            }}
          />
        </div>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !brief ? (
          <ScreenError message={error} onRetry={() => void load(range)} />
        ) : null}

        {!loading && brief ? (
          <>
            <FactsCard brief={brief} />
            {brief.signals.length > 0 ? (
              <SignalsCard signals={brief.signals} />
            ) : null}
            {review ? <ReviewCard review={review} /> : null}

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
                {writing
                  ? "Пишу…"
                  : review
                    ? "Написать ещё раз"
                    : "Написать разбор"}
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
              Это разбор записей, не план питания и не совет врача.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function FactsCard({ brief }: { brief: ReviewBrief }) {
  const protein =
    brief.nutrition.protein_total > 0
      ? `белок ${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`
      : null;
  const plan =
    brief.gym.plan_total > 0
      ? `план ${brief.gym.plan_hit} из ${brief.gym.plan_total}`
      : null;
  const gym =
    brief.gym.completed > 0
      ? `${brief.gym.completed} ${pluralWorkouts(brief.gym.completed)}`
      : "зала не было";
  const phase = brief.phase.type
    ? brief.phase.completed != null && brief.phase.circle != null
      ? `${brief.phase.type} · ${brief.phase.completed} из ${brief.phase.circle}`
      : brief.phase.type
    : null;

  return (
    <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {brief.range} дней
      </p>
      <p className="text-2xl font-semibold tracking-tight">
        {brief.nutrition.logged} {pluralDays(brief.nutrition.logged)} · {gym}
      </p>
      {protein || plan ? (
        <p className="text-sm text-muted-foreground">
          {[protein, plan].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {phase ? <p className="text-sm text-muted-foreground">{phase}</p> : null}
    </section>
  );
}

function SignalsCard({ signals }: { signals: string[] }) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
      <h2 className="text-sm font-medium text-muted-foreground">Цифры</h2>
      <ul className="flex flex-col gap-2.5">
        {signals.map((signal) => (
          <li key={signal} className="text-base leading-snug">
            {signal}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewCard({ review }: { review: ReviewText }) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <h2 className="text-2xl font-semibold tracking-tight">
        {review.headline}
      </h2>
      <ul className="flex flex-col gap-3">
        {review.observations.map((item) => (
          <li key={item} className="text-base leading-snug">
            {item}
          </li>
        ))}
      </ul>
      {review.watch.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-4">
          <p className="text-sm font-medium text-muted-foreground">Дальше</p>
          <ul className="flex flex-col gap-2">
            {review.watch.map((item) => (
              <li key={item} className="text-base leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function backHref(from: string | null): string {
  switch (from) {
    case "food":
      return "/today/history";
    case "gym":
      return "/workouts/history";
    case "workouts":
      return "/workouts";
    default:
      return "/settings";
  }
}

function readSnapshot(data: unknown): ReviewSnapshot | null {
  return parseReviewSnapshot(data);
}
