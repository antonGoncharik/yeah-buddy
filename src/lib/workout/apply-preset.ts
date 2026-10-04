import { getUserCalendarToday } from "@/lib/day/writable";
import { getUserSettings } from "@/lib/settings";
import type { ProgramAccessOptions } from "@/lib/workout/program-preset-access";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { withCycle } from "@/lib/workout/cycle";
import {
  closeCurrentMacro,
  createFirstMacro,
} from "@/lib/workout/macro-create";
import {
  type ProgramPresetId,
  programIsOffered,
  programPresetById,
} from "@/lib/workout/program-presets";
import { setQueuePresetId } from "@/lib/workout/program-preset-weeks";
import { syncProgramDaysToTemplates } from "@/lib/workout/program-preset-sync";
import { saveRotation } from "@/lib/workout/rotation";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-rebuild";
import {
  ensureWorkoutSettings,
  saveWorkoutSettings,
} from "@/lib/workout/settings";
import { listTemplates } from "@/lib/workout/template-store";

export class ProgramNotOfferedError extends Error {
  constructor() {
    super("Этой программы нет.");
    this.name = "ProgramNotOfferedError";
  }
}

export async function applyProgramPreset(
  userId: string,
  presetId: ProgramPresetId,
  access: ProgramAccessOptions = {},
): Promise<WorkoutTemplateDetail[]> {
  const preset = programPresetById(presetId);
  if (!preset) {
    throw new Error("Нет такой программы.");
  }

  const account = await getUserSettings(userId);
  if (!programIsOffered(presetId, account?.granted_programs ?? [], access)) {
    throw new ProgramNotOfferedError();
  }

  const activeIds = await syncProgramDaysToTemplates(userId, preset.templates);

  const settings = await ensureWorkoutSettings(userId);
  await saveWorkoutSettings(userId, {
    formulas: withCycle(settings.formulas, preset.cycle ?? [], {
      auto_end: preset.cycle_auto_end,
      loop: preset.cycle_loop,
    }),
  });
  await setQueuePresetId(userId, preset.weeks ? presetId : null);

  const all = await listTemplates(userId);
  const templates = await saveRotation(userId, {
    rotation: all.map((template, index) => ({
      id: template.id,
      sort_order: activeIds.includes(template.id)
        ? (activeIds.indexOf(template.id) + 1) * 10
        : 1000 + index,
      is_active: activeIds.includes(template.id),
    })),
  });

  await restartPresetCycle(userId, Boolean(preset.cycle));
  await rebuildTodaysPlannedSession(userId);

  return templates;
}

/** Closes leftover weeks, then starts this program's weeks if it has any. */
async function restartPresetCycle(
  userId: string,
  start: boolean,
): Promise<void> {
  try {
    await closeCurrentMacro(userId);
    if (!start) {
      return;
    }
    await createFirstMacro(userId, {
      start_date: await getUserCalendarToday(userId),
      note: null,
      maxes: [],
    });
  } catch {
    // Days and weeks are saved; the cycle screen can start it later.
  }
}
