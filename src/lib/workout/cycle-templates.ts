import type { CyclePhaseDef } from "@/lib/types";

function phase(
  key: string,
  name: string,
  extra: {
    skip_warmup?: boolean;
    increase_on_end?: boolean;
    percent_scale?: number;
  } = {},
): CyclePhaseDef {
  return {
    key,
    name,
    skip_warmup: extra.skip_warmup ?? false,
    increase_on_end: extra.increase_on_end ?? false,
    percent_scale: extra.percent_scale,
  };
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

export const CYCLE_TEMPLATES: Array<{
  id:
    | "four_phase"
    | "load_deload"
    | "light_medium_heavy"
    | "light_heavy"
    | "linear"
    | "volume_strength";
  name: string;
  hint: string;
  cycle: CyclePhaseDef[];
}> = [
  {
    id: "four_phase",
    name: "Разгон → сброс",
    hint: "Разгон, набор, рывок, сброс. После набора можно поднять веса.",
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
    name: "Линейный",
    hint: "70 → 75 → 80 → 85, потом сброс. После 85% можно поднять веса.",
    cycle: LINEAR_CYCLE,
  },
  {
    id: "volume_strength",
    name: "Объём → сила",
    hint: "Неделя объёма, неделя силы, сброс. После силы можно поднять веса.",
    cycle: VOLUME_STRENGTH_CYCLE,
  },
];
