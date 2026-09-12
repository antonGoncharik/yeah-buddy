import { formatG, formatPct } from "@/lib/ai/format";
import {
  formatAverageLine,
  halfWindow,
  worstProteinDays,
} from "@/lib/ai/signal-nutrition-window";
import type { ReviewAverages, ReviewWeight } from "@/lib/ai/types";
import {
  formatBodyWeight,
  formatProteinPerKg,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import type { FoodShare } from "@/lib/days";
import { KCAL_HIT_RATIO } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

const CARBS_MISS_RATIO = 0.9;
const HALF_KCAL_RATIO = 0.08;
const HALF_PROTEIN_G = 12;
export const WEIGHT_DELTA_KG = 0.5;

export function nutritionSignalLines(input: {
  days: DayHistoryRow[];
  rest: ReviewAverages | null;
  training: ReviewAverages | null;
  proteinHit: number;
  proteinTotal: number;
  kcalHit: number;
  kcalTotal: number;
  weight: ReviewWeight;
  foods: FoodShare[];
}): string[] {
  const lines: string[] = [];

  if (input.proteinTotal >= 3) {
    lines.push(
      `Белок дотянули: ${input.proteinHit} из ${input.proteinTotal} дней.`,
    );
  }
  if (input.kcalTotal >= 3) {
    lines.push(
      `Калории около цели (±${Math.round(KCAL_HIT_RATIO * 100)}%): ${input.kcalHit} из ${input.kcalTotal} дней.`,
    );
  }

  if (input.rest) {
    lines.push(formatAverageLine("Отдых", input.rest));
  }
  if (input.training) {
    lines.push(formatAverageLine("Зал", input.training));
  }

  const weight = input.weight;
  if (weight.start != null && weight.end != null) {
    const delta = weight.delta ?? 0;
    if (Math.abs(delta) >= WEIGHT_DELTA_KG) {
      lines.push(
        `Вес ${formatSignedBodyWeight(delta)} кг (${formatBodyWeight(weight.start)} → ${formatBodyWeight(weight.end)}).`,
      );
    } else {
      lines.push(`Вес около ${formatBodyWeight(weight.end)} кг.`);
    }
  }

  if (
    weight.protein_per_kg != null &&
    weight.protein_per_kg_target != null &&
    (weight.logged >= 1 || input.days.length >= 2)
  ) {
    lines.push(
      `Белок ${formatProteinPerKg(weight.protein_per_kg)} при цели ${formatProteinPerKg(weight.protein_per_kg_target)}.`,
    );
  }

  const trainingCarbs = input.training;
  if (
    trainingCarbs &&
    trainingCarbs.target.carbs > 0 &&
    trainingCarbs.fact.carbs < trainingCarbs.target.carbs * CARBS_MISS_RATIO
  ) {
    const miss = trainingCarbs.target.carbs - trainingCarbs.fact.carbs;
    lines.push(
      `В тренировочные дни углеводов не хватало на ${formatG(miss)} г.`,
    );
  }

  if (input.rest && input.training) {
    const delta = input.training.fact.protein - input.rest.fact.protein;
    if (Math.abs(delta) >= 10) {
      lines.push(
        delta > 0
          ? `В тренировочные дни белка больше, чем на отдыхе, на ${formatG(delta)} г.`
          : `В тренировочные дни белка меньше, чем на отдыхе, на ${formatG(-delta)} г.`,
      );
    }
  }

  const halves = halfWindow(input.days);
  if (halves) {
    const kcalRatio =
      halves.first.target.kcal > 0
        ? (halves.second.fact.kcal - halves.first.fact.kcal) /
          Math.max(halves.first.fact.kcal, 1)
        : 0;
    const proteinDelta = halves.second.fact.protein - halves.first.fact.protein;
    if (
      Math.abs(kcalRatio) >= HALF_KCAL_RATIO ||
      Math.abs(proteinDelta) >= HALF_PROTEIN_G
    ) {
      const kcalPart =
        Math.abs(kcalRatio) >= HALF_KCAL_RATIO
          ? `ккал ${formatPct(kcalRatio * 100)}`
          : null;
      const proteinPart =
        Math.abs(proteinDelta) >= HALF_PROTEIN_G
          ? `белок ${proteinDelta > 0 ? "+" : "−"}${formatG(Math.abs(proteinDelta))} г`
          : null;
      const parts = [kcalPart, proteinPart].filter(
        (item): item is string => item != null,
      );
      lines.push(`Во второй половине: ${parts.join(", ")}.`);
    }
  }

  const worst = worstProteinDays(input.days);
  if (worst.length > 0) {
    lines.push(
      `Мало белка: ${worst
        .map(
          (item) =>
            `${item.date} (−${formatG(item.miss)} г${item.training ? ", зал" : ""})`,
        )
        .join("; ")}.`,
    );
  }

  if (input.foods.length > 0) {
    lines.push(
      `Топ белка: ${input.foods
        .slice(0, 5)
        .map((item) => `${item.name} ${formatG(item.protein)} г`)
        .join(", ")}.`,
    );
  }

  return lines;
}
