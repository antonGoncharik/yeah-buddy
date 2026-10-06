import { shiftIsoDate } from "@/lib/day/dates";
import { dayHasFood } from "@/lib/day/week";
import { liveProteinHits, proteinWeekLine } from "@/lib/flavor";
import type { DayHistoryRow } from "@/lib/types";

/** First two weeks after onboarding — habit loop in the app and bot. */
export const EARLY_HABIT_DAYS = 14;
export const FOOD_LOG_STREAK_WINDOW = 14;

export function inEarlyHabitWindow(ageDays: number | null): boolean {
  return ageDays != null && ageDays >= 0 && ageDays < EARLY_HABIT_DAYS;
}

export interface EarlyHabitSnapshot {
  foodLogStreak: number;
  foodAtRisk: boolean;
  proteinHits: number;
  proteinLine: string | null;
  gymSessionsWeek: number;
  dayOfHabit: number;
}

export function priorFoodLogDays(
  days: ReadonlyArray<{
    date: string;
    fact_protein: number;
    fact_fat: number;
    fact_carbs: number;
    fact_kcal: number;
  }>,
  endDate: string,
): number {
  const byDate = new Map(days.map((day) => [day.date, day]));
  let count = 0;
  for (let offset = 1; offset < FOOD_LOG_STREAK_WINDOW; offset += 1) {
    const row = byDate.get(shiftIsoDate(endDate, -offset)) ?? null;
    if (!dayHasFood(row as DayHistoryRow | null)) {
      break;
    }
    count += 1;
  }
  return count;
}

export function liveFoodLogStreak(
  todayHasFood: boolean,
  priorDays: number,
): number {
  return todayHasFood ? priorDays + 1 : priorDays;
}

export function foodLogStreakAtRisk(
  todayHasFood: boolean,
  priorDays: number,
): boolean {
  return !todayHasFood && priorDays > 0;
}

export function earlyProteinLine(
  todayClosed: boolean,
  priorHits: number,
): string | null {
  const hits = liveProteinHits(todayClosed, priorHits);
  const milestone = proteinWeekLine(hits);
  if (milestone) {
    return milestone;
  }
  if (hits >= 3) {
    return `Белок ${hits} ${daysWord(hits)} подряд — до четвёртого осталось чуть-чуть.`;
  }
  if (hits === 2) {
    return "Белок два дня подряд.";
  }
  if (hits === 1) {
    return "Белок закрыт сегодня — завтра можно второй день подряд.";
  }
  if (priorHits >= 1 && !todayClosed) {
    return `Белок ${priorHits} ${daysWord(priorHits)} подряд — сегодня ещё можно продлить.`;
  }
  return null;
}

export function buildEarlyHabitSnapshot(input: {
  accountAgeDays: number;
  todayHasFood: boolean;
  priorFoodLogDays: number;
  todayProteinClosed: boolean;
  priorProteinHits: number;
  gymSessionsWeek: number;
}): EarlyHabitSnapshot {
  const foodLogStreak = liveFoodLogStreak(
    input.todayHasFood,
    input.priorFoodLogDays,
  );
  const proteinHits = liveProteinHits(
    input.todayProteinClosed,
    input.priorProteinHits,
  );
  return {
    foodLogStreak,
    foodAtRisk: foodLogStreakAtRisk(
      input.todayHasFood,
      input.priorFoodLogDays,
    ),
    proteinHits,
    proteinLine: earlyProteinLine(
      input.todayProteinClosed,
      input.priorProteinHits,
    ),
    gymSessionsWeek: input.gymSessionsWeek,
    dayOfHabit: input.accountAgeDays + 1,
  };
}

export function earlyHabitFoodMilestone(streak: number): string | null {
  if (streak === 3) {
    return "Три дня с едой в дневнике — привычка цепляется.";
  }
  if (streak === 7) {
    return "Неделя подряд с записями. Так и держим.";
  }
  if (streak === 14) {
    return "Две недели дневника — ты уже не гость.";
  }
  return null;
}

export function earlyHabitLead(snapshot: EarlyHabitSnapshot): string {
  if (snapshot.dayOfHabit <= 3) {
    return "Первые дни — главное открыть и записать хоть что-то.";
  }
  if (snapshot.dayOfHabit <= 7) {
    return "Неделя привычки: еда каждый день, белок и зал по плану.";
  }
  return "Вторая неделя — закрепи ритм, пока он свежий.";
}

function daysWord(count: number): string {
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

export function foodStreakLabel(streak: number, atRisk: boolean): string {
  if (streak <= 0) {
    return "Запиши еду — с этого начинается серия.";
  }
  const base = `${streak} ${daysWord(streak)} с едой в дневнике`;
  return atRisk ? `${base}. Сегодня ещё пусто — не оборви.` : base;
}
