"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";

import {
  mealActionBarClass,
  mealActionPrimarySegmentClass,
} from "@/components/day/meal-action-bar";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { useTodayOrder } from "@/components/layout/today-order-provider";
import { peekJson } from "@/lib/api-cache";
import {
  DAY_TYPE_LABELS,
  formatGrams,
  formatKcal,
  formatMacro,
  getMealLabel,
  visibleMealTypes,
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
  { label: "Белки", plan: 140 },
  { label: "Жиры", plan: 70 },
  { label: "Углеводы", plan: 200 },
] as const;

function TextBone({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("relative inline-block max-w-full", className)}>
      <span className="invisible">{text}</span>
      <span className="absolute inset-x-0 top-[0.12em] bottom-[0.08em] animate-pulse rounded-[0.2em] bg-foreground/25" />
    </span>
  );
}

function IconBone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 animate-pulse rounded-md bg-foreground/25",
        className,
      )}
    />
  );
}

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
  plan,
  compact,
}: {
  label: string;
  plan: number;
  compact: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-3",
          compact ? "text-sm" : "text-base",
        )}
      >
        <TextBone text={label} className="font-medium" />
        <TextBone
          text={`${formatMacro(0)} / ${formatMacro(plan)}`}
          className="tabular-nums"
        />
      </div>
      <div className={cn("relative", compact ? "h-2" : "h-2.5")} aria-hidden>
        <div className="absolute inset-0 animate-pulse rounded-full bg-foreground/20" />
      </div>
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
  const protein = gym
    ? `осталось ${formatGrams(120)}\u00A0г`
    : formatMacro(120);
  const kcalPair = `${formatKcal(1800)} / ${formatKcal(2400)}`;

  return (
    <section
      className={cn(
        "card-surface flex flex-col px-5",
        compact ? "gap-2 py-2" : "gap-5 py-5",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <IconBone className="size-4 rounded-full" />
              <TextBone text={gym ? "Белок" : "Осталось"} />
            </div>
            <p
              className={cn(
                "mt-1 font-semibold tracking-tight",
                compact ? "text-xl" : "text-2xl",
              )}
            >
              <TextBone text={protein} className="tabular-nums" />
              {gym ? null : (
                <TextBone
                  text="г белка"
                  className="ml-1.5 text-base font-medium"
                />
              )}
            </p>
            {gym ? null : (
              <p className="mt-1 text-sm tabular-nums">
                <TextBone text={`${kcalPair} ккал · Съел ${formatKcal(0)}`} />
              </p>
            )}
          </div>
          {gym ? (
            <div className="max-w-[48%] text-right">
              <p className="text-sm font-medium">
                <TextBone text="Зал" />
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                <TextBone text="План" />
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium">
                <TextBone text="Съел" />
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                <TextBone text={formatKcal(0)} />
                <TextBone
                  text={`/ ${formatKcal(2400)}`}
                  className="ml-1.5 text-sm font-medium"
                />
              </p>
            </div>
          )}
        </div>
        {gym ? (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: kcalPair, label: "ккал", align: "" },
                { value: formatKcal(0), label: "съел", align: "text-center" },
                { value: "—", label: "г/кг", align: "text-right" },
              ] as const
            ).map((cell) => (
              <p key={cell.label} className={cn("min-w-0", cell.align)}>
                <span className="block text-lg font-semibold tracking-tight tabular-nums">
                  <TextBone text={cell.value} />
                </span>
                <span className="text-sm font-medium">
                  <TextBone text={cell.label} />
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3.5")}>
        {MACRO_ROWS.map((row) => (
          <MacroRowSkeleton
            key={row.label}
            label={row.label}
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

function MealCardSkeleton({
  mealType,
  compact,
}: {
  mealType: MealType;
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
        <h2
          className={cn(
            "flex min-w-0 items-center gap-2 font-semibold",
            compact ? "text-lg" : "text-xl",
          )}
        >
          <IconBone className={MEAL_ICON_CLASS[mealType]} />
          <TextBone text={getMealLabel(mealType)} />
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <TextBone
            text={`${formatKcal(165)} ккал`}
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

      <div className="flex w-full min-w-0 items-stretch gap-1">
        <div className="min-w-0 flex-1 px-1 py-2">
          <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
            <TextBone text="Куриная грудка" className="text-base font-medium" />
            <span className="grid shrink-0 grid-cols-[4.75rem_3.5rem] items-baseline gap-x-1.5 tabular-nums">
              <span className="min-w-0 text-right">
                <TextBone
                  text={`${formatGrams(150)} г`}
                  className="text-sm font-medium"
                />
              </span>
              <span className="min-w-0 text-right">
                <TextBone
                  text={formatKcal(165)}
                  className="text-base font-semibold"
                />
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

      <p
        className={cn(
          "tabular-nums tracking-tight",
          compact ? "text-sm" : "text-lg font-semibold",
        )}
      >
        <TextBone
          text={`Б ${formatMacro(31)} · Ж ${formatMacro(3.6)} · У ${formatMacro(0)}`}
        />
      </p>

      <div className={mealActionBarClass}>
        <div className={mealActionPrimarySegmentClass}>
          <IconBone className="size-4 rounded-sm" />
          <TextBone text="Добавить" />
        </div>
      </div>
    </section>
  );
}

function DiaryLinksSkeleton() {
  return (
    <nav
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium"
      aria-hidden
    >
      <TextBone text="Неделя" />
      <TextBone text="История еды" />
      <TextBone text="Спросить" />
    </nav>
  );
}

export function TodayLoadingSkeleton({ gym = true }: { gym?: boolean }) {
  const { density } = useDiaryDensity();
  const { order } = useTodayOrder();
  const compact = density === "compact";
  const meals = visibleMealTypes(false).map((mealType) => (
    <MealCardSkeleton key={mealType} mealType={mealType} compact={compact} />
  ));
  const summary = (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-3")}>
      <SummarySkeleton compact={compact} gym={gym} />
    </div>
  );

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
        </>
      ) : (
        <>
          {meals}
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
