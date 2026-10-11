import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { unskipLastTemplate } from "@/lib/workout/settings";

export const POST = sessionRoute(async (session) => {
  await unskipLastTemplate(session.userId);
  return jsonOk({ ok: true });
});
