import {
  BAR_KG,
  canMakeTarget,
  fromKgUnits,
  loadedKg,
  SIDE_PLATES,
  toKgUnits,
} from "@/lib/workout/rest-load";

export const BARBELL_DAILY_MIN_KG = 60;
export const BARBELL_DAILY_MAX_KG = 140;
export const BARBELL_DAILY_STEP_UNITS = 10;

const DAILY_TARGETS = buildDailyTargets();

export interface BarbellDailyChallenge {
  dayKey: string;
  targetKg: number;
  parMoves: number;
}

export function buildDailyTargets(): number[] {
  const out: number[] = [];
  for (
    let units = toKgUnits(BARBELL_DAILY_MIN_KG);
    units <= toKgUnits(BARBELL_DAILY_MAX_KG);
    units += BARBELL_DAILY_STEP_UNITS
  ) {
    const kg = fromKgUnits(units);
    if (canMakeTarget(kg)) {
      out.push(kg);
    }
  }
  return out;
}

export function dailyChallenge(
  dayKey: string,
  targets: ReadonlyArray<number> = DAILY_TARGETS,
): BarbellDailyChallenge | null {
  if (targets.length === 0) {
    return null;
  }
  const index = Math.abs(hashDayKey(dayKey)) % targets.length;
  const targetKg = targets[index] ?? targets[0];
  if (targetKg == null || !canMakeTarget(targetKg)) {
    return null;
  }
  const parMoves = minMovesForTarget(targetKg);
  if (parMoves == null) {
    return null;
  }
  return { dayKey, targetKg, parMoves };
}

export function minMovesForTarget(
  targetKg: number,
  barKg = BAR_KG,
): number | null {
  const plates = minSidePlates(perSideUnits(targetKg, barKg));
  return plates == null ? null : plates.length;
}

export function minSidePlates(perSideUnits: number): number[] | null {
  if (perSideUnits < 0) {
    return null;
  }
  if (perSideUnits === 0) {
    return [];
  }

  const plateUnits = SIDE_PLATES.map((plate) => toKgUnits(plate)).sort(
    (left, right) => right - left,
  );
  const best = new Array<number>(perSideUnits + 1).fill(
    Number.POSITIVE_INFINITY,
  );
  const pick = new Array<number>(perSideUnits + 1).fill(-1);
  best[0] = 0;

  for (let units = 1; units <= perSideUnits; units += 1) {
    for (const plate of plateUnits) {
      if (plate > units || !Number.isFinite(best[units - plate])) {
        continue;
      }
      const next = best[units - plate] + 1;
      if (next < best[units]) {
        best[units] = next;
        pick[units] = plate;
      }
    }
  }

  if (!Number.isFinite(best[perSideUnits])) {
    return null;
  }

  const out: number[] = [];
  let left = perSideUnits;
  while (left > 0) {
    const plate = pick[left];
    if (plate < 0) {
      return null;
    }
    out.push(fromKgUnits(plate));
    left -= plate;
  }
  return out;
}

export function movesHitTarget(
  plates: ReadonlyArray<number>,
  targetKg: number,
  barKg = BAR_KG,
): boolean {
  return loadedKg(plates, barKg) === targetKg;
}

export function barbellDailyGrade(
  moves: number,
  parMoves: number,
): "perfect" | "solid" | "done" {
  if (moves <= parMoves) {
    return "perfect";
  }
  if (moves <= parMoves + 1) {
    return "solid";
  }
  return "done";
}

export function barbellDailyGradeLine(
  grade: ReturnType<typeof barbellDailyGrade>,
): string {
  if (grade === "perfect") {
    return "Идеально.";
  }
  if (grade === "solid") {
    return "Ровно.";
  }
  return "Встало.";
}

function perSideUnits(targetKg: number, barKg: number): number {
  const total = toKgUnits(targetKg) - toKgUnits(barKg);
  if (total < 0 || total % 2 !== 0) {
    return -1;
  }
  return total / 2;
}

function hashDayKey(dayKey: string): number {
  let hash = 0;
  for (const char of dayKey) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return hash;
}
