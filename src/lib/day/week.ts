import { isIsoDate, isWritableDayDate, shiftIsoDate } from "@/lib/day/dates";
import { parseDayHistoryPayload } from "@/lib/day/map";
import { isRecord, toNullableString } from "@/lib/read";
import type { DayHistoryRow, SessionStatus, WorkoutKind } from "@/lib/types";

export const WEEK_LENGTH = 7;

export interface WeekSessionInput {
  id: string;
  session_date: string;
  status: SessionStatus;
  template_name: string | null;
  workout_type?: WorkoutKind;
}

export interface WeekSessionFact {
  id: string;
  template_name: string | null;
  status: "completed" | "planned";
  workout_type: WorkoutKind;
}

export interface WeekSlot {
  date: string;
  day: DayHistoryRow | null;
  session: WeekSessionFact | null;
}

export interface WeekSnapshot {
  today: string;
  items: WeekSlot[];
}

export function weekWindow(today: string): { start: string; end: string } {
  return {
    start: shiftIsoDate(today, 1 - WEEK_LENGTH),
    end: today,
  };
}

export function weekDates(today: string): string[] {
  return Array.from({ length: WEEK_LENGTH }, (_, index) =>
    shiftIsoDate(today, -index),
  );
}

export function dayHasFood(day: DayHistoryRow | null): boolean {
  if (!day) {
    return false;
  }

  return (
    day.fact_protein > 0 ||
    day.fact_fat > 0 ||
    day.fact_carbs > 0 ||
    day.fact_kcal > 0
  );
}

export function weekHasEntries(slots: WeekSlot[]): boolean {
  return slots.some((slot) => slot.day != null || slot.session != null);
}

export function buildWeekSlots(input: {
  today: string;
  days: DayHistoryRow[];
  sessions: WeekSessionInput[];
}): WeekSlot[] {
  const dates = weekDates(input.today);
  const start = dates.at(-1) ?? input.today;
  const dayByDate = new Map<string, DayHistoryRow>();
  for (const day of input.days) {
    if (day.date < start || day.date > input.today || dayByDate.has(day.date)) {
      continue;
    }
    dayByDate.set(day.date, day);
  }

  const sessionByDate = new Map<string, WeekSessionFact>();
  for (const session of input.sessions) {
    if (session.session_date < start || session.session_date > input.today) {
      continue;
    }
    const picked = pickSession(
      sessionByDate.get(session.session_date) ?? null,
      session,
      input.today,
    );
    if (picked) {
      sessionByDate.set(session.session_date, picked);
    }
  }

  return dates.map((date) => ({
    date,
    day: dayByDate.get(date) ?? null,
    session: sessionByDate.get(date) ?? null,
  }));
}

export function weekSlotHref(
  slot: WeekSlot,
  today: string,
  fromSettings = false,
): string | null {
  if (slot.day) {
    if (isWritableDayDate(slot.date, today)) {
      return slot.date === today
        ? "/today"
        : `/today?date=${encodeURIComponent(slot.date)}`;
    }
    const params = new URLSearchParams();
    params.set("date", slot.date);
    params.set("view", "history");
    if (fromSettings) {
      params.set("from", "settings");
    }
    return `/today?${params.toString()}`;
  }

  if (slot.session) {
    return `/workouts/sessions/${slot.session.id}`;
  }

  return null;
}

export function parseWeekPayload(data: unknown): WeekSnapshot | null {
  if (
    !isRecord(data) ||
    typeof data.today !== "string" ||
    !isIsoDate(data.today)
  ) {
    return null;
  }
  if (!Array.isArray(data.items)) {
    return null;
  }

  const items: WeekSlot[] = [];
  for (const item of data.items) {
    if (!isRecord(item)) {
      return null;
    }
    const slot = parseWeekSlot(item);
    if (!slot) {
      return null;
    }
    items.push(slot);
  }

  return { today: data.today, items };
}

function pickSession(
  current: WeekSessionFact | null,
  candidate: WeekSessionInput,
  today: string,
): WeekSessionFact | null {
  if (!isWeekGymSession(candidate, today)) {
    return current;
  }

  const next: WeekSessionFact = {
    id: candidate.id,
    template_name: candidate.template_name,
    status: candidate.status,
    workout_type: candidate.workout_type === "static" ? "static" : "dynamic",
  };
  if (!current) {
    return next;
  }
  if (current.status !== "completed" && next.status === "completed") {
    return next;
  }
  return current;
}

function isWeekGymSession(
  session: WeekSessionInput,
  today: string,
): session is WeekSessionInput & { status: "completed" | "planned" } {
  if (session.status === "skipped" || !isIsoDate(session.session_date)) {
    return false;
  }
  if (session.status === "completed") {
    return true;
  }
  return session.status === "planned" && session.session_date === today;
}

function parseWeekSlot(row: Record<string, unknown>): WeekSlot | null {
  if (typeof row.date !== "string" || !isIsoDate(row.date)) {
    return null;
  }

  let day: DayHistoryRow | null = null;
  if (row.day != null) {
    if (!isRecord(row.day)) {
      return null;
    }
    day = parseDayHistoryPayload(row.day);
    if (!day) {
      return null;
    }
  }

  let session: WeekSessionFact | null = null;
  if (row.session != null) {
    session = parseWeekSession(row.session);
    if (!session) {
      return null;
    }
  }

  return { date: row.date, day, session };
}

function parseWeekSession(value: unknown): WeekSessionFact | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }
  if (value.status !== "completed" && value.status !== "planned") {
    return null;
  }

  return {
    id: value.id,
    template_name: toNullableString(value.template_name),
    status: value.status,
    workout_type: value.workout_type === "static" ? "static" : "dynamic",
  };
}
