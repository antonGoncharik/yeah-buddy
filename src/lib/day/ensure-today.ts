import { ApiError, postJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import type { DayType } from "@/lib/types";

export async function ensureTodayDay(dayType: DayType = "rest"): Promise<void> {
  try {
    await postJson("/api/days", {
      date: calendarToday(),
      dayType,
    });
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 409) {
      return;
    }
    throw caught;
  }
}
