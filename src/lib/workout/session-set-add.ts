export type WorkSetPlan = {
  set_type: string;
  set_number: number;
  planned_weight: number | null;
  planned_reps: number | null;
  planned_reps_to: number | null;
  planned_seconds: number | null;
  planned_rir: number | null;
};

/** One more work set, copied from the last work set. Does not touch 1RM. */
export function nextWorkSetPlan(
  sets: readonly WorkSetPlan[],
): WorkSetPlan | null {
  const work = sets.filter((set) => set.set_type === "work");
  const last = work.reduce<WorkSetPlan | null>(
    (best, set) =>
      best == null || set.set_number > best.set_number ? set : best,
    null,
  );
  if (!last) {
    return null;
  }

  return {
    set_type: "work",
    set_number: last.set_number + 1,
    planned_weight: last.planned_weight,
    planned_reps: last.planned_reps,
    planned_reps_to: last.planned_reps_to,
    planned_seconds: last.planned_seconds,
    planned_rir: last.planned_rir,
  };
}

/** The last work set, when another work set would remain and this one is still open. */
export function droppableWorkSetId(
  sets: readonly {
    id: string;
    set_type: string;
    set_number: number;
    is_completed: boolean;
  }[],
): string | null {
  const work = sets.filter((set) => set.set_type === "work");
  if (work.length < 2) {
    return null;
  }
  const last = work.reduce((best, set) =>
    set.set_number > best.set_number ? set : best,
  );
  return last.is_completed ? null : last.id;
}
