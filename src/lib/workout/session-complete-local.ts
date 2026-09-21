import type { SessionDetail, SessionFeel } from "@/lib/types";
import type { CompleteSessionInput } from "@/lib/workout/session-schema";

/** A feel chosen while finish is still saving beats the stale reply. */
export function preferLiveFeel(
  live: SessionFeel | null,
  sent: SessionFeel | null,
  returned: SessionFeel | null,
): SessionFeel | null {
  if (live !== sent && returned === sent) {
    return live;
  }
  return returned;
}

export function completeSessionLocally(
  detail: SessionDetail,
  input: CompleteSessionInput = {},
): SessionDetail {
  const overrides = new Map(
    (input.sets ?? []).map((set) => [set.id, set] as const),
  );

  return {
    ...detail,
    session: {
      ...detail.session,
      status: "completed",
      note: input.note !== undefined ? input.note : detail.session.note,
      feel: input.feel !== undefined ? input.feel : detail.session.feel,
    },
    exercises: detail.exercises.map((item) => ({
      ...item,
      sets: item.sets.map((set) => {
        const override = overrides.get(set.id);
        return {
          ...set,
          actual_weight:
            override?.actual_weight !== undefined
              ? override.actual_weight
              : (set.actual_weight ?? set.planned_weight),
          actual_reps:
            override?.actual_reps !== undefined
              ? override.actual_reps
              : (set.actual_reps ?? set.planned_reps),
          actual_seconds:
            override?.actual_seconds !== undefined
              ? override.actual_seconds
              : (set.actual_seconds ?? set.planned_seconds),
          actual_rir:
            override?.actual_rir !== undefined
              ? override.actual_rir
              : set.actual_rir,
          is_completed: true,
          logged: override !== undefined || set.logged,
        };
      }),
    })),
  };
}
