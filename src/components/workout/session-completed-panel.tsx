"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionFeelPicker } from "@/components/workout/session-feel-picker";
import type { SessionFeel, SessionMaxRaiseOffer } from "@/lib/types";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function SessionCompletedPanel({
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
      <p className="text-base leading-relaxed text-muted-foreground">
        Записано как в плане. Другой вес — поправь.
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
      {nextName ? (
        <p className="text-base text-muted-foreground">Дальше: {nextName}</p>
      ) : null}
      {phaseHint ? (
        <p className="text-base text-muted-foreground">{phaseHint}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Link
          href={phaseHint ? "/workouts/macro" : "/workouts"}
          className="text-base font-medium text-primary"
        >
          {phaseHint ? "К циклу" : QUEUE_LABEL}
        </Link>
        <Button
          type="button"
          variant="outline"
          className="h-12 text-base"
          disabled={busy}
          onClick={onCorrect}
        >
          Поправить записанное
        </Button>
      </div>
    </section>
  );
}
