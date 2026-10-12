import { buildReviewBrief } from "@/lib/ai/brief";
import { loadReviewSource } from "@/lib/ai/load-review-source";
import type { ReviewRange } from "@/lib/ai/range";
import {
  dayInsightFromBrief,
  templateInsightsFromBrief,
} from "@/lib/ai/template-insights";
import type { ReviewBrief } from "@/lib/ai/types";
import { getUserCalendarToday } from "@/lib/days";

export type UserSignals = {
  range: ReviewRange;
  today: string;
  brief: ReviewBrief;
  templateInsights: string[];
  dayInsight: string | null;
};

export async function buildUserSignals(
  userId: string,
  range: ReviewRange,
  today?: string,
): Promise<UserSignals> {
  const resolvedToday = today ?? (await getUserCalendarToday(userId));
  const source = await loadReviewSource(userId, range, resolvedToday);
  const brief = buildReviewBrief(source);
  const templateInsights = templateInsightsFromBrief(brief);
  return {
    range,
    today: resolvedToday,
    brief,
    templateInsights,
    dayInsight: dayInsightFromBrief(brief),
  };
}
