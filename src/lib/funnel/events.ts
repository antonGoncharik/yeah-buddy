export const FUNNEL_EVENTS = [
  "onboarding_done",
  "first_food",
  "first_session",
  "share",
  "program_start",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return (
    typeof value === "string" && FUNNEL_EVENTS.some((event) => event === value)
  );
}
