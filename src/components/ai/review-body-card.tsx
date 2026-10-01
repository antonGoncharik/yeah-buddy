"use client";

import {
  ReviewSection,
  ReviewSeriesChart,
  StatGrid,
} from "@/components/ai/review-blocks";
import { WEIGHT_DELTA_KG } from "@/lib/ai/signal-nutrition";
import type { ReviewBrief } from "@/lib/ai/types";
import {
  formatBodyWeight,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import { formatKcal } from "@/lib/nutrition/macros";
import { pluralDays } from "@/lib/nutrition-stats";

export function ReviewBodyCard({ brief }: { brief: ReviewBrief }) {
  const weightPoints = measurePoints(brief.nutrition.days, "weight");
  const waistPoints = measurePoints(brief.nutrition.days, "waist");
  const energy = brief.nutrition.energy;
  if (weightPoints.length < 2 && waistPoints.length < 2 && energy == null) {
    return null;
  }

  return (
    <ReviewSection
      title="Тело"
      summary={bodySummary(brief)}
      value={bodyValue(brief)}
    >
      {weightPoints.length >= 2 ? (
        <ReviewSeriesChart
          points={weightPoints}
          color="var(--foreground)"
          fillId="review-weight"
          label="Вес"
          unit="кг"
          formatValue={formatBodyWeight}
        />
      ) : null}
      {waistPoints.length >= 2 ? (
        <ReviewSeriesChart
          points={waistPoints}
          color="var(--primary)"
          fillId="review-waist"
          label="Талия"
          unit="см"
          formatValue={formatBodyWeight}
        />
      ) : null}
      {energy ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-3.5 py-3.5">
          <StatGrid
            items={[
              {
                label: "Съедено",
                value: formatKcal(energy.intake),
                detail: "ккал в день",
              },
              {
                label: "Расход",
                value: `~${formatKcal(energy.kcal)}`,
                detail: "ккал в день",
              },
              energy.target == null
                ? { label: "Цель", value: "" }
                : {
                    label: "Цель",
                    value: formatKcal(energy.target),
                    detail: "ккал в день",
                  },
            ]}
          />
          <p className="text-sm text-muted-foreground">
            За {energy.span} {pluralDays(energy.span)}, вес{" "}
            {formatSignedBodyWeight(energy.delta)} кг
          </p>
        </div>
      ) : null}
    </ReviewSection>
  );
}

function bodyValue(brief: ReviewBrief): string | null {
  const weight = brief.nutrition.weight;
  if (
    weight.delta != null &&
    weight.end != null &&
    Math.abs(weight.delta) >= WEIGHT_DELTA_KG
  ) {
    return `${formatSignedBodyWeight(weight.delta)} кг`;
  }
  if (weight.end != null) {
    return `${formatBodyWeight(weight.end)} кг`;
  }
  if (brief.nutrition.energy) {
    return `~${formatKcal(brief.nutrition.energy.kcal)}`;
  }
  return null;
}

function bodySummary(brief: ReviewBrief): string | null {
  const weight = brief.nutrition.weight;
  const hasWeight =
    (weight.delta != null &&
      weight.end != null &&
      Math.abs(weight.delta) >= WEIGHT_DELTA_KG) ||
    weight.end != null;
  if (hasWeight && brief.nutrition.energy) {
    return `расход ~${formatKcal(brief.nutrition.energy.kcal)}`;
  }
  if (brief.nutrition.energy) {
    return "расход в день";
  }
  return null;
}

function measurePoints(
  days: ReviewBrief["nutrition"]["days"],
  key: "weight" | "waist",
): Array<{ date: string; value: number }> {
  return [...days]
    .filter((day) => day[key] != null && (day[key] ?? 0) > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => ({
      date: day.date,
      value: day[key] ?? 0,
    }));
}
