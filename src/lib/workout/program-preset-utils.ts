import { exerciseShortLabel } from "@/lib/workout/labels";
import {
  PROGRAM_LEVEL_LABELS,
  PROGRAM_LEVELS,
  PROGRAM_PRESETS,
  type ProgramLevel,
  type ProgramPreset,
  type ProgramPresetId,
} from "@/lib/workout/program-preset-data";
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

export function programPresetById(
  id: ProgramPresetId,
): ProgramPreset | undefined {
  return PROGRAM_PRESETS.find((preset) => preset.id === id);
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
        preset.templates.flatMap((day) => day.exercises),
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
  const names = [...new Set(preset.templates.flatMap((day) => day.exercises))];
  const shown = names.slice(0, SUMMARY_LIFT_LIMIT);
  const line = presetExerciseLine(shown);
  const suffix = names.length > SUMMARY_LIFT_LIMIT ? "…" : "";
  return `${dayCountLabel(preset.templates.length)} · ${line}${suffix}`;
}

function dayCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} день`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} дня`;
  }
  return `${count} дней`;
}
