"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BARBELL_VIEWBOX,
  BarbellMark,
  Doodle,
} from "@/components/layout/doodles";
import { FlavorNote } from "@/components/layout/flavor-note";
import { Button } from "@/components/ui/button";
import { SessionFeelPicker } from "@/components/workout/session-feel-picker";
import {
  comebackLine,
  firstPhaseLine,
  LIGHT_WEIGHT_LINE,
  PLATE_BURST_MS,
  SPLASH_HOLD_MS,
  sessionDoneHeadline,
  sessionDoneLead,
  sessionMilestoneLine,
  sessionRaiseLine,
} from "@/lib/flavor";
import { haptic } from "@/lib/telegram/haptic";
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
  lastCompletedBefore,
  sessionDate,
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
  lastCompletedBefore: string | null;
  sessionDate: string;
  phaseCircle: PhaseCircleProgress | null;
  busy: boolean;
  onCorrect: () => void;
  onFeel: (value: SessionFeel | null) => void;
  onRaise: () => Promise<boolean>;
}) {
  const canRaise = raiseOffers.length > 0;
  const milestone = sessionMilestoneLine(completedSessions);
  const phase = firstPhaseLine(phaseCircle);
  const comeback = milestone
    ? null
    : comebackLine(sessionDate, lastCompletedBefore);
  const [extraPlate, setExtraPlate] = useState(false);
  const [lightWeight, setLightWeight] = useState(false);
  const plateHold = useRef<number | null>(null);
  const titleHold = useRef<number | null>(null);

  useEffect(() => {
    if (!extraPlate) {
      return;
    }
    const timer = window.setTimeout(() => setExtraPlate(false), PLATE_BURST_MS);
    return () => window.clearTimeout(timer);
  }, [extraPlate]);

  useEffect(() => {
    return () => {
      if (plateHold.current != null) {
        window.clearTimeout(plateHold.current);
      }
      if (titleHold.current != null) {
        window.clearTimeout(titleHold.current);
      }
    };
  }, []);

  async function raise() {
    if (await onRaise()) {
      setExtraPlate(true);
    }
  }

  function burstPlate() {
    haptic("tick");
    setExtraPlate(true);
  }

  function startPlateHold() {
    if (plateHold.current != null) {
      window.clearTimeout(plateHold.current);
    }
    plateHold.current = window.setTimeout(() => {
      plateHold.current = null;
      burstPlate();
    }, SPLASH_HOLD_MS);
  }

  function endPlateHold() {
    if (plateHold.current != null) {
      window.clearTimeout(plateHold.current);
      plateHold.current = null;
    }
  }

  function startTitleHold() {
    if (feel !== "easy" || lightWeight) {
      return;
    }
    if (titleHold.current != null) {
      window.clearTimeout(titleHold.current);
    }
    titleHold.current = window.setTimeout(() => {
      titleHold.current = null;
      setLightWeight(true);
      haptic("success");
    }, SPLASH_HOLD_MS);
  }

  function endTitleHold() {
    if (titleHold.current != null) {
      window.clearTimeout(titleHold.current);
      titleHold.current = null;
    }
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <h2
          className="select-none text-xl font-semibold"
          onPointerDown={feel === "easy" ? startTitleHold : undefined}
          onPointerUp={feel === "easy" ? endTitleHold : undefined}
          onPointerLeave={feel === "easy" ? endTitleHold : undefined}
          onPointerCancel={feel === "easy" ? endTitleHold : undefined}
        >
          {sessionDoneHeadline(feel)}
        </h2>
        <button
          type="button"
          className="mt-1 text-muted-foreground"
          aria-label="Штанга"
          onPointerDown={startPlateHold}
          onPointerUp={endPlateHold}
          onPointerLeave={endPlateHold}
          onPointerCancel={endPlateHold}
        >
          <Doodle className="h-5 w-auto" viewBox={BARBELL_VIEWBOX}>
            <BarbellMark extra={extraPlate} />
          </Doodle>
        </button>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        {sessionDoneLead(feel)}
      </p>
      <FlavorNote
        line={lightWeight ? LIGHT_WEIGHT_LINE : null}
        className="text-foreground"
      />
      <FlavorNote line={milestone} className="text-foreground" />
      <FlavorNote line={phase} className="text-foreground" />
      <FlavorNote line={comeback} className="text-foreground" />
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
