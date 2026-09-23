import type {
  CyclePhaseDef,
  SlotIntensity,
  SlotLoad,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import {
  FIVES_TO_ONES_CYCLE,
  FOUR_WEEK_DELOAD_CYCLE,
  TWO_WEEK_KG_CYCLE,
} from "@/lib/workout/cycle-templates";
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
  "starting_strength",
  "upper_lower",
  "ppl",
  "ppl_twice",
  "three_day",
  "arnold",
  "power_three",
  "gzclp",
  "upper_lower_hl",
  "phul",
  "four_day",
  "gvt",
  "five_three_one",
  "texas",
  "press_two_week",
  "table_squat",
  "table_bench",
  "table_three_lifts",
] as const;

export const RECOMMENDED_PROGRAM_PRESET_ID: ProgramPresetId = "full_body";

export type ProgramPresetId = (typeof PROGRAM_PRESET_IDS)[number];

/**
 * What everyone sees. «Всё тело» sits on top; the rest open under
 * «Ещё программы». Other presets stay in PROGRAM_PRESETS so a queue already
 * on one of them is left alone. A hidden one shows up only after a grant.
 * Bot start links stay on the featured three.
 */
export const LISTED_PROGRAM_PRESET_IDS = [
  "full_body",
  "five_by_five",
  "upper_lower",
  "ppl",
] as const satisfies readonly ProgramPresetId[];

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
  /**
   * Программы-таблицы несут свой цикл: схемы на слотах привязаны к его
   * этапам. Ставится вместе с днями, старые этапы заменяются.
   */
  cycle?: CyclePhaseDef[];
  cycle_auto_end?: boolean;
  cycle_loop?: boolean;
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: "full_body",
    name: "Всё тело",
    hint: "Два разных дня на всё тело по кругу. Вес от твоего максимума на раз — если нет, спросит в зале.",
    level: "beginner",
    templates: [
      day("День 1", [
        "Приседания со штангой",
        "Жим лёжа",
        "Тяга штанги в наклоне",
        "Жим гантелей сидя",
      ]),
      day("День 2", [
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
    hint: "Один состав, его и повторяешь. Вес от твоего максимума на раз — если нет, спросит в зале.",
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
    hint: "Два дня, присед каждый раз. Вес от твоего максимума на раз — если нет, спросит в зале.",
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
    hint: "Присед каждый раз, пятёрки на 80% от максимума на раз. Становая — один подход на 5.",
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
    id: "starting_strength",
    name: "3×5 A/B",
    hint: "Присед каждый раз, тройки на 80% от максимума на раз. Становая — один подход на 5.",
    level: "beginner",
    templates: [
      day("3×5 A", [
        threes("Приседания со штангой"),
        threes("Жим лёжа"),
        threes("Тяга штанги в наклоне"),
      ]),
      day("3×5 B", [
        threes("Приседания со штангой"),
        threes("Жим стоя"),
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
    hint: "Сначала жимы и тяги, потом ноги. Вес от твоего максимума на раз — если нет, спросит в зале.",
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
    hint: "Жимы, потом тяги, потом ноги. Вес от твоего максимума на раз — если нет, спросит в зале.",
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
    id: "ppl_twice",
    name: "Жим / Тяга / Ноги · A/B",
    hint: "Шесть дней: два круга жим-тяга-ноги, второй чуть другой состав. Вес от максимума на раз.",
    level: "intermediate",
    templates: [
      day("Жим A", [
        "Жим лёжа",
        "Жим стоя",
        "Жим гантелей под наклоном",
        "Отжимания на брусьях",
        "Разгибание на блоке",
      ]),
      day("Тяга A", [
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
        "Подъём штанги на бицепс",
        "Молотковый подъём",
      ]),
      day("Ноги A", [
        "Приседания со штангой",
        "Румынская тяга",
        "Жим ногами",
        "Выпады",
      ]),
      day("Жим B", [
        "Жим лёжа под наклоном",
        "Жим гантелей сидя",
        "Разведение гантелей лёжа",
        "Жим узким хватом",
        "Французский жим",
      ]),
      day("Тяга B", [
        "Тяга Т-штанги",
        "Тяга гантели в наклоне",
        "Тяга горизонтального блока",
        "Подъём гантелей на бицепс",
        "Шраги со штангой",
      ]),
      day("Ноги B", [
        "Гак-приседания",
        "Румынская тяга",
        "Сгибание ног",
        "Разгибание ног",
        "Подъём на носки стоя",
      ]),
    ],
  },
  {
    id: "three_day",
    name: "Спина / Ноги / Грудь",
    hint: "Спина с бицепсом, ноги с плечами, грудь с трицепсом. Вес от максимума на раз.",
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
    id: "arnold",
    name: "Грудь-спина / Плечи-руки / Ноги",
    hint: "Три дня Арнольда. Если ходишь шесть раз — круг просто пройдёт дважды. Вес от максимума на раз.",
    level: "intermediate",
    templates: [
      day("Грудь / спина", [
        "Жим лёжа",
        "Жим лёжа под наклоном",
        "Разведение гантелей лёжа",
        "Тяга штанги в наклоне",
        "Подтягивания",
        "Тяга верхнего блока",
      ]),
      day("Плечи / руки", [
        "Жим стоя",
        "Разведение гантелей в стороны",
        "Махи в наклоне",
        "Подъём штанги на бицепс",
        "Молотковый подъём",
        "Разгибание на блоке",
      ]),
      day("Ноги / икры", [
        "Приседания со штангой",
        "Румынская тяга",
        "Выпады",
        "Сгибание ног",
        "Подъём на носки стоя",
      ]),
    ],
  },
  {
    id: "power_three",
    name: "Присед / Жим / Тяга",
    hint: "Три соревновательных. Главный лифт — верх в кг и откат легче. Помощь по самочувствию.",
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
    hint: "Три этажа: T1 в кг после каждой тренировки, T2 от максимума на раз, T3 около отказа.",
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
    hint: "Четыре дня: тяжёлые и лёгкие верх и низ уже в составе. Вес от максимума на раз.",
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
    id: "phul",
    name: "Верх / Низ · сила-объём",
    hint: "Силовые дни 3–5, объём 8–12 — уже в составе. Вес от максимума на раз.",
    level: "intermediate",
    templates: [
      day("Верх сила", [
        base("Жим лёжа", 4, 5, "heavy"),
        base("Тяга штанги в наклоне", 4, 5, "heavy"),
        base("Жим стоя", 3, 6, "heavy"),
        near("Подтягивания", 3, 8),
        near("Разведение гантелей в стороны", 3, 15),
      ]),
      day("Низ сила", [
        base("Приседания со штангой", 4, 5, "heavy"),
        base("Румынская тяга", 3, 6, "heavy"),
        near("Жим ногами", 3, 8),
        near("Сгибание ног", 3, 10),
      ]),
      day("Верх объём", [
        base("Жим лёжа под наклоном", 3, 10, "light"),
        base("Тяга горизонтального блока", 3, 12, "light"),
        near("Жим гантелей сидя", 3, 12),
        near("Разведение гантелей лёжа", 3, 12),
        near("Подъём гантелей на бицепс", 3, 12),
        near("Разгибание на блоке", 3, 12),
      ]),
      day("Низ объём", [
        base("Гак-приседания", 3, 10, "light"),
        near("Выпады", 3, 12),
        near("Разгибание ног", 3, 12),
        near("Сгибание ног", 3, 12),
        near("Подъём на носки стоя", 4, 12),
      ]),
    ],
  },
  {
    id: "four_day",
    name: "Спина / Ноги / Грудь / Плечи",
    hint: "По группе мышц за тренировку. Вес от твоего максимума на раз — если нет, спросит в зале.",
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
    id: "gvt",
    name: "10×10",
    hint: "Главное упражнение дня — десять по десять на 60% от максимума на раз.",
    level: "advanced",
    templates: [
      day("10×10 ноги", [
        tenByTen("Приседания со штангой"),
        base("Румынская тяга", 3, 8, "light"),
        near("Сгибание ног", 3, 12),
      ]),
      day("10×10 жим", [
        tenByTen("Жим лёжа"),
        near("Жим лёжа под наклоном", 3, 10),
        near("Разгибание на блоке", 3, 12),
      ]),
      day("10×10 тяга", [
        tenByTen("Тяга штанги в наклоне"),
        near("Подтягивания", 3, 8),
        near("Подъём штанги на бицепс", 3, 10),
      ]),
    ],
  },
  {
    id: "five_three_one",
    name: "5/3/1",
    hint: "Четыре дня. Главный лифт волной 5 → 3 → 1 от максимума на раз, потом 5×10. Недели встанут сами: круг дней — следующая.",
    level: "advanced",
    cycle: FIVES_TO_ONES_CYCLE,
    cycle_auto_end: true,
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
    hint: "Три дня: пятёрки от максимума на раз, легче на восстановлении, в интенсив — рабочий кг после тренировки.",
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
    hint: "Три дня по кругу. Жим и наклон — в кг, +2.5 после каждой недели. Остальное от максимума на раз, тяжёлое и лёгкое меняются местами.",
    level: "advanced",
    cycle: TWO_WEEK_KG_CYCLE,
    cycle_auto_end: true,
    cycle_loop: true,
    templates: [
      day("Жим", [
        bench(),
        flippingBase("Подтягивания", 4, 6, "heavy", 8),
        flippingBase("Румынская тяга", 4, 10, "light"),
        near("Жим гантелей сидя", 3, 10),
        near("Махи в наклоне", 4, 15),
        near("Пресс", 3, 15),
      ]),
      day("Присед", [
        flippingBase("Отжимания на брусьях", 4, 8, "light"),
        flippingBase("Приседания со штангой", 4, 6, "heavy"),
        flippingBase("Тяга горизонтального блока", 4, 8, "light"),
        near("Разведение гантелей в стороны", 4, 15),
        near("Подъём гантелей на бицепс", 4, 12),
      ]),
      day("Наклон", [
        incline(),
        flippingBase("Тяга штанги в наклоне", 3, 8, "heavy"),
        flippingBase("Пуловер", 3, 10, "light"),
        flippingBase("Жим узким хватом", 3, 8, "heavy"),
        near("Гиперэкстензия", 3, 15),
      ]),
    ],
  },
  {
    id: "table_squat",
    name: "Присед по таблице",
    hint: "Присед четыре раза в неделю: 4×9, 5×7, 7×5, 10×3 от максимума на раз. Четыре недели и сброс, каждая тяжелее. Круг дней — следующая неделя сама.",
    level: "advanced",
    cycle: FOUR_WEEK_DELOAD_CYCLE,
    cycle_auto_end: true,
    templates: [
      day("Таблица · 9", [
        table("Приседания со штангой", 4, 9, [70, 75, 77.5, 80]),
        base("Жим лёжа", 3, 8, "light"),
        near("Пресс", 3, 15),
      ]),
      day("Таблица · 7", [
        table("Приседания со штангой", 5, 7, [75, 80, 82.5, 85]),
        near("Подтягивания", 4, 8),
        near("Гиперэкстензия", 3, 12),
      ]),
      day("Таблица · 5", [
        table("Приседания со штангой", 7, 5, [80, 85, 87.5, 90]),
        base("Жим стоя", 3, 8, "light"),
        near("Пресс", 3, 15),
      ]),
      day("Таблица · 3", [
        table("Приседания со штангой", 10, 3, [85, 87.5, 90, 92.5]),
        near("Сгибание ног", 3, 12),
        near("Гиперэкстензия", 3, 12),
      ]),
    ],
  },
  {
    id: "table_bench",
    name: "Жим по таблице",
    hint: "Жим три раза в неделю: тяжёлый, объёмный и быстрый — от максимума на раз. Четыре недели и сброс, каждая тяжелее. Круг дней — следующая неделя сама.",
    level: "advanced",
    cycle: FOUR_WEEK_DELOAD_CYCLE,
    cycle_auto_end: true,
    templates: [
      day("Таблица · жим тяжело", [
        table("Жим лёжа", 5, 5, [70, 75, 77.5, 80]),
        base("Приседания со штангой", 3, 5, "light"),
        near("Подтягивания", 4, 8),
        near("Жим узким хватом", 3, 10),
      ]),
      day("Таблица · жим объём", [
        table("Жим лёжа", 5, 8, [65, 67.5, 70, 72.5]),
        near("Жим гантелей сидя", 4, 10),
        near("Тяга горизонтального блока", 4, 12),
        near("Разгибание на блоке", 3, 12),
      ]),
      day("Таблица · жим быстро", [
        table("Жим лёжа", 8, 3, [60, 62.5, 65, 67.5]),
        base("Приседания со штангой", 3, 5, "light"),
        near("Жим лёжа под наклоном", 3, 8),
        near("Махи в наклоне", 4, 15),
      ]),
    ],
  },
  {
    id: "table_three_lifts",
    name: "Присед / Жим / Тяга по таблице",
    hint: "Три тренировки: присед и жим в каждой, свои проценты от максимума на раз. Четыре недели и сброс. Круг дней — следующая неделя сама.",
    level: "advanced",
    cycle: FOUR_WEEK_DELOAD_CYCLE,
    cycle_auto_end: true,
    templates: [
      day("Таблица · день 1", [
        table("Жим лёжа", 5, 5, [65, 70, 72.5, 75]),
        table("Приседания со штангой", 4, 5, [70, 75, 77.5, 80]),
        near("Жим узким хватом", 3, 10),
        near("Пресс", 3, 15),
      ]),
      day("Таблица · день 2", [
        table("Приседания со штангой", 4, 4, [75, 80, 82.5, 85]),
        table("Становая тяга", 4, 4, [70, 75, 77.5, 80]),
        near("Тяга штанги в наклоне", 4, 8),
        near("Гиперэкстензия", 3, 12),
      ]),
      day("Таблица · день 3", [
        table("Жим лёжа", 6, 3, [70, 75, 80, 85]),
        table("Приседания со штангой", 3, 5, [65, 70, 70, 75]),
        near("Подтягивания", 4, 8),
        near("Разведение гантелей в стороны", 3, 15),
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
    phases?: Record<string, SlotSetGroup[]>;
  } = {},
): ProgramSlot {
  return {
    name,
    plan: {
      groups,
      phases: extra.phases,
      intensity: extra.intensity ?? null,
      warmup: extra.warmup ?? true,
      note: extra.note ?? null,
    },
  };
}

/**
 * Строка таблицы: сеты × повторы, свой процент от максимума на раз на каждую неделю.
 * Первая неделя — обычная схема слота, дальше свои схемы на этапы цикла
 * `w2`–`w4`; на сбросе легкие пятёрки.
 */
function table(
  name: string,
  sets: number,
  reps: number,
  percents: [number, number, number, number],
): ProgramSlot {
  const [first, ...rest] = percents;
  const weeks = ["w2", "w3", "w4"] as const;
  return slot(name, [group(sets, reps, percentLoad(first))], {
    note: "таблица: проценты от максимума на раз",
    phases: {
      ...Object.fromEntries(
        weeks.map((key, index) => [
          key,
          [group(sets, reps, percentLoad(rest[index] ?? first))],
        ]),
      ),
      deload: [group(3, 5, percentLoad(55))],
    },
  });
}

/** Heavy day works at 80 % of 1RM, light at 70 %. */
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

/** Same as base, but week 2 of the cycle swaps heavy and light percents. */
function flippingBase(
  name: string,
  sets: number,
  reps: number,
  intensity: SlotIntensity,
  repsTo: number | null = null,
): ProgramSlot {
  const flipped: SlotIntensity = intensity === "heavy" ? "light" : "heavy";
  return slot(
    name,
    [group(sets, reps, percentLoad(intensityPercent(intensity)), repsTo)],
    {
      intensity,
      phases: {
        w2: [group(sets, reps, percentLoad(intensityPercent(flipped)), repsTo)],
      },
    },
  );
}

function fives(name: string): ProgramSlot {
  return base(name, 5, 5, "heavy");
}

function threes(name: string): ProgramSlot {
  return base(name, 3, 5, "heavy");
}

function tenByTen(name: string): ProgramSlot {
  return slot(name, [group(10, 10, percentLoad(60))], {
    intensity: "light",
    note: "10×10, длинный отдых",
  });
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
    { note: "кг: верх, потом откат" },
  );
}

function t1(name: string): ProgramSlot {
  return slot(name, [group(5, 3, trackLoad())], {
    intensity: "heavy",
    note: "T1 · кг, последний подход можно больше",
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

function wave531Week(
  first: [number, number],
  second: [number, number],
  third: [number, number],
  withBackoff: boolean,
): SlotSetGroup[] {
  const main = [
    group(1, first[1], percentLoad(first[0])),
    group(1, second[1], percentLoad(second[0])),
    group(1, third[1], percentLoad(third[0])),
  ];
  if (!withBackoff) {
    return main;
  }
  return [...main, group(5, 10, percentLoad(50))];
}

function wave531(name: string): ProgramSlot {
  return slot(name, wave531Week([65, 5], [75, 5], [85, 5], true), {
    note: "последний из тройки — максимум чистых, потом 5×10",
    phases: {
      w3s: wave531Week([70, 3], [80, 3], [90, 3], true),
      w1s: wave531Week([75, 5], [85, 3], [95, 1], true),
      deload: wave531Week([40, 5], [50, 5], [60, 5], false),
    },
  });
}

function prSet(name: string): ProgramSlot {
  return slot(name, [group(1, 5, trackLoad())], {
    intensity: "heavy",
    note: "кг: один тяжёлый на 5",
  });
}

/** Bench: top 2×2 by the line, back-off 3×6 ten kilos lighter. */
function bench(): ProgramSlot {
  return slot(
    "Жим лёжа",
    [group(2, 2, trackLoad()), group(3, 6, trackLoad(-10))],
    { note: "+2.5 кг после каждой недели, отказ только в конце" },
  );
}

/** Incline: 4×6 by its own line, no top sets. */
function incline(): ProgramSlot {
  return slot("Жим лёжа под наклоном", [group(4, 6, trackLoad())], {
    note: "старт: отказной на 6 минус 12.5 кг",
  });
}
