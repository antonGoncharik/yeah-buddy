"use client";

import Link from "next/link";
import { useMemo } from "react";

import { FlavorNote } from "@/components/layout/flavor-note";
import { JoyShareButton } from "@/components/share/joy-share-button";
import { Button } from "@/components/ui/button";
import { CircleOpenedNote } from "@/components/workout/circle-opened-note";
import { SessionCompletedPanelHeader } from "@/components/workout/session-completed-panel-header";
import { SessionFeelPicker } from "@/components/workout/session-feel-picker";
import { SessionMuscleMini } from "@/components/workout/session-muscle-mini";
import { useSessionCompletedSplash } from "@/components/workout/use-session-completed-splash";
import {
  LIGHT_WEIGHT_LINE,
  sessionDoneLead,
  sessionRaiseLine,
} from "@/lib/flavor";
import { CYCLE_RAISE_LATER } from "@/lib/messages";
import type { JoyLift } from "@/lib/share/joy";
import type {
  PhaseCircleProgress,
  SessionFeel,
  SessionMaxRaiseOffer,
  UserSex,
} from "@/lib/types";
import type { SessionExerciseDetail } from "@/lib/types/workout-session";
import type { SessionBeat } from "@/lib/workout/beats";
import type { EaseWeekKind } from "@/lib/workout/ease-week";
import { easeWeekMessage } from "@/lib/workout/ease-week";
import { buildSessionCompletedCopy } from "@/lib/workout/session-completed-copy";

export function SessionCompletedPanel({
  abovePlan,
  nextName,
  phaseHint,
  holdHint,
  feel,
  inCycle,
  raiseOffers,
  completedSessions,
  lastCompletedBefore,
  sessionDate,
  phaseCircle,
  beat,
  circleOpen,
  phaseId,
  workLift,
  busy,
  onCorrect,
  onFeel,
  onRaise,
  easeWeek = null,
  onEase,
  sessionExercises = [],
  figureSex = null,
}: {
  abovePlan: boolean;
  nextName: string | null;
  phaseHint: string | null;
  holdHint: string | null;
  feel: SessionFeel | null;
  inCycle: boolean;
  raiseOffers: SessionMaxRaiseOffer[];
  completedSessions: number;
  lastCompletedBefore: string | null;
  sessionDate: string;
  phaseCircle: PhaseCircleProgress | null;
  beat: SessionBeat | null;
  circleOpen: boolean;
  phaseId: string | null;
  workLift: JoyLift | null;
  busy: boolean;
  onCorrect: () => void;
  onFeel: (value: SessionFeel | null) => void;
  onRaise: () => Promise<boolean>;
  easeWeek?: EaseWeekKind | null;
  onEase?: () => Promise<boolean>;
  sessionExercises?: SessionExerciseDetail[];
  figureSex?: UserSex | null;
}) {
  const copy = useMemo(
    () =>
      buildSessionCompletedCopy({
        feel,
        completedSessions,
        lastCompletedBefore,
        sessionDate,
        phaseCircle,
        beat,
        workLift,
        raiseOffers,
      }),
    [
      beat,
      completedSessions,
      feel,
      lastCompletedBefore,
      phaseCircle,
      raiseOffers,
      sessionDate,
      workLift,
    ],
  );
  const splash = useSessionCompletedSplash(feel);

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <SessionCompletedPanelHeader
        feel={feel}
        easyPointer={splash.easyPointer}
        barbellPointer={splash.barbellPointer}
        extraPlate={splash.extraPlate}
      />
      <FlavorNote
        line={sessionDoneLead(feel)}
        className="text-muted-foreground"
      />
      <FlavorNote
        line={splash.lightWeight ? LIGHT_WEIGHT_LINE : null}
        className="text-foreground"
      />
      <FlavorNote line={copy.milestone} className="text-foreground" />
      <CircleOpenedNote phaseId={phaseId} open={circleOpen} />
      <FlavorNote line={copy.beatLine} className="text-foreground" />
      <FlavorNote line={copy.phase} className="text-foreground" />
      <FlavorNote line={copy.comeback} className="text-foreground" />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Как прошло</p>
        <SessionFeelPicker value={feel} disabled={busy} onChange={onFeel} />
      </div>
      {copy.joy ? (
        <JoyShareButton moment={copy.joy} lift={copy.shareLift} />
      ) : null}
      <SessionMuscleMini exercises={sessionExercises} figureSex={figureSex} />
      {copy.canRaise && abovePlan ? (
        <p className="text-base leading-relaxed">
          {sessionRaiseLine(true, feel)}
        </p>
      ) : null}
      {inCycle && !holdHint && (feel === "easy" || abovePlan) ? (
        <p className="text-base leading-relaxed text-muted-foreground">
          {CYCLE_RAISE_LATER}
        </p>
      ) : null}
      {holdHint ? (
        <p className="text-base leading-relaxed">{holdHint}</p>
      ) : null}
      {easeWeek && feel === "miss" && onEase ? (
        <>
          <p className="text-base leading-relaxed">
            {easeWeekMessage(easeWeek)}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-base"
            disabled={busy}
            onClick={() => void onEase()}
          >
            {busy ? "Открываю…" : "Неделя легче"}
          </Button>
        </>
      ) : null}
      {copy.canRaise ? (
        <Button
          type="button"
          className="h-12 text-base"
          disabled={busy}
          onClick={() => void splash.raise(onRaise)}
        >
          {busy ? "Поднимаю…" : "Поднять максимум"}
        </Button>
      ) : null}
      {nextName ? (
        <p className="text-base text-muted-foreground">Дальше {nextName}</p>
      ) : null}
      {phaseHint ? (
        <p className="text-base text-muted-foreground">{phaseHint}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        {phaseHint ? (
          <Link
            href="/workouts/macro"
            className="text-base font-medium text-primary"
          >
            Открыть цикл
          </Link>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-12 text-base"
          disabled={busy}
          onClick={onCorrect}
        >
          Поправить
        </Button>
      </div>
    </section>
  );
}
