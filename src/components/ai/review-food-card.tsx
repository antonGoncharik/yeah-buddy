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
import { DAY_TYPE_LABELS } from "@/lib/nutrition/day-labels";
import { formatKcal } from "@/lib/nutrition/macros";

export function ReviewFoodCard({ brief }: { brief: ReviewBrief }) {
  const days = [...brief.nutrition.days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const history = historyDays(days);
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
          brief.nutrition.kcal_total > 0 ||
          weight.protein_per_kg != null ? (
            <div className="flex flex-col gap-4">
              {brief.nutrition.protein_total > 0 ? (
                <MeterLine
                  label="Белок в цели (±2%)"
                  value={`${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`}
                  ratio={
                    brief.nutrition.protein_hit / brief.nutrition.protein_total
                  }
                  barClass="bg-[var(--macro-protein)]"
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
                    label="На килограмм"
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
                  label: "Ккал в зале",
                  value: signedAmount(
                    brief.nutrition.training.fact.kcal -
                      brief.nutrition.rest.fact.kcal,
                    (value) => formatKcal(value),
                  ),
                  detail: "к отдыху",
                },
                {
                  label: "Белок в зале",
                  value: signedAmount(
                    brief.nutrition.training.fact.protein -
                      brief.nutrition.rest.fact.protein,
                    (value) => `${formatG(value)} г`,
                  ),
                  detail: "к отдыху",
                },
              ]}
            />
          ) : null}
          {brief.nutrition.halves ? (
            <HalfCompare halves={brief.nutrition.halves} />
          ) : null}
          {brief.nutrition.foods.length > 0 ? (
            <div className="flex flex-col gap-3">
              {brief.nutrition.rest ||
              brief.nutrition.training ||
              brief.nutrition.halves ? (
                <BlockTitle>Откуда белок</BlockTitle>
              ) : null}
              <ShareBars foods={brief.nutrition.foods} />
            </div>
          ) : null}
        </ReviewSection>
      ) : null}
    </>
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
