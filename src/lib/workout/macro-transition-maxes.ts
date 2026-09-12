import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CyclePhaseDef,
  PhaseMaxRow,
  TransitionPreview,
} from "@/lib/types";
import { recapEndPhaseKey } from "@/lib/workout/cycle";
import { listPhaseMaxRows } from "@/lib/workout/macro-maxes";
import { mapWorkoutPhase } from "@/lib/workout/map-rows";

export function toTransitionMaxes(
  rows: PhaseMaxRow[],
  propose: (current: number, step: number) => number,
): TransitionPreview["maxes"] {
  return rows.flatMap((row) => {
    if (!row.phase_max) {
      return [];
    }

    return [
      {
        exercise_id: row.exercise.id,
        name: row.exercise.short_name || row.exercise.name,
        current_weight: row.phase_max.max_weight,
        proposed_weight: propose(
          row.phase_max.max_weight,
          row.exercise.weight_step,
        ),
      },
    ];
  });
}

export async function getRecapEndMaxes(
  userId: string,
  macroId: string,
  cycle: CyclePhaseDef[],
): Promise<PhaseMaxRow[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macroId)
    .order("sort_order", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  const phases = (result.data ?? []).map((row) =>
    mapWorkoutPhase(row as Record<string, unknown>),
  );
  const endKey = recapEndPhaseKey(
    cycle,
    phases.map((phase) => phase.phase_type),
  );
  const end =
    phases.find((phase) => phase.phase_type === endKey) ?? phases.at(-1);
  if (!end) {
    return [];
  }

  return listPhaseMaxRows(userId, end.id);
}
