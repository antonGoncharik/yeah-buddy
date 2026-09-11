"use client";

import type { ReviewBrief } from "@/lib/ai/types";
import { formatBodyWeight, formatProteinPerKg } from "@/lib/day/body-weight";
import { pluralDays } from "@/lib/nutrition-stats";
import { pluralWorkouts } from "@/lib/workout/history-stats";

export function ReviewFactsCard({ brief }: { brief: ReviewBrief }) {
  const protein =
    brief.nutrition.protein_total > 0
      ? `белок ${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`
      : null;
  const plan =
    brief.gym.plan_total > 0
      ? `план ${brief.gym.plan_hit} из ${brief.gym.plan_total}`
      : null;
  const gym =
    brief.gym.completed > 0
      ? `${brief.gym.completed} ${pluralWorkouts(brief.gym.completed)}`
      : "зала не было";
  const phase = brief.phase.type
    ? brief.phase.completed != null && brief.phase.circle != null
      ? `${brief.phase.type} · ${brief.phase.completed} из ${brief.phase.circle}`
      : brief.phase.type
    : null;

  return (
    <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {brief.range} дней
      </p>
      <p className="text-2xl font-semibold tracking-tight">
        {brief.nutrition.logged} {pluralDays(brief.nutrition.logged)} · {gym}
      </p>
      {protein || plan ? (
        <p className="text-sm text-muted-foreground">
          {[protein, plan].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {brief.nutrition.weight.end != null ? (
        <p className="text-sm text-muted-foreground">
          вес{" "}
          {brief.nutrition.weight.start != null &&
          brief.nutrition.weight.delta != null &&
          Math.abs(brief.nutrition.weight.delta) >= 0.5
            ? `${formatBodyWeight(brief.nutrition.weight.start)} → ${formatBodyWeight(brief.nutrition.weight.end)} кг`
            : `${formatBodyWeight(brief.nutrition.weight.end)} кг`}
          {brief.nutrition.weight.protein_per_kg == null
            ? null
            : ` · белок ${formatProteinPerKg(brief.nutrition.weight.protein_per_kg)}`}
        </p>
      ) : brief.nutrition.weight.protein_per_kg != null ? (
        <p className="text-sm text-muted-foreground">
          белок {formatProteinPerKg(brief.nutrition.weight.protein_per_kg)}
        </p>
      ) : null}
      {phase ? <p className="text-sm text-muted-foreground">{phase}</p> : null}
    </section>
  );
}
