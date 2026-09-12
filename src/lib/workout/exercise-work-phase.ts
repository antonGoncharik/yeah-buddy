import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseType } from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";

export interface PhaseMeta {
  phase_type: PhaseType;
  name: string | null;
  macro_number: number | null;
}

export async function loadPhaseMeta(
  userId: string,
  phaseIds: string[],
): Promise<Map<string, PhaseMeta>> {
  const unique = [...new Set(phaseIds)];
  const meta = new Map<string, PhaseMeta>();
  if (unique.length === 0) {
    return meta;
  }

  const supabase = createSupabaseServerClient();
  const phasesResult = await supabase
    .from("workout_phases")
    .select("id, phase_type, name, macro_cycle_id")
    .eq("user_id", userId)
    .in("id", unique);

  if (phasesResult.error) {
    throw phasesResult.error;
  }

  const macroIds = [
    ...new Set(
      (phasesResult.data ?? []).flatMap((row) =>
        typeof row.macro_cycle_id === "string" ? [row.macro_cycle_id] : [],
      ),
    ),
  ];
  const numbers = new Map<string, number>();
  if (macroIds.length > 0) {
    const macrosResult = await supabase
      .from("macro_cycles")
      .select("id, number")
      .eq("user_id", userId)
      .in("id", macroIds);
    if (macrosResult.error) {
      throw macrosResult.error;
    }
    for (const row of macrosResult.data ?? []) {
      if (typeof row.id === "string" && Number.isFinite(Number(row.number))) {
        numbers.set(row.id, Number(row.number));
      }
    }
  }

  for (const row of phasesResult.data ?? []) {
    const phaseType = isPhaseType(row.phase_type) ? row.phase_type : null;
    if (typeof row.id !== "string" || !phaseType) {
      continue;
    }
    meta.set(row.id, {
      phase_type: phaseType,
      name: typeof row.name === "string" ? row.name : null,
      macro_number:
        typeof row.macro_cycle_id === "string"
          ? (numbers.get(row.macro_cycle_id) ?? null)
          : null,
    });
  }

  return meta;
}

export function formatWorkDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
