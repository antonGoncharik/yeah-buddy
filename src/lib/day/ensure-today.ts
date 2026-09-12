import { ApiError, postJson } from "@/lib/api-cache";
import type { DayType } from "@/lib/types";

export async function ensureTodayDay(dayType: DayType = "rest"): Promise<void> {
  try {
    await postJson("/api/days", {
      dayType,
    });
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 409) {
      return;
    }
    throw caught;
  }
}
