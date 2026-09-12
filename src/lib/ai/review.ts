import { buildReviewBrief } from "@/lib/ai/brief";
import { ReviewError } from "@/lib/ai/errors";
import { getGeminiApiKey, writeReview } from "@/lib/ai/gemini";
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
import { getCurrentMacroState } from "@/lib/workout/macros";
import { getStrengthProgress } from "@/lib/workout/progress";
import { listSessionHistory } from "@/lib/workout/sessions";

const COOLDOWN_MS = 20_000;
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
  const [brief, stored] = await Promise.all([
    loadReviewBrief(userId, range, resolvedToday),
    listStoredReviews(userId, range),
  ]);
  return {
    configured: getGeminiApiKey() != null,
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
  const key = getGeminiApiKey();
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
    throw error;
  }

  return {
    configured: true,
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
  const [days, foods, sessionsPage, macro, progress, seedWeight] =
    await Promise.all([
      listDaysInRange(userId, start, end),
      listFoodSharesInRange(userId, start, end),
      listSessionHistory(userId, {
        since: start,
        limit: 40,
        statuses: ["completed", "skipped"],
      }),
      getCurrentMacroState(userId),
      getStrengthProgress(userId),
      getLastBodyWeight(userId, start),
    ]);

  const sessions = sessionsPage.items.filter(
    (item) =>
      item.session.session_date >= start && item.session.session_date <= end,
  );

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
