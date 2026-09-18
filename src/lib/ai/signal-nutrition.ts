import { formatG, formatKcalPlain, formatPct } from "@/lib/ai/format";
import {
  formatAverageLine,
  halfWindow,
  logCoverageLine,
  worstKcalDays,
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

const MACRO_MISS_RATIO = 0.9;
const MACRO_OVER_RATIO = 1.1;
const HALF_KCAL_RATIO = 0.08;
const HALF_PROTEIN_G = 12;
const HALF_FAT_G = 8;
const HALF_CARBS_G = 20;
const REST_TRAINING_KCAL = 150;
export const WEIGHT_DELTA_KG = 0.5;

export function nutritionSignalLines(input: {
  days: DayHistoryRow[];
  from?: string;
  to?: string;
  windowDays?: number;
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

  if (input.windowDays != null && input.from != null && input.to != null) {
    const coverage = logCoverageLine(
      input.windowDays,
      input.days.length,
      input.from,
      input.to,
      input.days.map((item) => item.date),
    );
    if (coverage) {
      lines.push(coverage);
    }
  }

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

  pushMacroMiss(lines, "На отдыхе", input.rest, "fat", "жира");
  pushMacroMiss(lines, "На отдыхе", input.rest, "carbs", "углеводов");
  pushMacroMiss(lines, "В тренировочные дни", input.training, "fat", "жира");
  pushMacroMiss(
    lines,
    "В тренировочные дни",
    input.training,
    "carbs",
    "углеводов",
  );
  pushMacroOver(lines, "На отдыхе", input.rest, "fat", "жира");
  pushKcalOver(lines, "На отдыхе", input.rest);
  pushKcalOver(lines, "В тренировочные дни", input.training);

  if (input.rest && input.training) {
    const proteinDelta = input.training.fact.protein - input.rest.fact.protein;
    if (Math.abs(proteinDelta) >= 10) {
      lines.push(
        proteinDelta > 0
          ? `В тренировочные дни белка больше, чем на отдыхе, на ${formatG(proteinDelta)} г.`
          : `В тренировочные дни белка меньше, чем на отдыхе, на ${formatG(-proteinDelta)} г.`,
      );
    }
    const kcalDelta = input.training.fact.kcal - input.rest.fact.kcal;
    if (Math.abs(kcalDelta) >= REST_TRAINING_KCAL) {
      lines.push(
        kcalDelta > 0
          ? `В тренировочные дни ккал больше, чем на отдыхе, на ${formatKcalPlain(kcalDelta)}.`
          : `В тренировочные дни ккал меньше, чем на отдыхе, на ${formatKcalPlain(-kcalDelta)}.`,
      );
    }
  }

  const halves = halfWindow(input.days);
  if (halves) {
    const halfParts = halfWindowParts(halves);
    if (halfParts.length > 0) {
      lines.push(`Во второй половине: ${halfParts.join(", ")}.`);
    }
  }

  const worstProtein = worstProteinDays(input.days);
  if (worstProtein.length > 0) {
    lines.push(
      `Мало белка: ${worstProtein
        .map(
          (item) =>
            `${item.date} (−${formatG(item.miss)} г${item.training ? ", зал" : ""})`,
        )
        .join("; ")}.`,
    );
  }

  const worstKcal = worstKcalDays(input.days);
  if (worstKcal.length > 0) {
    lines.push(
      `Мало ккал: ${worstKcal
        .map(
          (item) =>
            `${item.date} (−${formatKcalPlain(item.miss)}${item.training ? ", зал" : ""})`,
        )
        .join("; ")}.`,
    );
  }

  if (input.foods.length > 0) {
    lines.push(
      `Топ белка: ${input.foods
        .slice(0, 12)
        .map((item) => `${item.name} ${formatG(item.protein)} г`)
        .join(", ")}.`,
    );
  }

  return lines;
}

function halfWindowParts(halves: {
  first: ReviewAverages;
  second: ReviewAverages;
}): string[] {
  const kcalRatio =
    halves.first.fact.kcal > 0
      ? (halves.second.fact.kcal - halves.first.fact.kcal) /
        Math.max(halves.first.fact.kcal, 1)
      : 0;
  const proteinDelta = halves.second.fact.protein - halves.first.fact.protein;
  const fatDelta = halves.second.fact.fat - halves.first.fact.fat;
  const carbsDelta = halves.second.fact.carbs - halves.first.fact.carbs;
  const parts: string[] = [];
  if (Math.abs(kcalRatio) >= HALF_KCAL_RATIO) {
    parts.push(`ккал ${formatPct(kcalRatio * 100)}`);
  }
  if (Math.abs(proteinDelta) >= HALF_PROTEIN_G) {
    parts.push(
      `белок ${proteinDelta > 0 ? "+" : "−"}${formatG(Math.abs(proteinDelta))} г`,
    );
  }
  if (Math.abs(fatDelta) >= HALF_FAT_G) {
    parts.push(
      `жир ${fatDelta > 0 ? "+" : "−"}${formatG(Math.abs(fatDelta))} г`,
    );
  }
  if (Math.abs(carbsDelta) >= HALF_CARBS_G) {
    parts.push(
      `углеводы ${carbsDelta > 0 ? "+" : "−"}${formatG(Math.abs(carbsDelta))} г`,
    );
  }
  return parts;
}

function pushMacroMiss(
  lines: string[],
  prefix: string,
  stats: ReviewAverages | null,
  key: "fat" | "carbs",
  noun: string,
): void {
  if (!stats || stats.target[key] <= 0) {
    return;
  }
  if (stats.fact[key] >= stats.target[key] * MACRO_MISS_RATIO) {
    return;
  }
  const miss = stats.target[key] - stats.fact[key];
  lines.push(`${prefix} ${noun} не хватало на ${formatG(miss)} г.`);
}

function pushMacroOver(
  lines: string[],
  prefix: string,
  stats: ReviewAverages | null,
  key: "fat" | "carbs",
  noun: string,
): void {
  if (!stats || stats.target[key] <= 0) {
    return;
  }
  if (stats.fact[key] <= stats.target[key] * MACRO_OVER_RATIO) {
    return;
  }
  const extra = stats.fact[key] - stats.target[key];
  lines.push(`${prefix} ${noun} выше цели на ${formatG(extra)} г.`);
}

function pushKcalOver(
  lines: string[],
  prefix: string,
  stats: ReviewAverages | null,
): void {
  if (!stats || stats.target.kcal <= 0) {
    return;
  }
  if (stats.fact.kcal <= stats.target.kcal * (1 + KCAL_HIT_RATIO)) {
    return;
  }
  const extra = stats.fact.kcal - stats.target.kcal;
  lines.push(`${prefix} ккал выше цели на ${formatKcalPlain(extra)}.`);
}
