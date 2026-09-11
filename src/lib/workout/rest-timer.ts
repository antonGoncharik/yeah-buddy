export const WORK_REST_SECONDS = 180;
export const REST_ADJUST_SECONDS = 30;
export const REST_MIN_SECONDS = 30;
export const REST_MAX_SECONDS = 900;
export const REST_TIMER_KEY_PREFIX = "yb.rest:";
export const REST_LAST_KEY = "yb.rest.last";

export interface RestTimerState {
  endsAt: number;
  exerciseId: string | null;
}

export function restTimerKey(sessionId: string): string {
  return `${REST_TIMER_KEY_PREFIX}${sessionId}`;
}

export function restLeftAt(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

export function clampRestSeconds(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) {
    return WORK_REST_SECONDS;
  }
  return Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, rounded));
}

export function nextRestPreset(current: number, delta: number): number {
  return clampRestSeconds(current + delta);
}

export function parseRestEndsAt(raw: string | null): number | null {
  return parseRestState(raw)?.endsAt ?? null;
}

export function parseRestState(raw: string | null): RestTimerState | null {
  if (raw == null || raw === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("endsAt" in parsed) ||
      typeof parsed.endsAt !== "number" ||
      !Number.isFinite(parsed.endsAt)
    ) {
      return null;
    }

    const exerciseId =
      "exerciseId" in parsed &&
      typeof parsed.exerciseId === "string" &&
      parsed.exerciseId !== ""
        ? parsed.exerciseId
        : null;

    return { endsAt: parsed.endsAt, exerciseId };
  } catch {
    return null;
  }
}

export function serializeRestEndsAt(endsAt: number): string {
  return serializeRestState({ endsAt, exerciseId: null });
}

export function serializeRestState(state: RestTimerState): string {
  return JSON.stringify(
    state.exerciseId
      ? { endsAt: state.endsAt, exerciseId: state.exerciseId }
      : { endsAt: state.endsAt },
  );
}

const restMemory = new Map<string, RestTimerState>();
const lastMemory = new Map<string, number>();
let lastLoaded = false;

function restStorage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function readStoredRestState(sessionId: string): RestTimerState | null {
  const memory = restMemory.get(sessionId);
  if (memory != null) {
    return memory;
  }
  return parseRestState(
    restStorage()?.getItem(restTimerKey(sessionId)) ?? null,
  );
}

export function readStoredRestEndsAt(sessionId: string): number | null {
  return readStoredRestState(sessionId)?.endsAt ?? null;
}

export function writeStoredRestState(
  sessionId: string,
  state: RestTimerState,
): void {
  restMemory.set(sessionId, state);
  restStorage()?.setItem(restTimerKey(sessionId), serializeRestState(state));
}

export function writeStoredRestEndsAt(sessionId: string, endsAt: number): void {
  const current = readStoredRestState(sessionId);
  writeStoredRestState(sessionId, {
    endsAt,
    exerciseId: current?.exerciseId ?? null,
  });
}

export function clearStoredRest(sessionId: string): void {
  restMemory.delete(sessionId);
  restStorage()?.removeItem(restTimerKey(sessionId));
}

export function readLastRestSeconds(exerciseId: string): number {
  loadLastMap();
  return lastMemory.get(exerciseId) ?? WORK_REST_SECONDS;
}

export function writeLastRestSeconds(
  exerciseId: string,
  seconds: number,
): void {
  loadLastMap();
  lastMemory.set(exerciseId, clampRestSeconds(seconds));
  persistLastMap();
}

function loadLastMap(): void {
  if (lastLoaded) {
    return;
  }
  lastLoaded = true;
  const raw = restStorage()?.getItem(REST_LAST_KEY);
  if (raw == null || raw === "") {
    return;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        lastMemory.set(id, clampRestSeconds(value));
      }
    }
  } catch {
    return;
  }
}

function persistLastMap(): void {
  const storage = restStorage();
  if (!storage) {
    return;
  }

  const payload: Record<string, number> = {};
  for (const [id, seconds] of lastMemory) {
    payload[id] = seconds;
  }
  storage.setItem(REST_LAST_KEY, JSON.stringify(payload));
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
