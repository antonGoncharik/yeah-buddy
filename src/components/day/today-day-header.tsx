"use client";

import { useRouter } from "next/navigation";

import {
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
} from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { todayHomeHref } from "@/lib/day/dates";
import { CATCH_UP_TITLE, PAST_DAY_LOCKED } from "@/lib/messages";
import { DAY_TYPE_LABELS } from "@/lib/nutrition";
import type { DayType } from "@/lib/types";

export function TodayDayHeader({
  date,
  today,
  writable,
  catchUp,
  viewOnly,
  fromHistory,
  isTrainingDay,
  busy,
  switchType,
}: {
  date: string;
  today: string;
  writable: boolean;
  catchUp: boolean;
  viewOnly: boolean;
  fromHistory: boolean;
  isTrainingDay: boolean;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
}) {
  const router = useRouter();

  if (viewOnly) {
    const typeLabel = isTrainingDay
      ? DAY_TYPE_LABELS.training
      : DAY_TYPE_LABELS.rest;

    return (
      <div className="animate-rise flex flex-col gap-3">
        <p className="text-base text-muted-foreground">
          {[
            typeLabel,
            catchUp ? CATCH_UP_TITLE : null,
            writable ? null : PAST_DAY_LOCKED,
          ]
            .filter((note) => note != null)
            .join(". ")}
        </p>
        {fromHistory && writable ? (
          <Button
            className="h-12 w-full text-base"
            onClick={() => router.push(todayHomeHref(date, today))}
          >
            Исправить
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animate-rise flex flex-col gap-3">
      <Segmented
        value={isTrainingDay ? "training" : "rest"}
        disabled={busy}
        options={[
          {
            id: "rest",
            label: DAY_TYPE_LABELS.rest,
            icon: (
              <Doodle className="size-4" viewBox="-12 -12 24 24">
                <CookieMark />
              </Doodle>
            ),
          },
          {
            id: "training",
            label: DAY_TYPE_LABELS.training,
            icon: (
              <Doodle className="size-7" viewBox={DUMBBELL_VIEWBOX}>
                <DumbbellMark />
              </Doodle>
            ),
          },
        ]}
        onChange={(dayType) => void switchType(dayType)}
      />
    </div>
  );
}
