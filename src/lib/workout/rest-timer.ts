export const WORK_REST_SECONDS = 180;
export const REST_ADJUST_SECONDS = 30;

export function formatRestClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function nextRestLeft(current: number, delta: number): number {
  return Math.max(0, current + delta);
}

export function workSetsNeedRest(
  sets: Array<{ set_type: string; planned_seconds: number | null }>,
): boolean {
  return sets.some(
    (set) => set.set_type === "work" && set.planned_seconds == null,
  );
}
