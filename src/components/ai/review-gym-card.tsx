"use client";

import {
  BlockTitle,
  ReviewSection,
  StatGrid,
} from "@/components/ai/review-blocks";
import { WeekTonnageChart } from "@/components/workout/week-tonnage-chart";
import type { ReviewBrief } from "@/lib/ai/types";
import { formatIsoDate } from "@/lib/day/format";
import { formatWeekRate, workoutsPerWeek } from "@/lib/workout/history-stats";
import { SESSION_FEEL_LABELS } from "@/lib/workout/labels";
import { formatTonnage, formatWeight } from "@/lib/workout/numbers";

export function ReviewGymCard({ brief }: { brief: ReviewBrief }) {
  const gym = brief.gym;
  const feels = gym.feels;
  const feelTotal = feels.easy + feels.close + feels.miss;
  const perWeek = workoutsPerWeek(gym.completed, brief.range);
  const show =
    gym.completed > 0 ||
    gym.skipped > 0 ||
    gym.tonnage != null ||
    gym.records.length > 0 ||
    gym.notes.length > 0 ||
    gym.templates.length > 0 ||
    gym.weak.length > 0 ||
    brief.phase.type != null ||
    feelTotal > 0;
  if (!show) {
    return null;
  }

  const stats = [
    perWeek > 0
      ? {
          label: "В неделю",
          value: formatWeekRate(perWeek),
          detail:
            gym.circle_size > 0 ? `${gym.circle_size} в круге` : "тренировок",
        }
      : null,
    gym.rate_halves
      ? {
          label: "Темп",
          value: `${formatWeekRate(gym.rate_halves.first)} → ${formatWeekRate(gym.rate_halves.second)}`,
          detail: "в неделю",
        }
      : null,
    gym.plan_total > 0
      ? {
          label: "Не слабее плана",
          value: `${gym.plan_hit} из ${gym.plan_total}`,
        }
      : null,
    gym.completed > 0 && gym.as_planned > 0
      ? {
          label: "Как план",
          value: `${gym.as_planned} из ${gym.completed}`,
        }
      : null,
    gym.gap_days != null && gym.gap_days > 0
      ? { label: "Пауза", value: `${gym.gap_days} дн.` }
      : null,
    gym.skipped > 0 ? { label: "Пропуски", value: String(gym.skipped) } : null,
    brief.phase.type &&
    brief.phase.completed != null &&
    brief.phase.circle != null
      ? {
          label: brief.phase.type,
          value: `${brief.phase.completed} из ${brief.phase.circle}`,
          detail: brief.phase.suggest_end ? "круг можно закрыть" : null,
        }
      : null,
  ].flatMap((item) => (item ? [item] : []));

  return (
    <ReviewSection title="Зал">
      {stats.length > 0 ? <StatGrid items={stats} /> : null}
      {feelTotal > 0 ? <FeelBar feels={feels} total={feelTotal} /> : null}
      {gym.templates.length > 0 ? (
        <CountBars
          title="Какие тренировки"
          rows={gym.templates.map((item) => ({
            key: item.name,
            label: item.name,
            value: item.count,
          }))}
        />
      ) : null}
      {gym.weak.length > 0 ? (
        <div className="flex flex-col gap-2">
          <BlockTitle>Слабее плана</BlockTitle>
          <ul className="flex flex-col gap-1">
            {gym.weak.map((name) => (
              <li key={name} className="text-sm">
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {gym.tonnage != null ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <BlockTitle>Тоннаж</BlockTitle>
            <p className="text-sm font-medium tabular-nums">
              {formatTonnage(gym.tonnage)} кг
            </p>
          </div>
          {gym.tonnage_weeks.length >= 2 ? (
            <WeekTonnageChart weeks={gym.tonnage_weeks} heading={false} />
          ) : null}
        </div>
      ) : null}
      {gym.records.length > 0 ? (
        <div className="flex flex-col gap-1">
          <BlockTitle>Рекорды</BlockTitle>
          <ul className="flex flex-col">
            {gym.records.slice(0, 6).map((record) => (
              <li
                key={`${record.name}-${record.date}`}
                className="flex flex-col gap-0.5 py-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium">{record.name}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatIsoDate(record.date, "d MMM")}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {formatWeight(record.previous)} →{" "}
                  {formatWeight(record.weight)} кг
                </p>
              </li>
            ))}
          </ul>
          {gym.records.length > 6 ? (
            <p className="text-xs text-muted-foreground">
              Ещё {gym.records.length - 6}
            </p>
          ) : null}
        </div>
      ) : null}
      {gym.notes.length > 0 ? (
        <div className="flex flex-col gap-3">
          <BlockTitle>Заметки</BlockTitle>
          <ul className="flex flex-col gap-3">
            {gym.notes.slice(0, 5).map((note) => (
              <li key={`${note.date}-${note.name}-${note.note}`}>
                <p className="text-xs text-muted-foreground">
                  {formatIsoDate(note.date, "d MMM")} · {note.name}
                </p>
                <p className="mt-0.5 text-sm leading-snug">{note.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ReviewSection>
  );
}

function FeelBar({
  feels,
  total,
}: {
  feels: ReviewBrief["gym"]["feels"];
  total: number;
}) {
  const parts = (
    [
      ["easy", "var(--primary)"],
      ["close", "var(--macro-carbs)"],
      ["miss", "var(--destructive)"],
    ] as const
  ).flatMap(([key, color]) => {
    const count = feels[key];
    if (count <= 0) {
      return [];
    }
    return [{ key, color, count, label: SESSION_FEEL_LABELS[key] }];
  });

  return (
    <div className="flex flex-col gap-2">
      <BlockTitle>Как прошло</BlockTitle>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {parts.map((part) => (
          <div
            key={part.key}
            style={{
              width: `${(part.count / total) * 100}%`,
              background: part.color,
            }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((part) => (
          <li
            key={part.key}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: part.color }}
            />
            {part.label} {part.count}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CountBars({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: string; value: number }>;
}) {
  const peak = rows.reduce((max, row) => Math.max(max, row.value), 1);

  return (
    <div className="flex flex-col gap-3">
      <BlockTitle>{title}</BlockTitle>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{
                  width: `${Math.max(8, Math.round((row.value / peak) * 100))}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
