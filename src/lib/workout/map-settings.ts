import { isRecord } from "@/lib/read";
import type { WorkoutSettings } from "@/lib/types";
import { toNumber } from "@/lib/workout/numbers";
import {
  parseFormulas,
  parseSkipTemplateIds,
} from "@/lib/workout/parse-formulas";

export { formulasSchema } from "@/lib/workout/formulas-schema";
export { fillFormulas } from "@/lib/workout/parse-formulas";

export function mapWorkoutSettings(
  row: Record<string, unknown>,
): WorkoutSettings {
  return {
    user_id: String(row.user_id),
    max_increase_percent: toNumber(row.max_increase_percent),
    formulas: parseFormulas(row.formulas),
    skip_template_ids: parseSkipTemplateIds(row),
    updated_at: String(row.updated_at),
  };
}

export function parseWorkoutSettings(value: unknown): WorkoutSettings | null {
  if (
    !isRecord(value) ||
    !isRecord(value.formulas) ||
    value.max_increase_percent == null
  ) {
    return null;
  }

  const settings = mapWorkoutSettings(value);
  if (settings.formulas.warmups == null) {
    return null;
  }

  return settings;
}

export function readWorkoutSettingsPayload(
  data: unknown,
): WorkoutSettings | null {
  return isRecord(data) ? parseWorkoutSettings(data.settings) : null;
}
