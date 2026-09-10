import type { WorkoutKind } from "@/lib/types";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export interface ProgramDay {
  name: string;
  kind: WorkoutKind;
  exercises: string[];
}

export const PROGRAM_PRESET_IDS = [
  "one_day",
  "strength",
  "full_body",
  "upper_lower",
  "ppl",
] as const;

export type ProgramPresetId = (typeof PROGRAM_PRESET_IDS)[number];

export interface ProgramPreset {
  id: ProgramPresetId;
  name: string;
  hint: string;
  templates: ProgramDay[];
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: "one_day",
    name: "Один день",
    hint: "Одна тренировка по кругу. Самый простой старт.",
    templates: [
      {
        name: "Зал",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Жим лёжа",
          "Тяга штанги в наклоне",
          "Жим стоя",
          "Румынская тяга",
        ],
      },
    ],
  },
  {
    id: "strength",
    name: "Сила",
    hint: "Два дня, присед каждый раз. Классика новичка со штангой.",
    templates: [
      {
        name: "Сила A",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Жим лёжа",
          "Тяга штанги в наклоне",
        ],
      },
      {
        name: "Сила B",
        kind: "dynamic",
        exercises: ["Приседания со штангой", "Жим стоя", "Становая тяга"],
      },
    ],
  },
  {
    id: "full_body",
    name: "Всё тело",
    hint: "Два разных дня на всё тело. Можно чередовать чаще.",
    templates: [
      {
        name: "Тело A",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Жим лёжа",
          "Тяга штанги в наклоне",
          "Жим гантелей сидя",
        ],
      },
      {
        name: "Тело B",
        kind: "dynamic",
        exercises: ["Румынская тяга", "Жим стоя", "Подтягивания", "Жим ногами"],
      },
    ],
  },
  {
    id: "upper_lower",
    name: "Верх / Низ",
    hint: "Два дня: жимы с тягами, потом ноги.",
    templates: [
      {
        name: "Верх",
        kind: "dynamic",
        exercises: [
          "Жим лёжа",
          "Жим стоя",
          "Тяга штанги в наклоне",
          "Подтягивания",
          "Тяга верхнего блока",
          "Жим гантелей сидя",
        ],
      },
      {
        name: "Низ",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Румынская тяга",
          "Жим ногами",
          "Выпады",
        ],
      },
    ],
  },
  {
    id: "ppl",
    name: "Жим / Тяга / Ноги",
    hint: "Три тренировки по кругу. После можно убрать лишнее.",
    templates: [
      {
        name: "Жим",
        kind: "dynamic",
        exercises: [
          "Жим лёжа",
          "Жим стоя",
          "Жим гантелей под наклоном",
          "Отжимания на брусьях",
          "Разгибание на блоке",
        ],
      },
      {
        name: "Тяга",
        kind: "dynamic",
        exercises: [
          "Тяга штанги в наклоне",
          "Подтягивания",
          "Тяга верхнего блока",
          "Подъём штанги на бицепс",
          "Молотковый подъём",
        ],
      },
      {
        name: "Ноги",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Румынская тяга",
          "Жим ногами",
          "Выпады",
        ],
      },
    ],
  },
];

export function isProgramPresetId(value: unknown): value is ProgramPresetId {
  return PROGRAM_PRESET_IDS.some((id) => id === value);
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

export function unknownProgramExercises(): string[] {
  const starterNames = new Set(
    STARTER_EXERCISES.map((exercise) => exercise.name),
  );
  return programPresetExerciseNames().filter((name) => !starterNames.has(name));
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
      return exercise?.short_name || name;
    })
    .join(" · ");
}
