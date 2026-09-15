import type {
  SlotIntensity,
  SlotLoad,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";

export interface ProgramSlot {
  name: string;
  /** null — по общему плану подходов. */
  plan: SlotPlan | null;
}

export interface ProgramDay {
  name: string;
  kind: WorkoutKind;
  exercises: ProgramSlot[];
}

export const PROGRAM_PRESET_IDS = [
  "full_body",
  "one_day",
  "strength",
  "upper_lower",
  "ppl",
  "three_day",
  "four_day",
  "press_two_week",
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
    name: "Всё тело A/B",
    hint: "Две разные тренировки на всё тело. Дальше по кругу.",
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
    name: "Всё тело · повтор",
    hint: "Один состав, его и повторяешь.",
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
    name: "Сила A/B",
    hint: "Две тренировки, присед каждый раз.",
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
    hint: "Сначала жимы и тяги, потом ноги.",
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
    hint: "Жимы, потом тяги, потом ноги.",
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
    name: "Спина / Ноги / Грудь / Плечи",
    hint: "По группе мышц за тренировку.",
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
  {
    id: "press_two_week",
    name: "Жимовая · 2 недели",
    hint: "Верх и жимы, ног мало. Тяжёлые и лёгкие дни меняются местами через неделю, жим лёжа и наклон идут по линейке.",
    level: "advanced",
    templates: [
      day("Неделя 1 · Пн", [
        bench(),
        base("Подтягивания", 4, 6, "heavy", 8),
        base("Румынская тяга", 4, 10, "light"),
        near("Жим гантелей сидя", 3, 10),
        near("Махи в наклоне", 4, 15),
        near("Пресс", 3, 15),
      ]),
      day("Неделя 1 · Ср", [
        base("Отжимания на брусьях", 4, 8, "light"),
        base("Приседания со штангой", 4, 6, "heavy"),
        base("Тяга горизонтального блока", 4, 8, "light"),
        near("Разведение гантелей в стороны", 4, 15),
        near("Подъём гантелей на бицепс", 4, 12),
      ]),
      day("Неделя 1 · Пт", [
        incline(),
        base("Тяга штанги в наклоне", 3, 8, "heavy"),
        base("Пуловер", 3, 10, "light"),
        base("Жим узким хватом", 3, 8, "heavy"),
        near("Гиперэкстензия", 3, 15),
      ]),
      day("Неделя 2 · Пн", [
        bench(),
        base("Подтягивания", 4, 6, "light", 8),
        base("Румынская тяга", 4, 10, "heavy"),
        near("Жим гантелей сидя", 3, 10),
        near("Махи в наклоне", 4, 15),
        near("Пресс", 3, 15),
      ]),
      day("Неделя 2 · Ср", [
        base("Отжимания на брусьях", 4, 8, "heavy"),
        base("Приседания со штангой", 4, 6, "light"),
        base("Тяга горизонтального блока", 4, 8, "heavy"),
        near("Разведение гантелей в стороны", 4, 15),
        near("Подъём гантелей на бицепс", 4, 12),
      ]),
      day("Неделя 2 · Пт", [
        incline(),
        base("Тяга штанги в наклоне", 3, 8, "light"),
        base("Пуловер", 3, 10, "heavy"),
        base("Жим узким хватом", 3, 8, "light"),
        near("Гиперэкстензия", 3, 15),
      ]),
    ],
  },
];

function day(name: string, exercises: Array<string | ProgramSlot>): ProgramDay {
  return {
    name,
    kind: "dynamic",
    exercises: exercises.map((item) =>
      typeof item === "string" ? { name: item, plan: null } : item,
    ),
  };
}

function group(
  sets: number,
  reps: number,
  load: SlotLoad,
  repsTo: number | null = null,
): SlotSetGroup {
  return { sets, reps, reps_to: repsTo, seconds: null, load };
}

/** Heavy day works at 80 % of the working weight, light at 70 %. */
function intensityPercent(intensity: SlotIntensity): number {
  return intensity === "heavy" ? 80 : 70;
}

/** Base lift with a heavy/light tag: the tag flips between the two weeks. */
function base(
  name: string,
  sets: number,
  reps: number,
  intensity: SlotIntensity,
  repsTo: number | null = null,
): ProgramSlot {
  return {
    name,
    plan: {
      groups: [
        group(
          sets,
          reps,
          { type: "percent", percent: intensityPercent(intensity) },
          repsTo,
        ),
      ],
      intensity,
      warmup: true,
      note: null,
    },
  };
}

/** Isolation: weight by feel, every set near failure. */
function near(name: string, sets: number, reps: number): ProgramSlot {
  return {
    name,
    plan: {
      groups: [group(sets, reps, { type: "feel" })],
      intensity: null,
      warmup: false,
      note: "около отказа",
    },
  };
}

/** Bench: top 2×2 by the line, back-off 3×6 ten kilos lighter. */
function bench(): ProgramSlot {
  return {
    name: "Жим лёжа",
    plan: {
      groups: [
        group(2, 2, { type: "track", percent: 100, offset: 0 }),
        group(3, 6, { type: "track", percent: 100, offset: -10 }),
      ],
      intensity: null,
      warmup: true,
      note: "линейка +2.5 в неделю, отказ только в конце",
    },
  };
}

/** Incline: 4×6 by its own line, no top sets. */
function incline(): ProgramSlot {
  return {
    name: "Жим лёжа под наклоном",
    plan: {
      groups: [group(4, 6, { type: "track", percent: 100, offset: 0 })],
      intensity: null,
      warmup: true,
      note: "старт: отказной на 6 минус 12.5 кг",
    },
  };
}
