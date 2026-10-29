import { formatSessionDate } from "@/components/workout/session-drafts";
import type { PhaseCircleProgress, SessionDetail } from "@/lib/types";
import { phaseLabel, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function sessionScreenTitle(detail: SessionDetail | null): string {
  const session = detail?.session;
  return (
    detail?.template?.name ??
    (session ? WORKOUT_KIND_LABELS[session.workout_type] : "Тренировка")
  );
}

export function sessionScreenSubtitle(
  detail: SessionDetail | null,
  phaseCircle: PhaseCircleProgress | null,
): string | undefined {
  const session = detail?.session;
  if (!session) {
    return undefined;
  }

  const phasePart =
    phaseCircle && session.status !== "completed"
      ? phaseLabel(phaseCircle.phase_type, phaseCircle.phase_name)
      : detail?.phase
        ? phaseLabel(detail.phase.phase_type, detail.phase.name)
        : phaseCircle
          ? phaseLabel(phaseCircle.phase_type, phaseCircle.phase_name)
          : null;

  return [formatSessionDate(session.session_date), phasePart]
    .filter(Boolean)
    .join(" · ");
}

export function sessionScreenContentPadding(
  showStickyComplete: boolean,
  restLeft: number | null,
): string {
  if (!showStickyComplete) {
    return "flex flex-col gap-5 px-4 pb-4";
  }
  if (restLeft != null && restLeft > 0) {
    return "flex flex-col gap-5 px-4 pb-80";
  }
  if (restLeft != null) {
    return "flex flex-col gap-5 px-4 pb-52";
  }
  return "flex flex-col gap-5 px-4 pb-36";
}
