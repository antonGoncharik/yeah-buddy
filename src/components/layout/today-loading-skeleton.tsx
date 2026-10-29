"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";

import {
  mealActionBarClass,
  mealActionPrimarySegmentClass,
} from "@/components/day/meal-action-bar";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { IconBone, TextBone } from "@/components/layout/skeleton";
import { useTodayOrder } from "@/components/layout/today-order-provider";
import { peekJson } from "@/lib/api-cache";
import {
  DAY_TYPE_LABELS,
  formatKcal,
  formatMacro,
  getMealLabel,
} from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings/map";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEAL_ICON_CLASS: Record<MealType, string> = {
  breakfast: "h-5 w-4",
  lunch: "size-4",
  snack: "size-4",
  dinner: "size-4",
  pre_workout: "h-3.5 w-7",
  post_workout: "h-3.5 w-8",
};

const MACRO_ROWS = [
  { label: "Белки", fact: 110, plan: 110 },
  { label: "Жиры", fact: 53.9, plan: 55 },
  { label: "Углеводы", fact: 256.4, plan: 260 },
] as const;

const REST_MEALS: Array<{
  mealType: MealType;
  kcal: string;
  macros: string;
  items: Array<{ name: string; grams: string; kcal: string }>;
}> = [
  {
    mealType: "breakfast",
    kcal: "752 ккал",
    macros: "Б 35,1 · Ж 22,0 · У 97,3",
    items: [
      { name: "Овсянка сухая", grams: "155 г", kcal: "574" },
      { name: "Яйца куриные", grams: "115 г", kcal: "178" },
    ],
  },
  {
    mealType: "lunch",
    kcal: "733 ккал",
    macros: "Б 45,1 · Ж 14,5 · У 105,3",
    items: [
      { name: "Рис сухой", grams: "135 г", kcal: "473" },
      { name: "Куриное филе сырое", grams: "155 г", kcal: "171" },
      { name: "Оливковое масло", grams: "10 г", kcal: "90" },
    ],
  },
  {
    mealType: "snack",
    kcal: "78 ккал",
    macros: "Б 0,0 · Ж 0,0 · У 21,0",
    items: [{ name: "Яблоко", grams: "150 г", kcal: "78" }],
  },
  {
    mealType: "dinner",
    kcal: "408 ккал",
    macros: "Б 29,8 · Ж 17,5 · У 32,8",
    items: [
      { name: "Творог 5%", grams: "155 г", kcal: "188" },
      { name: "Банан", grams: "120 г", kcal: "115" },
      { name: "Грецкий орех", grams: "15 г", kcal: "105" },
    ],
  },
];

const FREQUENT_CHIPS = [
  "Яйца куриные · 50 г = 1 шт",
  "Оливковое масло · 10 мл",
  "Яблоко · 150 г = 1 шт",
  "Творог 5% · 150 г",
] as const;

export function TodayDayTypeSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/80 p-1"
      aria-hidden
    >
      <div className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-card px-1.5 py-2 shadow-sm">
        <IconBone className="size-4 rounded-full" />
        <TextBone text={DAY_TYPE_LABELS.rest} className="text-sm" />
      </div>
      <div className="flex min-h-11 items-center justify-center gap-1 px-1.5 py-2">
        <IconBone className="h-3.5 w-7" />
        <TextBone text={DAY_TYPE_LABELS.training} className="text-sm" />
      </div>
    </div>
  );
}

function MacroRowSkeleton({
  label,
  fact,
  plan,
  compact,
}: {
  label: string;
  fact: number;
  plan: number;
  compact: boolean;
}) {
  const amounts = (
    <TextBone
      text={`${formatMacro(fact)} / ${formatMacro(plan)}`}
      className="tabular-nums"
    />
  );
  const bar = (
    <div className={cn("relative", compact ? "h-2" : "h-2.5")} aria-hidden>
      <div className="absolute inset-0 animate-pulse rounded-full bg-foreground/20" />
    </div>
  );

  if (compact) {
    const [factText, planText] =
      `${formatMacro(fact)} / ${formatMacro(plan)}`.split(" / ");
    return (
      <>
        <TextBone text={label} className="font-medium whitespace-nowrap" />
        <div className="min-w-0">{bar}</div>
        <TextBone text={factText ?? ""} className="text-right tabular-nums" />
        <TextBone text="/" />
        <TextBone text={planText ?? ""} className="tabular-nums" />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-base">
        <TextBone text={label} className="font-medium" />
        {amounts}
      </div>
      {bar}
    </div>
  );
}

function WeightFieldSkeleton({ label, unit }: { label: string; unit: string }) {
  return (
    <div>
      <p className="text-sm font-medium">
        <TextBone text={label} />
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="field-control h-8 w-[4.5rem] animate-pulse rounded-lg bg-foreground/10" />
        <TextBone text={unit} className="text-lg font-medium" />
      </div>
    </div>
  );
}

function SummarySkeleton({ compact, gym }: { compact: boolean; gym: boolean }) {
  return (
    <section
      className={cn(
        "card-surface flex flex-col px-5",
        compact ? "gap-2 py-2" : "gap-5 py-5",
      )}
    >
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "flex justify-between gap-3",
            compact ? "items-center" : "items-start gap-4",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <IconBone
                className={
                  compact ? "size-3.5 rounded-full" : "size-4 rounded-full"
                }
              />
              {compact ? (
                <span className="truncate">
                  <TextBone text="Белок" />{" "}
                  <TextBone text={formatMacro(140)} className="tabular-nums" />
                  <TextBone
                    text={`/ ${formatMacro(110)}`}
                    className="font-medium"
                  />
                </span>
              ) : (
                <TextBone text="Белок" />
              )}
            </div>
            {compact ? null : (
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                <TextBone text={formatMacro(140)} className="tabular-nums" />
                <TextBone
                  text={`/ ${formatMacro(110)}`}
                  className="ml-1.5 text-base font-medium"
                />
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {compact ? null : (
              <p className="text-sm font-medium">
                <TextBone text="Съел" />
              </p>
            )}
            <p
              className={cn(
                "font-semibold tracking-tight tabular-nums",
                compact ? "text-sm" : "mt-1 text-2xl",
              )}
            >
              <TextBone text={formatKcal(1628)} />
              <TextBone
                text={`/ ${formatKcal(1975)}`}
                className={
                  compact ? "ml-1 font-medium" : "ml-1.5 text-base font-medium"
                }
              />
              {compact ? (
                <TextBone text="ккал" className="ml-1 font-medium" />
              ) : null}
            </p>
          </div>
        </div>
        {gym ? (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <TextBone text="Зал" className="text-sm font-medium" />
            <TextBone text="День 2" className="text-base font-semibold" />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          compact
            ? "grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-1 text-sm"
            : "flex flex-col gap-3.5",
        )}
      >
        {MACRO_ROWS.map((row) => (
          <MacroRowSkeleton
            key={row.label}
            label={row.label}
            fact={row.fact}
            plan={row.plan}
            compact={compact}
          />
        ))}
      </div>

      <div
        className={cn(
          "flex flex-col border-t border-border",
          compact ? "gap-2 pt-3" : "gap-3 pt-4",
        )}
      >
        <div className="grid grid-cols-2 gap-4">
          <WeightFieldSkeleton label="Вес" unit="кг" />
          <WeightFieldSkeleton label="Талия" unit="см" />
        </div>
      </div>
    </section>
  );
}

function MealItemSkeleton({
  name,
  grams,
  kcal,
}: {
  name: string;
  grams: string;
  kcal: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-stretch gap-1">
      <div className="min-w-0 flex-1 px-1 py-2">
        <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
          <TextBone text={name} className="text-base font-medium" />
          <span className="grid shrink-0 grid-cols-[4.75rem_3.5rem] items-baseline gap-x-1.5 tabular-nums">
            <span className="min-w-0 text-right">
              <TextBone text={grams} className="text-sm font-medium" />
            </span>
            <span className="min-w-0 text-right">
              <TextBone text={kcal} className="text-base font-semibold" />
            </span>
          </span>
        </span>
      </div>
      <div className="self-center" aria-hidden>
        <span className="flex size-11 items-center justify-center">
          <IconBone className="size-5" />
        </span>
      </div>
    </div>
  );
}

function MealCardSkeleton({
  meal,
  compact,
}: {
  meal: (typeof REST_MEALS)[number];
  compact: boolean;
}) {
  return (
    <section
      className={cn(
        "card-surface flex min-w-0 flex-col px-5",
        compact ? "gap-1.5 py-2" : "gap-3 py-5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <IconBone className={MEAL_ICON_CLASS[meal.mealType]} />
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate font-semibold",
                compact ? "text-base leading-tight" : "text-xl",
              )}
            >
              <TextBone text={getMealLabel(meal.mealType)} />
            </h2>
            {compact ? (
              <p className="truncate text-xs leading-tight">
                <TextBone text={meal.macros} />
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TextBone
            text={meal.kcal}
            className="text-base font-semibold tabular-nums"
          />
          <span
            className="flex size-12 items-center justify-center"
            aria-hidden
          >
            <IconBone className="size-5" />
          </span>
        </div>
      </div>

      {meal.items.map((item) => (
        <MealItemSkeleton
          key={item.name}
          name={item.name}
          grams={item.grams}
          kcal={item.kcal}
        />
      ))}

      {compact ? null : (
        <p className="text-lg font-semibold tabular-nums tracking-tight">
          <TextBone text={meal.macros} />
        </p>
      )}

      <div className={mealActionBarClass}>
        <div className={mealActionPrimarySegmentClass}>
          <IconBone className="size-4 rounded-sm" />
          <TextBone text="Добавить" />
        </div>
      </div>
    </section>
  );
}

function TodayTailSkeleton({ compact }: { compact: boolean }) {
  return (
    <>
      <div className="flex h-10 items-center justify-center">
        <TextBone text="Запомнить на дни без зала" className="text-sm" />
      </div>
      <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
        <p className={cn("px-1 font-medium", compact ? "text-xs" : "text-sm")}>
          <TextBone text="Частые" />
        </p>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FREQUENT_CHIPS.map((chip) => (
            <span
              key={chip}
              className={cn(
                "shrink-0 rounded-full border border-border bg-card px-3 shadow-sm",
                compact ? "min-h-10 py-2 text-sm" : "min-h-12 py-2 text-base",
              )}
            >
              <TextBone text={chip} className="font-medium" />
            </span>
          ))}
        </div>
      </div>
      <div className="card-surface overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 font-semibold">
          <TextBone text="Ещё на сегодня" />
          <span className="text-xl font-normal" aria-hidden>
            <TextBone text="+" />
          </span>
        </div>
      </div>
    </>
  );
}

function DiaryLinksSkeleton() {
  return (
    <nav className="grid grid-cols-3 gap-2" aria-hidden>
      {["Неделя", "История еды", "Спросить"].map((label) => (
        <span
          key={label}
          className="flex min-h-11 items-center justify-center rounded-xl border border-border px-1.5 text-center text-sm"
        >
          <TextBone text={label} />
        </span>
      ))}
    </nav>
  );
}

export function TodayLoadingSkeleton({ gym = true }: { gym?: boolean }) {
  const { density } = useDiaryDensity();
  const { order } = useTodayOrder();
  const compact = density === "compact";
  const meals = REST_MEALS.map((meal) => (
    <MealCardSkeleton key={meal.mealType} meal={meal} compact={compact} />
  ));
  const summary = (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-3")}>
      <SummarySkeleton compact={compact} gym={gym} />
    </div>
  );
  const tail = <TodayTailSkeleton compact={compact} />;

  return (
    <div
      role="status"
      aria-label="Загрузка дня"
      aria-busy="true"
      className={cn("flex w-full flex-col", compact ? "gap-1.5" : "gap-4")}
    >
      {order === "numbers" ? (
        <>
          {summary}
          {meals}
          {tail}
        </>
      ) : (
        <>
          {meals}
          {tail}
          {summary}
        </>
      )}
      <DiaryLinksSkeleton />
      <p className="sr-only">Загрузка…</p>
    </div>
  );
}

function RouteHeaderSkeleton({ title }: { title: string }) {
  return (
    <header className="flex w-full items-center gap-2 px-0 pt-1.5 pb-2.5">
      <div className="min-w-0 flex-1">
        <div className="-ml-2 flex max-w-full items-center gap-1.5 px-2 py-1">
          <TextBone
            text={title}
            className="text-2xl font-semibold tracking-tight"
          />
          <IconBone className="size-5" />
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1" aria-hidden>
        <span className="flex size-11 items-center justify-center">
          <IconBone className="size-6" />
        </span>
        <span className="flex size-11 items-center justify-center">
          <IconBone className="size-6" />
        </span>
      </div>
    </header>
  );
}

export function TodayRouteLoading() {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const [gym, setGym] = useState(true);
  const titleDate = format(new Date(), "d MMMM", { locale: ru });

  useEffect(() => {
    const settings = readSettingsPayload(peekJson("/api/settings"));
    if (settings) {
      setGym(settings.gym_enabled);
    }
  }, []);

  return (
    <div
      className={cn("flex w-full flex-col px-4", compact ? "gap-2" : "gap-3")}
    >
      <div className="today-chrome">
        <div className="today-chrome-head">
          <RouteHeaderSkeleton title={titleDate} />
        </div>
        {gym ? <TodayDayTypeSkeleton /> : null}
      </div>
      <div className="flex flex-col gap-4 pb-4">
        <TodayLoadingSkeleton gym={gym} />
      </div>
    </div>
  );
}
