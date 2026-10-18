import {
  canGrowMacro,
  canShrinkMacro,
  type FitItem,
  fitTemplateItems,
  type TemplateGoalSettings,
  templateMacroTarget,
  visibleTemplateFitItems,
} from "@/lib/food/template-fit";
import {
  calcMacrosFromPer100,
  DAY_TEMPLATE_TITLES,
  getMealLabel,
  type Macros,
  sumMealItems,
} from "@/lib/nutrition";
import type { DayType, MealTemplateDetail, MealType } from "@/lib/types";

const PROTEIN_GAP = 15;
const FAT_GAP = 12;
const CARB_GAP = 25;
const LINE_CAP = 6;

export interface DayTemplateReview {
  lines: string[];
  canFit: boolean;
}

export interface MealTemplateReview {
  lines: string[];
  fitDays: DayType[];
}

export function fitGramsConfirm(dayCount: number): string {
  if (dayCount > 1) {
    return "Подогнать граммы в обоих днях? Продукты останутся, изменятся только граммы.";
  }
  return "Подогнать граммы под цель? Продукты останутся, изменятся только граммы.";
}

export function reviewVisibleTemplate(
  template: MealTemplateDetail,
  settings: TemplateGoalSettings | null,
): DayTemplateReview {
  const items = visibleTemplateFitItems(template);
  const target = templateMacroTarget(template.day_type, settings);
  return reviewDay(template.day_type, items, target);
}

export function reviewVisibleTemplates(
  templates: readonly MealTemplateDetail[],
  settings: TemplateGoalSettings | null,
  gymEnabled: boolean,
): MealTemplateReview {
  const rest = templates.find((template) => template.day_type === "rest");
  const training = gymEnabled
    ? templates.find((template) => template.day_type === "training")
    : undefined;
  if (!rest) {
    return { lines: [], fitDays: [] };
  }

  const restItems = visibleTemplateFitItems(rest);
  const restTarget = templateMacroTarget("rest", settings);
  const restFound = inspectDay("rest", restItems, restTarget);
  const trainingItems = training ? visibleTemplateFitItems(training) : null;
  const trainingTarget = training
    ? templateMacroTarget("training", settings)
    : null;
  const trainingFound =
    trainingItems && trainingTarget
      ? inspectDay("training", trainingItems, trainingTarget)
      : null;

  const fitDays: DayType[] = [];
  if (restFound.canFit) {
    fitDays.push("rest");
  }
  if (trainingFound?.canFit) {
    fitDays.push("training");
  }

  if (restItems.length === 0 && trainingItems?.length === 0) {
    return {
      lines: [
        "Оба дня пустые. Добавь свои продукты или подставь готовый рацион.",
      ],
      fitDays,
    };
  }

  const lines: string[] = [];
  pushDayLines(lines, "rest", restItems, restFound, trainingFound != null);
  if (trainingItems && trainingFound) {
    pushDayLines(lines, "training", trainingItems, trainingFound, true);
  }
  if (trainingItems && trainingTarget && restItems.length > 0) {
    const cross = trainingCarbInversion(
      restItems,
      trainingItems,
      restTarget,
      trainingTarget,
    );
    if (cross) {
      lines.push(cross);
    }
  }
  pushDayNotes(lines, "rest", restFound);
  if (trainingFound) {
    pushDayNotes(lines, "training", trainingFound);
  }

  if (lines.length === 0) {
    return {
      lines: [
        trainingFound
          ? "Оба дня близко к целям."
          : "День отдыха близко к цели.",
      ],
      fitDays,
    };
  }

  return { lines: lines.slice(0, LINE_CAP), fitDays };
}

function pushDayLines(
  lines: string[],
  dayType: DayType,
  items: readonly FitItem[],
  found: DayFindings,
  pair: boolean,
): void {
  if (items.length === 0) {
    lines.push(emptyDayLine(dayType, pair));
    return;
  }
  if (found.gap) {
    lines.push(prefixDay(dayType, found.gap));
  }
}

function pushDayNotes(
  lines: string[],
  dayType: DayType,
  found: DayFindings,
): void {
  for (const note of found.notes) {
    lines.push(prefixDay(dayType, note));
  }
}

function emptyDayLine(dayType: DayType, pair: boolean): string {
  if (dayType === "training") {
    return "День тренировки пустой. Новый зальный день начнётся без еды.";
  }
  if (pair) {
    return "День отдыха пустой. Новый день без зала начнётся без еды.";
  }
  return "День отдыха пустой. Добавь продукты или подставь готовый рацион.";
}

interface DayFindings {
  canFit: boolean;
  gap: string | null;
  notes: string[];
}

function reviewDay(
  dayType: DayType,
  items: readonly FitItem[],
  target: Macros,
): DayTemplateReview {
  if (items.length === 0) {
    return {
      canFit: false,
      lines: [
        "Пока пусто. Добавь продукты — потом граммы можно подогнать под цель.",
      ],
    };
  }
  const found = inspectDay(dayType, items, target);
  const lines = [found.gap, ...found.notes].flatMap((line) =>
    line ? [line] : [],
  );
  if (lines.length === 0) {
    return { canFit: false, lines: ["Близко к цели."] };
  }
  return { canFit: found.canFit, lines };
}

function inspectDay(
  dayType: DayType,
  items: readonly FitItem[],
  target: Macros,
): DayFindings {
  if (items.length === 0) {
    return { canFit: false, gap: null, notes: [] };
  }
  const totals = sumMealItems(
    items.map((item) => calcMacrosFromPer100(item.per100, item.grams)),
  );
  const gap = macroGapLine(items, totals, target);
  const notes: string[] = [];
  const clump = proteinClumpLine(items);
  if (clump) {
    notes.push(clump);
  }
  if (dayType === "training") {
    const before = preWorkoutFatLine(items);
    if (before) {
      notes.push(before);
    }
    const after = postWorkoutCarbLine(totals.carbs, target.carbs, items);
    if (after) {
      notes.push(after);
    }
  }
  return {
    canFit: gap != null && fitTemplateItems(items, target).changed,
    gap,
    notes,
  };
}

function macroGapLine(
  items: readonly FitItem[],
  totals: Macros,
  target: Macros,
): string | null {
  const keys = ["protein", "fat", "carbs"] as const;
  const gaps: Array<{ key: (typeof keys)[number]; delta: number }> = [];
  for (const key of keys) {
    const delta = totals[key] - target[key];
    const limit =
      key === "protein" ? PROTEIN_GAP : key === "fat" ? FAT_GAP : CARB_GAP;
    if (Math.abs(delta) >= limit) {
      gaps.push({ key, delta });
    }
  }
  if (gaps.length === 0) {
    return null;
  }

  const clauses = gaps.map((gap) => macroClause(gap.key, gap.delta));
  const sentence = `${upperFirst(clauses.join(", "))}.`;
  const missing = gaps.find(
    (gap) =>
      gap.delta < 0 && !items.some((item) => canGrowMacro(item, gap.key)),
  );
  const stuck = gaps.find(
    (gap) =>
      gap.delta > 0 && !items.some((item) => canShrinkMacro(item, gap.key)),
  );
  const extra = missing
    ? missingLeverLine(missing.key)
    : stuck
      ? "Лишнее сидит в продуктах, которые сами не убавятся — урежь порцию руками."
      : null;
  return extra ? `${sentence} ${extra}` : sentence;
}

function macroClause(key: "protein" | "fat" | "carbs", delta: number): string {
  const amount = Math.round(Math.abs(delta));
  if (key === "protein") {
    return delta < 0
      ? `белка не хватает около ${amount} г`
      : `белка больше цели на ${amount} г`;
  }
  if (key === "fat") {
    return delta < 0
      ? `жира не хватает около ${amount} г`
      : `жира больше цели на ${amount} г`;
  }
  return delta < 0
    ? `углеводов не хватает около ${amount} г`
    : `углеводов больше цели на ${amount} г`;
}

function missingLeverLine(key: "protein" | "fat" | "carbs"): string {
  if (key === "protein") {
    return "Этим составом белок не добрать — добавь мясо, рыбу, творог или яйца.";
  }
  if (key === "fat") {
    return "Этим составом жир не добрать — добавь масло, орехи или другой жир, который ешь.";
  }
  return "Этим составом углеводы не добрать — добавь крупу, хлеб или фрукт.";
}

function proteinClumpLine(items: readonly FitItem[]): string | null {
  const meals = new Map<MealType, number>();
  for (const item of items) {
    const protein = (item.per100.protein * item.grams) / 100;
    meals.set(item.mealType, (meals.get(item.mealType) ?? 0) + protein);
  }
  if (meals.size < 2) {
    return null;
  }

  let topMeal: MealType | null = null;
  let topProtein = 0;
  let lowMeal: MealType | null = null;
  let lowProtein = Number.POSITIVE_INFINITY;
  let total = 0;
  for (const [meal, protein] of meals) {
    total += protein;
    if (protein > topProtein) {
      topProtein = protein;
      topMeal = meal;
    }
    if (protein < lowProtein) {
      lowProtein = protein;
      lowMeal = meal;
    }
  }
  if (
    !topMeal ||
    !lowMeal ||
    topMeal === lowMeal ||
    total < 80 ||
    topProtein < 60 ||
    topProtein / total < 0.5 ||
    lowProtein > 15
  ) {
    return null;
  }

  return `Белок собран в ${mealWhere(topMeal)}: ${Math.round(topProtein)} г из ${Math.round(total)}. В ${mealWhere(lowMeal)} ${Math.round(lowProtein)} г.`;
}

function preWorkoutFatLine(items: readonly FitItem[]): string | null {
  const slot = items.filter((item) => item.mealType === "pre_workout");
  let fat = 0;
  let top: FitItem | null = null;
  let topFat = 0;
  for (const item of slot) {
    const grams = (item.per100.fat * item.grams) / 100;
    fat += grams;
    if (grams > topFat) {
      topFat = grams;
      top = item;
    }
  }
  if (fat < 18 || !top) {
    return null;
  }
  return `До тренировки ${Math.round(fat)} г жира, больше всего в «${top.name}». Перед залом лучше углеводы, жир оставь на другие приёмы.`;
}

function postWorkoutCarbLine(
  carbs: number,
  targetCarbs: number,
  items: readonly FitItem[],
): string | null {
  if (targetCarbs - carbs < 30) {
    return null;
  }
  let post = 0;
  for (const item of items) {
    if (item.mealType === "post_workout") {
      post += (item.per100.carbs * item.grams) / 100;
    }
  }
  if (post >= 15) {
    return null;
  }
  return "После зала углеводов почти нет. Нехватку лучше закрыть там.";
}

function trainingCarbInversion(
  rest: readonly FitItem[],
  training: readonly FitItem[],
  restTarget: Macros,
  trainingTarget: Macros,
): string | null {
  if (rest.length === 0 || training.length === 0) {
    return null;
  }
  if (trainingTarget.carbs < restTarget.carbs + 40) {
    return null;
  }
  const restCarbs = carbTotal(rest);
  const trainingCarbs = carbTotal(training);
  if (trainingCarbs > restCarbs + 10) {
    return null;
  }
  return `В дне тренировки углеводов ${Math.round(trainingCarbs)} г, в дне отдыха ${Math.round(restCarbs)} г. В зал должно уходить больше топлива, не меньше.`;
}

function carbTotal(items: readonly FitItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.per100.carbs * item.grams) / 100,
    0,
  );
}

function prefixDay(dayType: DayType, line: string): string {
  return `${DAY_TEMPLATE_TITLES[dayType]}: ${lowerFirst(line)}`;
}

function mealWhere(mealType: MealType): string {
  return getMealLabel(mealType).toLocaleLowerCase("ru");
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase("ru") + text.slice(1);
}

function upperFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase("ru") + text.slice(1);
}
