import { buildReviewBrief } from "@/lib/ai/brief";
import { ReviewError } from "@/lib/ai/errors";
import { getGeminiApiKey, writeReview } from "@/lib/ai/gemini";
import { isReviewRange, type ReviewRange, reviewWindow } from "@/lib/ai/range";
import type { ReviewSnapshot, ReviewText } from "@/lib/ai/types";
import { calendarToday } from "@/lib/day/dates";
import {
  getLastBodyWeight,
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
  today = calendarToday(),
): Promise<ReviewSnapshot> {
  const brief = await loadReviewBrief(userId, range, today);
  return {
    configured: getGeminiApiKey() != null,
    brief,
    review: null,
  };
}

export async function createReview(
  userId: string,
  range: ReviewRange,
  today = calendarToday(),
): Promise<ReviewSnapshot> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const now = Date.now();
  const previous = lastWrite.get(userId) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const brief = await loadReviewBrief(userId, range, today);
  if (brief.coverage === "empty") {
    throw new ReviewError("EMPTY", AI_REVIEW_EMPTY);
  }

  lastWrite.set(userId, now);

  let review: ReviewText;
  try {
    review = await writeReview(brief);
  } catch (error) {
    lastWrite.delete(userId);
    throw error;
  }

  return {
    configured: true,
    brief,
    review,
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
