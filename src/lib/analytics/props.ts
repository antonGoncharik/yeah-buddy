import type { ProductEvent } from "@/lib/analytics/events";

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

const EVENT_PROP_KEYS: Record<ProductEvent, readonly string[]> = {
  onboarding_step_view: ["step"],
  onboarding_step_complete: ["step"],
  energy_offer_shown: ["rest_kcal"],
  energy_offer_applied: [],
  energy_offer_dismissed: [],
  muscles_view: ["horizon_days"],
  muscle_map_opened: ["horizon_days"],
  muscle_map_action: ["action", "muscle_id"],
  sync_failed: ["kind", "status", "url"],
  reminder_opened: ["via"],
  food_logged: ["method"],
  workout_started: [],
  workout_completed: [],
  share_publish: [],
  share_send: ["channel"],
  pack_apply: ["kind"],
  coach_claim: [],
  buddy_claim: [],
  reminder_sent: ["kind"],
  reminder_blocked: ["kind"],
  ai_request: ["kind", "ok"],
  ai_failed: ["kind"],
  ai_empty: ["kind"],
  landing_cta_click: ["src"],
};

export function sanitizeProductProps(
  event: ProductEvent,
  props: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const allowed = new Set(EVENT_PROP_KEYS[event]);
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!allowed.has(key) || FORBIDDEN_PROP_KEYS.has(key)) {
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
