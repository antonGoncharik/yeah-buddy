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

export function sessionDoneLead(feel: SessionFeel | null): string {
  if (feel === "close") {
    return "Так и надо.";
  }
  if (feel === "miss") {
    return "Бывает. Записано как было.";
  }
  return "Записано как в плане. Другой вес — поправь.";
}

export function sessionRaiseLine(
  abovePlan: boolean,
  feel: SessionFeel | null,
): string {
  if (abovePlan) {
    return "Где-то больше плана. Рабочий сам не прыгнет.";
  }
  if (feel === "easy") {
    return "Можно поднять рабочий.";
  }
  return "Легко. Можно поднять рабочий.";
}

export function sessionMilestoneLine(count: number): string | null {
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

export function firstDeloadLine(
  circle: PhaseCircleProgress | null,
): string | null {
  if (circle == null || circle.phase_type !== "deload") {
    return null;
  }
  if (circle.completed_count > 1) {
    return null;
  }
  return "Сброс. Легче — не значит зря.";
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
export const DARK_THEME_LABEL = "Ночная смена";
export const OVERFLOW_KCAL_LABEL = "Ну, праздник.";
export const PROTEIN_CLOSED_LABEL = "закрыт";
export const STEADY_WEIGHT_DAYS = 14;
export const STEADY_WEIGHT_LINE = "Вес стоит. Нормально.";
export const SPLASH_HOLD_MS = 480;
export const PLATE_BURST_MS = 400;
export const PROTEIN_CLOSED_MS = 1200;

export function proteinClosed(remaining: number, factProtein: number): boolean {
  return factProtein > 0 && remaining <= 0.5;
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
