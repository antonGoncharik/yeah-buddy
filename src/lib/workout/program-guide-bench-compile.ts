import type {
  ProgramDay,
  ProgramSlot,
} from "@/lib/workout/program-preset-data";
import {
  BENCH_GUIDE_DAY_NAMES,
  feel,
  guideDay,
  pct,
  pctSeq,
  vol,
} from "@/lib/workout/program-preset-builders";

const ALIASES: Record<string, string> = {
  sq: "Приседания со штангой",
  bp: "Жим лёжа",
  bpinc: "Жим лёжа под наклоном",
  bpincdb: "Жим гантелей под наклоном",
  fly: "Разведение гантелей лёжа",
  curl: "Подъём штанги на бицепс",
  abs: "Пресс",
  hyper: "Гиперэкстензия",
  hyperw: "Гиперэкстензия с весом",
  ohp: "Жим стоя",
  ohpseated: "Жим штанги сидя",
  pull: "Подтягивания",
  pullneg: "Негативные подтягивания",
  rowh: "Тяга горизонтального блока",
  rowv: "Тяга верхнего блока",
  wrist: "Сгибания кисти",
  latdb: "Разведение гантелей в стороны",
  tri: "Разгибание на блоке",
  hammer: "Молотковый подъём",
  curlrev: "Сгибание на бицепс обратным хватом",
  close: "Жим узким хватом",
  dl: "Становая тяга",
  dlstiff: "Мертвая тяга",
  medium: "Жим средним хватом",
  french: "Французский жим",
  tbar: "Тяга Т-штанги",
  dbrow: "Тяга гантели в наклоне",
  dbpress: "Жим гантелей лёжа",
  dbohp: "Жим гантелей сидя",
  meditate: "Медитация в зале",
};

type PctBlock = { p: number; r: number; s: number };
type RawSlot =
  | { k: string; t: "p"; blocks: PctBlock[] }
  | { k: string; t: "f"; r: number; s: number }
  | { k: string; t: "v"; r: number; s: number };

type RawDay = { d: "Пн" | "Ср" | "Пт"; slots: RawSlot[] };

function name(key: string): string {
  const mapped = ALIASES[key];
  if (!mapped) {
    throw new Error(`Unknown exercise key: ${key}`);
  }
  return mapped;
}

function compileSlot(raw: RawSlot): ProgramSlot {
  if (raw.t === "p") {
    if (raw.blocks.length === 1) {
      const [block] = raw.blocks;
      return pct(name(raw.k), block.p, block.r, block.s);
    }
    return pctSeq(
      name(raw.k),
      raw.blocks.map((block) => ({
        percent: block.p,
        reps: block.r,
        sets: block.s,
      })),
    );
  }
  if (raw.t === "f") {
    return feel(name(raw.k), raw.s, raw.r);
  }
  return vol(name(raw.k), raw.s, raw.r);
}

function compileDay(raw: RawDay): ProgramDay {
  return guideDay(raw.d, raw.slots.map(compileSlot));
}

export function compileBenchGuideWeeks(
  weeks: Record<string, RawDay[]>,
): Record<string, ProgramDay[]> {
  const out: Record<string, ProgramDay[]> = {};
  for (const [key, days] of Object.entries(weeks)) {
    out[key] = days.map(compileDay);
    for (const day of out[key]) {
      if (!(BENCH_GUIDE_DAY_NAMES as readonly string[]).includes(day.name)) {
        throw new Error(`Bad day name ${day.name}`);
      }
    }
  }
  return out;
}

export type { RawDay, RawSlot, PctBlock };
