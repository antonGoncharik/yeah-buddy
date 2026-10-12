import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  assertGoalSettingsAllowed,
  UnsafeGoalError,
} from "@/lib/nutrition/goal-safety";
import {
  getUserSettings,
  saveUserSettings,
  settingsInputSchema,
} from "@/lib/settings";
import { resetReminderDayMarks } from "@/lib/telegram/reminder-marks";

function goalFromPatch(
  data: Record<string, unknown>,
): "lose" | "keep" | "gain" | null | undefined {
  if (!("goal" in data)) {
    return undefined;
  }
  const goal = data.goal;
  if (goal === "lose" || goal === "keep" || goal === "gain" || goal === null) {
    return goal;
  }
  return undefined;
}

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
    const patch = parsed.data as Record<string, unknown>;
    const nextGoal = goalFromPatch(patch);
    if (nextGoal === "lose") {
      const current = await getUserSettings(session.userId);
      assertGoalSettingsAllowed({
        goal: "lose",
        height_cm:
          (typeof patch.height_cm === "number" || patch.height_cm === null
            ? patch.height_cm
            : null) ??
          current?.height_cm ??
          null,
        body_weight_kg: null,
        birth_year:
          (typeof patch.birth_year === "number" || patch.birth_year === null
            ? patch.birth_year
            : null) ??
          current?.birth_year ??
          null,
      });
    }

    const before = await getUserSettings(session.userId);
    const patchReminders =
      "reminders_enabled" in parsed.data
        ? parsed.data.reminders_enabled
        : undefined;
    const enablingReminders =
      patchReminders === true && before?.reminders_enabled === false;
    const settings = await saveUserSettings(session.userId, parsed.data);
    if (enablingReminders) {
      await resetReminderDayMarks(session.userId);
    }
    return jsonOk({ settings });
  } catch (error) {
    return failRoute(error, [whenError(UnsafeGoalError, 400)]);
  }
});
