import type {
  ProgramDay,
  ProgramPreset,
  ProgramPresetId,
} from "@/lib/workout/program-preset-data";
import { programPresetById } from "@/lib/workout/program-preset-utils";
import { syncProgramDaysToTemplates } from "@/lib/workout/program-preset-sync";
import {
  ensureWorkoutSettings,
  saveWorkoutSettings,
} from "@/lib/workout/settings";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-rebuild";

export function programDaysForWeek(
  presetId: ProgramPresetId,
  phaseKey: string,
): ProgramDay[] | null {
  const preset = programPresetById(presetId);
  if (!preset?.weeks) {
    return null;
  }
  return preset.weeks[phaseKey] ?? null;
}

export function validatePresetWeeks(preset: ProgramPreset): string | null {
  if (!preset.weeks) {
    return null;
  }
  const cycleKeys = new Set((preset.cycle ?? []).map((phase) => phase.key));
  const weekKeys = Object.keys(preset.weeks);
  if (weekKeys.length === 0) {
    return `${preset.id}: weeks is empty`;
  }
  for (const key of weekKeys) {
    if (!cycleKeys.has(key)) {
      return `${preset.id}: week «${key}» is missing from cycle`;
    }
    const days = preset.weeks[key];
    if (days.length !== preset.templates.length) {
      return `${preset.id}: week «${key}» has ${days.length} days, expected ${preset.templates.length}`;
    }
    const templateNames = preset.templates.map((day) => day.name);
    for (const day of days) {
      if (!templateNames.includes(day.name)) {
        return `${preset.id}: week «${key}» day «${day.name}» does not match template names`;
      }
    }
  }
  const w1 = preset.weeks.w1 ?? preset.templates;
  for (let index = 0; index < preset.templates.length; index += 1) {
    if (preset.templates[index]?.name !== w1[index]?.name) {
      return `${preset.id}: templates must match weeks.w1 day names`;
    }
  }
  return null;
}

export async function syncQueuedProgramWeek(
  userId: string,
  phaseKey: string,
): Promise<boolean> {
  const settings = await ensureWorkoutSettings(userId);
  const presetId = settings.queue_preset_id;
  if (!presetId || !programPresetById(presetId as ProgramPresetId)) {
    return false;
  }
  const id = presetId as ProgramPresetId;
  const days = programDaysForWeek(id, phaseKey);
  if (!days) {
    return false;
  }
  await syncProgramDaysToTemplates(userId, days);
  await rebuildTodaysPlannedSession(userId);
  return true;
}

export async function setQueuePresetId(
  userId: string,
  presetId: ProgramPresetId | null,
): Promise<void> {
  await saveWorkoutSettings(userId, { queue_preset_id: presetId });
}
