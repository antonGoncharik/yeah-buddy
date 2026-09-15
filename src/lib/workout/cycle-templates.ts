import type { CyclePhaseDef, FormulaSetSpec } from "@/lib/types";

function phase(
  key: string,
  name: string,
  extra: {
    skip_warmup?: boolean;
    increase_on_end?: boolean;
    percent_scale?: number;
    work?: FormulaSetSpec[];
  } = {},
): CyclePhaseDef {
  return {
    key,
    name,
    skip_warmup: extra.skip_warmup ?? false,
    increase_on_end: extra.increase_on_end ?? false,
    percent_scale: extra.percent_scale,
    work: extra.work,
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

/** 5/3/1 week wave on the shared plan. Do not stack on the 5/3/1 program. */
export const FIVES_TO_ONES_CYCLE: CyclePhaseDef[] = [
  phase("w5s", "5s", { work: [set(65, 5), set(75, 5), set(85, 5)] }),
  phase("w3s", "3s", { work: [set(70, 3), set(80, 3), set(90, 3)] }),
  phase("w1s", "1s", {
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
    | "three_week_deload"
    | "four_week_deload"
    | "tens_to_triples"
    | "fives_to_ones";
  name: string;
  hint: string;
  cycle: CyclePhaseDef[];
}> = [
  {
    id: "four_phase",
    name: "Разгон → сброс",
    hint: "Четыре этапа: разгон, набор, рывок, сброс. После набора можно поднять веса.",
    cycle: FOUR_PHASE_CYCLE,
  },
  {
    id: "load_deload",
    name: "Нагрузка / разгрузка",
    hint: "После нагрузки можно поднять веса. Разгрузка лёгкая.",
    cycle: LOAD_DELOAD_CYCLE,
  },
  {
    id: "light_medium_heavy",
    name: "Лёгкая → средняя → тяжёлая",
    hint: "Лёгкая, средняя, тяжёлая. После тяжёлой можно поднять веса.",
    cycle: LIGHT_MEDIUM_HEAVY_CYCLE,
  },
  {
    id: "light_heavy",
    name: "Лёгкая → тяжёлая",
    hint: "Лёгкая и тяжёлая. После тяжёлой можно поднять веса.",
    cycle: LIGHT_HEAVY_CYCLE,
  },
  {
    id: "linear",
    name: "70 → 85%",
    hint: "Проценты от рабочего веса: 70 → 75 → 80 → 85, потом сброс. Это не линейка килограммов.",
    cycle: LINEAR_CYCLE,
  },
  {
    id: "volume_strength",
    name: "Объём → сила",
    hint: "Неделя объёма, неделя силы, сброс. После силы можно поднять веса.",
    cycle: VOLUME_STRENGTH_CYCLE,
  },
  {
    id: "three_week_deload",
    name: "Три недели + сброс",
    hint: "Программа та же. После третьей недели можно поднять рабочие веса.",
    cycle: THREE_WEEK_DELOAD_CYCLE,
  },
  {
    id: "four_week_deload",
    name: "Четыре недели + сброс",
    hint: "Программа та же. После четвёртой недели можно поднять рабочие веса.",
    cycle: FOUR_WEEK_DELOAD_CYCLE,
  },
  {
    id: "tens_to_triples",
    name: "10 → 3",
    hint: "Программа та же. Подходы меняются: 10, 8, 5, 3, сброс. Для дней без своей схемы.",
    cycle: TENS_TO_TRIPLES_CYCLE,
  },
  {
    id: "fives_to_ones",
    name: "5s → 1s",
    hint: "Волна 5s → 3s → 1s, потом сброс. Не ставь, если 5/3/1 уже зашит в днях.",
    cycle: FIVES_TO_ONES_CYCLE,
  },
];
