import { stringList } from "@/lib/ai/parse-review-numbers";
import type { ReviewRange } from "@/lib/ai/range";
import type { ReviewText, StoredReview } from "@/lib/ai/types";
import { isIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const KEEP_PER_RANGE = 2;

export async function listStoredReviews(
  userId: string,
  range: ReviewRange,
): Promise<StoredReview[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("review_snapshots")
    .select("period_from, period_to, headline, observations, watch, created_at")
    .eq("user_id", userId)
    .eq("range", range)
    .order("created_at", { ascending: false })
    .limit(KEEP_PER_RANGE);

  if (result.error) {
    if (isMissingReviewTable(result.error)) {
      return [];
    }
    throw result.error;
  }

  return (result.data ?? []).flatMap((row) => {
    const mapped = mapStoredReview(row as Record<string, unknown>);
    return mapped ? [mapped] : [];
  });
}

export async function saveStoredReview(
  userId: string,
  range: ReviewRange,
  period: { from: string; to: string },
  text: ReviewText,
): Promise<StoredReview> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("review_snapshots")
    .insert({
      user_id: userId,
      range,
      period_from: period.from,
      period_to: period.to,
      headline: text.headline,
      observations: text.observations,
      watch: text.watch,
    })
    .select("period_from, period_to, headline, observations, watch, created_at")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Review save failed");
  }

  await pruneStoredReviews(userId, range);

  const mapped = mapStoredReview(inserted.data as Record<string, unknown>);
  if (!mapped) {
    throw new Error("Review save failed");
  }

  return mapped;
}

async function pruneStoredReviews(
  userId: string,
  range: ReviewRange,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("review_snapshots")
    .select("id")
    .eq("user_id", userId)
    .eq("range", range)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  const extra = (result.data ?? [])
    .slice(KEEP_PER_RANGE)
    .flatMap((row) => (typeof row.id === "string" ? [row.id] : []));
  if (extra.length === 0) {
    return;
  }

  const removed = await supabase
    .from("review_snapshots")
    .delete()
    .eq("user_id", userId)
    .in("id", extra);

  if (removed.error) {
    throw removed.error;
  }
}

export function mapStoredReview(
  row: Record<string, unknown>,
): StoredReview | null {
  if (typeof row.headline !== "string" || row.headline.trim() === "") {
    return null;
  }

  const from = toDateOnly(row.period_from ?? row.from);
  const to = toDateOnly(row.period_to ?? row.to);
  const writtenAt =
    typeof row.created_at === "string"
      ? row.created_at
      : typeof row.written_at === "string"
        ? row.written_at
        : "";
  if (!from || !to || writtenAt === "") {
    return null;
  }

  return {
    from,
    to,
    written_at: writtenAt,
    headline: row.headline,
    observations: stringList(row.observations),
    watch: stringList(row.watch),
  };
}

function toDateOnly(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.slice(0, 10);
  return isIsoDate(date) ? date : null;
}

function isMissingReviewTable(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" &&
      error.message.includes("review_snapshots"))
  );
}
