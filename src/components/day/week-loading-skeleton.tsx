import { AppHeader } from "@/components/layout/app-header";
import { IconBone, TextBone } from "@/components/layout/skeleton";

const WEEK_ROWS = [
  "пн, 7 октября",
  "вт, 8 октября",
  "ср, 9 октября",
  "чт, 10 октября",
  "пт, 11 октября",
  "сб, 12 октября",
  "вс, 13 октября",
] as const;

export function WeekLoadingSkeleton() {
  return (
    <ul
      role="status"
      aria-label="Загрузка недели"
      aria-busy="true"
      className="card-surface divide-y divide-border/70 px-5 py-1"
    >
      {WEEK_ROWS.map((day) => (
        <li key={day} className="flex items-center gap-3 py-3">
          <IconBone className="size-11 rounded-2xl" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-3">
              <TextBone text={day} className="text-base font-medium" />
              <TextBone text="Отдых" className="text-sm" />
            </span>
            <TextBone text="белок закрыт · зал" className="text-sm" />
          </span>
          <IconBone className="size-5" />
        </li>
      ))}
    </ul>
  );
}

export function WeekRouteLoading() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Неделя" />
      <div className="flex flex-col gap-3 px-4 pb-4">
        <WeekLoadingSkeleton />
      </div>
    </div>
  );
}
