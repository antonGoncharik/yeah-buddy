import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listMealTemplates } from "@/lib/meal-templates";

export const GET = sessionRoute(async (session) => {
  const templates = await listMealTemplates(session.userId);
  return jsonOk({ templates });
});
