import { shiftIsoDate } from "@/lib/day/dates";
import type { PhaseCircleProgress, SessionFeel } from "@/lib/types";

export type LoadingFlavor = "boot" | "food" | "idle";

export const LOADING_LINES: Record<LoadingFlavor, readonly string[]> = {
  boot: [
    "Загрузка углеводами…",
    "Греем блины…",
    "Ищем рабочий…",
    "Минуту. Белок считается.",
  ],
  food: ["Загрузка углеводами…", "Считаю граммы…", "Греем блины…"],
  idle: ["Загрузка…", "Секунду.", "Минуту."],
};

export function loadingFlavor(options: {
  splash?: boolean;
  title?: string;
}): LoadingFlavor {
  if (options.splash) {
    return "boot";
  }
  if (options.title) {
    return "food";
  }
  return "idle";
}

export function loadingLine(flavor: LoadingFlavor, nowMs: number): string {
  const lines = LOADING_LINES[flavor];
  const hour = Math.floor(nowMs / (1000 * 60 * 60));
  return lines[hour % lines.length] ?? lines[0];
}

export function sessionDoneHeadline(feel: SessionFeel | null): string {
  if (feel === "easy") {
    return "Yeah buddy.";
  }
  if (feel === "close") {
    return "Впритык.";
  }
  if (feel === "miss") {
    return "Не пошло.";
  }
  return "Готово";
}

export function sessionDoneLead(feel: SessionFeel | null): string | null {
  if (feel === "close") {
    return "Так и надо.";
  }
  if (feel === "miss") {
    return "Бывает. Записано как было.";
  }
  return null;
}

export function sessionRaiseLine(
  abovePlan: boolean,
  _feel: SessionFeel | null,
): string {
  if (abovePlan) {
    return "Где-то взял больше плана. 1ПМ сам не вырастет.";
  }
  return "Можно поднять 1ПМ.";
}

export function sessionMilestoneLine(count: number): string | null {
  if (count === 1) {
    return "Первый. Yeah buddy.";
  }
  if (count === 10) {
    return "Десять. Уже не разовый заход.";
  }
  if (count === 50) {
    return "Пятьдесят. Yeah buddy.";
  }
  if (count === 100) {
    return "Сотня. Можно не считать, но мы посчитали.";
  }
  return null;
}

export function firstPhaseLine(
  circle: PhaseCircleProgress | null,
): string | null {
  if (circle == null || circle.completed_count > 1) {
    return null;
  }
  const name = circle.phase_name.trim();
  if (circle.phase_type === "deload") {
    return `${name || "Сброс"}. Легче — не значит зря.`;
  }
  if (circle.phase_type === "peak") {
    return `${name || "Рывок"}. Не плюсуй сгоряча.`;
  }
  if (circle.phase_type === "volume") {
    return `${name || "Набор"}. Тот же 1ПМ, больше работы.`;
  }
  return null;
}

export function firstDeloadLine(
  circle: PhaseCircleProgress | null,
): string | null {
  if (circle == null || circle.phase_type !== "deload") {
    return null;
  }
  return firstPhaseLine(circle);
}

export function comebackLine(
  sessionDate: string,
  lastBefore: string | null,
): string | null {
  if (lastBefore == null) {
    return null;
  }
  const days = isoDayDiff(sessionDate, lastBefore);
  if (days < 14) {
    return null;
  }
  return "Давно не были. Нормально.";
}

function isoDayDiff(end: string, start: string): number {
  const ms =
    Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) {
    return 0;
  }
  return Math.round(ms / 86_400_000);
}

export function consecutiveProteinHits(
  slots: ReadonlyArray<{
    day: { fact_protein: number; target_protein: number } | null;
  }>,
): number {
  let count = 0;
  for (const slot of slots) {
    const day = slot.day;
    if (!day || day.target_protein <= 0) {
      break;
    }
    if (day.fact_protein + 0.5 < day.target_protein) {
      break;
    }
    count += 1;
  }
  return count;
}

export function proteinWeekLine(hits: number): string | null {
  if (hits < 7) {
    return null;
  }
  return "Белок семь дней подряд. Холодильник в курсе.";
}

export const REST_DONE_LABEL = "Погнали.";
export const SKIP_SESSION_LABEL = "Не сегодня.";
export const DARK_THEME_LABEL = "Тёмная";
export const OVERFLOW_KCAL_LABEL = "Ну, праздник.";
export const PROTEIN_CLOSED_LABEL = "закрыт";
export const PROTEIN_ALMOST_LINE = "Почти.";
export const MACROS_CLOSED_LINE = "Три из трёх.";
export const HUNDRED_WEIGHT_LINE = "Сотня.";
export const LIGHT_WEIGHT_LINE = "Лёгкий вес.";
export const YEAH_BUDDY_LINE = "Yeah buddy.";
export const LATE_NIGHT_LINE = "Ещё не спишь.";
export const STEADY_WEIGHT_DAYS = 14;
export const STEADY_WEIGHT_LINE = "Вес стоит. Нормально.";
export const SPLASH_HOLD_MS = 480;
export const PLATE_BURST_MS = 400;
export const PROTEIN_CLOSED_MS = 1200;
export const SPLASH_BEAT_ORDER = [
  "mug",
  "dumbbell",
  "cookie",
  "barbell",
] as const;
export type SplashBeat = (typeof SPLASH_BEAT_ORDER)[number];

const FOOD_SEARCH_EGGS: Record<string, string> = {
  yeah: YEAH_BUDDY_LINE,
  buddy: YEAH_BUDDY_LINE,
  "yeah buddy": YEAH_BUDDY_LINE,
  "yeah buddy.": YEAH_BUDDY_LINE,
  ронни: YEAH_BUDDY_LINE,
  ronnie: YEAH_BUDDY_LINE,
  coleman: YEAH_BUDDY_LINE,
  "light weight": LIGHT_WEIGHT_LINE,
  lightweight: LIGHT_WEIGHT_LINE,
  "легкий вес": LIGHT_WEIGHT_LINE,
};

export function proteinClosed(remaining: number, factProtein: number): boolean {
  return factProtein > 0 && remaining <= 0.5;
}

export function proteinAlmostLine(
  remaining: number,
  factProtein: number,
): string | null {
  if (factProtein <= 0 || remaining <= 0.5 || remaining > 5) {
    return null;
  }
  return PROTEIN_ALMOST_LINE;
}

export function macrosClosedLine(
  fact: { protein: number; fat: number; carbs: number },
  day: { target_protein: number; target_fat: number; target_carbs: number },
): string | null {
  if (
    !macroHit(fact.protein, day.target_protein) ||
    !macroHit(fact.fat, day.target_fat) ||
    !macroHit(fact.carbs, day.target_carbs)
  ) {
    return null;
  }
  return MACROS_CLOSED_LINE;
}

function macroHit(fact: number, plan: number): boolean {
  return plan > 0 && fact + 0.5 >= plan;
}

export function hundredWeightLine(weight: number | null): string | null {
  if (weight == null || Math.abs(weight - 100) > 0.05) {
    return null;
  }
  return HUNDRED_WEIGHT_LINE;
}

export function foodSearchEasterEgg(query: string): string | null {
  const value = query.trim().toLowerCase().replaceAll("ё", "е");
  return FOOD_SEARCH_EGGS[value] ?? null;
}

export function nightLoadingLine(nowMs: number): string | null {
  const hour = new Date(nowMs).getHours();
  if (hour < 1 || hour >= 5) {
    return null;
  }
  return LATE_NIGHT_LINE;
}

export function splashBeatProgress(current: number, key: SplashBeat): number {
  if (current >= SPLASH_BEAT_ORDER.length) {
    return current;
  }
  if (SPLASH_BEAT_ORDER[current] === key) {
    return current + 1;
  }
  return key === SPLASH_BEAT_ORDER[0] ? 1 : 0;
}

export function overflowKcalLabel(overflow: boolean): string {
  return overflow ? OVERFLOW_KCAL_LABEL : "Осталось";
}

export function steadyWeightLine(
  byDate: ReadonlyMap<string, number>,
  endDate: string,
  need = STEADY_WEIGHT_DAYS,
): string | null {
  if (need <= 0) {
    return null;
  }

  let expected: number | null = null;
  for (let offset = 0; offset < need; offset += 1) {
    const date = shiftIsoDate(endDate, -offset);
    const weight = byDate.get(date);
    if (weight == null) {
      return null;
    }
    if (expected == null) {
      expected = weight;
    }
    if (Math.abs(weight - expected) > 0.05) {
      return null;
    }
  }

  return STEADY_WEIGHT_LINE;
}
