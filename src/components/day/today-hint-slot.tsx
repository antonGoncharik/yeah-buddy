"use client";

import { EarlyHabitCard } from "@/components/day/early-habit-card";
import {
  EnergyGoalCard,
  EnergyGoalHintCard,
} from "@/components/day/energy-goal-card";
import { YesterdayCatchUpHint } from "@/components/day/yesterday-catch-up-hint";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";

export function TodayHintSlot({
  dayHasItems,
  topNudge,
  habitSnapshot,
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
  if (topNudge === "catch-up") {
    return (
      <div className="animate-rise">
        <YesterdayCatchUpHint onOpen={onOpenYesterday} />
      </div>
    );
  }

  if (date === today && !viewOnly && energyGoal) {
    return (
      <div className="animate-rise">
        <EnergyGoalCard
          offer={energyGoal}
          busy={energyGoalBusy}
          onApply={onApplyEnergyGoal}
          onDismiss={() => onDismissEnergyGoal(energyGoal.restKcal)}
        />
      </div>
    );
  }

  if (date === today && !viewOnly && energyGoalHint) {
    return (
      <div className="animate-rise">
        <EnergyGoalHintCard line={energyGoalHint} />
      </div>
    );
  }

  const habitHasStory =
    habitSnapshot != null &&
    (habitSnapshot.foodLogStreak > 0 || habitSnapshot.gymSessionsWeek > 0);
  if (
    !dayHasItems &&
    topNudge === "early-habit" &&
    habitSnapshot &&
    habitHasStory
  ) {
    return (
      <div className="animate-rise">
        <EarlyHabitCard snapshot={habitSnapshot} compact showGymLine />
      </div>
    );
  }

  return null;
}
