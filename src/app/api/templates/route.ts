import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  createTemplate,
  listTemplates,
  rotationPatchSchema,
  saveRotation,
  templateWriteSchema,
} from "@/lib/workout/templates";

export const GET = sessionRoute(async (session) => {
  await ensureWorkoutSettings(session.userId);
  const templates = await listTemplates(session.userId);
  return jsonOk({ templates });
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, templateWriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await createTemplate(session.userId, parsed.data);
    return jsonOk({ template });
  } catch (error) {
    return failRoute(error);
  }
});

export const PATCH = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, rotationPatchSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const templates = await saveRotation(session.userId, parsed.data);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error);
  }
});
