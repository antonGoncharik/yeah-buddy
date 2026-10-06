import { dayHasFood, weekDates } from "@/lib/day/week";
import { proteinClosed } from "@/lib/flavor";
import { EARLY_HABIT_DAYS } from "@/lib/retention/habit";
import type { DayHistoryRow } from "@/lib/types";

/** Days 15–30 after onboarding (age 14–29 inclusive). */
export const HABIT_BRIDGE_END_DAYS = 30;

export function inHabitBridgeWindow(ageDays: number | null): boolean {
  return (
    ageDays != null &&
    ageDays >= EARLY_HABIT_DAYS &&
    ageDays < HABIT_BRIDGE_END_DAYS
  );
}

export interface HabitBridgeSnapshot {
  foodDaysWeek: number;
  gymSessionsWeek: number;
  proteinHitDaysWeek: number;
  reviewReady: boolean;
}

export function buildHabitBridgeSnapshot(input: {
  today: string;
  recentDays: ReadonlyArray<{
    date: string;
    fact_protein: number;
    target_protein: number;
    fact_kcal: number;
    fact_fat: number;
    fact_carbs: number;
  }>;
  gymSessionsWeek: number;
  reviewReady: boolean;
}): HabitBridgeSnapshot {
  const byDate = new Map(input.recentDays.map((day) => [day.date, day]));
  let foodDaysWeek = 0;
  let proteinHitDaysWeek = 0;

  for (const date of weekDates(input.today)) {
    const row = byDate.get(date) ?? null;
    if (!dayHasFood(row as DayHistoryRow | null)) {
      continue;
    }
    foodDaysWeek += 1;
    if (
      row &&
      row.target_protein > 0 &&
      proteinClosed(row.target_protein - row.fact_protein, row.fact_protein)
    ) {
      proteinHitDaysWeek += 1;
    }
  }

  return {
    foodDaysWeek,
    gymSessionsWeek: input.gymSessionsWeek,
    proteinHitDaysWeek,
    reviewReady: input.reviewReady,
  };
}

export function habitBridgeLead(snapshot: HabitBridgeSnapshot): string {
  if (snapshot.foodDaysWeek >= 5 && snapshot.gymSessionsWeek >= 2) {
    return "Ритм держится — смотри неделю и закрепи.";
  }
  if (snapshot.foodDaysWeek < 4) {
    return "Вторая половина месяца: чем больше дней с едой, тем проще не бросить.";
  }
  return "Неделя на виду — белок, зал и записи без лишней суеты.";
}
