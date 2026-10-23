import { formatGrams, formatKcal } from "@/lib/nutrition";

/** Sticky facts for Today: eaten kcal and macros, while the meals scroll. */
export type TodayGlance = {
  kcal: string;
  macros: string;
};

export function todayGlance(input: {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  targetKcal: number;
}): TodayGlance | null {
  if (
    input.protein <= 0 &&
    input.fat <= 0 &&
    input.carbs <= 0 &&
    input.kcal <= 0
  ) {
    return null;
  }

  const kcal =
    input.targetKcal > 0
      ? `${formatKcal(input.kcal)} / ${formatKcal(input.targetKcal)} ккал`
      : `${formatKcal(input.kcal)} ккал`;

  return {
    kcal,
    macros: [
      macroPair("Б", input.protein, input.targetProtein),
      macroPair("Ж", input.fat, input.targetFat),
      macroPair("У", input.carbs, input.targetCarbs),
    ].join(" · "),
  };
}

function macroPair(label: string, fact: number, target: number): string {
  if (target > 0) {
    return `${label} ${formatGrams(fact)}/${formatGrams(target)}`;
  }
  return `${label} ${formatGrams(fact)}`;
}
