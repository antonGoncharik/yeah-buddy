import { formatIsoDate } from "@/lib/day/format";
import { cn } from "@/lib/utils";
import { formatTonnage } from "@/lib/workout/numbers";
import type { WeekTonnage } from "@/lib/workout/progress-control";

export function WeekTonnageChart({ weeks }: { weeks: WeekTonnage[] }) {
  const shown = weeks.slice(-8);
  const first = shown[0];
  const last = shown[shown.length - 1];
  const peak = Math.max(...shown.map((week) => week.tonnage), 1);
  if (!first || !last || shown.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-24 items-end gap-1.5">
        {shown.map((week, index) => {
          const tallest = index === shown.length - 1;
          const height = Math.max(12, Math.round((week.tonnage / peak) * 100));
          return (
            <div
              key={week.start}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${formatIsoDate(week.start, "d MMM")} · ${formatTonnage(week.tonnage)}`}
            >
              <div
                className={cn(
                  "w-full rounded-t-2xl motion-safe:animate-rise",
                  tallest ? "bg-primary" : "bg-primary/28",
                )}
                style={{
                  height: `${height}%`,
                  animationDelay: `${index * 45}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{formatIsoDate(first.start, "d MMM")}</span>
        <span>по неделям</span>
        <span>{formatIsoDate(last.start, "d MMM")}</span>
      </div>
    </div>
  );
}
