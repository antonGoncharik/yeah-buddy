import type { ReviewRange } from "@/lib/ai/range";
import { reviewWindow } from "@/lib/ai/range";
import type { ReviewSource } from "@/lib/ai/review-source";
import {
  getLastBodyWeight,
  getLastWaist,
  listDaysInRange,
  listFoodSharesInRange,
} from "@/lib/days";
import { getUserSettings } from "@/lib/settings";
import type { RecentWorkoutSession } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { getMuscleSnapshot } from "@/lib/workout/muscle-load";
import { getStrengthProgress } from "@/lib/workout/progress";
import { listSessionHistory } from "@/lib/workout/sessions";

const SESSION_WORK_LIMIT = 8;

export async function loadReviewSource(
  userId: string,
  range: ReviewRange,
  today: string,
): Promise<ReviewSource> {
  const { start, end } = reviewWindow(today, range);
  const [
    days,
    foods,
    sessions,
    macro,
    progress,
    seedWeight,
    seedWaist,
    settings,
    muscles,
  ] = await Promise.all([
    listDaysInRange(userId, start, end),
    listFoodSharesInRange(userId, start, end),
    loadReviewSessions(userId, start, end),
    getCurrentMacroState(userId),
    getStrengthProgress(userId),
    getLastBodyWeight(userId, start),
    getLastWaist(userId, start),
    getUserSettings(userId),
    getMuscleSnapshot(userId, range >= 30 ? 30 : range),
  ]);

  return {
    range,
    from: start,
    to: end,
    days,
    sessions,
    foods: foods.all,
    foodsRest: foods.rest,
    foodsTraining: foods.training,
    mealsRest: foods.mealsRest,
    mealsTraining: foods.mealsTraining,
    macro,
    progress,
    seedWeight: seedWeight?.weight ?? null,
    seedWaist: seedWaist?.cm ?? null,
    sex: settings?.sex ?? null,
    goal: settings?.goal ?? null,
    trainingAge: settings?.training_age ?? null,
    muscles,
  };
}

async function loadReviewSessions(userId: string, start: string, end: string) {
  const items: RecentWorkoutSession[] = [];
  let before: string | undefined;
  for (let page = 0; page < 3; page += 1) {
    const result = await listSessionHistory(userId, {
      since: start,
      until: end,
      before,
      limit: 120,
      statuses: ["completed", "skipped"],
      summaryLimit: SESSION_WORK_LIMIT,
      richWork: true,
    });
    items.push(...result.items);
    if (!result.next_before) {
      break;
    }
    before = result.next_before;
  }

  return items.filter(
    (item) =>
      item.session.session_date >= start && item.session.session_date <= end,
  );
}
