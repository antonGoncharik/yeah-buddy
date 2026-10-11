import { jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { CoachLimitError, CoachShareError } from "@/lib/coach/errors";
import { issueCoachLink, loadCoachHome } from "@/lib/coach/store";

export const GET = sessionRoute(async (session) => {
  return jsonOk(await loadCoachHome(session.userId));
});

export const POST = sessionRoute(
  async (session) => {
    return jsonOk(await issueCoachLink(session.userId));
  },
  [whenError(CoachLimitError, 409), whenError(CoachShareError, 503)],
);
