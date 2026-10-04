import { format } from "date-fns";

import { forgetJson, mutateJson, writeJson } from "@/lib/api-cache";
import { sessionDateUrl } from "@/lib/workout/session-local";

const MACRO_URL = "/api/macros";
const TEMPLATES_URL = "/api/templates";

export function forgetGymHubCaches(...sessionDates: string[]): void {
  forgetJson(MACRO_URL);
  forgetJson(TEMPLATES_URL);
  const dates = new Set(sessionDates);
  dates.add(format(new Date(), "yyyy-MM-dd"));
  for (const date of dates) {
    forgetJson(sessionDateUrl(date));
  }
}

/** Refetch gym hub data after sessions, macro transitions, or preset apply. */
export async function syncGymCachesAfterWorkoutChange(
  sessionDate?: string,
): Promise<void> {
  const today = format(new Date(), "yyyy-MM-dd");
  const dates = new Set<string>([today]);
  if (sessionDate) {
    dates.add(sessionDate);
  }

  await Promise.all([
    ...[...dates].map(async (date) => {
      const url = sessionDateUrl(date);
      const data = await mutateJson(url);
      writeJson(url, data);
    }),
    mutateJson(MACRO_URL).then((data) => writeJson(MACRO_URL, data)),
    mutateJson(TEMPLATES_URL).then((data) => writeJson(TEMPLATES_URL, data)),
  ]);
}
