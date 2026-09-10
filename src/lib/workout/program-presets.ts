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
  "three_day",
  "four_day",
] as const;

export type ProgramPresetId = (typeof PROGRAM_PRESET_IDS)[number];

export const PROGRAM_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type ProgramLevel = (typeof PROGRAM_LEVELS)[number];

export const PROGRAM_LEVEL_LABELS: Record<ProgramLevel, string> = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export interface ProgramPreset {
  id: ProgramPresetId;
  name: string;
  hint: string;
  level: ProgramLevel;
  templates: ProgramDay[];
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: "one_day",
    name: "Один день",
    hint: "Новичок. Одна тренировка, её и повторяешь.",
    level: "beginner",
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
    hint: "Новичок. Два дня, присед каждый раз.",
    level: "beginner",
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
    hint: "Новичок. Два разных дня на всё тело.",
    level: "beginner",
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
    hint: "Средний. Два дня: жимы с тягами, потом ноги.",
    level: "intermediate",
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
    hint: "Средний. Три тренировки по кругу.",
    level: "intermediate",
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
  {
    id: "three_day",
    name: "Спина / Ноги / Грудь",
    hint: "Средний. Спина с бицепсом, ноги с плечами, грудь с трицепсом.",
    level: "intermediate",
    templates: [
      {
        name: "Спина",
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
        name: "Ноги+плечи",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Жим ногами",
          "Сгибание ног",
          "Жим гантелей сидя",
          "Разведение гантелей в стороны",
        ],
      },
      {
        name: "Грудь",
        kind: "dynamic",
        exercises: [
          "Жим лёжа",
          "Жим лёжа под наклоном",
          "Жим узким хватом",
          "Разгибание на блоке",
          "Отжимания на брусьях",
        ],
      },
    ],
  },
  {
    id: "four_day",
    name: "Четыре дня",
    hint: "Продвинутый. Спина, ноги, грудь, плечи. По группе в день.",
    level: "advanced",
    templates: [
      {
        name: "Спина+трицепс",
        kind: "dynamic",
        exercises: [
          "Тяга штанги в наклоне",
          "Подтягивания",
          "Тяга верхнего блока",
          "Жим узким хватом",
          "Разгибание на блоке",
        ],
      },
      {
        name: "Ноги",
        kind: "dynamic",
        exercises: [
          "Приседания со штангой",
          "Жим ногами",
          "Румынская тяга",
          "Сгибание ног",
          "Выпады",
        ],
      },
      {
        name: "Грудь+бицепс",
        kind: "dynamic",
        exercises: [
          "Жим лёжа под наклоном",
          "Жим лёжа",
          "Отжимания на брусьях",
          "Подъём штанги на бицепс",
          "Подъём гантелей на бицепс",
        ],
      },
      {
        name: "Плечи",
        kind: "dynamic",
        exercises: [
          "Жим стоя",
          "Жим гантелей сидя",
          "Разведение гантелей в стороны",
          "Тяга горизонтального блока",
          "Махи в наклоне",
        ],
      },
    ],
  },
];

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
