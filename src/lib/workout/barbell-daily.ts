import {
  BAR_KG,
  fromKgUnits,
  loadedKg,
  loadStatus,
  plateLabel,
  REST_LOAD_OVER_LINE,
  SIDE_PLATES,
  type SidePlate,
  toKgUnits,
} from "@/lib/workout/rest-load";

const MIN_TARGET_KG = 80;
const MAX_TARGET_KG = 220;
const MIN_PAR = 4;
const MAX_PAR = 6;
const MAX_SIDE_UNITS = toKgUnits(110);

// Counts follow SIDE_PLATES: 25, 20, 15, 10, 5, 2.5, 1.25.
// Each rack is missing a plate the usual greedy load wants.
const RACK_PRESETS: ReadonlyArray<readonly number[]> = [
  [0, 2, 2, 2, 2, 2, 2],
  [0, 1, 2, 2, 2, 2, 2],
  [1, 0, 2, 2, 2, 2, 1],
  [0, 0, 2, 3, 3, 2, 2],
  [0, 1, 0, 3, 3, 2, 2],
  [1, 0, 0, 3, 2, 2, 2],
  [0, 2, 0, 2, 3, 2, 2],
  [1, 0, 2, 0, 3, 2, 2],
  [0, 1, 2, 1, 2, 2, 2],
  [2, 0, 0, 2, 2, 2, 2],
];

const FALLBACK_COUNTS = [0, 0, 2, 2, 2, 2, 1] as const;
const FALLBACK_PLATES = [15, 10, 10, 5] as const;

export interface RackSlot {
  plate: SidePlate;
  count: number;
}

export interface BarbellDailyChallenge {
  dayKey: string;
  targetKg: number;
  parMoves: number;
  parPlates: number[];
  rack: RackSlot[];
}

export function dailyChallenge(dayKey: string): BarbellDailyChallenge | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return null;
  }
  return challengeFromPresets(dayKey) ?? fallbackChallenge(dayKey);
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

export function barbellDailyGradeEmoji(
  grade: ReturnType<typeof barbellDailyGrade>,
): string {
  if (grade === "perfect") {
    return "🟩";
  }
  if (grade === "solid") {
    return "🟨";
  }
  return "⬜";
}

export function optimalSidePlates(
  targetKg: number,
  barKg = BAR_KG,
): number[] | null {
  const units = perSideUnits(targetKg, barKg);
  if (units < 0) {
    return null;
  }
  return minSidePlates(units);
}

export function formatSidePlateStack(plates: ReadonlyArray<number>): string {
  if (plates.length === 0) {
    return "—";
  }
  return plates.map((plate) => plateLabel(plate)).join("+");
}

export function remainingPerSideKg(
  currentKg: number,
  targetKg: number,
  barKg = BAR_KG,
): number | null {
  const targetUnits = toKgUnits(targetKg) - toKgUnits(barKg);
  const currentUnits = toKgUnits(currentKg) - toKgUnits(barKg);
  if (targetUnits < 0 || targetUnits % 2 !== 0) {
    return null;
  }
  if (currentUnits < 0 || currentUnits % 2 !== 0) {
    return null;
  }
  const left = (targetUnits - currentUnits) / 2;
  if (left < 0) {
    return null;
  }
  return fromKgUnits(left);
}

export function barbellDailyPlayLine(
  currentKg: number,
  targetKg: number,
  revealRemainder = false,
): string {
  const status = loadStatus(currentKg, targetKg);
  if (status === "over") {
    return REST_LOAD_OVER_LINE;
  }
  const base = `${plateLabel(currentKg)} / ${plateLabel(targetKg)} кг`;
  if (!revealRemainder) {
    return base;
  }
  const rem = remainingPerSideKg(currentKg, targetKg);
  if (rem != null && rem > 0) {
    return `${base} · на сторону ещё ${plateLabel(rem)} кг`;
  }
  return base;
}

export const BARBELL_DAILY_RULES =
  "Гриф 20 кг уже на полу. Каждая кнопка — пара блинов. На стойке сегодня не всё.";

export function rackCount(rack: readonly RackSlot[], plate: number): number {
  for (const slot of rack) {
    if (slot.plate === plate) {
      return slot.count;
    }
  }
  return 0;
}

export function canTakePlate(
  rack: readonly RackSlot[],
  plates: readonly number[],
  plate: number,
): boolean {
  return (plateTally(plates).get(plate) ?? 0) < rackCount(rack, plate);
}

export function rackAllows(
  rack: readonly RackSlot[],
  plates: readonly number[],
): boolean {
  for (const [plate, count] of plateTally(plates)) {
    if (count > rackCount(rack, plate)) {
      return false;
    }
  }
  return true;
}

export function formatRack(rack: readonly RackSlot[]): string {
  const parts: string[] = [];
  for (const slot of rack) {
    if (slot.count <= 0) {
      continue;
    }
    const label = plateLabel(slot.plate);
    parts.push(slot.count === 1 ? label : `${label}×${slot.count}`);
  }
  return parts.join(", ");
}

export function formatMissingRack(rack: readonly RackSlot[]): string | null {
  const missing = rack
    .filter((slot) => slot.count <= 0)
    .map((slot) => plateLabel(slot.plate));
  if (missing.length === 0) {
    return null;
  }
  return missing.join(", ");
}

export function plateCountWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "блин";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "блина";
  }
  return "блинов";
}

export function streakDayWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "день";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "дня";
  }
  return "дней";
}

function perSideUnits(targetKg: number, barKg: number): number {
  const total = toKgUnits(targetKg) - toKgUnits(barKg);
  if (total < 0 || total % 2 !== 0) {
    return -1;
  }
  return total / 2;
}

export function barbellDayHash(dayKey: string): number {
  let hash = 0;
  for (const char of dayKey) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return hash;
}

function challengeFromPresets(dayKey: string): BarbellDailyChallenge | null {
  const presetHash = Math.abs(barbellDayHash(dayKey));
  const targetHash = Math.abs(barbellDayHash(`${dayKey}:kg`));
  for (let offset = 0; offset < RACK_PRESETS.length; offset += 1) {
    const counts = RACK_PRESETS[(presetHash + offset) % RACK_PRESETS.length];
    if (!counts) {
      continue;
    }
    const candidates = rackCandidates(counts);
    if (candidates.length === 0) {
      continue;
    }
    const picked = candidates[targetHash % candidates.length];
    if (!picked) {
      continue;
    }
    return toChallenge(dayKey, counts, picked);
  }
  return null;
}

function fallbackChallenge(dayKey: string): BarbellDailyChallenge {
  return toChallenge(dayKey, FALLBACK_COUNTS, {
    units: FALLBACK_PLATES.reduce((sum, plate) => sum + toKgUnits(plate), 0),
    plates: [...FALLBACK_PLATES],
  });
}

function toChallenge(
  dayKey: string,
  counts: readonly number[],
  picked: { units: number; plates: readonly number[] },
): BarbellDailyChallenge {
  const parPlates = [...picked.plates].sort((left, right) => right - left);
  return {
    dayKey,
    targetKg: fromKgUnits(toKgUnits(BAR_KG) + picked.units * 2),
    parMoves: parPlates.length,
    parPlates,
    rack: SIDE_PLATES.map((plate, index) => ({
      plate,
      count: counts[index] ?? 0,
    })),
  };
}

function rackCandidates(
  counts: readonly number[],
): Array<{ units: number; plates: number[] }> {
  const rack = SIDE_PLATES.map((plate, index) => ({
    plate,
    count: counts[index] ?? 0,
  }));
  const ways = lightestPlates(counts);
  const candidates: Array<{ units: number; plates: number[] }> = [];
  for (const [units, plates] of ways) {
    if (units === 0 || plates.length < MIN_PAR || plates.length > MAX_PAR) {
      continue;
    }
    if (new Set(plates).size < 2) {
      continue;
    }
    const targetKg = fromKgUnits(toKgUnits(BAR_KG) + units * 2);
    if (targetKg < MIN_TARGET_KG || targetKg > MAX_TARGET_KG) {
      continue;
    }
    const greedy = minSidePlates(units);
    if (greedy != null && rackAllows(rack, greedy)) {
      continue;
    }
    candidates.push({ units, plates });
  }
  candidates.sort(
    (left, right) =>
      left.units - right.units ||
      left.plates.join(",").localeCompare(right.plates.join(",")),
  );
  return candidates;
}

function lightestPlates(counts: readonly number[]): Map<number, number[]> {
  let ways = new Map<number, number[]>();
  ways.set(0, []);
  for (let plateIndex = 0; plateIndex < SIDE_PLATES.length; plateIndex += 1) {
    const plate = SIDE_PLATES[plateIndex];
    const count = counts[plateIndex] ?? 0;
    if (plate == null || count <= 0) {
      continue;
    }
    const plateUnits = toKgUnits(plate);
    for (let copy = 0; copy < count; copy += 1) {
      const next = new Map(ways);
      for (const [units, plates] of ways) {
        if (plates.length >= MAX_PAR) {
          continue;
        }
        const got = units + plateUnits;
        if (got > MAX_SIDE_UNITS) {
          continue;
        }
        const candidate = [...plates, plate];
        const prev = next.get(got);
        if (!prev || candidate.length < prev.length) {
          next.set(got, candidate);
        }
      }
      ways = next;
    }
  }
  return ways;
}

function plateTally(plates: readonly number[]): Map<number, number> {
  const tally = new Map<number, number>();
  for (const plate of plates) {
    tally.set(plate, (tally.get(plate) ?? 0) + 1);
  }
  return tally;
}
