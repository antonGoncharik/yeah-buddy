import { foodNameKey } from "@/lib/food/dedupe-foods";
import { STARTER_FOODS } from "@/lib/food/starter";
import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  type Macros,
  roundMacros,
  sumMealItems,
} from "@/lib/nutrition";
import type { DayType, MealType } from "@/lib/types";

export const RATION_IDS = ["usual", "nocook", "fish"] as const;

export type RationId = (typeof RATION_IDS)[number];

export const RECOMMENDED_RATION_ID: RationId = "usual";

/** Protein, carb and fat lines scale. Anchors stay a normal portion. */
export type RationRole = "protein" | "carb" | "fat" | "anchor";

export interface RationItem {
  mealType: MealType;
  foodName: string;
  grams: number;
  role: RationRole;
}

export interface RationDay {
  dayType: DayType;
  items: RationItem[];
}

export interface RationPreset {
  id: RationId;
  name: string;
  hint: string;
  days: readonly RationDay[];
}

export interface RationFood {
  name: string;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
}

export interface FittedRationItem {
  mealType: MealType;
  foodName: string;
  grams: number;
  role: RationRole;
}

export interface FittedRationDay {
  dayType: DayType;
  items: FittedRationItem[];
  totals: Macros;
}

export class RationFoodMissingError extends Error {
  constructor(foodName?: string) {
    super(
      foodName
        ? `В продуктах нет «${foodName}».`
        : "В продуктах не хватает еды для этого рациона.",
    );
    this.name = "RationFoodMissingError";
  }
}

const OIL_CAP_G = 25;
const MIN_G = 5;
const MAX_G = 1000;
const FAT_DENSE = 80;

export const RATIONS: readonly RationPreset[] = [
  {
    id: "usual",
    name: "Обычный",
    hint: "Овсянка, яйца, рис с курицей, творог",
    days: [
      {
        dayType: "rest",
        items: [
          item("breakfast", "Овсянка сухая", 80, "carb"),
          item("breakfast", "Яйца куриные", 150, "protein"),
          item("lunch", "Рис сухой", 70, "carb"),
          item("lunch", "Куриное филе сырое", 200, "protein"),
          item("lunch", "Оливковое масло", 10, "fat"),
          item("snack", "Яблоко", 150, "anchor"),
          item("dinner", "Творог 5%", 200, "protein"),
          item("dinner", "Банан", 120, "anchor"),
          item("dinner", "Грецкий орех", 15, "fat"),
        ],
      },
      {
        dayType: "training",
        items: [
          item("breakfast", "Овсянка сухая", 80, "carb"),
          item("breakfast", "Яйца куриные", 150, "protein"),
          item("lunch", "Рис сухой", 90, "carb"),
          item("lunch", "Куриное филе сырое", 200, "protein"),
          item("lunch", "Оливковое масло", 10, "fat"),
          item("pre_workout", "Банан", 120, "anchor"),
          item("post_workout", "Молоко 2.5%", 200, "anchor"),
          item("dinner", "Творог 5%", 200, "protein"),
          item("dinner", "Яблоко", 150, "anchor"),
          item("dinner", "Грецкий орех", 15, "fat"),
        ],
      },
    ],
  },
  {
    id: "nocook",
    name: "Без плиты",
    hint: "Творог, тунец, хлеб и кефир — ничего не варить",
    days: [
      {
        dayType: "rest",
        items: [
          item("breakfast", "Творог 5%", 200, "protein"),
          item("breakfast", "Хлеб пшеничный", 80, "carb"),
          item("lunch", "Тунец в собственном соку", 120, "protein"),
          item("lunch", "Хлеб пшеничный", 40, "carb"),
          item("lunch", "Арахисовая паста", 15, "fat"),
          item("snack", "Яблоко", 150, "anchor"),
          item("dinner", "Творог 5%", 150, "protein"),
          item("dinner", "Кефир 1%", 200, "anchor"),
          item("dinner", "Банан", 120, "anchor"),
          item("dinner", "Миндаль", 20, "fat"),
        ],
      },
      {
        dayType: "training",
        items: [
          item("breakfast", "Творог 5%", 200, "protein"),
          item("breakfast", "Хлеб пшеничный", 80, "carb"),
          item("lunch", "Тунец в собственном соку", 150, "protein"),
          item("lunch", "Хлеб пшеничный", 60, "carb"),
          item("lunch", "Арахисовая паста", 15, "fat"),
          item("pre_workout", "Банан", 120, "anchor"),
          item("post_workout", "Кефир 1%", 200, "anchor"),
          item("dinner", "Творог 5%", 150, "protein"),
          item("dinner", "Яблоко", 150, "anchor"),
          item("dinner", "Миндаль", 20, "fat"),
        ],
      },
    ],
  },
  {
    id: "fish",
    name: "Рыба и крупа",
    hint: "Гречка, треска, яйца и творог",
    days: [
      {
        dayType: "rest",
        items: [
          item("breakfast", "Яйца куриные", 120, "protein"),
          item("breakfast", "Овсянка сухая", 60, "carb"),
          item("lunch", "Гречка сухая", 80, "carb"),
          item("lunch", "Треска сырая", 200, "protein"),
          item("lunch", "Оливковое масло", 10, "fat"),
          item("snack", "Огурец", 100, "anchor"),
          item("snack", "Помидор", 120, "anchor"),
          item("dinner", "Творог 5%", 180, "protein"),
          item("dinner", "Гречка сухая", 50, "carb"),
          item("dinner", "Грецкий орех", 15, "fat"),
        ],
      },
      {
        dayType: "training",
        items: [
          item("breakfast", "Яйца куриные", 120, "protein"),
          item("breakfast", "Овсянка сухая", 70, "carb"),
          item("lunch", "Гречка сухая", 90, "carb"),
          item("lunch", "Треска сырая", 200, "protein"),
          item("lunch", "Оливковое масло", 10, "fat"),
          item("pre_workout", "Банан", 120, "anchor"),
          item("dinner", "Творог 5%", 180, "protein"),
          item("dinner", "Гречка сухая", 40, "carb"),
          item("dinner", "Яблоко", 150, "anchor"),
          item("dinner", "Грецкий орех", 15, "fat"),
        ],
      },
    ],
  },
];

export function isRationId(value: unknown): value is RationId {
  return RATION_IDS.some((id) => id === value);
}

export function rationById(id: RationId): RationPreset | null {
  return RATIONS.find((preset) => preset.id === id) ?? null;
}

export function macroGoalsFromSettings(settings: {
  rest_protein: number;
  rest_fat: number;
  rest_carbs: number;
  training_protein: number;
  training_fat: number;
  training_carbs: number;
}): { rest: Macros; training: Macros } {
  return {
    rest: withKcal(
      settings.rest_protein,
      settings.rest_fat,
      settings.rest_carbs,
    ),
    training: withKcal(
      settings.training_protein,
      settings.training_fat,
      settings.training_carbs,
    ),
  };
}

export function previewRation(
  id: RationId,
  goals: { rest: Macros; training: Macros },
): { rest: FittedRationDay; training: FittedRationDay } | null {
  const preset = rationById(id);
  if (!preset) {
    return null;
  }
  const rest = preset.days.find((day) => day.dayType === "rest");
  const training = preset.days.find((day) => day.dayType === "training");
  if (!rest || !training) {
    return null;
  }
  return {
    rest: fitRationDay("rest", rest.items, STARTER_FOODS, goals.rest),
    training: fitRationDay(
      "training",
      training.items,
      STARTER_FOODS,
      goals.training,
    ),
  };
}

export function fitRationDay(
  dayType: DayType,
  items: readonly RationItem[],
  foods: readonly RationFood[],
  target: Macros,
): FittedRationDay {
  const table = indexFoods(foods);
  const lines: Working[] = items.map((entry) => {
    const food = table.get(foodNameKey(entry.foodName));
    if (!food) {
      throw new RationFoodMissingError(entry.foodName);
    }
    return {
      mealType: entry.mealType,
      foodName: entry.foodName,
      role: entry.role,
      grams: entry.grams,
      per100: {
        protein: food.protein_per_100,
        fat: food.fat_per_100,
        carbs: food.carbs_per_100,
        kcal: food.kcal_per_100,
      },
    };
  });

  scaleRole(lines, "protein", "protein", target.protein);
  scaleRole(lines, "fat", "fat", target.fat);
  capOils(lines);
  scaleRole(lines, "carb", "carbs", target.carbs);
  scaleRole(lines, "protein", "protein", target.protein);
  scaleRole(lines, "fat", "fat", target.fat);
  capOils(lines);
  scaleRole(lines, "protein", "protein", target.protein);

  for (const line of lines) {
    roundLine(line);
  }

  nudge(lines, "protein", "protein", target.protein);
  nudge(lines, "fat", "fat", target.fat);
  nudge(lines, "carb", "carbs", target.carbs);
  nudge(lines, "protein", "protein", target.protein);
  nudge(lines, "fat", "fat", target.fat);

  return {
    dayType,
    items: lines.map((line) => ({
      mealType: line.mealType,
      foodName: line.foodName,
      grams: line.grams,
      role: line.role,
    })),
    totals: sumLines(lines),
  };
}

function item(
  mealType: MealType,
  foodName: string,
  grams: number,
  role: RationRole,
): RationItem {
  return { mealType, foodName, grams, role };
}

function withKcal(protein: number, fat: number, carbs: number): Macros {
  return {
    protein,
    fat,
    carbs,
    kcal: calcKcalFromMacros(protein, fat, carbs),
  };
}

interface Working {
  mealType: MealType;
  foodName: string;
  role: RationRole;
  grams: number;
  per100: Macros;
}

function indexFoods(foods: readonly RationFood[]): Map<string, RationFood> {
  const table = new Map<string, RationFood>();
  for (const food of foods) {
    const key = foodNameKey(food.name);
    if (!table.has(key)) {
      table.set(key, food);
    }
  }
  return table;
}

function amount(line: Working, key: keyof Macros): number {
  return (line.per100[key] * line.grams) / 100;
}

function totalOf(lines: readonly Working[], key: keyof Macros): number {
  return lines.reduce((sum, line) => sum + amount(line, key), 0);
}

function scaleRole(
  lines: Working[],
  role: RationRole,
  key: "protein" | "fat" | "carbs",
  target: number,
): void {
  const flex = lines.filter((line) => line.role === role);
  const flexAmount = flex.reduce((sum, line) => sum + amount(line, key), 0);
  if (!(flexAmount > 0)) {
    return;
  }
  const need = Math.max(0, target - (totalOf(lines, key) - flexAmount));
  const factor = need / flexAmount;
  for (const line of flex) {
    line.grams *= factor;
  }
}

function capOils(lines: Working[]): void {
  const dense = lines.filter(
    (line) =>
      line.role === "fat" &&
      line.per100.fat >= FAT_DENSE &&
      line.grams > OIL_CAP_G,
  );
  let spill = 0;
  for (const line of dense) {
    spill += ((line.grams - OIL_CAP_G) * line.per100.fat) / 100;
    line.grams = OIL_CAP_G;
  }
  if (!(spill > 0)) {
    return;
  }
  const loose = lines.filter(
    (line) =>
      line.role === "fat" && line.per100.fat < FAT_DENSE && line.per100.fat > 0,
  );
  if (loose.length === 0) {
    return;
  }
  const looseFat = loose.reduce((sum, line) => sum + amount(line, "fat"), 0);
  if (!(looseFat > 0)) {
    const first = loose[0];
    if (first) {
      first.grams += (spill * 100) / first.per100.fat;
    }
    return;
  }
  const factor = (looseFat + spill) / looseFat;
  for (const line of loose) {
    line.grams *= factor;
  }
}

function roundLine(line: Working): void {
  let grams = Math.round(line.grams / 5) * 5;
  if (grams < MIN_G) {
    grams = MIN_G;
  }
  if (grams > MAX_G) {
    grams = MAX_G;
  }
  if (
    line.role === "fat" &&
    line.per100.fat >= FAT_DENSE &&
    grams > OIL_CAP_G
  ) {
    grams = OIL_CAP_G;
  }
  line.grams = grams;
}

function nudge(
  lines: Working[],
  role: RationRole,
  key: "protein" | "fat" | "carbs",
  target: number,
): void {
  for (let step = 0; step < 12; step += 1) {
    const delta = target - totalOf(lines, key);
    if (Math.abs(delta) <= 5) {
      return;
    }
    const pick = lines
      .filter((line) => line.role === role && line.per100[key] > 0)
      .filter((line) => canStep(line, delta > 0))
      .sort((left, right) => right.per100[key] - left.per100[key])[0];
    if (!pick) {
      return;
    }
    pick.grams += delta > 0 ? 5 : -5;
  }
}

function canStep(line: Working, up: boolean): boolean {
  if (up) {
    if (line.grams >= MAX_G) {
      return false;
    }
    if (line.role === "fat" && line.per100.fat >= FAT_DENSE) {
      return line.grams + 5 <= OIL_CAP_G;
    }
    return true;
  }
  return line.grams - 5 >= MIN_G;
}

function sumLines(lines: readonly Working[]): Macros {
  return roundMacros(
    sumMealItems(
      lines.map((line) => calcMacrosFromPer100(line.per100, line.grams)),
    ),
  );
}
