"use client";

import {
  BlockTitle,
  ReviewSection,
  StatGrid,
} from "@/components/ai/review-blocks";
import { formatPct } from "@/lib/ai/format";
import type { ReviewBrief, ReviewMaxRow } from "@/lib/ai/types";
import { formatWeight } from "@/lib/workout/numbers";

const RELATIVE_GAP = 2;

export function ReviewLiftsCard({ brief }: { brief: ReviewBrief }) {
  const maxes = brief.maxes;
  const show =
    maxes.total > 0 ||
    maxes.grown_list.length > 0 ||
    maxes.stalled.length > 0 ||
    maxes.categories.length > 1 ||
    maxes.last_recap != null;
  if (!show) {
    return null;
  }

  const showRelative =
    maxes.avg_relative_percent != null &&
    (maxes.avg_percent == null ||
      Math.abs(maxes.avg_relative_percent - maxes.avg_percent) >= RELATIVE_GAP);
  const easy = brief.gym.feels.easy;
  const stats = [
    maxes.total > 0
      ? {
          label: "Выросли",
          value: `${maxes.grown} из ${maxes.total}`,
        }
      : null,
    maxes.avg_percent != null
      ? { label: "По штанге", value: formatPct(maxes.avg_percent) }
      : null,
    showRelative && maxes.avg_relative_percent != null
      ? {
          label: "К весу тела",
          value: formatPct(maxes.avg_relative_percent),
        }
      : null,
  ].flatMap((item) => (item ? [item] : []));

  return (
    <ReviewSection
      title="Рабочие веса"
      hint={maxes.since === "first_work" ? "С первой записи" : undefined}
      summary={liftsSummary(brief)}
    >
      {stats.length > 0 ? <StatGrid items={stats} /> : null}
      {maxes.grown_list.length > 0 ? (
        <LiftBars rows={maxes.grown_list} />
      ) : null}
      {maxes.stalled.length > 0 ? (
        <div className="flex flex-col gap-2">
          <BlockTitle>Без роста</BlockTitle>
          {easy >= 2 ? (
            <p className="text-sm text-muted-foreground">
              Тренировки шли легко ({easy}), а эти веса стоят.
            </p>
          ) : null}
          <ul className="flex flex-wrap gap-2">
            {maxes.stalled.map((item) => (
              <li
                key={item.name}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {maxes.categories.length > 1 ? (
        <CategoryBars categories={maxes.categories} />
      ) : null}
      {maxes.last_recap ? (
        <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 px-3 py-3">
          <BlockTitle>Прошлый цикл</BlockTitle>
          <p className="text-sm font-medium">
            {maxes.last_recap.from} → {maxes.last_recap.to}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {maxes.last_recap.avg_percent != null
              ? `${formatPct(maxes.last_recap.avg_percent)} · `
              : null}
            выросли {maxes.last_recap.grown}
          </p>
        </div>
      ) : null}
    </ReviewSection>
  );
}

function liftsSummary(brief: ReviewBrief): string | null {
  const parts: string[] = [];
  if (brief.maxes.avg_percent != null) {
    parts.push(formatPct(brief.maxes.avg_percent));
  }
  if (brief.maxes.total > 0) {
    parts.push(`${brief.maxes.grown} из ${brief.maxes.total}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function LiftBars({ rows }: { rows: ReviewMaxRow[] }) {
  const peak = rows.reduce((max, row) => {
    const value = Math.abs(row.percent ?? row.relative_percent ?? 0);
    return Math.max(max, value);
  }, 1);

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const percent = row.percent ?? row.relative_percent;
        const width =
          percent == null
            ? 0
            : Math.max(6, Math.round((Math.abs(percent) / peak) * 100));
        return (
          <li key={row.name} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 font-medium">{row.name}</span>
              {percent != null ? (
                <span className="shrink-0 tabular-nums">
                  {formatPct(percent)}
                </span>
              ) : null}
            </div>
            {kgLine(row) ? (
              <p className="text-sm tabular-nums text-muted-foreground">
                {kgLine(row)}
              </p>
            ) : null}
            {relativeLine(row) ? (
              <p className="text-sm text-muted-foreground">
                {relativeLine(row)}
              </p>
            ) : null}
            {percent != null && percent !== 0 ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(width, 100)}%` }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function CategoryBars({
  categories,
}: {
  categories: Array<{ name: string; percent: number }>;
}) {
  const peak = categories.reduce(
    (max, row) => Math.max(max, Math.abs(row.percent)),
    1,
  );

  return (
    <div className="flex flex-col gap-3">
      <BlockTitle>По группам</BlockTitle>
      <ul className="flex flex-col gap-3">
        {categories.map((row) => (
          <li key={row.name} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{row.name}</span>
              <span className="tabular-nums">{formatPct(row.percent)}</span>
            </div>
            {row.percent !== 0 ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    row.percent >= 0
                      ? "h-full rounded-full bg-primary"
                      : "h-full rounded-full bg-destructive/70"
                  }
                  style={{
                    width: `${Math.max(6, Math.round((Math.abs(row.percent) / peak) * 100))}%`,
                  }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function kgLine(row: ReviewMaxRow): string | null {
  if (row.start == null || row.current == null) {
    return null;
  }
  if (row.start === row.current) {
    return `${formatWeight(row.current)} кг`;
  }
  return `${formatWeight(row.start)} → ${formatWeight(row.current)} кг`;
}

function relativeLine(row: ReviewMaxRow): string | null {
  if (
    row.percent == null ||
    row.relative_percent == null ||
    Math.abs(row.relative_percent - row.percent) < RELATIVE_GAP
  ) {
    return null;
  }
  return `к весу ${formatPct(row.relative_percent)}`;
}
