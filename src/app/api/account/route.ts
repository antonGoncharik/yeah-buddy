import { deleteUserById } from "@/lib/account/delete";
import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { clearSessionCookie } from "@/lib/auth/session";

export const DELETE = sessionRoute(async (session) => {
  await deleteUserById(session.userId);
  await clearSessionCookie();
  return jsonOk({ deleted: true });
});
