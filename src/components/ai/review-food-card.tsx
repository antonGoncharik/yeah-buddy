"use client";

import {
  BlockTitle,
  MeterLine,
  ReviewSection,
  ShareBars,
  StatGrid,
} from "@/components/ai/review-blocks";
import {
  AverageBlock,
  HalfCompare,
} from "@/components/ai/review-food-averages";
import {
  averageSummary,
  averageValue,
  foodSummary,
  foodValue,
  historyDays,
  signedAmount,
} from "@/components/ai/review-food-copy";
import { MacroChart } from "@/components/ai/review-food-macro-chart";
import { formatG, formatKcalPlain } from "@/lib/ai/format";
import {
  worstKcalDays,
  worstProteinDays,
} from "@/lib/ai/signal-nutrition-window";
import type { ReviewBrief } from "@/lib/ai/types";
import { formatProteinPerKg } from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";
import type { FoodShare, MealPlate } from "@/lib/days";
import {
  DAY_TYPE_LABELS,
  formatKcal,
  getMealLabel,
  MEAL_DISPLAY_ORDER,
} from "@/lib/nutrition";
import { MACRO_HIT_RATIO, nutritionHits } from "@/lib/nutrition-stats";

export function ReviewFoodCard({ brief }: { brief: ReviewBrief }) {
  const days = [...brief.nutrition.days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const history = historyDays(days);
  const macroHits = nutritionHits(history);
  const band = `±${Math.round(MACRO_HIT_RATIO * 100)}%`;
  const lowProtein = worstProteinDays(history);
  const lowKcal = worstKcalDays(history);
  const weight = brief.nutrition.weight;
  const showDays =
    brief.nutrition.protein_total > 0 ||
    brief.nutrition.kcal_total > 0 ||
    days.length >= 2 ||
    weight.protein_per_kg != null;
  const showAverage =
    brief.nutrition.rest != null ||
    brief.nutrition.training != null ||
    brief.nutrition.halves != null ||
    brief.nutrition.foods.length > 0;

  return (
    <>
      {showDays ? (
        <ReviewSection
          title="Еда"
          summary={foodSummary(brief)}
          value={foodValue(brief)}
        >
          {brief.nutrition.protein_total > 0 ||
          macroHits.fatTotal > 0 ||
          macroHits.carbsTotal > 0 ||
          brief.nutrition.kcal_total > 0 ||
          weight.protein_per_kg != null ? (
            <div className="flex flex-col gap-4">
              {brief.nutrition.protein_total > 0 ? (
                <MeterLine
                  label={`Белок в цели (${band})`}
                  value={`${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`}
                  ratio={
                    brief.nutrition.protein_hit / brief.nutrition.protein_total
                  }
                  barClass="bg-[var(--macro-protein)]"
                />
              ) : null}
              {macroHits.fatTotal > 0 ? (
                <MeterLine
                  label={`Жир в цели (${band})`}
                  value={`${macroHits.fatHit} из ${macroHits.fatTotal}`}
                  ratio={macroHits.fatHit / macroHits.fatTotal}
                  barClass="bg-[var(--macro-fat)]"
                />
              ) : null}
              {macroHits.carbsTotal > 0 ? (
                <MeterLine
                  label={`Углеводы в цели (${band})`}
                  value={`${macroHits.carbsHit} из ${macroHits.carbsTotal}`}
                  ratio={macroHits.carbsHit / macroHits.carbsTotal}
                  barClass="bg-[var(--macro-carbs)]"
                />
              ) : null}
              {brief.nutrition.kcal_total > 0 ? (
                <MeterLine
                  label="Калории около цели"
                  value={`${brief.nutrition.kcal_hit} из ${brief.nutrition.kcal_total}`}
                  ratio={brief.nutrition.kcal_hit / brief.nutrition.kcal_total}
                  barClass="bg-primary"
                />
              ) : null}
              {weight.protein_per_kg != null ? (
                <div className="flex flex-col gap-1.5">
                  <MeterLine
                    label="Белок на кг"
                    value={formatProteinPerKg(weight.protein_per_kg)}
                    ratio={
                      weight.protein_per_kg_target != null &&
                      weight.protein_per_kg_target > 0
                        ? weight.protein_per_kg / weight.protein_per_kg_target
                        : null
                    }
                    barClass="bg-[var(--macro-protein)]"
                  />
                  {weight.protein_per_kg_target != null ? (
                    <p className="text-xs text-muted-foreground">
                      Цель {formatProteinPerKg(weight.protein_per_kg_target)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {days.length >= 2 || lowKcal.length > 0 ? (
            <div className="flex flex-col gap-3">
              <MacroChart days={days} metric="kcal" />
              {lowKcal.length > 0 ? (
                <MissList
                  title="Мало ккал"
                  rows={lowKcal}
                  formatMiss={(miss) => `−${formatKcalPlain(miss)}`}
                />
              ) : null}
            </div>
          ) : null}
          {days.length >= 2 || lowProtein.length > 0 ? (
            <div className="flex flex-col gap-3">
              <MacroChart days={days} metric="protein" />
              {lowProtein.length > 0 ? (
                <MissList
                  title="Мало белка"
                  rows={lowProtein}
                  formatMiss={(miss) => `−${formatG(miss)} г`}
                />
              ) : null}
            </div>
          ) : null}
          {days.length >= 2 ? <MacroChart days={days} metric="fat" /> : null}
          {days.length >= 2 ? <MacroChart days={days} metric="carbs" /> : null}
        </ReviewSection>
      ) : null}
      {showAverage ? (
        <ReviewSection
          title={
            brief.nutrition.rest ||
            brief.nutrition.training ||
            brief.nutrition.halves
              ? "Среднее"
              : "Откуда белок"
          }
          summary={averageSummary(brief)}
          value={averageValue(brief)}
        >
          {brief.nutrition.rest ? (
            <AverageBlock
              label={DAY_TYPE_LABELS.rest}
              stats={brief.nutrition.rest}
            />
          ) : null}
          {brief.nutrition.training ? (
            <AverageBlock
              label={DAY_TYPE_LABELS.training}
              stats={brief.nutrition.training}
            />
          ) : null}
          {brief.nutrition.rest && brief.nutrition.training ? (
            <StatGrid
              items={[
                {
                  label: "Ккал к отдыху",
                  value: signedAmount(
                    brief.nutrition.training.fact.kcal -
                      brief.nutrition.rest.fact.kcal,
                    (value) => formatKcal(value),
                  ),
                },
                {
                  label: "Белок к отдыху",
                  value: signedAmount(
                    brief.nutrition.training.fact.protein -
                      brief.nutrition.rest.fact.protein,
                    (value) => `${formatG(value)} г`,
                  ),
                },
              ]}
            />
          ) : null}
          {brief.nutrition.halves ? (
            <HalfCompare halves={brief.nutrition.halves} />
          ) : null}
          {brief.nutrition.meals_rest.length > 0 ||
          brief.nutrition.meals_training.length > 0 ? (
            <div className="flex flex-col gap-4">
              <BlockTitle>По приёмам</BlockTitle>
              <MealAverages
                label={DAY_TYPE_LABELS.rest}
                meals={brief.nutrition.meals_rest}
              />
              <MealAverages
                label={DAY_TYPE_LABELS.training}
                meals={brief.nutrition.meals_training}
              />
            </div>
          ) : null}
          {brief.nutrition.foods.length > 0 ? (
            <div className="flex flex-col gap-3">
              {brief.nutrition.rest ||
              brief.nutrition.training ||
              brief.nutrition.halves ? (
                <BlockTitle>Откуда белок</BlockTitle>
              ) : null}
              {foodListsDiffer(
                brief.nutrition.foods_rest,
                brief.nutrition.foods_training,
              ) ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      {DAY_TYPE_LABELS.rest}
                    </p>
                    <ShareBars foods={brief.nutrition.foods_rest} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      {DAY_TYPE_LABELS.training}
                    </p>
                    <ShareBars foods={brief.nutrition.foods_training} />
                  </div>
                </div>
              ) : (
                <ShareBars foods={brief.nutrition.foods} />
              )}
            </div>
          ) : null}
        </ReviewSection>
      ) : null}
    </>
  );
}

function MealAverages({ label, meals }: { label: string; meals: MealPlate[] }) {
  const ordered = [...meals].sort(
    (left, right) =>
      MEAL_DISPLAY_ORDER.indexOf(left.meal) -
      MEAL_DISPLAY_ORDER.indexOf(right.meal),
  );
  if (ordered.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {ordered.map((meal) => (
          <li
            key={meal.meal}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span>{getMealLabel(meal.meal)}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatG(meal.protein)} г · {formatKcal(meal.kcal)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function foodListsDiffer(rest: FoodShare[], training: FoodShare[]): boolean {
  const names = (foods: FoodShare[]) =>
    foods
      .filter((food) => food.protein > 0)
      .slice(0, 3)
      .map((food) => food.name)
      .join("\0");
  const restNames = names(rest);
  const trainingNames = names(training);
  return (
    restNames !== "" && trainingNames !== "" && restNames !== trainingNames
  );
}

function MissList({
  title,
  rows,
  formatMiss,
}: {
  title: string;
  rows: Array<{ date: string; miss: number; training: boolean }>;
  formatMiss: (miss: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <BlockTitle>{title}</BlockTitle>
      <ul className="flex flex-wrap gap-1.5">
        {rows.map((row) => (
          <li
            key={row.date}
            className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums"
          >
            {formatIsoDate(row.date, "d MMM")}
            {row.training ? " · зал" : ""} {formatMiss(row.miss)}
          </li>
        ))}
      </ul>
    </div>
  );
}
