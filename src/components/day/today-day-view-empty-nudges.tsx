"use client";

import { EarlyHabitCard } from "@/components/day/early-habit-card";
import {
  EnergyGoalCard,
  EnergyGoalHintCard,
} from "@/components/day/energy-goal-card";
import { HabitBridgeCard } from "@/components/day/habit-bridge-card";
import { YesterdayCatchUpHint } from "@/components/day/yesterday-catch-up-hint";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";

export function TodayDayViewEmptyNudges({
  dayHasItems,
  topNudge,
  habitSnapshot,
  habitBridgeSnapshot,
  compact,
  gymEnabled,
  onOpenYesterday,
  date,
  today,
  viewOnly,
  energyGoal,
  energyGoalHint,
  energyGoalBusy,
  onApplyEnergyGoal,
  onDismissEnergyGoal,
}: {
  dayHasItems: boolean;
  topNudge: "catch-up" | "early-habit" | "habit-bridge" | null;
  habitSnapshot: EarlyHabitSnapshot | null;
  habitBridgeSnapshot: HabitBridgeSnapshot | null;
  compact: boolean;
  gymEnabled: boolean;
  onOpenYesterday: () => void;
  date: string;
  today: string;
  viewOnly: boolean;
  energyGoal: EnergyGoalOffer | null;
  energyGoalHint: string | null;
  energyGoalBusy: boolean;
  onApplyEnergyGoal: () => void;
  onDismissEnergyGoal: (dismissedKcal: number) => void;
}) {
  if (dayHasItems) {
    return null;
  }

  return (
    <>
      {topNudge === "catch-up" ? (
        <div className="animate-rise">
          <YesterdayCatchUpHint onOpen={onOpenYesterday} />
        </div>
      ) : null}
      {topNudge === "early-habit" && habitSnapshot ? (
        <div className="animate-rise">
          <EarlyHabitCard
            snapshot={habitSnapshot}
            compact={compact}
            showGymLine={gymEnabled}
          />
        </div>
      ) : null}
      {topNudge === "habit-bridge" && habitBridgeSnapshot ? (
        <div className="animate-rise">
          <HabitBridgeCard
            snapshot={habitBridgeSnapshot}
            compact={compact}
            showGymLine={gymEnabled}
            showReviewLink
          />
        </div>
      ) : null}

      {date === today && !viewOnly && energyGoal ? (
        <div className="animate-rise">
          <EnergyGoalCard
            offer={energyGoal}
            busy={energyGoalBusy}
            onApply={onApplyEnergyGoal}
            onDismiss={() => onDismissEnergyGoal(energyGoal.restKcal)}
          />
        </div>
      ) : null}

      {date === today && !viewOnly && !energyGoal && energyGoalHint ? (
        <div className="animate-rise">
          <EnergyGoalHintCard line={energyGoalHint} />
        </div>
      ) : null}
    </>
  );
}
