import type { WorkoutTemplateDetail } from "@/lib/types";
import { WORK_REST_SECONDS } from "@/lib/workout/rest-timer";

/** Seconds of lifting on top of the rest, so the clock is not only the timer. */
const LIFT_SECONDS = 20;
/** Slot without its own scheme still follows the usual three work sets. */
const DEFAULT_WORK_SETS = 3;

export function templateSessionOutline(
  slots: readonly {
    plan: { groups: readonly { sets: number }[] | null } | null;
  }[],
): { exercises: number; workSets: number; minutes: number } | null {
  if (slots.length === 0) {
    return null;
  }

  let workSets = 0;
  for (const slot of slots) {
    const groups = slot.plan?.groups;
    if (groups && groups.length > 0) {
      workSets += groups.reduce(
        (sum, group) => sum + Math.max(0, group.sets),
        0,
      );
    } else {
      workSets += DEFAULT_WORK_SETS;
    }
  }

  if (workSets <= 0) {
    return null;
  }

  const rawMinutes = (workSets * (WORK_REST_SECONDS + LIFT_SECONDS)) / 60;
  const minutes = Math.max(5, Math.round(rawMinutes / 5) * 5);
  return { exercises: slots.length, workSets, minutes };
}

export function templateSessionLine(outline: {
  exercises: number;
  workSets: number;
  minutes: number;
}): string {
  return `${outline.exercises} ${exerciseWord(outline.exercises)} · ${outline.workSets} ${workSetWord(outline.workSets)} · ~${outline.minutes} мин`;
}

export function workoutTemplateSessionLine(
  template: WorkoutTemplateDetail,
): string | null {
  const outline = templateSessionOutline(
    template.exercises.map((exercise) => ({
      plan:
        template.slots.find((slot) => slot.exercise_id === exercise.id)?.plan ??
        null,
    })),
  );
  return outline ? templateSessionLine(outline) : null;
}

function exerciseWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "упражнение";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "упражнения";
  }
  return "упражнений";
}

function workSetWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "рабочий подход";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "рабочих подхода";
  }
  return "рабочих подходов";
}
