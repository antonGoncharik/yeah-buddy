import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getStrengthProgress } from "@/lib/workout/progress";

export const GET = sessionRoute(async (session) => {
  const progress = await getStrengthProgress(session.userId);
  return jsonOk(progress);
});
