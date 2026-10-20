"use client";

import {
  BlockTitle,
  ReviewSection,
  StatGrid,
} from "@/components/ai/review-blocks";
import { WeekTonnageChart } from "@/components/workout/week-tonnage-chart";
import type { ReviewBrief } from "@/lib/ai/types";
import { formatIsoDate } from "@/lib/day/format";
import {
  formatWeekRate,
  pluralWorkouts,
  workoutsPerWeek,
} from "@/lib/workout/history-stats";
import { SESSION_FEEL_LABELS } from "@/lib/workout/labels";
import { formatTonnage } from "@/lib/workout/numbers";
import { formatPeakRecord } from "@/lib/workout/progress-control";

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
    gym.rate_halves
      ? {
          label: "Темп",
          value: `${formatWeekRate(gym.rate_halves.first)} → ${formatWeekRate(gym.rate_halves.second)}`,
          detail:
            brief.gym.circle_size > 0
              ? `в неделю · ${brief.gym.circle_size} в круге`
              : "в неделю",
        }
      : null,
    gym.plan_total > 0
      ? {
          label: "Подходы по плану",
          value: `${gym.plan_hit} из ${gym.plan_total}`,
          detail: "которые правил",
        }
      : null,
    gym.completed > 0 && gym.as_planned > 0 && gym.as_planned < gym.completed
      ? {
          label: "Без правок",
          value: `${gym.as_planned} из ${gym.completed}`,
        }
      : null,
    gym.gap_days != null
      ? {
          label: "Пауза",
          value: `${gym.gap_days} дн.`,
          detail: "без зала",
        }
      : null,
    gym.skipped > 0
      ? {
          label: "Пропуски",
          value: String(gym.skipped),
        }
      : null,
    gym.static > 0
      ? {
          label: "На время",
          value: String(gym.static),
          detail: gym.dynamic > 0 ? `повторы ${gym.dynamic}` : null,
        }
      : null,
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
    <ReviewSection
      title="Зал"
      summary={gymSummary(brief, perWeek)}
      value={gymValue(brief, perWeek)}
    >
      {stats.length > 0 ? <StatGrid items={stats} /> : null}
      {gym.tonnage_weeks.length >= 2 ? (
        <WeekTonnageChart
          weeks={gym.tonnage_weeks}
          periodTotal={gym.tonnage ?? undefined}
        />
      ) : gym.tonnage != null && gym.tonnage > 0 ? (
        <StatGrid
          items={[
            {
              label: "Тоннаж",
              value: formatTonnage(gym.tonnage),
              detail: "кг",
            },
          ]}
        />
      ) : null}
      {gym.records.length > 0 ? (
        <div className="flex flex-col gap-2">
          <BlockTitle>Рекорды</BlockTitle>
          <ul className="flex flex-col gap-1.5">
            {gym.records.slice(0, 6).map((row) => (
              <li key={`${row.name}-${row.date}`} className="text-sm">
                {formatPeakRecord(row)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {feelTotal > 0 ? <FeelBar feels={feels} /> : null}
      {gym.templates.length > 0 ? (
        <div className="flex flex-col gap-2">
          <BlockTitle>Тренировки</BlockTitle>
          <ul className="flex flex-wrap gap-2">
            {gym.templates.map((item) => (
              <li
                key={item.name}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {item.name}
                <span className="tabular-nums text-muted-foreground">
                  {" "}
                  · {item.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {gym.weak.length > 0 ? (
        <div className="flex flex-col gap-2">
          <BlockTitle>Слабее плана</BlockTitle>
          <ul className="flex flex-wrap gap-2">
            {gym.weak.map((name) => (
              <li
                key={name}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {gym.notes.length > 0 ? (
        <div className="flex flex-col gap-3">
          <BlockTitle>Заметки</BlockTitle>
          <ul className="flex flex-col gap-3">
            {gym.notes.slice(0, 5).map((note) => (
              <li
                key={`${note.date}-${note.name}-${note.note}`}
                className="rounded-2xl bg-muted/40 px-3 py-2.5"
              >
                <p className="text-xs text-muted-foreground">
                  {formatIsoDate(note.date, "d MMM")} · {note.name}
                </p>
                <p className="mt-1 text-sm leading-snug">{note.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ReviewSection>
  );
}

function gymValue(brief: ReviewBrief, perWeek: number): string | null {
  if (perWeek > 0) {
    return formatWeekRate(perWeek);
  }
  if (brief.gym.completed > 0) {
    return String(brief.gym.completed);
  }
  if (brief.gym.skipped > 0) {
    return String(brief.gym.skipped);
  }
  return null;
}

function gymSummary(brief: ReviewBrief, perWeek: number): string | null {
  const plan =
    brief.gym.plan_total > 0
      ? `план ${brief.gym.plan_hit} из ${brief.gym.plan_total}`
      : null;
  if (perWeek > 0) {
    const circle =
      brief.gym.circle_size > 0 ? `${brief.gym.circle_size} в круге` : null;
    return ["в неделю", circle, plan]
      .filter((part): part is string => part != null)
      .join(" · ");
  }
  if (brief.gym.completed > 0) {
    const word = pluralWorkouts(brief.gym.completed);
    return plan ? `${word} · ${plan}` : word;
  }
  if (brief.gym.skipped > 0) {
    return "пропуски";
  }
  return brief.phase.type;
}

function FeelBar({ feels }: { feels: ReviewBrief["gym"]["feels"] }) {
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
      <BlockTitle>Ощущения</BlockTitle>
      <div className="flex h-2.5 gap-1">
        {parts.map((part) => (
          <div
            key={part.key}
            className="h-full rounded-full"
            style={{
              flex: part.count,
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
