import { isReviewRange, type ReviewRange } from "@/lib/ai/range";
import { buildUserSignals } from "@/lib/ai/user-signals";
import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";

export const GET = sessionRoute(async (session, request) => {
  const params = new URL(request.url).searchParams;
  const rangeRaw = Number(params.get("range") ?? "14");
  const range: ReviewRange = isReviewRange(rangeRaw) ? rangeRaw : 14;
  const signals = await buildUserSignals(session.userId, range);
  return jsonOk({
    dayInsight: signals.dayInsight,
    templateInsights: signals.templateInsights,
    coverage: signals.brief.coverage,
  });
});
