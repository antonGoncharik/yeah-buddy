const FORBIDDEN_PROP_KEYS = new Set([
  "telegram_id",
  "telegramId",
  "weight",
  "waist",
  "body_weight",
  "bodyWeight",
  "food",
  "food_name",
  "foodName",
  "name",
  "init_data",
  "initData",
]);

export function sanitizeProductProps(
  props: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEYS.has(key)) {
      continue;
    }
    const normalized = normalizePropValue(value);
    if (normalized !== undefined) {
      safe[key] = normalized;
    }
  }
  return safe;
}

function normalizePropValue(
  value: unknown,
): string | number | boolean | null | undefined {
  if (value == null) {
    return null;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    if (typeof value === "string" && value.length > 200) {
      return value.slice(0, 200);
    }
    return value;
  }
  return undefined;
}
