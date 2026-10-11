import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";
import {
  ensureWorkoutSettings,
  saveWorkoutSettings,
  workoutSettingsPatchSchema,
} from "@/lib/workout/settings";

export const GET = sessionRoute(async (session) => {
  const settings = await ensureWorkoutSettings(session.userId);
  return jsonOk({
    settings: {
      max_increase_percent: settings.max_increase_percent,
      formulas: settings.formulas,
    },
  });
});

export const PATCH = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, workoutSettingsPatchSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const settings = await saveWorkoutSettings(session.userId, parsed.data);
    // Today's planned (not started) workout follows the new scheme right away.
    await rebuildTodaysPlannedSession(session.userId);
    return jsonOk({
      settings: {
        max_increase_percent: settings.max_increase_percent,
        formulas: settings.formulas,
      },
    });
  } catch (error) {
    return failRoute(error);
  }
});
