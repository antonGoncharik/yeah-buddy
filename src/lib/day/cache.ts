import { clearActionError, reportActionError } from "@/lib/action-error";
import {
  beginMutation,
  endMutation,
  peekJson,
  writeJson,
} from "@/lib/api-cache";
import { calendarToday, isCatchUpWindowDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { bumpOrAddFood, dayFromTemplate } from "@/lib/day/optimistic";
import { remainingFills } from "@/lib/day/remaining";
import { readDay, readRecipes } from "@/lib/day/today-payload";
import { parseFoodList } from "@/lib/food/map";
import { readCachedTemplate } from "@/lib/meal/template-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros, defaultMacroGoals } from "@/lib/nutrition";
import { isRecord } from "@/lib/read";
import { readSettingsPayload } from "@/lib/settings/map";
import { haptic } from "@/lib/telegram/haptic";
import type {
  DayType,
  Food,
  MealTemplateDetail,
  MealType,
  NamedMealHint,
} from "@/lib/types";

type DayListener = (date: string, day: DayWithMeals | null) => void;

const listeners = new Set<DayListener>();

export function daysUrl(date: string): string {
  return `/api/days?date=${encodeURIComponent(date)}`;
}

export function subscribeDayCache(listener: DayListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readCachedDay(date: string): DayWithMeals | null {
  return readDay(peekJson(daysUrl(date)));
}

export function writeCachedDay(date: string, day: DayWithMeals | null): void {
  const url = daysUrl(date);
  const current = peekJson(url);
  const payload = isRecord(current) ? { ...current, day } : { day };
  writeJson(url, payload);
  emit(date, day);
}

export function writeDayResponse(
  date: string,
  data: unknown,
): DayWithMeals | null {
  const url = daysUrl(date);
  const current = peekJson(url);
  const payload =
    isRecord(current) && isRecord(data) ? { ...current, ...data } : data;
  writeJson(url, payload);
  const day = readDay(payload);
  emit(date, day);
  return day;
}

export function writeCachedNamedMeals(
  date: string,
  namedMeals: NamedMealHint[],
): void {
  const url = daysUrl(date);
  const current = peekJson(url);
  writeJson(
    url,
    isRecord(current) ? { ...current, namedMeals } : { namedMeals },
  );
}

export function restoreDayPayload(date: string, payload: unknown): void {
  const url = daysUrl(date);
  if (payload == null) {
    const current = peekJson(url);
    const next = isRecord(current) ? { ...current, day: null } : { day: null };
    writeJson(url, next);
    emit(date, null);
    return;
  }
  writeJson(url, payload);
  emit(date, readDay(payload));
}

export async function withDayOptimistic(
  date: string,
  nextDay: DayWithMeals | null,
  work: () => Promise<DayWithMeals | null | "keep" | "revert">,
): Promise<void> {
  const url = daysUrl(date);
  const previous = peekJson(url);
  clearActionError();
  beginMutation(url);
  writeCachedDay(date, nextDay);
  try {
    const result = await work();
    if (result === "revert") {
      restoreDayPayload(date, previous);
      return;
    }
    if (result !== "keep") {
      writeCachedDay(date, result);
    }
  } catch (caught) {
    restoreDayPayload(date, previous);
    haptic("error");
    reportActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
  } finally {
    endMutation(url);
  }
}

export function peekFood(id: string): Food | null {
  for (const url of [
    "/api/foods",
    "/api/foods?filter=favorites",
    "/api/foods?filter=recent",
  ]) {
    const food = parseFoodList(peekJson(url)).find((item) => item.id === id);
    if (food) {
      return food;
    }
  }
  for (const dayType of ["rest", "training"] as const) {
    const template = peekTemplate(dayType);
    const item = template?.items.find((row) => row.food.id === id);
    if (item) {
      return item.food;
    }
  }
  return null;
}

export function peekTemplate(dayType: DayType): MealTemplateDetail | null {
  return readCachedTemplate(dayType);
}

export function targetsFromCache(dayType: DayType): {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
} {
  const settings = readSettingsPayload(peekJson("/api/settings"));
  const fallback = defaultMacroGoals(dayType);
  const protein =
    (dayType === "training"
      ? settings?.training_protein
      : settings?.rest_protein) ?? fallback.protein;
  const fat =
    (dayType === "training" ? settings?.training_fat : settings?.rest_fat) ??
    fallback.fat;
  const carbs =
    (dayType === "training"
      ? settings?.training_carbs
      : settings?.rest_carbs) ?? fallback.carbs;
  return {
    protein,
    fat,
    carbs,
    kcal: calcKcalFromMacros(protein, fat, carbs),
  };
}

export function optimisticCreatedDay(
  date: string,
  dayType: DayType,
): DayWithMeals {
  const day = dayFromTemplate(
    date,
    dayType,
    peekTemplate(dayType),
    targetsFromCache(dayType),
  );
  return {
    ...day,
    caught_up: isCatchUpWindowDate(date, calendarToday()),
  };
}

export function applyRemainingFromCache(
  day: DayWithMeals,
  mealType?: MealType,
): DayWithMeals | null {
  const recipes = readRecipes(peekJson(daysUrl(day.date)));
  const recipe = day.is_training_day ? recipes.training : recipes.rest;
  const fills = remainingFills(recipe, day.meals, day.is_training_day).filter(
    (fill) => (mealType ? fill.mealType === mealType : true),
  );
  if (fills.length === 0) {
    return day;
  }

  let next: DayWithMeals = day;
  for (const fill of fills) {
    const food = peekFood(fill.foodId);
    if (!food) {
      return null;
    }
    next = bumpOrAddFood(next, fill.mealType, food, fill.grams);
  }
  return next;
}

function emit(date: string, day: DayWithMeals | null): void {
  for (const listener of listeners) {
    listener(date, day);
  }
}
