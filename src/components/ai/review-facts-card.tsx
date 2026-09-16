"use client";

import { formatPct } from "@/lib/ai/format";
import { WEIGHT_DELTA_KG } from "@/lib/ai/signal-nutrition";
import type { ReviewBrief } from "@/lib/ai/types";
import {
  formatBodyWeight,
  formatProteinPerKg,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import { pluralDays } from "@/lib/nutrition-stats";
import { cn } from "@/lib/utils";
import {
  formatFrequencyVsProgram,
  formatSessionRateHalves,
  pluralWorkouts,
} from "@/lib/workout/history-stats";
import { formatTonnage } from "@/lib/workout/numbers";
import {
  formatPeakRecord,
  formatWeeklyTonnageLine,
} from "@/lib/workout/progress-control";

export function ReviewFactsCard({ brief }: { brief: ReviewBrief }) {
  const gymLine =
    brief.gym.completed > 0
      ? `${brief.gym.completed} ${pluralWorkouts(brief.gym.completed)}`
      : "зала не было";

  return (
    <section className="card-surface animate-rise flex flex-col gap-5 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          За {brief.range} дней
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {brief.nutrition.logged}
          <span className="ml-2 text-lg font-medium text-muted-foreground">
            {pluralDays(brief.nutrition.logged)}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{gymLine}</p>
      </div>

      <HitRow
        label="Белок"
        hit={brief.nutrition.protein_hit}
        total={brief.nutrition.protein_total}
        empty="нет записей"
        barClass="bg-[var(--macro-protein)]"
        hint={proteinHint(brief)}
      />
      <HitRow
        label="Зал"
        hit={brief.gym.plan_hit}
        total={brief.gym.plan_total}
        empty={brief.gym.completed > 0 ? "без плана" : "не было"}
        hint={gymHint(brief)}
      />
      <FactRow
        label="Вес"
        value={weightValue(brief)}
        hint={weightHint(brief)}
      />
      <FactRow
        label="Рабочие веса"
        value={liftsValue(brief)}
        hint={liftsHint(brief)}
      />
      {brief.gym.tonnage != null ? (
        <FactRow
          label="Тоннаж"
          value={formatTonnage(brief.gym.tonnage)}
          hint={formatWeeklyTonnageLine(brief.gym.tonnage_weeks)}
        />
      ) : null}
      {brief.gym.records.length > 0 ? (
        <FactRow
          label="Рекорды"
          value={String(brief.gym.records.length)}
          hint={brief.gym.records.slice(0, 4).map(formatPeakRecord).join("; ")}
        />
      ) : null}
    </section>
  );
}

function proteinHint(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  if (brief.nutrition.kcal_total > 0) {
    parts.push(
      `ккал ${brief.nutrition.kcal_hit} из ${brief.nutrition.kcal_total}`,
    );
  }
  if (brief.nutrition.weight.protein_per_kg != null) {
    parts.push(formatProteinPerKg(brief.nutrition.weight.protein_per_kg));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function gymHint(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  const perWeek = formatFrequencyVsProgram(
    brief.gym.completed,
    brief.range,
    brief.gym.circle_size,
  );
  if (perWeek) {
    parts.push(perWeek);
  }
  if (brief.gym.rate_halves) {
    parts.push(formatSessionRateHalves(brief.gym.rate_halves));
  }
  if (
    brief.phase.type &&
    brief.phase.completed != null &&
    brief.phase.circle != null
  ) {
    parts.push(
      `${brief.phase.type} · ${brief.phase.completed} из ${brief.phase.circle}`,
    );
  } else if (brief.phase.type) {
    parts.push(brief.phase.type);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function weightValue(brief: ReviewBrief): string {
  const weight = brief.nutrition.weight;
  if (weight.end == null) {
    return "не записан";
  }
  if (
    weight.start != null &&
    weight.delta != null &&
    Math.abs(weight.delta) >= WEIGHT_DELTA_KG
  ) {
    return `${formatSignedBodyWeight(weight.delta)} кг`;
  }
  return `${formatBodyWeight(weight.end)} кг`;
}

function weightHint(brief: ReviewBrief): string | null {
  const weight = brief.nutrition.weight;
  if (
    weight.start == null ||
    weight.end == null ||
    weight.delta == null ||
    Math.abs(weight.delta) < WEIGHT_DELTA_KG
  ) {
    return null;
  }
  return `${formatBodyWeight(weight.start)} → ${formatBodyWeight(weight.end)}`;
}

function liftsValue(brief: ReviewBrief): string {
  if (brief.maxes.total === 0) {
    return "пока мало данных";
  }
  if (brief.maxes.grown > 0) {
    return `выросли ${brief.maxes.grown} из ${brief.maxes.total}`;
  }
  return `без роста · ${brief.maxes.total}`;
}

function liftsHint(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  if (brief.maxes.avg_percent != null) {
    parts.push(formatPct(brief.maxes.avg_percent));
  }
  if (brief.maxes.avg_relative_percent != null) {
    parts.push(`к весу ${formatPct(brief.maxes.avg_relative_percent)}`);
  }
  if (brief.maxes.categories.length > 1) {
    parts.push(
      brief.maxes.categories
        .map((row) => `${row.name} ${formatPct(row.percent)}`)
        .join(" · "),
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function HitRow({
  label,
  hit,
  total,
  empty,
  barClass = "bg-primary",
  hint,
}: {
  label: string;
  hit: number;
  total: number;
  empty: string;
  barClass?: string;
  hint?: string | null;
}) {
  if (total === 0) {
    return <FactRow label={label} value={empty} hint={hint} />;
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-border/70 pt-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="tabular-nums text-muted-foreground">
          {hit} из {total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.round((hit / total) * 100)}%` }}
        />
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FactRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 border-t border-border/70 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-base font-medium tabular-nums">{value}</p>
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
