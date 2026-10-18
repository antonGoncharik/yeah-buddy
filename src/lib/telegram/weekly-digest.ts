import { getReviewSnapshot } from "@/lib/ai/review";
import { formatSignedBodyWeight } from "@/lib/day/body-weight";
import { shiftIsoDate } from "@/lib/day/dates";
import { macroInGoal } from "@/lib/nutrition/macro-hit";
import { pluralWorkouts } from "@/lib/workout/history-stats";

export function weeklyDigestText(input: {
  proteinHit: number;
  proteinDays: number;
  gymSessions: number;
  /** Sessions the program expected that week; 0 when there is no plan. */
  gymPlanned: number;
  /** This week's average minus last week's, when both weeks have weigh-ins. */
  weightDelta: number | null;
  /** New bar records inside the week. */
  records: number;
}): string {
  const protein =
    input.proteinDays > 0
      ? `белок ${input.proteinHit}/${input.proteinDays}`
      : "белок —";
  const gym =
    input.gymPlanned > 0
      ? `зал ${input.gymSessions} из ${input.gymPlanned}`
      : `зал ${input.gymSessions} ${pluralWorkouts(input.gymSessions)}`;
  const weight =
    input.weightDelta != null && Math.abs(input.weightDelta) >= 0.05
      ? `, вес ${formatSignedBodyWeight(input.weightDelta)} кг к прошлой неделе`
      : "";
  const records =
    input.records > 0
      ? `, ${input.records} ${input.records === 1 ? "рекорд" : "рекорда"}`
      : "";
  return `Неделя: ${protein}, ${gym}${weight}${records}`;
}

export async function buildWeeklyDigestForUser(
  userId: string,
  anchorDate: string,
): Promise<string | null> {
  const to = shiftIsoDate(anchorDate, -1);
  const from = shiftIsoDate(anchorDate, -7);
  const priorFrom = shiftIsoDate(anchorDate, -14);
  const snapshot = await getReviewSnapshot(userId, 14, to);
  if (snapshot.brief.coverage === "empty") {
    return null;
  }

  const days = snapshot.brief.nutrition.days.filter(
    (day) => day.date >= from && day.date <= to,
  );
  let proteinHit = 0;
  let proteinDays = 0;
  for (const day of days) {
    if (day.protein_target <= 0) {
      continue;
    }
    proteinDays += 1;
    if (macroInGoal(day.protein, day.protein_target)) {
      proteinHit += 1;
    }
  }

  const sessions = snapshot.brief.gym.sessions.filter(
    (session) => session.date >= from && session.date <= to,
  );
  const gymSessions = sessions.filter(
    (session) => session.status === "completed",
  ).length;
  // Completed plus skipped: a skipped day was on the plan, an open one is not
  // settled yet. The brief only carries those two statuses.
  const gymPlanned = sessions.length;

  const weekWeights = averageWeight(snapshot.brief.nutrition.days, from, to);
  const priorWeights = averageWeight(
    snapshot.brief.nutrition.days,
    priorFrom,
    shiftIsoDate(from, -1),
  );
  const weightDelta =
    weekWeights != null && priorWeights != null
      ? weekWeights - priorWeights
      : null;

  const records = snapshot.brief.gym.records.filter(
    (record) => record.date >= from && record.date <= to,
  ).length;

  return weeklyDigestText({
    proteinHit,
    proteinDays,
    gymSessions,
    gymPlanned,
    weightDelta,
    records,
  });
}

function averageWeight(
  days: ReadonlyArray<{ date: string; weight: number | null }>,
  from: string,
  to: string,
): number | null {
  const weights = days
    .filter((day) => day.date >= from && day.date <= to)
    .map((day) => day.weight)
    .filter((value): value is number => value != null && value > 0);
  if (weights.length === 0) {
    return null;
  }
  const sum = weights.reduce((total, value) => total + value, 0);
  return sum / weights.length;
}
