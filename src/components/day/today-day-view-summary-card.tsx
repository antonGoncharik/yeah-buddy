"use client";

import { DaySummary } from "@/components/day/day-summary";
import { TodayGymStatus } from "@/components/day/today-gym-status";
import type { GymLoop } from "@/lib/day/loop";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";

export function TodayDayViewSummaryCard({
  shownDay,
  fact,
  lastBodyWeight,
  lastWaist,
  weightSteady,
  priorProteinHits,
  foodStreakLine,
  trainingGap,
  weightGap,
  waistGap,
  writable,
  gymEnabled,
  gym,
  viewOnly,
  busy,
  saveBodyWeight,
  saveWaist,
}: {
  shownDay: DayWithMeals;
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  lastBodyWeight: number | null;
  lastWaist: number | null;
  weightSteady: boolean;
  priorProteinHits: number;
  foodStreakLine: string | null;
  trainingGap: string | null;
  weightGap: string | null;
  waistGap: string | null;
  writable: boolean;
  gymEnabled: boolean;
  gym: GymLoop;
  viewOnly: boolean;
  busy: boolean;
  saveBodyWeight: (value: number | null) => Promise<void>;
  saveWaist: (value: number | null) => Promise<void>;
}) {
  return (
    <DaySummary
      day={shownDay}
      fact={fact}
      showWeight
      bodyWeight={shownDay.body_weight}
      lastBodyWeight={lastBodyWeight}
      waist={shownDay.waist_cm}
      lastWaist={lastWaist}
      weightSteady={weightSteady}
      priorProteinHits={priorProteinHits}
      foodStreakLine={foodStreakLine}
      trainingGap={trainingGap}
      weightGap={weightGap}
      waistGap={waistGap}
      share={writable}
      gym={gymEnabled ? <TodayGymStatus {...gym} /> : null}
      onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
      onSaveWaist={viewOnly ? undefined : saveWaist}
      bodyWeightReadOnly={viewOnly}
      bodyWeightBusy={busy || isTempId(shownDay.id)}
    />
  );
}
