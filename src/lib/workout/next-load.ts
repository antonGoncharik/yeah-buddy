import { formatWeight } from "@/lib/workout/numbers";
import { platesLine } from "@/lib/workout/plates";

export interface UpcomingExercise {
  name: string;
  sets: readonly {
    id: string;
    set_type: string;
    is_completed: boolean;
    planned_weight: number | null;
  }[];
}

/** The next open work set, with plates when it is a barbell. */
export function upcomingWorkLine(
  exercises: readonly UpcomingExercise[],
  openSetIds: readonly string[],
): string | null {
  const rows = exercises.flatMap((exercise) =>
    exercise.sets.map((set) => ({ ...set, name: exercise.name })),
  );
  const open = rows.find(
    (set) =>
      openSetIds.includes(set.id) &&
      set.set_type === "work" &&
      !set.is_completed &&
      set.planned_weight != null &&
      set.planned_weight > 0,
  );
  const fallback = rows.find(
    (set) =>
      set.set_type === "work" &&
      !set.is_completed &&
      set.planned_weight != null &&
      set.planned_weight > 0,
  );
  const hit = open ?? fallback;
  if (!hit?.planned_weight) {
    return null;
  }
  const head = `Следующий: ${hit.name} ${formatWeight(hit.planned_weight)} кг`;
  const plates = platesLine(hit.planned_weight);
  return plates ? `${head} · ${plates}` : head;
}
