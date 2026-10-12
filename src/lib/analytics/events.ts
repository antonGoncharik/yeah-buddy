export const CLIENT_PRODUCT_EVENTS = [
  "onboarding_step_view",
  "onboarding_step_complete",
  "energy_offer_shown",
  "muscles_view",
  "sync_failed",
] as const;

export type ClientProductEvent = (typeof CLIENT_PRODUCT_EVENTS)[number];

export const SERVER_PRODUCT_EVENTS = [
  "food_logged",
  "workout_started",
  "workout_completed",
  "share_publish",
  "share_send",
  "pack_apply",
  "coach_claim",
  "buddy_claim",
  "reminder_sent",
  "reminder_blocked",
  "energy_offer_applied",
  "energy_offer_dismissed",
  "ai_request",
  "landing_cta_click",
] as const;

export type ServerProductEvent = (typeof SERVER_PRODUCT_EVENTS)[number];

export const PRODUCT_EVENTS = [
  ...CLIENT_PRODUCT_EVENTS,
  ...SERVER_PRODUCT_EVENTS,
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];

const PRODUCT_EVENT_SET = new Set<string>(PRODUCT_EVENTS);

export function isProductEvent(value: unknown): value is ProductEvent {
  return typeof value === "string" && PRODUCT_EVENT_SET.has(value);
}

export function isClientProductEvent(
  value: unknown,
): value is ClientProductEvent {
  return (
    typeof value === "string" &&
    CLIENT_PRODUCT_EVENTS.some((event) => event === value)
  );
}
