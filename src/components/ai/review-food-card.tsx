"use client";

import {
  BlockTitle,
  MeterLine,
  ReviewSection,
  ShareBars,
  StatGrid,
} from "@/components/ai/review-blocks";
import { NutritionTrendSvg } from "@/components/day/nutrition-trend-svg";
import { formatG, formatKcalPlain } from "@/lib/ai/format";
import {
  worstKcalDays,
  worstProteinDays,
} from "@/lib/ai/signal-nutrition-window";
import type { ReviewAverages, ReviewBrief, ReviewDayRow } from "@/lib/ai/types";
import { chartLayout, chartSeries, chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean } from "@/lib/chart-stats";
import { formatProteinPerKg } from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";
import { DAY_TYPE_LABELS } from "@/lib/nutrition/day-labels";
import { formatKcal } from "@/lib/nutrition/macros";
import { pluralDays } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

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
        <ReviewSection title="Еда" summary={foodSummary(brief)}>
          {brief.nutrition.protein_total > 0 ||
          brief.nutrition.kcal_total > 0 ||
          weight.protein_per_kg != null ? (
            <div className="flex flex-col gap-4">
              {brief.nutrition.protein_total > 0 ? (
                <MeterLine
                  label="Белок дотянули"
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

const MACRO_CHART = {
  kcal: {
    label: "Ккал",
    color: "var(--primary)",
    target: "kcal_target",
    format: (value: number) => `${formatKcal(value)} ккал`,
  },
  protein: {
    label: "Белок",
    color: "var(--macro-protein)",
    target: "protein_target",
    format: (value: number) => `${formatG(value)} г`,
  },
  fat: {
    label: "Жир",
    color: "var(--macro-fat)",
    target: "fat_target",
    format: (value: number) => `${formatG(value)} г`,
  },
  carbs: {
    label: "Углеводы",
    color: "var(--macro-carbs)",
    target: "carbs_target",
    format: (value: number) => `${formatG(value)} г`,
  },
} as const;

function MacroChart({
  days,
  metric,
}: {
  days: ReviewDayRow[];
  metric: keyof typeof MACRO_CHART;
}) {
  if (days.length < 2) {
    return null;
  }

  const spec = MACRO_CHART[metric];
  const facts = days.map((day) => day[metric]);
  const targets = days.map((day) => day[spec.target]);
  const hasTarget = targets.some((value) => value > 0);
  const layout = chartLayout(
    hasTarget ? [...facts, ...targets] : facts,
    days.length,
    320,
    176,
    16,
  );
  const factSeries = layout ? chartSeries(facts, layout) : null;
  const targetSeries =
    layout && hasTarget ? chartSeries(targets, layout) : null;
  const last = days[days.length - 1];
  if (!layout || !factSeries || !last) {
    return null;
  }

  const mean = chartMean(facts);
  const targetMean = hasTarget ? chartMean(targets) : null;
  const format = spec.format;
  const label = spec.label;
  const color = spec.color;

  return (
    <div className="flex flex-col gap-2">
      <BlockTitle>{label} по дням</BlockTitle>
      <NutritionTrendSvg
        layout={layout}
        factSeries={factSeries}
        targetSeries={targetSeries ?? undefined}
        color={color}
        label={label}
        fillId={`review-${metric}`}
        maxLabel={format(Math.max(...facts))}
        minLabel={format(Math.min(...facts))}
        lastDate={last.date}
        guideY={
          mean != null && layout.dataMax !== layout.dataMin
            ? chartY(mean, layout)
            : undefined
        }
        endValue={format(facts[facts.length - 1] ?? 0)}
        insight={chartInsight([
          mean != null ? `среднее ${format(mean)}` : null,
          targetMean != null ? `цель ${format(targetMean)}` : null,
        ])}
      />
    </div>
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
    <div className="flex flex-col gap-1.5">
      <BlockTitle>{title}</BlockTitle>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li
            key={row.date}
            className="flex items-baseline justify-between gap-3 py-1 text-sm"
          >
            <span>
              {formatIsoDate(row.date, "d MMM")}
              {row.training ? (
                <span className="text-muted-foreground"> · зал</span>
              ) : null}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatMiss(row.miss)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AverageBlock({
  label,
  stats,
}: {
  label: string;
  stats: ReviewAverages;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">
        {label}
        <span className="ml-2 font-normal text-muted-foreground">
          {stats.count} {pluralDays(stats.count)}
        </span>
      </p>
      <MacroMeter
        label="Ккал"
        fact={stats.fact.kcal}
        target={stats.target.kcal}
        barClass="bg-primary"
        format={(value) => formatKcal(value)}
      />
      <MacroMeter
        label="Белок"
        fact={stats.fact.protein}
        target={stats.target.protein}
        barClass="bg-[var(--macro-protein)]"
        format={(value) => `${formatG(value)} г`}
      />
      <MacroMeter
        label="Жир"
        fact={stats.fact.fat}
        target={stats.target.fat}
        barClass="bg-[var(--macro-fat)]"
        format={(value) => `${formatG(value)} г`}
      />
      <MacroMeter
        label="Углеводы"
        fact={stats.fact.carbs}
        target={stats.target.carbs}
        barClass="bg-[var(--macro-carbs)]"
        format={(value) => `${formatG(value)} г`}
      />
    </div>
  );
}

function MacroMeter({
  label,
  fact,
  target,
  barClass,
  format,
}: {
  label: string;
  fact: number;
  target: number;
  barClass: string;
  format: (value: number) => string;
}) {
  const value =
    target > 0 ? `${format(fact)} / ${format(target)}` : format(fact);

  return (
    <MeterLine
      label={label}
      value={value}
      ratio={target > 0 ? fact / target : null}
      barClass={barClass}
    />
  );
}

function HalfCompare({
  halves,
}: {
  halves: { first: ReviewAverages; second: ReviewAverages };
}) {
  const rows = [
    {
      label: "Ккал",
      first: formatKcal(halves.first.fact.kcal),
      second: formatKcal(halves.second.fact.kcal),
    },
    {
      label: "Белок",
      first: `${formatG(halves.first.fact.protein)} г`,
      second: `${formatG(halves.second.fact.protein)} г`,
    },
    {
      label: "Жир",
      first: `${formatG(halves.first.fact.fat)} г`,
      second: `${formatG(halves.second.fact.fat)} г`,
    },
    {
      label: "Углеводы",
      first: `${formatG(halves.first.fact.carbs)} г`,
      second: `${formatG(halves.second.fact.carbs)} г`,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <BlockTitle>Две половины</BlockTitle>
      <div className="grid grid-cols-[minmax(0,1.3fr)_1fr_1fr] gap-x-3 gap-y-2 text-sm">
        <span />
        <span className="text-muted-foreground">Первая</span>
        <span className="text-muted-foreground">Вторая</span>
        {rows.map((row) => (
          <HalfRow key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}

function HalfRow({
  row,
}: {
  row: { label: string; first: string; second: string };
}) {
  return (
    <>
      <span>{row.label}</span>
      <span className="tabular-nums">{row.first}</span>
      <span className="font-medium tabular-nums">{row.second}</span>
    </>
  );
}

function signedAmount(
  delta: number,
  format: (value: number) => string,
): string {
  const text = format(Math.abs(delta));
  if (delta > 0) {
    return `+${text}`;
  }
  if (delta < 0) {
    return `−${text}`;
  }
  return text;
}

function foodSummary(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  if (brief.nutrition.protein_total > 0) {
    parts.push(
      `белок ${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`,
    );
  }
  if (brief.nutrition.kcal_total > 0) {
    parts.push(
      `ккал ${brief.nutrition.kcal_hit} из ${brief.nutrition.kcal_total}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function averageSummary(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  if (brief.nutrition.rest) {
    parts.push(`отдых ${formatKcal(brief.nutrition.rest.fact.kcal)}`);
  }
  if (brief.nutrition.training) {
    parts.push(`зал ${formatKcal(brief.nutrition.training.fact.kcal)}`);
  }
  if (parts.length > 0) {
    return parts.join(" · ");
  }
  const top = brief.nutrition.foods[0];
  return top ? top.name : null;
}

function historyDays(days: ReviewDayRow[]): DayHistoryRow[] {
  return days.map((day) => ({
    date: day.date,
    is_training_day: day.training,
    target_protein: day.protein_target,
    target_fat: day.fat_target,
    target_carbs: day.carbs_target,
    target_kcal: day.kcal_target,
    body_weight: day.weight,
    waist_cm: day.waist,
    caught_up: false,
    fact_protein: day.protein,
    fact_fat: day.fat,
    fact_carbs: day.carbs,
    fact_kcal: day.kcal,
  }));
}
