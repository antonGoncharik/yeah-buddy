import type { WorkoutKind } from "@/lib/types";

export interface ProgramDay {
  name: string;
  kind: WorkoutKind;
  exercises: string[];
}

export const PROGRAM_PRESET_IDS = [
  "full_body",
  "one_day",
  "strength",
  "upper_lower",
  "ppl",
  "three_day",
  "four_day",
] as const;

export const RECOMMENDED_PROGRAM_PRESET_ID: ProgramPresetId = "full_body";

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
    id: "full_body",
    name: "Всё тело",
    hint: "Два разных дня на всё тело.",
    level: "beginner",
    templates: [
      day("Тело A", [
        "Приседания со штангой",
        "Жим лёжа",
        "Тяга штанги в наклоне",
        "Жим гантелей сидя",
      ]),
      day("Тело B", [
        "Румынская тяга",
        "Жим стоя",
        "Подтягивания",
        "Жим ногами",
      ]),
    ],
  },
  {
    id: "one_day",
    name: "Один день",
    hint: "Одна тренировка, её и повторяешь.",
    level: "beginner",
    templates: [
      day("Зал", [
        "Приседания со штангой",
        "Жим лёжа",
        "Тяга штанги в наклоне",
        "Жим стоя",
        "Румынская тяга",
      ]),
    ],
  },
  {
    id: "strength",
    name: "Сила",
    hint: "Два дня, присед каждый раз.",
    level: "beginner",
    templates: [
      day("Сила A", [
        "Приседания со штангой",
        "Жим лёжа",
        "Тяга штанги в наклоне",
      ]),
      day("Сила B", ["Приседания со штангой", "Жим стоя", "Становая тяга"]),
    ],
  },
  {
    id: "upper_lower",
    name: "Верх / Низ",
    hint: "Два дня: жимы с тягами, потом ноги.",
    level: "intermediate",
    templates: [
      day("Верх", [
        "Жим лёжа",
        "Жим стоя",
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
        "Жим гантелей сидя",
      ]),
      day("Низ", [
        "Приседания со штангой",
        "Румынская тяга",
        "Жим ногами",
        "Выпады",
      ]),
    ],
  },
  {
    id: "ppl",
    name: "Жим / Тяга / Ноги",
    hint: "Три тренировки подряд.",
    level: "intermediate",
    templates: [
      day("Жим", [
        "Жим лёжа",
        "Жим стоя",
        "Жим гантелей под наклоном",
        "Отжимания на брусьях",
        "Разгибание на блоке",
      ]),
      day("Тяга", [
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
        "Подъём штанги на бицепс",
        "Молотковый подъём",
      ]),
      day("Ноги", [
        "Приседания со штангой",
        "Румынская тяга",
        "Жим ногами",
        "Выпады",
      ]),
    ],
  },
  {
    id: "three_day",
    name: "Спина / Ноги / Грудь",
    hint: "Спина с бицепсом, ноги с плечами, грудь с трицепсом.",
    level: "intermediate",
    templates: [
      day("Спина", [
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
        "Подъём штанги на бицепс",
        "Молотковый подъём",
      ]),
      day("Ноги+плечи", [
        "Приседания со штангой",
        "Жим ногами",
        "Сгибание ног",
        "Жим гантелей сидя",
        "Разведение гантелей в стороны",
      ]),
      day("Грудь", [
        "Жим лёжа",
        "Жим лёжа под наклоном",
        "Жим узким хватом",
        "Разгибание на блоке",
        "Отжимания на брусьях",
      ]),
    ],
  },
  {
    id: "four_day",
    name: "Четыре дня",
    hint: "Спина, ноги, грудь, плечи. По группе в день.",
    level: "advanced",
    templates: [
      day("Спина+трицепс", [
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
        "Жим узким хватом",
        "Разгибание на блоке",
      ]),
      day("Ноги", [
        "Приседания со штангой",
        "Жим ногами",
        "Румынская тяга",
        "Сгибание ног",
        "Выпады",
      ]),
      day("Грудь+бицепс", [
        "Жим лёжа под наклоном",
        "Жим лёжа",
        "Отжимания на брусьях",
        "Подъём штанги на бицепс",
        "Подъём гантелей на бицепс",
      ]),
      day("Плечи", [
        "Жим стоя",
        "Жим гантелей сидя",
        "Разведение гантелей в стороны",
        "Тяга горизонтального блока",
        "Махи в наклоне",
      ]),
    ],
  },
];

function day(name: string, exercises: string[]): ProgramDay {
  return { name, kind: "dynamic", exercises };
}
