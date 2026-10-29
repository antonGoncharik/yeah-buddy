import type { ExerciseProgress } from "@/lib/types";

export type ProgressSummaryFilter = "all" | "base" | "isolation";

export function rankExerciseProgress(
  items: ExerciseProgress[],
  programIds: readonly string[],
): ExerciseProgress[] {
  const order = new Map(programIds.map((id, index) => [id, index]));
  return [...items].sort((left, right) => {
    const leftMove =
      left.percent != null && left.percent !== 0 ? Math.abs(left.percent) : 0;
    const rightMove =
      right.percent != null && right.percent !== 0
        ? Math.abs(right.percent)
        : 0;
    if (leftMove !== rightMove) {
      return rightMove - leftMove;
    }
    const leftProgram = order.get(left.exercise_id);
    const rightProgram = order.get(right.exercise_id);
    if ((leftProgram != null) !== (rightProgram != null)) {
      return leftProgram != null ? -1 : 1;
    }
    if (
      leftProgram != null &&
      rightProgram != null &&
      leftProgram !== rightProgram
    ) {
      return leftProgram - rightProgram;
    }
    const leftBase = left.category === "base" ? 0 : 1;
    const rightBase = right.category === "base" ? 0 : 1;
    if (leftBase !== rightBase) {
      return leftBase - rightBase;
    }
    const leftDate = left.points.reduce(
      (latest, point) => (point.date > latest ? point.date : latest),
      "",
    );
    const rightDate = right.points.reduce(
      (latest, point) => (point.date > latest ? point.date : latest),
      "",
    );
    return rightDate.localeCompare(leftDate);
  });
}

export function exercisesForProgressSummary(
  tracked: ExerciseProgress[],
  filter: ProgressSummaryFilter,
  mixedCategories: boolean,
): ExerciseProgress[] {
  if (!mixedCategories || filter === "all") {
    return tracked;
  }
  if (filter === "isolation") {
    return tracked.filter((item) => item.category === "isolation");
  }
  return tracked.filter((item) => item.category !== "isolation");
}
