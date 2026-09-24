import { hundredWeightLine, LIGHT_WEIGHT_LINE } from "@/lib/flavor";

export const BAR_KG = 20;
export const SIDE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export type SidePlate = (typeof SIDE_PLATES)[number];

const FALLBACK_TARGETS = [60, 80, 100, 120] as const;
const KG_UNITS = 4;
const PAIR_STEP_UNITS = 10;

export type RestLoadStatus = "empty" | "under" | "hit" | "over";

export const REST_LOAD_OVER_LINE = "Много.";
export const REST_LOAD_HIT_LINE = "Встало.";

export function toKgUnits(kg: number): number {
  return Math.round(kg * KG_UNITS);
}

export function fromKgUnits(units: number): number {
  return units / KG_UNITS;
}

export function plateLabel(kg: number): string {
  const units = toKgUnits(kg);
  if (units % KG_UNITS === 0) {
    return String(units / KG_UNITS);
  }
  if (units % 2 === 0) {
    return (units / KG_UNITS).toFixed(1);
  }
  return (units / KG_UNITS).toFixed(2);
}

export function loadedKg(
  plates: ReadonlyArray<number>,
  barKg = BAR_KG,
): number {
  const added = plates.reduce((sum, plate) => sum + toKgUnits(plate) * 2, 0);
  return fromKgUnits(toKgUnits(barKg) + added);
}

export function canMakeTarget(targetKg: number, barKg = BAR_KG): boolean {
  const rem = toKgUnits(targetKg) - toKgUnits(barKg);
  return rem >= PAIR_STEP_UNITS && rem % PAIR_STEP_UNITS === 0;
}

export function loadStatus(
  currentKg: number,
  targetKg: number,
  barKg = BAR_KG,
): RestLoadStatus {
  const current = toKgUnits(currentKg);
  const target = toKgUnits(targetKg);
  const bar = toKgUnits(barKg);
  if (current > target) {
    return "over";
  }
  if (current === target) {
    return "hit";
  }
  if (current <= bar) {
    return "empty";
  }
  return "under";
}

export function addSidePlate(
  plates: ReadonlyArray<number>,
  plate: number,
): number[] {
  return [...plates, plate];
}

export function undoSidePlate(plates: ReadonlyArray<number>): number[] {
  return plates.slice(0, -1);
}

export function workLoadKg(
  sets: ReadonlyArray<{
    set_type: string;
    planned_weight: number | null;
    actual_weight: number | null;
  }>,
): number | null {
  let weight: number | null = null;
  for (const set of sets) {
    if (set.set_type !== "work") {
      continue;
    }
    const kg = set.actual_weight ?? set.planned_weight;
    if (kg != null && kg > 0) {
      weight = kg;
    }
  }
  return weight;
}

export function resolveLoadTarget(
  plannedKg: number | null,
  salt: string | null,
): number {
  if (plannedKg != null && canMakeTarget(plannedKg)) {
    return plannedKg;
  }
  const index = Math.abs(hashSalt(salt)) % FALLBACK_TARGETS.length;
  return FALLBACK_TARGETS[index] ?? 80;
}

export function restLoadTargetKg(
  exercises: ReadonlyArray<{
    exercise_id: string;
    sets: ReadonlyArray<{
      set_type: string;
      planned_weight: number | null;
      actual_weight: number | null;
    }>;
  }>,
  exerciseId: string | null,
): number {
  const item =
    exerciseId == null
      ? null
      : (exercises.find((row) => row.exercise_id === exerciseId) ?? null);
  return resolveLoadTarget(item ? workLoadKg(item.sets) : null, exerciseId);
}

export function restLoadHitLine(targetKg: number): string {
  return (
    hundredWeightLine(targetKg) ??
    (targetKg <= 40 ? LIGHT_WEIGHT_LINE : REST_LOAD_HIT_LINE)
  );
}

export function restLoadLine(
  currentKg: number,
  targetKg: number,
  barKg = BAR_KG,
): string {
  const status = loadStatus(currentKg, targetKg, barKg);
  if (status === "hit") {
    return restLoadHitLine(targetKg);
  }
  if (status === "over") {
    return REST_LOAD_OVER_LINE;
  }
  return `${plateLabel(currentKg)} / ${plateLabel(targetKg)} кг`;
}

function hashSalt(salt: string | null): number {
  if (salt == null || salt === "") {
    return 0;
  }
  let hash = 0;
  for (const char of salt) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return hash;
}
