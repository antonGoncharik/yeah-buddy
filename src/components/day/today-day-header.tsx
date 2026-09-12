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
import { DAY_TYPE_LABELS } from "@/lib/nutrition";
import type { DayType } from "@/lib/types";

export function TodayDayHeader({
  date,
  today,
  writable,
  viewOnly,
  fromHistory,
  isTrainingDay,
  busy,
  switchType,
}: {
  date: string;
  today: string;
  writable: boolean;
  viewOnly: boolean;
  fromHistory: boolean;
  isTrainingDay: boolean;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
}) {
  const router = useRouter();

  if (viewOnly) {
    return (
      <div className="animate-rise flex flex-col gap-3">
        <p className="text-base text-muted-foreground">
          {isTrainingDay ? DAY_TYPE_LABELS.training : DAY_TYPE_LABELS.rest}
          {writable ? null : ". Это старый день — граммы уже не меняются."}
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
    <div className="animate-rise">
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
