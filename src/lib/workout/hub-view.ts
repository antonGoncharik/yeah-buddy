import type {
  ExerciseWithMax,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import {
  exerciseShortLabel,
  SESSION_STATUS_LABELS,
} from "@/lib/workout/labels";

export function hubSessionActionLabel(
  session: WorkoutSession | null,
): string | null {
  if (!session) {
    return null;
  }
  if (session.status === "planned") {
    return "Продолжить";
  }
  if (session.status === "skipped") {
    return SESSION_STATUS_LABELS.skipped;
  }
  if (session.status === "completed") {
    return SESSION_STATUS_LABELS.completed;
  }
  return null;
}

export function hubQueueHighlight(
  session: WorkoutSession | null,
  sessionTemplate: WorkoutTemplateDetail | null,
  nextTemplate: WorkoutTemplateDetail | null,
): { highlightId: string | undefined; highlightMark: "идёт" | "дальше" } {
  const planned = session?.status === "planned";
  return {
    highlightId: planned ? sessionTemplate?.id : nextTemplate?.id,
    highlightMark: planned ? "идёт" : "дальше",
  };
}

export function templateExerciseSummary(
  template: WorkoutTemplateDetail,
): string {
  return template.exercises
    .map((exercise) => exerciseShortLabel(exercise.short_name, exercise.name))
    .join(" · ");
}

export function exercisesById(
  exercises: readonly ExerciseWithMax[],
): Map<string, ExerciseWithMax> {
  return new Map(exercises.map((exercise) => [exercise.id, exercise]));
}

export type HubQueueSecondaryAction = {
  key: string;
  label: string;
  onClick: () => void;
};

export function hubQueueSecondaryActions({
  canUnskip,
  canSkip,
  canBackfill,
  skipping,
  backfillLabel,
  onUnskip,
  onSkip,
  onBackfill,
}: {
  canUnskip: boolean;
  canSkip: boolean;
  canBackfill: boolean;
  skipping: boolean;
  backfillLabel: string;
  onUnskip: () => void;
  onSkip: () => void;
  onBackfill: () => void;
}): HubQueueSecondaryAction[] {
  const primary = canUnskip
    ? {
        key: "unskip",
        label: skipping ? "Возвращаю…" : "Вернуть пропущенную",
        onClick: onUnskip,
      }
    : canSkip
      ? {
          key: "skip",
          label: skipping ? "Пропускаю…" : "Пропустить",
          onClick: onSkip,
        }
      : null;

  const actions: HubQueueSecondaryAction[] = [];
  if (primary) {
    actions.push(primary);
  }
  if (canBackfill) {
    actions.push({
      key: "backfill",
      label: backfillLabel,
      onClick: onBackfill,
    });
  }
  return actions;
}
