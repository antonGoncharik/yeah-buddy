"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { formatBodyWeight } from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";
import { dayHasFood, type WeekSlot, weekSlotHref } from "@/lib/day/week";
import { CATCH_UP_MARK, WEEK_NO_FOOD, WEEK_NO_GYM } from "@/lib/messages";
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
    [
      slot.day?.body_weight == null
        ? null
        : `${formatBodyWeight(slot.day.body_weight)} кг`,
      slot.day?.waist_cm == null
        ? null
        : `${formatBodyWeight(slot.day.waist_cm)} см`,
    ]
      .filter((part) => part != null)
      .join(" · ") || null;

  // One line of facts under the date; what's missing is muted, not hidden,
  // so an empty day still reads as a day.
  const facts = [
    { key: "food", label: foodLabel, muted: !dayHasFood(slot.day) },
    { key: "gym", label: gymLabel, muted: slot.session == null },
    weightLabel ? { key: "weight", label: weightLabel, muted: false } : null,
  ].filter((item) => item != null);

  const gym = slot.session != null;
  const food = dayHasFood(slot.day);
  const training = slot.day?.is_training_day === true || gym;

  const body = (
    <>
      <MarkBadge
        className={cn("size-9 rounded-xl", !food && !gym && "opacity-45")}
      >
        {training ? <DumbbellDoodle /> : <CookieDoodle />}
      </MarkBadge>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-base font-medium">
            {formatIsoDate(slot.date, "EEEEEE, d MMMM")}
          </span>
          {typeLabel ? (
            <span className="shrink-0 text-sm text-muted-foreground">
              {slot.day?.caught_up
                ? `${typeLabel} · ${CATCH_UP_MARK}`
                : typeLabel}
            </span>
          ) : null}
        </span>
        <span className="truncate text-sm">
          {facts.map((item, index) => (
            <span key={item.key}>
              {index > 0 ? (
                <span className="text-muted-foreground"> · </span>
              ) : null}
              <span className={cn(item.muted && "text-muted-foreground")}>
                {item.label}
              </span>
            </span>
          ))}
        </span>
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
    return <div className="flex items-center gap-3 py-3">{body}</div>;
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40"
    >
      {body}
    </Link>
  );
}

function formatWeekProtein(fact: number, target: number): string {
  return `белок ${Math.round(fact).toLocaleString("ru-RU")} / ${Math.round(target).toLocaleString("ru-RU")} г`;
}
