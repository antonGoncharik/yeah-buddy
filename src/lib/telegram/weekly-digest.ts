import { getReviewSnapshot } from "@/lib/ai/review";
import { formatSignedBodyWeight } from "@/lib/day/body-weight";
import { shiftIsoDate } from "@/lib/day/dates";

export function weeklyDigestText(input: {
  proteinHit: number;
  proteinDays: number;
  gymSessions: number;
  weightDelta: number | null;
}): string {
  const protein =
    input.proteinDays > 0
      ? `белок ${input.proteinHit}/${input.proteinDays}`
      : "белок —";
  const gym = `зал ${input.gymSessions}`;
  const weight =
    input.weightDelta != null && Math.abs(input.weightDelta) >= 0.05
      ? `, вес ${formatSignedBodyWeight(input.weightDelta)} кг`
      : "";
  return `Неделя: ${protein}, ${gym}${weight}`;
}

export async function buildWeeklyDigestForUser(
  userId: string,
  anchorDate: string,
): Promise<string | null> {
  const to = shiftIsoDate(anchorDate, -1);
  const from = shiftIsoDate(anchorDate, -7);
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
    if (day.protein >= day.protein_target * 0.98) {
      proteinHit += 1;
    }
  }
  const weights = days
    .map((day) => day.weight)
    .filter((value): value is number => value != null && value > 0);
  const weightDelta =
    weights.length >= 2
      ? (weights[weights.length - 1] ?? 0) - (weights[0] ?? 0)
      : null;

  return weeklyDigestText({
    proteinHit,
    proteinDays,
    gymSessions: snapshot.brief.gym.completed,
    weightDelta,
  });
}
