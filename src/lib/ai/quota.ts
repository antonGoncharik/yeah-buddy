import { ReviewError } from "@/lib/ai/errors";
import { getGeminiPlateApiKey, getGeminiReviewApiKey } from "@/lib/ai/gemini";
import {
  type AiKind,
  dailyLimit,
  remainingAfterUse,
} from "@/lib/ai/quota-copy";
import { getUserCalendarToday } from "@/lib/day/writable";
import { AI_PLATE_QUOTA, AI_REVIEW_QUOTA } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { AiKind } from "@/lib/ai/quota-copy";
export { plateRemainingLine } from "@/lib/ai/quota-copy";

export interface AiQuota {
  configured: boolean;
  remaining: number | null;
}

type UsageClient = ReturnType<typeof createSupabaseServerClient>;

export function hasAiKey(kind: AiKind): boolean {
  return kind === "plate"
    ? getGeminiPlateApiKey() != null
    : getGeminiReviewApiKey() != null;
}

export async function getAiQuota(
  userId: string,
  kind: AiKind,
): Promise<AiQuota> {
  if (!hasAiKey(kind)) {
    return { configured: false, remaining: 0 };
  }

  const usedOn = await getUserCalendarToday(userId);
  const supabase = createSupabaseServerClient();
  const used = await peekAiUsage(userId, kind, usedOn, supabase);
  if (used == null) {
    return { configured: true, remaining: null };
  }
  return {
    configured: true,
    remaining: remainingAfterUse(used, dailyLimit(kind)),
  };
}

export async function takeAiSlot(
  userId: string,
  kind: AiKind,
): Promise<{ remaining: number | null }> {
  const usedOn = await getUserCalendarToday(userId);
  const result = await consumeAiUsage(userId, kind, usedOn);
  if (result === "exhausted") {
    throw new ReviewError(
      "QUOTA",
      kind === "plate" ? AI_PLATE_QUOTA : AI_REVIEW_QUOTA,
    );
  }
  if (result === "untracked") {
    return { remaining: null };
  }
  return result;
}

export async function refundAiSlot(
  userId: string,
  kind: AiKind,
): Promise<void> {
  const usedOn = await getUserCalendarToday(userId);
  const supabase = createSupabaseServerClient();
  const used = await peekAiUsage(userId, kind, usedOn, supabase);
  if (used == null || used <= 0) {
    return;
  }

  const updated = await supabase
    .from("ai_usage")
    .update({ count: used - 1 })
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("used_on", usedOn);
  if (updated.error && !isMissingUsageTable(updated.error)) {
    throw updated.error;
  }
}

async function consumeAiUsage(
  userId: string,
  kind: AiKind,
  usedOn: string,
): Promise<{ remaining: number | null } | "exhausted" | "untracked"> {
  const limit = dailyLimit(kind);
  const supabase = createSupabaseServerClient();
  const used = await peekAiUsage(userId, kind, usedOn, supabase);
  if (used == null) {
    return "untracked";
  }
  if (used >= limit) {
    return "exhausted";
  }

  const next = used + 1;
  if (used === 0) {
    const inserted = await supabase.from("ai_usage").insert({
      user_id: userId,
      kind,
      used_on: usedOn,
      count: 1,
    });
    if (inserted.error) {
      if (isMissingUsageTable(inserted.error)) {
        return "untracked";
      }
      if (inserted.error.code !== "23505") {
        throw inserted.error;
      }
      return bumpAfterConflict(supabase, userId, kind, usedOn, limit);
    }
    return { remaining: remainingAfterUse(1, limit) };
  }

  const updated = await supabase
    .from("ai_usage")
    .update({ count: next })
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("used_on", usedOn);
  if (updated.error) {
    if (isMissingUsageTable(updated.error)) {
      return "untracked";
    }
    throw updated.error;
  }
  return { remaining: remainingAfterUse(next, limit) };
}

async function bumpAfterConflict(
  supabase: UsageClient,
  userId: string,
  kind: AiKind,
  usedOn: string,
  limit: number,
): Promise<{ remaining: number | null } | "exhausted" | "untracked"> {
  const latest = await peekAiUsage(userId, kind, usedOn, supabase);
  if (latest == null) {
    return "untracked";
  }
  if (latest >= limit) {
    return "exhausted";
  }

  const next = latest + 1;
  const updated = await supabase
    .from("ai_usage")
    .update({ count: next })
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("used_on", usedOn);
  if (updated.error) {
    if (isMissingUsageTable(updated.error)) {
      return "untracked";
    }
    throw updated.error;
  }
  return { remaining: remainingAfterUse(next, limit) };
}

async function peekAiUsage(
  userId: string,
  kind: AiKind,
  usedOn: string,
  supabase: UsageClient,
): Promise<number | null> {
  const result = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("used_on", usedOn)
    .maybeSingle();

  if (result.error) {
    if (isMissingUsageTable(result.error)) {
      return null;
    }
    throw result.error;
  }

  const count = result.data?.count;
  return typeof count === "number" && count > 0 ? count : 0;
}

function isMissingUsageTable(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" && error.message.includes("ai_usage"))
  );
}
