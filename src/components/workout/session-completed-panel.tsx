"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { gymQuote } from "@/lib/quotes";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function SessionCompletedPanel({
  sessionId,
  abovePlan,
  nextName,
  phaseHint,
  busy,
  onCorrect,
}: {
  sessionId: string;
  abovePlan: boolean;
  nextName: string | null;
  phaseHint: string | null;
  busy: boolean;
  onCorrect: () => void;
}) {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <h2 className="text-xl font-semibold">Готово</h2>
      <p className="text-sm text-muted-foreground">{gymQuote(sessionId)}</p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Записано. Другой вес — поправь, останется сделанной.
      </p>
      {abovePlan ? (
        <p className="text-base leading-relaxed">
          Где-то больше плана. Рабочий вес сам не прыгнет — это в цикле.
        </p>
      ) : null}
      {nextName ? (
        <p className="text-base text-muted-foreground">
          Дальше в очереди: {nextName}.
        </p>
      ) : null}
      {phaseHint ? (
        <p className="text-base text-muted-foreground">{phaseHint}</p>
      ) : null}
      {abovePlan ? (
        <Link
          href="/workouts/macro"
          className="text-base font-medium text-primary"
        >
          К циклу
        </Link>
      ) : null}
      {phaseHint && !abovePlan ? (
        <Link
          href="/workouts/macro"
          className="text-base font-medium text-primary"
        >
          К циклу
        </Link>
      ) : null}
      {nextName ? (
        <Link href="/workouts" className="text-base font-medium text-primary">
          {QUEUE_LABEL}
        </Link>
      ) : (
        <Link href="/workouts" className="text-base font-medium text-primary">
          К тренировкам
        </Link>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-12 text-base"
        disabled={busy}
        onClick={onCorrect}
      >
        Поправить записанное
      </Button>
    </section>
  );
}
