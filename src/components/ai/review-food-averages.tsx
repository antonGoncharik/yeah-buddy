"use client";

import { BlockTitle, MeterLine } from "@/components/ai/review-blocks";
import { formatG } from "@/lib/ai/format";
import type { ReviewAverages } from "@/lib/ai/types";
import { formatKcal } from "@/lib/nutrition/macros";
import { pluralDays } from "@/lib/nutrition-stats";

export function AverageBlock({
  label,
  stats,
}: {
  label: string;
  stats: ReviewAverages;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-3.5 py-3.5">
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

export function HalfCompare({
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
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-3.5 py-3.5">
      <BlockTitle>Две половины</BlockTitle>
      <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_1fr] gap-x-3 gap-y-2.5 text-sm">
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
