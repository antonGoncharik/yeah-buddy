import type {
  SlotIntensity,
  SlotLoad,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import { feelLoad, percentLoad, trackLoad } from "@/lib/workout/slot-plan";

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
  "five_by_five",
  "upper_lower",
  "ppl",
  "three_day",
  "power_three",
  "gzclp",
  "upper_lower_hl",
  "four_day",
  "five_three_one",
  "texas",
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
    hint: "Две тренировки, присед каждый раз. Подходы — как в общем плане.",
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
    id: "five_by_five",
    name: "5×5 A/B",
    hint: "Присед каждый раз, пятёрки на 80%. Становая — один подход на 5. Цикл не нужен.",
    level: "beginner",
    templates: [
      day("5×5 A", [
        fives("Приседания со штангой"),
        fives("Жим лёжа"),
        fives("Тяга штанги в наклоне"),
      ]),
      day("5×5 B", [
        fives("Приседания со штангой"),
        fives("Жим стоя"),
        slot("Становая тяга", [group(1, 5, percentLoad(80))], {
          intensity: "heavy",
          note: "один тяжёлый подход",
        }),
      ]),
    ],
  },
  {
    id: "upper_lower",
    name: "Верх / Низ",
    hint: "Сначала жимы и тяги, потом ноги. Подходы — как в общем плане.",
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
    hint: "Жимы, потом тяги, потом ноги. Подходы — как в общем плане.",
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
    id: "power_three",
    name: "Присед / Жим / Тяга",
    hint: "Три соревновательных. Главный лифт — верх по линейке и откат легче, помощь по самочувствию.",
    level: "intermediate",
    templates: [
      day("День приседа", [
        topBack("Приседания со штангой", 1, 5, 3, 5, -10),
        base("Румынская тяга", 3, 8, "light"),
        near("Сгибание ног", 3, 12),
        near("Подъём на носки стоя", 3, 12),
      ]),
      day("День жима", [
        topBack("Жим лёжа", 1, 5, 3, 5, -10),
        base("Жим лёжа под наклоном", 3, 8, "light"),
        near("Разведение гантелей лёжа", 3, 12),
        near("Разгибание на блоке", 3, 12),
      ]),
      day("День тяги", [
        topBack("Становая тяга", 1, 5, 3, 5, -10),
        base("Тяга штанги в наклоне", 3, 8, "heavy"),
        near("Подтягивания", 3, 8),
        near("Гиперэкстензия", 3, 12),
      ]),
    ],
  },
  {
    id: "gzclp",
    name: "T1 / T2 / T3",
    hint: "Три этажа: T1 по линейке, T2 от рабочего, T3 около отказа. Цикл не нужен.",
    level: "intermediate",
    templates: [
      day("T1 присед", [
        t1("Приседания со штангой"),
        t2("Жим лёжа"),
        t3("Тяга верхнего блока"),
        t3("Разведение гантелей в стороны"),
      ]),
      day("T1 жим", [
        t1("Жим лёжа"),
        t2("Приседания со штангой"),
        t3("Тяга горизонтального блока"),
        t3("Подъём гантелей на бицепс"),
      ]),
      day("T1 тяга", [
        t1("Становая тяга"),
        t2("Жим стоя"),
        t3("Подтягивания"),
        t3("Пресс"),
      ]),
    ],
  },
  {
    id: "upper_lower_hl",
    name: "Верх / Низ · тяжело-легко",
    hint: "Четыре дня: тяжёлые и лёгкие верх и низ меняются. Цикл не нужен — метки уже в днях.",
    level: "intermediate",
    templates: [
      day("Верх тяжело", [
        base("Жим лёжа", 5, 5, "heavy"),
        base("Тяга штанги в наклоне", 5, 5, "heavy"),
        base("Жим стоя", 3, 8, "heavy"),
        near("Подтягивания", 3, 8),
        near("Разведение гантелей в стороны", 3, 15),
      ]),
      day("Низ тяжело", [
        base("Приседания со штангой", 5, 5, "heavy"),
        base("Румынская тяга", 4, 8, "heavy"),
        near("Жим ногами", 3, 10),
        near("Сгибание ног", 3, 12),
      ]),
      day("Верх легко", [
        base("Жим лёжа", 3, 10, "light"),
        base("Тяга штанги в наклоне", 3, 10, "light"),
        base("Жим стоя", 3, 10, "light"),
        near("Тяга верхнего блока", 3, 12),
        near("Махи в наклоне", 3, 15),
      ]),
      day("Низ легко", [
        base("Приседания со штангой", 3, 8, "light"),
        base("Румынская тяга", 3, 10, "light"),
        near("Выпады", 3, 10),
        near("Подъём на носки стоя", 3, 12),
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
    id: "five_three_one",
    name: "5/3/1",
    hint: "Главный лифт 65–75–85%, потом 5×10 на 50%. Цикл и линейка не нужны — схема уже в днях.",
    level: "advanced",
    templates: [
      day("5/3/1 · жим стоя", [
        wave531("Жим стоя"),
        near("Подтягивания", 5, 8),
        near("Разведение гантелей в стороны", 4, 15),
        near("Пресс", 3, 15),
      ]),
      day("5/3/1 · тяга", [
        wave531("Становая тяга"),
        near("Тяга штанги в наклоне", 5, 10),
        near("Гиперэкстензия", 3, 12),
        near("Пресс", 3, 15),
      ]),
      day("5/3/1 · жим лёжа", [
        wave531("Жим лёжа"),
        near("Тяга горизонтального блока", 5, 10),
        near("Разгибание на блоке", 4, 12),
        near("Пресс", 3, 15),
      ]),
      day("5/3/1 · присед", [
        wave531("Приседания со штангой"),
        near("Сгибание ног", 5, 10),
        near("Подъём на носки стоя", 4, 12),
        near("Пресс", 3, 15),
      ]),
    ],
  },
  {
    id: "texas",
    name: "Объём / Лёгкая / Интенсив",
    hint: "Три дня: пятёрки на объёме, легче на восстановлении, в интенсив — один подход по линейке.",
    level: "advanced",
    templates: [
      day("Объём", [
        fives("Приседания со штангой"),
        fives("Жим лёжа"),
        fives("Тяга штанги в наклоне"),
      ]),
      day("Лёгкая", [
        base("Приседания со штангой", 3, 5, "light"),
        base("Жим стоя", 3, 5, "light"),
        near("Подтягивания", 3, 8),
      ]),
      day("Интенсив", [
        prSet("Приседания со штангой"),
        prSet("Жим лёжа"),
        prSet("Становая тяга"),
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

function slot(
  name: string,
  groups: SlotSetGroup[],
  extra: {
    intensity?: SlotIntensity | null;
    warmup?: boolean;
    note?: string | null;
  } = {},
): ProgramSlot {
  return {
    name,
    plan: {
      groups,
      intensity: extra.intensity ?? null,
      warmup: extra.warmup ?? true,
      note: extra.note ?? null,
    },
  };
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
  return slot(
    name,
    [group(sets, reps, percentLoad(intensityPercent(intensity)), repsTo)],
    { intensity },
  );
}

function fives(name: string): ProgramSlot {
  return base(name, 5, 5, "heavy");
}

/** Isolation: weight by feel, every set near failure. */
function near(name: string, sets: number, reps: number): ProgramSlot {
  return slot(name, [group(sets, reps, feelLoad())], {
    warmup: false,
    note: "около отказа",
  });
}

function topBack(
  name: string,
  topSets: number,
  topReps: number,
  backSets: number,
  backReps: number,
  offset: number,
): ProgramSlot {
  return slot(
    name,
    [
      group(topSets, topReps, trackLoad()),
      group(backSets, backReps, trackLoad(offset)),
    ],
    { note: "линейка: верх, потом откат" },
  );
}

function t1(name: string): ProgramSlot {
  return slot(name, [group(5, 3, trackLoad())], {
    intensity: "heavy",
    note: "T1 · линейка, последний подход можно больше",
  });
}

function t2(name: string): ProgramSlot {
  return slot(name, [group(3, 10, percentLoad(70))], {
    intensity: "light",
    note: "T2",
  });
}

function t3(name: string): ProgramSlot {
  return slot(name, [group(3, 15, feelLoad())], {
    warmup: false,
    note: "T3 · около отказа",
  });
}

function wave531(name: string): ProgramSlot {
  return slot(
    name,
    [
      group(1, 5, percentLoad(65)),
      group(1, 5, percentLoad(75)),
      group(1, 5, percentLoad(85)),
      group(5, 10, percentLoad(50)),
    ],
    { note: "последний из тройки — максимум чистых, потом 5×10" },
  );
}

function prSet(name: string): ProgramSlot {
  return slot(name, [group(1, 5, trackLoad())], {
    intensity: "heavy",
    note: "линейка: один тяжёлый на 5",
  });
}

/** Bench: top 2×2 by the line, back-off 3×6 ten kilos lighter. */
function bench(): ProgramSlot {
  return slot(
    "Жим лёжа",
    [group(2, 2, trackLoad()), group(3, 6, trackLoad(-10))],
    { note: "линейка +2.5 в неделю, отказ только в конце" },
  );
}

/** Incline: 4×6 by its own line, no top sets. */
function incline(): ProgramSlot {
  return slot("Жим лёжа под наклоном", [group(4, 6, trackLoad())], {
    note: "старт: отказной на 6 минус 12.5 кг",
  });
}
