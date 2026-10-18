import {
  fitRationDay,
  macroGoalsFromSettings,
  type RationFood,
  type RationItem,
  type RationRole,
} from "@/lib/food/ration";
import { defaultMacroGoals, isMealVisible, type Macros } from "@/lib/nutrition";
import type { DayType, MealTemplateDetail, MealType } from "@/lib/types";

const OIL_FAT_PER_100 = 80;
const OIL_CAP_G = 25;
const MAX_G = 1000;
const MIN_MOVE_G = 10;

export interface TemplateGoalSettings {
  rest_protein: number;
  rest_fat: number;
  rest_carbs: number;
  training_protein: number;
  training_fat: number;
  training_carbs: number;
}

export interface FitItem {
  id: string;
  mealType: MealType;
  name: string;
  grams: number;
  per100: Macros;
}

export interface TemplateFitResult {
  grams: Array<{ id: string; grams: number }>;
  changed: boolean;
}

export function inferRationRole(per100: Macros): RationRole {
  const protein = positive(per100.protein);
  const fat = positive(per100.fat);
  const carbs = positive(per100.carbs);
  const proteinCal = protein * 4;
  const fatCal = fat * 9;
  const carbCal = carbs * 4;
  const total = proteinCal + fatCal + carbCal;
  if (!(total > 0)) {
    return "anchor";
  }

  if (fat >= OIL_FAT_PER_100 && fatCal / total >= 0.85) {
    return "fat";
  }

  if (
    protein >= 10 &&
    proteinCal >= fatCal * 0.45 &&
    proteinCal >= carbCal * 0.7
  ) {
    return "protein";
  }

  const top = Math.max(proteinCal, fatCal, carbCal);
  if (top / total < 0.55) {
    return "anchor";
  }

  const kcal = positive(per100.kcal) > 0 ? positive(per100.kcal) : total;
  if (fatCal === top && fat >= 8) {
    return "fat";
  }
  if (carbCal === top && carbs >= 12 && kcal >= 70) {
    return "carb";
  }
  return "anchor";
}

export function templateMacroTarget(
  dayType: DayType,
  settings: TemplateGoalSettings | null,
): Macros {
  if (!settings) {
    return defaultMacroGoals(dayType);
  }
  const goals = macroGoalsFromSettings(settings);
  return dayType === "training" ? goals.training : goals.rest;
}

export function visibleTemplateFitItems(
  template: MealTemplateDetail,
): FitItem[] {
  const training = template.day_type === "training";
  return template.items.flatMap((item) => {
    if (!isMealVisible(item.meal_type, training) || !(item.grams > 0)) {
      return [];
    }
    return [
      {
        id: item.id,
        mealType: item.meal_type,
        name: item.food.name,
        grams: item.grams,
        per100: {
          protein: positive(item.food.protein_per_100),
          fat: positive(item.food.fat_per_100),
          carbs: positive(item.food.carbs_per_100),
          kcal: positive(item.food.kcal_per_100),
        },
      },
    ];
  });
}

export function fitTemplateItems(
  items: readonly FitItem[],
  target: Macros,
): TemplateFitResult {
  if (items.length === 0) {
    return { grams: [], changed: false };
  }

  const before = macroError(items, target);
  const foods: RationFood[] = items.map((item) => ({
    name: item.id,
    protein_per_100: positive(item.per100.protein),
    fat_per_100: positive(item.per100.fat),
    carbs_per_100: positive(item.per100.carbs),
    kcal_per_100: positive(item.per100.kcal),
  }));
  const rationItems: RationItem[] = items.map((item) => ({
    mealType: item.mealType,
    foodName: item.id,
    grams: item.grams,
    role: inferRationRole(item.per100),
  }));
  const fitted = fitRationDay("rest", rationItems, foods, target);
  const grams = fitted.items.map((line, index) => {
    const source = items[index];
    return {
      id: source ? source.id : line.foodName,
      grams: line.grams,
    };
  });
  const next = items.map((item, index) => ({
    ...item,
    grams: grams[index]?.grams ?? item.grams,
  }));
  const moved = grams.some((line, index) => {
    const source = items[index];
    return source != null && Math.abs(line.grams - source.grams) >= MIN_MOVE_G;
  });
  const closer = macroError(next, target) + 1 < before;
  return { grams, changed: moved && closer };
}

export function fitVisibleTemplate(
  template: MealTemplateDetail,
  settings: TemplateGoalSettings | null,
): TemplateFitResult {
  return fitTemplateItems(
    visibleTemplateFitItems(template),
    templateMacroTarget(template.day_type, settings),
  );
}

function macroError(items: readonly FitItem[], target: Macros): number {
  const totals = { protein: 0, fat: 0, carbs: 0 };
  for (const item of items) {
    totals.protein += (positive(item.per100.protein) * item.grams) / 100;
    totals.fat += (positive(item.per100.fat) * item.grams) / 100;
    totals.carbs += (positive(item.per100.carbs) * item.grams) / 100;
  }
  return (
    Math.abs(totals.protein - target.protein) +
    Math.abs(totals.fat - target.fat) +
    Math.abs(totals.carbs - target.carbs)
  );
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function canGrowMacro(
  item: FitItem,
  key: "protein" | "fat" | "carbs",
): boolean {
  if (inferRationRole(item.per100) !== roleFor(key)) {
    return false;
  }
  if (!(item.per100[key] > 0) || item.grams >= MAX_G) {
    return false;
  }
  if (
    key === "fat" &&
    item.per100.fat >= OIL_FAT_PER_100 &&
    item.grams >= OIL_CAP_G
  ) {
    return false;
  }
  return true;
}

export function canShrinkMacro(
  item: FitItem,
  key: "protein" | "fat" | "carbs",
): boolean {
  if (inferRationRole(item.per100) !== roleFor(key)) {
    return false;
  }
  return item.per100[key] > 0 && item.grams > 10;
}

function roleFor(key: "protein" | "fat" | "carbs"): RationRole {
  if (key === "protein") {
    return "protein";
  }
  if (key === "fat") {
    return "fat";
  }
  return "carb";
}
