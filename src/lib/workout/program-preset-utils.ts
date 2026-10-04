import { exerciseShortLabel } from "@/lib/workout/labels";
import {
  LISTED_PROGRAM_PRESET_IDS,
  PROGRAM_LEVEL_LABELS,
  PROGRAM_LEVELS,
  PROGRAM_PRESETS,
  type ProgramDay,
  type ProgramLevel,
  type ProgramPreset,
  type ProgramPresetId,
} from "@/lib/workout/program-preset-data";
import {
  programQueueDayLabel,
  programVisitFrequencyLead,
  programVisitFrequencyShort,
} from "@/lib/workout/program-preset-visit";
import {
  type ProgramAccessOptions,
  DEV_ONLY_PROGRAM_PRESET_IDS,
  isDevOnlyProgramPresetId,
} from "@/lib/workout/program-preset-access";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export function programPresetsByLevel(): Array<{
  level: ProgramLevel;
  label: string;
  presets: ProgramPreset[];
}> {
  return PROGRAM_LEVELS.map((level) => ({
    level,
    label: PROGRAM_LEVEL_LABELS[level],
    presets: PROGRAM_PRESETS.filter((preset) => preset.level === level),
  })).filter((group) => group.presets.length > 0);
}

export function isProgramPresetId(value: unknown): value is ProgramPresetId {
  return PROGRAM_PRESETS.some((preset) => preset.id === value);
}

const listedProgramIds = new Set<ProgramPresetId>(LISTED_PROGRAM_PRESET_IDS);

export function isListedProgramPresetId(id: ProgramPresetId): boolean {
  return listedProgramIds.has(id);
}

/** Listed catalog, grants, and a program already chosen so onboarding still shows it. */
export function pickerProgramPresetIds(
  selected?: ProgramPresetId | null,
  granted: readonly ProgramPresetId[] = [],
  access: ProgramAccessOptions = {},
): ProgramPresetId[] {
  const ids: ProgramPresetId[] = [...LISTED_PROGRAM_PRESET_IDS];
  for (const id of granted) {
    if (isProgramPresetId(id) && !ids.includes(id)) {
      ids.push(id);
    }
  }
  if (access.devTester === true) {
    for (const id of DEV_ONLY_PROGRAM_PRESET_IDS) {
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
  }
  if (selected && isProgramPresetId(selected) && !ids.includes(selected)) {
    ids.push(selected);
  }
  return ids;
}

export function parseGrantedPrograms(value: unknown): ProgramPresetId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids: ProgramPresetId[] = [];
  for (const item of value) {
    if (!isProgramPresetId(item) || isListedProgramPresetId(item)) {
      continue;
    }
    if (!ids.includes(item)) {
      ids.push(item);
    }
  }
  return ids;
}

export function programIsOffered(
  id: ProgramPresetId,
  granted: readonly string[],
  access: ProgramAccessOptions = {},
): boolean {
  if (isListedProgramPresetId(id)) {
    return true;
  }
  if (parseGrantedPrograms(granted).includes(id)) {
    return true;
  }
  return isDevOnlyProgramPresetId(id) && access.devTester === true;
}

export function programPresetById(
  id: ProgramPresetId,
): ProgramPreset | undefined {
  return PROGRAM_PRESETS.find((preset) => preset.id === id);
}

export function programDayExerciseNames(day: ProgramDay): string[] {
  return day.exercises.map((slot) => slot.name);
}

export function programPresetExerciseNames(
  presetId?: ProgramPresetId,
): string[] {
  const presets = presetId
    ? PROGRAM_PRESETS.filter((preset) => preset.id === presetId)
    : PROGRAM_PRESETS;
  return [
    ...new Set(
      presets.flatMap((preset) =>
        preset.templates.flatMap(programDayExerciseNames),
      ),
    ),
  ];
}

export function matchProgramPresetId(
  templates: Array<{ name: string; is_active: boolean }>,
): ProgramPresetId | null {
  const activeNames = templates
    .filter((template) => template.is_active)
    .map((template) => template.name);
  if (activeNames.length === 0) {
    return null;
  }

  for (const preset of PROGRAM_PRESETS) {
    const names = preset.templates.map((day) => day.name);
    if (
      activeNames.length === names.length &&
      names.every((name) => activeNames.includes(name))
    ) {
      return preset.id;
    }
  }

  return null;
}

export function presetExerciseLine(names: string[]): string {
  return names
    .map((name) => {
      const exercise = STARTER_EXERCISES.find((item) => item.name === name);
      return exercise ? exerciseShortLabel(exercise.short_name, name) : name;
    })
    .join(" · ");
}

const SUMMARY_LIFT_LIMIT = 5;

export function programPresetSummary(preset: ProgramPreset): string {
  const dayCount = preset.templates.length;
  const names = [...new Set(preset.templates.flatMap(programDayExerciseNames))];
  const shown = names.slice(0, SUMMARY_LIFT_LIMIT);
  const line = presetExerciseLine(shown);
  const suffix = names.length > SUMMARY_LIFT_LIMIT ? "…" : "";
  return `${programQueueDayLabel(dayCount)} · ${programVisitFrequencyShort(dayCount)} · ${line}${suffix}`;
}

export function programPresetHint(preset: ProgramPreset): string {
  const dayCount = preset.templates.length;
  return `${programVisitFrequencyLead(dayCount)} ${preset.hint}`;
}
