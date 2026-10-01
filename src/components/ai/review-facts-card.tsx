"use client";

import { StatGrid } from "@/components/ai/review-blocks";
import { ReviewBodyCard } from "@/components/ai/review-body-card";
import { ReviewFoodCard } from "@/components/ai/review-food-card";
import { ReviewGymCard } from "@/components/ai/review-gym-card";
import { ReviewLiftsCard } from "@/components/ai/review-lifts-card";
import { WEIGHT_DELTA_KG } from "@/lib/ai/signal-nutrition";
import { LOG_GAP_DAYS, longestLogGap } from "@/lib/ai/signal-nutrition-window";
import type { ReviewBrief } from "@/lib/ai/types";
import {
  formatBodyWeight,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import { pluralDays } from "@/lib/nutrition-stats";
import { pluralWorkouts } from "@/lib/workout/history-stats";

export function ReviewFactsCard({ brief }: { brief: ReviewBrief }) {
  return (
    <>
      <ReviewOverview brief={brief} />
      <ReviewFoodCard brief={brief} />
      <ReviewBodyCard brief={brief} />
      <ReviewGymCard brief={brief} />
      <ReviewLiftsCard brief={brief} />
    </>
  );
}

function ReviewOverview({ brief }: { brief: ReviewBrief }) {
  const weight = weightStat(brief);
  const waist = waistStat(brief);
  const logged = brief.nutrition.logged;
  const foodGap = longestLogGap(
    brief.from,
    brief.to,
    brief.nutrition.days.map((day) => day.date),
  );
  const foodDetail = [
    logged > 0 && logged < brief.range - 1 ? `из ${brief.range}` : null,
    brief.range >= 7 && foodGap >= LOG_GAP_DAYS ? `пауза ${foodGap} дн.` : null,
  ]
    .filter((part): part is string => part != null)
    .join(" · ");

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {brief.range} {pluralDays(brief.range)}
      </p>
      <StatGrid
        items={[
          {
            label: logged > 0 ? "С едой" : "Еда",
            value: logged > 0 ? String(logged) : "нет",
            detail: foodDetail || null,
          },
          {
            label: "Зал",
            value:
              brief.gym.completed > 0 ? String(brief.gym.completed) : "нет",
            detail:
              brief.gym.completed > 0
                ? pluralWorkouts(brief.gym.completed)
                : null,
          },
          weight ?? { label: "Вес", value: "" },
          waist ?? { label: "Талия", value: "" },
        ]}
      />
    </section>
  );
}

function weightStat(
  brief: ReviewBrief,
): { label: string; value: string; detail?: string | null } | null {
  const weight = brief.nutrition.weight;
  if (weight.end == null) {
    return null;
  }
  if (
    weight.start != null &&
    weight.delta != null &&
    Math.abs(weight.delta) >= WEIGHT_DELTA_KG
  ) {
    return {
      label: "Вес",
      value: `${formatSignedBodyWeight(weight.delta)} кг`,
      detail: `${formatBodyWeight(weight.start)} → ${formatBodyWeight(weight.end)}`,
    };
  }
  return {
    label: "Вес",
    value: `${formatBodyWeight(weight.end)} кг`,
  };
}

function waistStat(
  brief: ReviewBrief,
): { label: string; value: string; detail?: string | null } | null {
  const waist = brief.nutrition.waist;
  if (waist == null || waist.end == null) {
    return null;
  }
  if (waist.delta != null && waist.delta !== 0) {
    return {
      label: "Талия",
      value: `${formatSignedBodyWeight(waist.delta)} см`,
      detail:
        waist.start != null
          ? `${formatBodyWeight(waist.start)} → ${formatBodyWeight(waist.end)}`
          : null,
    };
  }
  return {
    label: "Талия",
    value: `${formatBodyWeight(waist.end)} см`,
  };
}
