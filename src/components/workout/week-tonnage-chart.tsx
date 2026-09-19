import { ChartInsight, ChartLegend } from "@/components/chart/trend-plot";
import { chartInsight, chartMean } from "@/lib/chart-stats";
import { formatIsoDate } from "@/lib/day/format";
import { cn } from "@/lib/utils";
import { formatTonnage } from "@/lib/workout/numbers";
import type { WeekTonnage } from "@/lib/workout/progress-control";

export function WeekTonnageChart({ weeks }: { weeks: WeekTonnage[] }) {
  const shown = weeks.slice(-8);
  const first = shown[0];
  const last = shown[shown.length - 1];
  const previous = shown[shown.length - 2];
  const values = shown.map((week) => week.tonnage);
  const peak = Math.max(...values, 1);
  const mean = chartMean(values);
  if (!first || !last || shown.length < 2) {
    return null;
  }

  const versusPrevious =
    previous == null || last.tonnage === previous.tonnage
      ? null
      : last.tonnage > previous.tonnage
        ? "выше прошлой"
        : "ниже прошлой";

  return (
    <div className="flex flex-col gap-2.5">
      <ChartInsight>
        {chartInsight([
          `Сейчас ${formatTonnage(last.tonnage)}`,
          mean != null ? `средняя ${formatTonnage(mean)}` : null,
          versusPrevious,
        ])}
      </ChartInsight>
      <div className="flex items-end gap-1.5">
        {shown.map((week, index) => {
          const current = index === shown.length - 1;
          const tallest = week.tonnage === peak;
          const labeled = current || tallest;
          const height = Math.max(12, Math.round((week.tonnage / peak) * 100));
          return (
            <div
              key={week.start}
              className="flex min-w-0 flex-1 flex-col items-stretch gap-1"
              title={`${formatIsoDate(week.start, "d MMM")} · ${formatTonnage(week.tonnage)}`}
            >
              <span
                aria-hidden={!labeled}
                className={cn(
                  "h-3.5 text-center text-[10px] leading-none tabular-nums",
                  current
                    ? "font-medium text-foreground"
                    : tallest
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
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{formatIsoDate(first.start, "d MMM")}</span>
        <span>{formatIsoDate(last.start, "d MMM")}</span>
      </div>
      <ChartLegend
        items={[
          { label: "Раньше", swatch: "bar" },
          { label: "Сейчас", color: "var(--primary)", swatch: "bar" },
        ]}
      />
    </div>
  );
}
