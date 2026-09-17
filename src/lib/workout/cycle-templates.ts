import type { CyclePhaseDef, FormulaSetSpec } from "@/lib/types";

function phase(
  key: string,
  name: string,
  extra: {
    skip_warmup?: boolean;
    increase_on_end?: boolean;
    percent_scale?: number;
    work?: FormulaSetSpec[];
    kg_increase_on_end?: number;
  } = {},
): CyclePhaseDef {
  return {
    key,
    name,
    skip_warmup: extra.skip_warmup ?? false,
    increase_on_end: extra.increase_on_end ?? false,
    percent_scale: extra.percent_scale,
    work: extra.work,
    kg_increase_on_end: extra.kg_increase_on_end,
  };
}

function set(percent: number, reps: number): FormulaSetSpec {
  return { percent, reps, seconds: null };
}

function times(percent: number, reps: number, sets: number): FormulaSetSpec[] {
  return Array.from({ length: sets }, () => set(percent, reps));
}

export const FOUR_PHASE_CYCLE: CyclePhaseDef[] = [
  phase("ramp", "Разгон"),
  phase("volume", "Набор", { increase_on_end: true }),
  phase("peak", "Рывок"),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const LOAD_DELOAD_CYCLE: CyclePhaseDef[] = [
  phase("work", "Нагрузка", { increase_on_end: true }),
  phase("deload", "Разгрузка", { skip_warmup: true }),
];

export const LIGHT_MEDIUM_HEAVY_CYCLE: CyclePhaseDef[] = [
  phase("light", "Лёгкая", { percent_scale: 0.875 }),
  phase("medium", "Средняя", { percent_scale: 1 }),
  phase("heavy", "Тяжёлая", { increase_on_end: true, percent_scale: 1.1 }),
];

export const LIGHT_HEAVY_CYCLE: CyclePhaseDef[] = [
  phase("light", "Лёгкая", { percent_scale: 0.875 }),
  phase("heavy", "Тяжёлая", { increase_on_end: true, percent_scale: 1.1 }),
];

export const LINEAR_CYCLE: CyclePhaseDef[] = [
  phase("w70", "70%", { percent_scale: 0.875 }),
  phase("w75", "75%", { percent_scale: 0.9375 }),
  phase("w80", "80%", { percent_scale: 1 }),
  phase("w85", "85%", { increase_on_end: true, percent_scale: 1.0625 }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const VOLUME_STRENGTH_CYCLE: CyclePhaseDef[] = [
  phase("volume", "Объём", { percent_scale: 0.875 }),
  phase("strength", "Сила", { increase_on_end: true, percent_scale: 1.1 }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const TWO_WEEK_DELOAD_CYCLE: CyclePhaseDef[] = [
  phase("w1", "Неделя 1"),
  phase("w2", "Неделя 2", { increase_on_end: true }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

/** Two working weeks that loop; linear kg lines grow after each week. */
export const TWO_WEEK_KG_CYCLE: CyclePhaseDef[] = [
  phase("w1", "Неделя 1", { kg_increase_on_end: 2.5 }),
  phase("w2", "Неделя 2", { kg_increase_on_end: 2.5 }),
];

export const THREE_WEEK_DELOAD_CYCLE: CyclePhaseDef[] = [
  phase("w1", "Неделя 1"),
  phase("w2", "Неделя 2"),
  phase("w3", "Неделя 3", { increase_on_end: true }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const FOUR_WEEK_DELOAD_CYCLE: CyclePhaseDef[] = [
  phase("w1", "Неделя 1"),
  phase("w2", "Неделя 2"),
  phase("w3", "Неделя 3"),
  phase("w4", "Неделя 4", { increase_on_end: true }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

/** Wave of set/rep schemes on the shared plan. For days without their own slots. */
export const TENS_TO_TRIPLES_CYCLE: CyclePhaseDef[] = [
  phase("tens", "5×10", { work: times(60, 10, 5) }),
  phase("eights", "5×8", { work: times(70, 8, 5) }),
  phase("fives", "5×5", { work: times(80, 5, 5) }),
  phase("triples", "3×3", { increase_on_end: true, work: times(87, 3, 3) }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

/** Volume down, weight up, last phase ends with a single. Shared plan only. */
export const PEAKING_CYCLE: CyclePhaseDef[] = [
  phase("w5", "5×5", { work: times(80, 5, 5) }),
  phase("w4", "4×4", { work: times(88, 4, 4) }),
  phase("w3", "3×3", { work: times(94, 3, 3) }),
  phase("top", "Разовый", {
    increase_on_end: true,
    work: [set(80, 5), set(90, 3), set(100, 1)],
  }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

/** 5/3/1 week wave on the shared plan. The 5/3/1 program also uses these keys. */
export const FIVES_TO_ONES_CYCLE: CyclePhaseDef[] = [
  phase("w5s", "Пятёрки", { work: [set(65, 5), set(75, 5), set(85, 5)] }),
  phase("w3s", "Тройки", { work: [set(70, 3), set(80, 3), set(90, 3)] }),
  phase("w1s", "Единицы", {
    increase_on_end: true,
    work: [set(75, 5), set(85, 3), set(95, 1)],
  }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const CYCLE_TEMPLATES: Array<{
  id:
    | "four_phase"
    | "load_deload"
    | "light_medium_heavy"
    | "light_heavy"
    | "linear"
    | "volume_strength"
    | "two_week_deload"
    | "two_week_kg"
    | "three_week_deload"
    | "four_week_deload"
    | "tens_to_triples"
    | "fives_to_ones"
    | "peaking";
  name: string;
  hint: string;
  cycle: CyclePhaseDef[];
  /** Changes set/rep scheme on the shared plan, not just the percent. */
  scheme?: boolean;
  auto_end?: boolean;
  loop?: boolean;
}> = [
  {
    id: "four_phase",
    name: "Разгон → сброс",
    hint: "Четыре этапа. После набора можно поднять 1ПМ. Сброс лёгкий.",
    cycle: FOUR_PHASE_CYCLE,
  },
  {
    id: "load_deload",
    name: "Нагрузка / разгрузка",
    hint: "После нагрузки можно поднять 1ПМ. Разгрузка — лёгкая неделя.",
    cycle: LOAD_DELOAD_CYCLE,
  },
  {
    id: "light_medium_heavy",
    name: "Лёгкая → средняя → тяжёлая",
    hint: "Три недели: легче, обычно, тяжелее. После тяжёлой можно поднять 1ПМ.",
    cycle: LIGHT_MEDIUM_HEAVY_CYCLE,
  },
  {
    id: "light_heavy",
    name: "Лёгкая → тяжёлая",
    hint: "Две недели: легче и тяжелее. После тяжёлой можно поднять 1ПМ.",
    cycle: LIGHT_HEAVY_CYCLE,
  },
  {
    id: "linear",
    name: "70 → 85% от 1ПМ",
    hint: "Каждая неделя тяжелее: 70, 75, 80, 85% от 1ПМ, потом сброс.",
    cycle: LINEAR_CYCLE,
  },
  {
    id: "volume_strength",
    name: "Объём → сила",
    hint: "Неделя объёма, неделя силы, сброс. После силы можно поднять 1ПМ.",
    cycle: VOLUME_STRENGTH_CYCLE,
  },
  {
    id: "two_week_deload",
    name: "Две недели + сброс",
    hint: "Две рабочие недели и сброс. После второй можно поднять 1ПМ.",
    cycle: TWO_WEEK_DELOAD_CYCLE,
  },
  {
    id: "two_week_kg",
    name: "Две недели · +2.5 кг",
    hint: "Две недели по кругу. Рабочий кг +2.5 после каждой. Для жима в килограммах.",
    cycle: TWO_WEEK_KG_CYCLE,
    auto_end: true,
    loop: true,
  },
  {
    id: "three_week_deload",
    name: "Три недели + сброс",
    hint: "Три рабочие недели и сброс. Свою схему на неделю ставишь в дне упражнения.",
    cycle: THREE_WEEK_DELOAD_CYCLE,
  },
  {
    id: "four_week_deload",
    name: "Четыре недели + сброс",
    hint: "Четыре рабочие недели и сброс. Для таблиц: своя сетка на каждую неделю в дне.",
    cycle: FOUR_WEEK_DELOAD_CYCLE,
  },
  {
    id: "tens_to_triples",
    name: "10 → 3",
    hint: "Дни те же. Подходы меняются: 10, 8, 5, 3, сброс. Для дней без своей схемы.",
    cycle: TENS_TO_TRIPLES_CYCLE,
    scheme: true,
  },
  {
    id: "fives_to_ones",
    name: "Пятёрки → единицы",
    hint: "Волна 5 → 3 → 1, потом сброс. У программы 5/3/1 это уже в днях — не ставь сверху.",
    cycle: FIVES_TO_ONES_CYCLE,
    scheme: true,
  },
  {
    id: "peaking",
    name: "Подводка к разовому",
    hint: "Подходов меньше, вес больше: 5×5 → 4×4 → 3×3 → один на раз. Для дней без своей схемы.",
    cycle: PEAKING_CYCLE,
    scheme: true,
  },
];
