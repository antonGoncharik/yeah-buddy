import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  getUserSettings,
  saveUserSettings,
  settingsInputSchema,
} from "@/lib/settings";

export const GET = sessionRoute(async (session) => {
  const settings = await getUserSettings(session.userId);
  if (!settings) {
    return jsonError("Настройки не нашлись.", 404);
  }

  return jsonOk({ settings });
});

export const PATCH = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, settingsInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const settings = await saveUserSettings(session.userId, parsed.data);
    return jsonOk({ settings });
  } catch (error) {
    return failRoute(error);
  }
});
