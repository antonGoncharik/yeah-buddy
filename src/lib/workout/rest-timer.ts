export const WORK_REST_SECONDS = 180;
export const REST_ADJUST_SECONDS = 30;
export const REST_TIMER_KEY_PREFIX = "yb.rest:";

export function restTimerKey(sessionId: string): string {
  return `${REST_TIMER_KEY_PREFIX}${sessionId}`;
}

export function restLeftAt(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function parseRestEndsAt(raw: string | null): number | null {
  if (raw == null || raw === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "endsAt" in parsed &&
      typeof parsed.endsAt === "number" &&
      Number.isFinite(parsed.endsAt)
    ) {
      return parsed.endsAt;
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeRestEndsAt(endsAt: number): string {
  return JSON.stringify({ endsAt });
}

const restMemory = new Map<string, number>();

function restStorage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function readStoredRestEndsAt(sessionId: string): number | null {
  const memory = restMemory.get(sessionId);
  if (memory != null) {
    return memory;
  }
  return parseRestEndsAt(
    restStorage()?.getItem(restTimerKey(sessionId)) ?? null,
  );
}

export function writeStoredRestEndsAt(sessionId: string, endsAt: number): void {
  restMemory.set(sessionId, endsAt);
  restStorage()?.setItem(restTimerKey(sessionId), serializeRestEndsAt(endsAt));
}

export function clearStoredRest(sessionId: string): void {
  restMemory.delete(sessionId);
  restStorage()?.removeItem(restTimerKey(sessionId));
}

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
