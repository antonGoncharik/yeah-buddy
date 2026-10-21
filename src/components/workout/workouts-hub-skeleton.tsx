import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { AppHeader } from "@/components/layout/app-header";
import {
  IconBone,
  NavRowSkeleton,
  TextBone,
} from "@/components/layout/skeleton";
import {
  QUEUE_LABEL,
  REVIEW_LABEL,
  STRENGTH_LABEL,
} from "@/lib/workout/labels";
import { HUB_WEIGHT_NAV_HINT } from "@/lib/workout/user-copy";

const LIFTS = [
  { name: "румынская", load: "50" },
  { name: "жим стоя", load: "20" },
  { name: "подтягивания", load: "22.5" },
  { name: "жим ногами", load: "85" },
] as const;

export function WorkoutsHubSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загрузка тренировок"
      aria-busy="true"
      className="flex flex-col gap-5"
    >
      <section className="card-surface flex flex-col gap-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <IconBone className="size-11 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              <TextBone text="Сегодня" />
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
              <TextBone text="День 2" />
            </h2>
            <p className="mt-0.5 text-sm">
              <TextBone text="Потом День 1" />
            </p>
          </div>
        </div>
        <ul className="flex flex-col divide-y divide-border/60">
          {LIFTS.map((lift) => (
            <li
              key={lift.name}
              className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <TextBone text={lift.name} className="text-base" />
              <span className="flex items-baseline gap-1.5">
                <TextBone
                  text={lift.load}
                  className="text-base font-semibold tabular-nums"
                />
                <TextBone text="× 5" className="text-sm font-medium" />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex h-14 items-center justify-center rounded-xl bg-foreground/15">
          <TextBone text="Начать" className="text-lg font-medium" />
        </div>
        <div className="flex min-h-11 items-center justify-center">
          <TextBone text="Пропустить" className="text-base" />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-1">
          <span className="min-w-0 flex-1 text-lg font-semibold">
            <TextBone text={QUEUE_LABEL} />
          </span>
          <TextBone text="Настроить" className="text-sm font-medium" />
        </div>
        <ol className="card-surface divide-y divide-border/70 px-5 py-1">
          <li className="flex items-center gap-3 py-2.5">
            <IconBone className="size-7 rounded-full" />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">
                <TextBone text="День 1" />
              </span>
              <span className="block truncate text-sm">
                <TextBone text="присед · жим лёжа · тяга в наклоне · жим сидя" />
              </span>
            </span>
          </li>
          <li className="flex items-center gap-3 py-2.5">
            <IconBone className="size-7 rounded-full" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2 text-base font-semibold">
                <TextBone text="День 2" />
                <TextBone text="дальше" className="text-sm font-medium" />
              </span>
              <span className="block truncate text-sm">
                <TextBone text="румынская · жим стоя · подтягивания · жим ногами" />
              </span>
            </span>
          </li>
        </ol>
      </section>

      <section className="card-surface divide-y divide-border/70 px-5 py-2">
        <NavRowSkeleton title="Упражнения" hint={HUB_WEIGHT_NAV_HINT} />
        <NavRowSkeleton
          title={STRENGTH_LABEL}
          hint="За 90 дней и с первой записи"
        />
        <NavRowSkeleton title="Мышцы" hint="Схема нагрузки и пропусков" />
        <NavRowSkeleton title={REVIEW_LABEL} hint="За 14, 30 или 90 дней" />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-1">
          <span className="min-w-0 flex-1 text-lg font-semibold">
            <TextBone text="Недавние" />
          </span>
          <TextBone text="Все" className="text-sm font-medium" />
        </div>
        <ul className="card-surface divide-y divide-border/70 px-5 py-1">
          <li className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <TextBone text="День 1" className="text-base font-medium" />
                <TextBone text="12 окт." className="text-sm tabular-nums" />
              </span>
              <span className="mt-0.5 block truncate text-sm">
                <TextBone text="как план · присед 45×5 · жим лёжа 25×5 · тяга в наклоне 25×5" />
              </span>
            </span>
            <IconBone className="size-5" />
          </li>
        </ul>
      </section>

      <div className="card-surface flex items-center gap-3 px-5 py-4">
        <IconBone className="size-10 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-medium">
            <TextBone text="Собери штангу" />
          </span>
          <span className="mt-0.5 block text-sm">
            <TextBone text="105 кг · Задача дня · блины со стойки" />
          </span>
        </span>
        <IconBone className="size-5" />
      </div>
      <p className="sr-only">Загрузка…</p>
    </div>
  );
}

export function WorkoutsRouteLoading() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Тренировки"
        subtitle={format(new Date(), "d MMMM", { locale: ru })}
      />
      <div className="flex flex-col gap-5 px-4 pb-4">
        <WorkoutsHubSkeleton />
      </div>
    </div>
  );
}
