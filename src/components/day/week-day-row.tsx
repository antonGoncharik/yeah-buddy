"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatBodyWeight } from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";
import { dayHasFood, type WeekSlot, weekSlotHref } from "@/lib/day/week";
import { WEEK_NO_FOOD, WEEK_NO_GYM } from "@/lib/messages";
import { DAY_TYPE_LABELS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WeekDayRow({
  slot,
  today,
  fromSettings,
}: {
  slot: WeekSlot;
  today: string;
  fromSettings: boolean;
}) {
  const href = weekSlotHref(slot, today, fromSettings);
  const typeLabel = slot.day
    ? slot.day.is_training_day
      ? DAY_TYPE_LABELS.training
      : DAY_TYPE_LABELS.rest
    : null;
  const foodLabel =
    slot.day && dayHasFood(slot.day)
      ? formatWeekProtein(slot.day.fact_protein, slot.day.target_protein)
      : WEEK_NO_FOOD;
  const gymLabel = slot.session
    ? (slot.session.template_name ??
      WORKOUT_KIND_LABELS[slot.session.workout_type])
    : WEEK_NO_GYM;
  const weightLabel =
    slot.day?.body_weight == null
      ? null
      : `${formatBodyWeight(slot.day.body_weight)} кг`;

  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-base font-medium">
            {formatIsoDate(slot.date, "EEEEEE, d MMMM")}
          </span>
          {typeLabel ? (
            <span className="text-sm text-muted-foreground">{typeLabel}</span>
          ) : null}
        </span>
        <span
          className={cn(
            "text-sm",
            dayHasFood(slot.day) ? null : "text-muted-foreground",
          )}
        >
          {foodLabel}
        </span>
        <span
          className={cn(
            "truncate text-sm",
            slot.session ? null : "text-muted-foreground",
          )}
        >
          {gymLabel}
        </span>
        {weightLabel ? (
          <span className="text-sm text-muted-foreground">{weightLabel}</span>
        ) : null}
      </span>
      {href ? (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="card-surface flex items-center gap-3 px-5 py-4">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      {body}
    </Link>
  );
}

function formatWeekProtein(fact: number, target: number): string {
  return `${Math.round(fact).toLocaleString("ru-RU")} / ${Math.round(target).toLocaleString("ru-RU")} г`;
}
