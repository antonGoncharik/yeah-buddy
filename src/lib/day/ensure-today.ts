import { ApiError, mutateJson, postJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { readDay } from "@/lib/day/today-payload";
import { isRecord } from "@/lib/read";
import type { DayType } from "@/lib/types";

export async function ensureTodayDay(
  dayType: DayType = "rest",
): Promise<string | null> {
  try {
    const data = await postJson("/api/days", {
      dayType,
    });
    return dayIdFromPayload(data);
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 409) {
      return loadTodayDayId();
    }
    throw caught;
  }
}

async function loadTodayDayId(): Promise<string | null> {
  try {
    const data = await mutateJson(`/api/days?date=${calendarToday()}`);
    return dayIdFromPayload(data);
  } catch {
    return null;
  }
}

function dayIdFromPayload(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }
  return readDay(data)?.id ?? readDay(data.day)?.id ?? null;
}
