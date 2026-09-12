"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BARBELL_VIEWBOX,
  BarbellMark,
  Doodle,
} from "@/components/layout/doodles";
import { FlavorNote } from "@/components/layout/flavor-note";
import { Button } from "@/components/ui/button";
import { SessionFeelPicker } from "@/components/workout/session-feel-picker";
import {
  firstDeloadLine,
  PLATE_BURST_MS,
  sessionDoneHeadline,
  sessionDoneLead,
  sessionMilestoneLine,
  sessionRaiseLine,
} from "@/lib/flavor";
import type {
  PhaseCircleProgress,
  SessionFeel,
  SessionMaxRaiseOffer,
} from "@/lib/types";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function SessionCompletedPanel({
  abovePlan,
  nextName,
  phaseHint,
  holdHint,
  feel,
  raiseOffers,
  completedSessions,
  phaseCircle,
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
  completedSessions: number;
  phaseCircle: PhaseCircleProgress | null;
  busy: boolean;
  onCorrect: () => void;
  onFeel: (value: SessionFeel | null) => void;
  onRaise: () => Promise<boolean>;
}) {
  const canRaise = raiseOffers.length > 0;
  const milestone = sessionMilestoneLine(completedSessions);
  const deload = firstDeloadLine(phaseCircle);
  const [extraPlate, setExtraPlate] = useState(false);

  useEffect(() => {
    if (!extraPlate) {
      return;
    }
    const timer = window.setTimeout(() => setExtraPlate(false), PLATE_BURST_MS);
    return () => window.clearTimeout(timer);
  }, [extraPlate]);

  async function raise() {
    if (await onRaise()) {
      setExtraPlate(true);
    }
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{sessionDoneHeadline(feel)}</h2>
        <Doodle
          className="mt-1 h-5 w-auto text-muted-foreground"
          viewBox={BARBELL_VIEWBOX}
        >
          <BarbellMark extra={extraPlate} />
        </Doodle>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        {sessionDoneLead(feel)}
      </p>
      <FlavorNote line={milestone} className="text-foreground" />
      <FlavorNote line={deload} className="text-foreground" />
      <SessionFeelPicker value={feel} disabled={busy} onChange={onFeel} />
      {canRaise ? (
        <p className="text-base leading-relaxed">
          {sessionRaiseLine(abovePlan, feel)}
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
          onClick={() => void raise()}
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
