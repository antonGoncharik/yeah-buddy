export const MEAL_LOG_TEXT_MAX_CHARS = 600;

/** Client-safe validation for meal log text before API call. */
export function normalizeMealLogText(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed === "" || trimmed.length > MEAL_LOG_TEXT_MAX_CHARS) {
    return null;
  }
  return trimmed;
}
