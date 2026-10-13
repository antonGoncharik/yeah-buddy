import { barbellDayHash } from "@/lib/workout/barbell-daily";
import {
  BAR_KG,
  fromKgUnits,
  plateLabel,
  SIDE_PLATES,
  toKgUnits,
} from "@/lib/workout/rest-load";

export const BALANCE_TILT_LIMIT_KG = 25;

export const BALANCE_RULES = `Те же килограммы. Каждый блин — на одну сторону. Перекос больше ${plateLabel(BALANCE_TILT_LIMIT_KG)} кг — блины съезжают.`;

export interface BalanceProof {
  pile: number[];
  left: number[];
  right: number[];
}

export type BalanceSide = "left" | "right";

export interface BalanceMove {
  side: BalanceSide;
  plate: number;
}

export function sideUnits(plates: readonly number[]): number {
  return plates.reduce((sum, plate) => sum + toKgUnits(plate), 0);
}

export function balanceWouldDump(
  left: readonly number[],
  right: readonly number[],
  limitKg = BALANCE_TILT_LIMIT_KG,
): boolean {
  return Math.abs(sideUnits(left) - sideUnits(right)) > toKgUnits(limitKg);
}

export function balanceHitsTarget(
  left: readonly number[],
  right: readonly number[],
  targetKg: number,
): boolean {
  if (left.length + right.length === 0) {
    return false;
  }
  if (sideUnits(left) !== sideUnits(right)) {
    return false;
  }
  const total = fromKgUnits(
    toKgUnits(BAR_KG) + sideUnits(left) + sideUnits(right),
  );
  return total === targetKg;
}

export function balanceTiltDeg(
  left: readonly number[],
  right: readonly number[],
  limitKg = BALANCE_TILT_LIMIT_KG,
): number {
  const limit = toKgUnits(limitKg);
  if (limit <= 0) {
    return 0;
  }
  const ratio = (sideUnits(right) - sideUnits(left)) / limit;
  const clamped = Math.max(-1.25, Math.min(1.25, ratio));
  return clamped * 14;
}

export function balancePlayLine(
  left: readonly number[],
  right: readonly number[],
  targetKg: number,
  dumped: boolean,
): string {
  if (dumped) {
    return "Съехали.";
  }
  const total = fromKgUnits(
    toKgUnits(BAR_KG) + sideUnits(left) + sideUnits(right),
  );
  const base = `${plateLabel(total)} / ${plateLabel(targetKg)} кг`;
  const diff = fromKgUnits(Math.abs(sideUnits(left) - sideUnits(right)));
  if (diff <= 0) {
    return base;
  }
  return `${base} · перекос ${plateLabel(diff)}`;
}

export function balanceGrade(dumps: number): "perfect" | "solid" | "done" {
  if (dumps <= 0) {
    return "perfect";
  }
  if (dumps === 1) {
    return "solid";
  }
  return "done";
}

export function balanceGradeLine(
  grade: ReturnType<typeof balanceGrade>,
): string {
  if (grade === "perfect") {
    return "Ровно.";
  }
  if (grade === "solid") {
    return "Чуть качнуло.";
  }
  return "Встало.";
}

export function balanceDeal(
  parPlates: readonly number[],
  dayKey: string,
): number[] {
  return proveBalanceDeal(parPlates, dayKey).pile;
}

export function proveBalanceDeal(
  parPlates: readonly number[],
  dayKey: string,
): BalanceProof {
  const units = parPlates.reduce((sum, plate) => sum + toKgUnits(plate), 0);
  const combos = plateCombos(units);
  const hash = Math.abs(barbellDayHash(`${dayKey}:balance`));
  const tries =
    combos.length === 0 ? 0 : Math.min(48, Math.max(combos.length, 1) * 6);
  for (let offset = 0; offset < tries; offset += 1) {
    const left = combos[mod(hash + offset, combos.length)];
    const right = combos[mod(Math.imul(hash, 3) + offset * 5, combos.length)];
    if (!left || !right || samePlates(left, right)) {
      continue;
    }
    if (left.length + right.length > 10) {
      continue;
    }
    if (findSafeOrder(left, right) == null) {
      continue;
    }
    return {
      pile: seededShuffle([...left, ...right], `${dayKey}:pile`),
      left,
      right,
    };
  }
  const mirror = combos[mod(hash, combos.length)] ?? [...parPlates];
  return {
    pile: seededShuffle([...mirror, ...mirror], `${dayKey}:pile`),
    left: mirror,
    right: [...mirror],
  };
}

export function findSafeOrder(
  left: readonly number[],
  right: readonly number[],
  limitKg = BALANCE_TILT_LIMIT_KG,
): BalanceMove[] | null {
  if (left.length > 16 || right.length > 16) {
    return null;
  }
  const limit = toKgUnits(limitKg);
  const leftUnits = left.map((plate) => toKgUnits(plate));
  const rightUnits = right.map((plate) => toKgUnits(plate));
  const fullLeft = (1 << left.length) - 1;
  const fullRight = (1 << right.length) - 1;
  const seen = new Set<string>();

  function walk(
    maskLeft: number,
    maskRight: number,
    diff: number,
  ): BalanceMove[] | null {
    if (maskLeft === fullLeft && maskRight === fullRight) {
      return [];
    }
    const key = `${maskLeft}:${maskRight}:${diff}`;
    if (seen.has(key)) {
      return null;
    }
    seen.add(key);
    for (let index = 0; index < left.length; index += 1) {
      const bit = 1 << index;
      if ((maskLeft & bit) !== 0) {
        continue;
      }
      const next = diff - (leftUnits[index] ?? 0);
      if (Math.abs(next) > limit) {
        continue;
      }
      const rest = walk(maskLeft | bit, maskRight, next);
      const plate = left[index];
      if (rest && plate != null) {
        return [{ side: "left", plate }, ...rest];
      }
    }
    for (let index = 0; index < right.length; index += 1) {
      const bit = 1 << index;
      if ((maskRight & bit) !== 0) {
        continue;
      }
      const next = diff + (rightUnits[index] ?? 0);
      if (Math.abs(next) > limit) {
        continue;
      }
      const rest = walk(maskLeft, maskRight | bit, next);
      const plate = right[index];
      if (rest && plate != null) {
        return [{ side: "right", plate }, ...rest];
      }
    }
    return null;
  }

  return walk(0, 0, 0);
}

function plateCombos(units: number): number[][] {
  const out: number[][] = [];
  const acc: number[] = [];
  function walk(remaining: number, start: number) {
    if (acc.length > 5) {
      return;
    }
    if (remaining === 0) {
      if (acc.length >= 3) {
        out.push([...acc]);
      }
      return;
    }
    if (acc.length === 5) {
      return;
    }
    for (let index = start; index < SIDE_PLATES.length; index += 1) {
      const plate = SIDE_PLATES[index];
      if (plate == null) {
        continue;
      }
      const plateUnits = toKgUnits(plate);
      if (plateUnits > remaining) {
        continue;
      }
      acc.push(plate);
      walk(remaining - plateUnits, index);
      acc.pop();
    }
  }
  walk(units, 0);
  return out;
}

function mod(value: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return ((value % length) + length) % length;
}

function samePlates(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function seededShuffle(items: readonly number[], salt: string): number[] {
  const out = [...items];
  let state = Math.abs(barbellDayHash(salt)) || 1;
  for (let index = out.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    const swap = (state >>> 0) % (index + 1);
    const current = out[index];
    out[index] = out[swap] ?? current;
    out[swap] = current;
  }
  return out;
}
