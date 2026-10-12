import { buildReviewBrief } from "@/lib/ai/brief";
import { ReviewError } from "@/lib/ai/errors";
import { readGeminiKeys, writeReview } from "@/lib/ai/gemini";
import { loadReviewSource } from "@/lib/ai/load-review-source";
import { getAiQuota, refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { isReviewRange, type ReviewRange } from "@/lib/ai/range";
import { listStoredReviews, saveStoredReview } from "@/lib/ai/review-store";
import type { ReviewSnapshot, StoredReview } from "@/lib/ai/types";
import { getUserCalendarToday } from "@/lib/days";
import { AI_REVIEW_EMPTY, AI_REVIEW_NO_KEY } from "@/lib/messages";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOLDOWN_MS = 20_000;

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
  if (readGeminiKeys("review").length === 0) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const resolvedToday = today ?? (await getUserCalendarToday(userId));
  const settings = await getUserSettings(userId);
  const cooldownUntil = settings?.review_cooldown_until;
  if (cooldownUntil != null && Date.parse(cooldownUntil) > Date.now()) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }
  const [brief, stored] = await Promise.all([
    loadReviewBrief(userId, range, resolvedToday),
    listStoredReviews(userId, range),
  ]);
  if (brief.coverage === "empty") {
    throw new ReviewError("EMPTY", AI_REVIEW_EMPTY);
  }

  const slot = await takeAiSlot(userId, "review");

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
    await setReviewCooldown(userId);
  } catch (error) {
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

async function setReviewCooldown(userId: string): Promise<void> {
  const until = new Date(Date.now() + COOLDOWN_MS).toISOString();
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("user_settings")
    .update({ review_cooldown_until: until })
    .eq("user_id", userId);
  if (updated.error) {
    throw updated.error;
  }
}

async function loadReviewBrief(
  userId: string,
  range: ReviewRange,
  today: string,
) {
  const source = await loadReviewSource(userId, range, today);
  return buildReviewBrief(source);
}
