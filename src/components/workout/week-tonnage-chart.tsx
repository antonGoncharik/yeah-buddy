import { ChartInsight, ChartLegend } from "@/components/chart/trend-plot";
import { chartInsight, chartMean } from "@/lib/chart-stats";
import { formatIsoDate } from "@/lib/day/format";
import { cn } from "@/lib/utils";
import { formatSignedWeight, formatTonnage } from "@/lib/workout/numbers";
import type { WeekTonnage } from "@/lib/workout/progress-control";

function tonnageKg(value: number): string {
  return `${formatTonnage(value)} кг`;
}

export function WeekTonnageChart({
  weeks,
  periodTotal,
}: {
  weeks: WeekTonnage[];
  periodTotal?: number;
}) {
  const shown = weeks.slice(-8);
  const first = shown[0];
  const last = shown[shown.length - 1];
  const previous = shown[shown.length - 2];
  const values = shown.map((week) => week.tonnage);
  const peak = Math.max(...values, 1);
  const peakWeeks = new Set(
    shown.filter((week) => week.tonnage === peak).map((week) => week.start),
  );
  const mean = chartMean(values);
  if (!first || !last || shown.length < 2) {
    return null;
  }

  const versusPrevious =
    previous == null || last.tonnage === previous.tonnage
      ? null
      : `${formatSignedWeight(last.tonnage - previous.tonnage)} кг к прошлой неделе`;

  const periodSpan =
    first.start !== last.start
      ? `${tonnageKg(first.tonnage)} → ${tonnageKg(last.tonnage)}`
      : null;

  return (
    <section
      className="flex flex-col gap-2.5"
      aria-labelledby="week-tonnage-heading"
    >
      <div>
        <h3
          id="week-tonnage-heading"
          className="text-sm font-medium text-foreground"
        >
          Тоннаж по неделям
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Сумма «вес × повторы» по рабочим подходам за каждую неделю. Не путать
          с рабочим весом на штанге.
        </p>
        {periodTotal != null && periodTotal > 0 ? (
          <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
            За период всего{" "}
            <span className="font-medium text-foreground">
              {tonnageKg(periodTotal)}
            </span>
          </p>
        ) : null}
      </div>
      <ChartInsight>
        {chartInsight([
          `Последняя неделя ${tonnageKg(last.tonnage)}`,
          periodSpan ? `на графике ${periodSpan}` : null,
          mean != null && shown.length >= 3
            ? `средняя ${tonnageKg(mean)}/нед`
            : null,
          versusPrevious,
        ])}
      </ChartInsight>
      <div
        className="flex items-end gap-1.5"
        role="img"
        aria-label={`Тоннаж по неделям, последняя ${tonnageKg(last.tonnage)}`}
      >
        {shown.map((week, index) => {
          const current = index === shown.length - 1;
          const isPeak = peakWeeks.has(week.start);
          const labeled = current || (isPeak && !current);
          const height = Math.max(12, Math.round((week.tonnage / peak) * 100));
          return (
            <div
              key={week.start}
              className="flex min-w-0 flex-1 flex-col items-stretch gap-1"
              title={`Неделя с ${formatIsoDate(week.start, "d MMM")} · ${tonnageKg(week.tonnage)}`}
            >
              <span
                aria-hidden={!labeled}
                className={cn(
                  "h-3.5 text-center text-[10px] leading-none tabular-nums",
                  current
                    ? "font-medium text-foreground"
                    : isPeak
                      ? "text-muted-foreground"
                      : "invisible",
                )}
              >
                {formatTonnage(week.tonnage)}
              </span>
              <div className="flex h-28 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-2xl motion-safe:animate-rise",
                    current ? "bg-primary" : "bg-primary/30",
                  )}
                  style={{
                    height: `${height}%`,
                    animationDelay: `${index * 45}ms`,
                    backgroundImage: current
                      ? "linear-gradient(to top, color-mix(in oklab, var(--primary) 62%, transparent), var(--primary))"
                      : "linear-gradient(to top, color-mix(in oklab, var(--primary) 6%, transparent), color-mix(in oklab, var(--primary) 38%, transparent))",
                  }}
                />
              </div>
              <span className="truncate text-center text-[10px] leading-tight text-muted-foreground">
                {formatIsoDate(week.start, "d MMM")}
              </span>
            </div>
          );
        })}
      </div>
      <ChartLegend
        items={[
          { label: "Прошлые недели", swatch: "bar" },
          { label: "Последняя неделя", color: "var(--primary)", swatch: "bar" },
        ]}
      />
    </section>
  );
}
