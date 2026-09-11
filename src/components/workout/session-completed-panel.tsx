"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionFeelPicker } from "@/components/workout/session-feel-picker";
import { gymQuote } from "@/lib/quotes";
import type { SessionFeel, SessionMaxRaiseOffer } from "@/lib/types";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function SessionCompletedPanel({
  sessionId,
  abovePlan,
  nextName,
  phaseHint,
  holdHint,
  feel,
  raiseOffers,
  busy,
  onCorrect,
  onFeel,
  onRaise,
}: {
  sessionId: string;
  abovePlan: boolean;
  nextName: string | null;
  phaseHint: string | null;
  holdHint: string | null;
  feel: SessionFeel | null;
  raiseOffers: SessionMaxRaiseOffer[];
  busy: boolean;
  onCorrect: () => void;
  onFeel: (value: SessionFeel | null) => void;
  onRaise: () => void;
}) {
  const canRaise = raiseOffers.length > 0;

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <h2 className="text-xl font-semibold">Готово</h2>
      <p className="text-sm text-muted-foreground">{gymQuote(sessionId)}</p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Записано. Другой вес — поправь, останется сделанной.
      </p>
      <SessionFeelPicker value={feel} disabled={busy} onChange={onFeel} />
      {canRaise ? (
        <p className="text-base leading-relaxed">
          {abovePlan
            ? "Где-то больше плана. Рабочий сам не прыгнет."
            : "Легко. Можно поднять рабочий."}
        </p>
      ) : null}
      {holdHint ? (
        <p className="text-base leading-relaxed">{holdHint}</p>
      ) : null}
      {nextName ? (
        <p className="text-base text-muted-foreground">
          Дальше в очереди: {nextName}.
        </p>
      ) : null}
      {phaseHint ? (
        <p className="text-base text-muted-foreground">{phaseHint}</p>
      ) : null}
      {canRaise ? (
        <Button
          type="button"
          className="h-12 text-base"
          disabled={busy}
          onClick={onRaise}
        >
          Поднять рабочий
        </Button>
      ) : null}
      {phaseHint ? (
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
