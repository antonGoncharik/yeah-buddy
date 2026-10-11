import { exportUserAccount } from "@/lib/account/export";
import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";

export const GET = sessionRoute(async (session) => {
  const dump = await exportUserAccount(session.userId);
  return jsonOk({ export: dump });
});
