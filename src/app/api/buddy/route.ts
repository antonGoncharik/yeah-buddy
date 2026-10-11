import { jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { BuddyLimitError, BuddyShareError } from "@/lib/buddy/errors";
import { issueBuddyLink, loadBuddyHome } from "@/lib/buddy/store";

export const GET = sessionRoute(async (session) => {
  return jsonOk(await loadBuddyHome(session.userId));
});

export const POST = sessionRoute(
  async (session) => {
    return jsonOk(await issueBuddyLink(session.userId));
  },
  [whenError(BuddyLimitError, 409), whenError(BuddyShareError, 503)],
);
