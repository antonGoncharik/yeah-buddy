import {
  comebackLine,
  firstPhaseLine,
  sessionMilestoneLine,
} from "@/lib/flavor";
import { type JoyLift, sessionJoyMoment } from "@/lib/share/joy";
import type {
  PhaseCircleProgress,
  SessionFeel,
  SessionMaxRaiseOffer,
} from "@/lib/types";
import type { SessionBeat } from "@/lib/workout/beats";

export function buildSessionCompletedCopy({
  feel,
  completedSessions,
  lastCompletedBefore,
  sessionDate,
  phaseCircle,
  beat,
  workLift,
  raiseOffers,
}: {
  feel: SessionFeel | null;
  completedSessions: number;
  lastCompletedBefore: string | null;
  sessionDate: string;
  phaseCircle: PhaseCircleProgress | null;
  beat: SessionBeat | null;
  workLift: JoyLift | null;
  raiseOffers: SessionMaxRaiseOffer[];
}) {
  const canRaise = raiseOffers.length > 0;
  const milestone = sessionMilestoneLine(completedSessions);
  const record = beat?.kind === "record" ? beat : null;
  const joy = sessionJoyMoment({
    feel,
    completedSessions,
    workKg: workLift?.kg ?? null,
    record,
  });
  const shareLift =
    joy?.kind === "record" && record
      ? { name: record.name, kg: record.kg }
      : workLift;
  const phase = firstPhaseLine(phaseCircle);
  const comeback = milestone
    ? null
    : comebackLine(sessionDate, lastCompletedBefore);

  return {
    canRaise,
    milestone,
    record,
    joy,
    shareLift,
    phase,
    comeback,
    beatLine: beat?.line ?? null,
  };
}
