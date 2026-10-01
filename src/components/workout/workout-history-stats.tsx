import { StatGrid } from "@/components/ui/stat-grid";
import { formatIsoDate } from "@/lib/day/format";
import {
  formatWeekRate,
  GYM_GAP_DAYS,
  gymGapDays,
  pluralWorkouts,
  type WorkoutHistoryRange,
  type WorkoutHistoryStats as WorkoutHistoryStatsData,
  workoutsPerWeek,
} from "@/lib/workout/history-stats";
export function WorkoutHistoryStats({
  days,
  stats,
  from,
  to,
  dates,
}: {
  days: WorkoutHistoryRange;
  stats: WorkoutHistoryStatsData;
  from: string;
  to: string;
  dates: string[];
}) {
  const perWeek = workoutsPerWeek(stats.count, days);
  const gap = gymGapDays(from, to, dates);

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {days} дней
        <span className="font-normal">
          {" "}
          · {formatIsoDate(from, "d MMM")} – {formatIsoDate(to, "d MMM")}
        </span>
      </p>
      <StatGrid
        size="lg"
        items={[
          {
            label: "Тренировки",
            value: String(stats.count),
            detail: pluralWorkouts(stats.count),
          },
          perWeek > 0
            ? {
                label: "В неделю",
                value: formatWeekRate(perWeek),
              }
            : { label: "В неделю", value: "" },
          gap >= GYM_GAP_DAYS
            ? { label: "Пауза", value: `${gap} дн.` }
            : { label: "Пауза", value: "" },
        ]}
      />
    </section>
  );
}
