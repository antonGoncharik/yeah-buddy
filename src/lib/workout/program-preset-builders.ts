import type { SlotIntensity, SlotLoad, SlotPlan } from "@/lib/types";
import type {
  ProgramDay,
  ProgramSlot,
} from "@/lib/workout/program-preset-data";
import { feelLoad, percentLoad } from "@/lib/workout/slot-plan";

export const BENCH_GUIDE_DAY_NAMES = [
  "Жим · Пн",
  "Жим · Ср",
  "Жим · Пт",
] as const;

function group(
  sets: number,
  reps: number,
  load: SlotLoad,
  repsTo: number | null = null,
) {
  return { sets, reps, reps_to: repsTo, seconds: null, load };
}

function plan(
  groups: ReturnType<typeof group>[],
  intensity: SlotIntensity | null = null,
): SlotPlan {
  return {
    groups,
    intensity,
    warmup: true,
    note: null,
  };
}

export function pct(
  name: string,
  percent: number,
  reps: number,
  sets: number,
  intensity: SlotIntensity | null = "heavy",
): ProgramSlot {
  return {
    name,
    plan: plan([group(sets, reps, percentLoad(percent))], intensity),
  };
}

export function pctSeq(
  name: string,
  blocks: ReadonlyArray<{ percent: number; reps: number; sets: number }>,
  intensity: SlotIntensity | null = "heavy",
): ProgramSlot {
  return {
    name,
    plan: plan(
      blocks.map((block) =>
        group(block.sets, block.reps, percentLoad(block.percent)),
      ),
      intensity,
    ),
  };
}

export function feel(
  name: string,
  sets: number,
  reps: number,
  intensity: SlotIntensity | null = "light",
): ProgramSlot {
  return {
    name,
    plan: plan([group(sets, reps, feelLoad())], intensity),
  };
}

/** Повторы без процента: подбор веса / своё тело. */
export function vol(
  name: string,
  sets: number,
  reps: number,
  intensity: SlotIntensity | null = "light",
): ProgramSlot {
  return feel(name, sets, reps, intensity);
}

export function guideDay(
  label: "Пн" | "Ср" | "Пт",
  exercises: ProgramSlot[],
): ProgramDay {
  const name =
    label === "Пн"
      ? BENCH_GUIDE_DAY_NAMES[0]
      : label === "Ср"
        ? BENCH_GUIDE_DAY_NAMES[1]
        : BENCH_GUIDE_DAY_NAMES[2];
  return {
    name,
    kind: "dynamic",
    exercises,
  };
}

export function guideWeek(
  days: [ProgramDay, ProgramDay, ProgramDay],
): ProgramDay[] {
  return days;
}
