import { buildReviewBrief } from "@/lib/ai/brief";
import { ReviewError } from "@/lib/ai/errors";
import { getGeminiReviewApiKey, writeReview } from "@/lib/ai/gemini";
import { getAiQuota, refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { isReviewRange, type ReviewRange, reviewWindow } from "@/lib/ai/range";
import { listStoredReviews, saveStoredReview } from "@/lib/ai/review-store";
import type { ReviewSnapshot, StoredReview } from "@/lib/ai/types";
import {
  getLastBodyWeight,
  getUserCalendarToday,
  listDaysInRange,
  listFoodSharesInRange,
} from "@/lib/days";
import { AI_REVIEW_EMPTY, AI_REVIEW_NO_KEY } from "@/lib/messages";
import type { RecentWorkoutSession } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { getStrengthProgress } from "@/lib/workout/progress";
import { listSessionHistory } from "@/lib/workout/sessions";

const COOLDOWN_MS = 20_000;
const SESSION_WORK_LIMIT = 8;
const lastWrite = new Map<string, number>();

export function parseReviewRange(value: unknown): ReviewRange | null {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return isReviewRange(parsed) ? parsed : null;
  }
  if (typeof value === "number") {
    return isReviewRange(value) ? value : null;
  }
  return null;
}

export async function getReviewSnapshot(
  userId: string,
  range: ReviewRange,
  today?: string,
): Promise<ReviewSnapshot> {
  const resolvedToday = today ?? (await getUserCalendarToday(userId));
  const [brief, stored, quota] = await Promise.all([
    loadReviewBrief(userId, range, resolvedToday),
    listStoredReviews(userId, range),
    getAiQuota(userId, "review"),
  ]);
  return {
    configured: quota.configured,
    remaining: quota.remaining,
    brief,
    review: stored[0] ?? null,
    previous: stored[1] ?? null,
  };
}

export async function createReview(
  userId: string,
  range: ReviewRange,
  today?: string,
): Promise<ReviewSnapshot> {
  const key = getGeminiReviewApiKey();
  if (!key) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const now = Date.now();
  const previousWrite = lastWrite.get(userId) ?? 0;
  if (now - previousWrite < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const resolvedToday = today ?? (await getUserCalendarToday(userId));
  const [brief, stored] = await Promise.all([
    loadReviewBrief(userId, range, resolvedToday),
    listStoredReviews(userId, range),
  ]);
  if (brief.coverage === "empty") {
    throw new ReviewError("EMPTY", AI_REVIEW_EMPTY);
  }

  const slot = await takeAiSlot(userId, "review");
  lastWrite.set(userId, now);

  const previous = stored[0] ?? null;
  let review: StoredReview;
  try {
    const text = await writeReview(brief, previous);
    review = await saveStoredReview(
      userId,
      range,
      { from: brief.from, to: brief.to },
      text,
    );
  } catch (error) {
    lastWrite.delete(userId);
    await refundAiSlot(userId, "review");
    throw error;
  }

  return {
    configured: true,
    remaining: slot.remaining,
    brief,
    review,
    previous,
  };
}

async function loadReviewBrief(
  userId: string,
  range: ReviewRange,
  today: string,
) {
  const { start, end } = reviewWindow(today, range);
  const [days, foods, sessions, macro, progress, seedWeight] =
    await Promise.all([
      listDaysInRange(userId, start, end),
      listFoodSharesInRange(userId, start, end),
      loadReviewSessions(userId, start, end),
      getCurrentMacroState(userId),
      getStrengthProgress(userId),
      getLastBodyWeight(userId, start),
    ]);

  return buildReviewBrief({
    range,
    from: start,
    to: end,
    days,
    sessions,
    foods,
    macro,
    progress,
    seedWeight,
  });
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
