import { calendarDateInTimeZone, shiftIsoDate } from "@/lib/day/dates";
import { listDaysInRange } from "@/lib/day/history";
import type { DayWithMeals } from "@/lib/day/map";
import { getDayByDate } from "@/lib/day/store";
import {
  ENERGY_GOAL_LOOKBACK_DAYS,
  type EnergyGoalPlan,
  energyGoalOffer,
} from "@/lib/nutrition/energy-goal";
import { getUserSettings, saveUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSettings } from "@/lib/types";

export type EnergyGoalSaveResult = {
  energyGoal: null;
  goals?: {
    restProtein: number;
    restCarbs: number;
    trainingProtein: number;
    trainingCarbs: number;
  };
  day?: DayWithMeals;
};

export async function loadEnergyGoalOffer(
  userId: string,
  today: string,
  settings: UserSettings | null,
): Promise<EnergyGoalPlan | null> {
  if (settings?.goal == null) {
    return null;
  }

  const days = await listDaysInRange(
    userId,
    shiftIsoDate(today, 1 - ENERGY_GOAL_LOOKBACK_DAYS),
    today,
  );
  return offerFrom(settings, days);
}

export async function applyEnergyGoal(
  userId: string,
): Promise<EnergyGoalSaveResult | null> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    return null;
  }

  const today = calendarDateInTimeZone(settings.timezone);
  const plan = await loadEnergyGoalOffer(userId, today, settings);
  if (!plan) {
    return { energyGoal: null };
  }

  const day = await writeTodayTargets(userId, today, plan);
  const saved = await saveUserSettings(userId, {
    rest_protein: plan.rest.protein,
    rest_fat: plan.rest.fat,
    rest_carbs: plan.restCarbs,
    training_protein: plan.training.protein,
    training_fat: plan.training.fat,
    training_carbs: plan.trainingCarbs,
    energy_goal_dismissed_kcal: null,
  });

  return {
    energyGoal: null,
    goals: {
      restProtein: saved.rest_protein,
      restCarbs: saved.rest_carbs,
      trainingProtein: saved.training_protein,
      trainingCarbs: saved.training_carbs,
    },
    ...(day ? { day } : {}),
  };
}

export async function dismissEnergyGoal(
  userId: string,
  dismissedKcalFromClient?: number,
): Promise<EnergyGoalSaveResult | null> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    return null;
  }

  const today = calendarDateInTimeZone(settings.timezone);
  const plan = await loadEnergyGoalOffer(userId, today, settings);
  const dismissedKcal = resolveDismissedKcal(
    dismissedKcalFromClient,
    plan?.restKcal,
  );
  if (dismissedKcal == null) {
    return { energyGoal: null };
  }

  await saveUserSettings(userId, {
    energy_goal_dismissed_kcal: dismissedKcal,
  });
  return { energyGoal: null };
}

function resolveDismissedKcal(
  fromClient: number | undefined,
  fromPlan: number | undefined,
): number | null {
  const candidate = fromClient ?? fromPlan;
  if (candidate == null || !Number.isFinite(candidate)) {
    return null;
  }
  const rounded = Math.round(candidate);
  if (rounded < 0 || rounded > 20_000) {
    return null;
  }
  return rounded;
}

function offerFrom(
  settings: UserSettings,
  days: Awaited<ReturnType<typeof listDaysInRange>>,
): EnergyGoalPlan | null {
  return energyGoalOffer({
    days: days.map((day) => ({
      date: day.date,
      fact_kcal: day.fact_kcal,
      target_kcal: day.target_kcal,
      body_weight: day.body_weight,
    })),
    goal: settings.goal,
    sex: settings.sex,
    restProtein: settings.rest_protein,
    restFat: settings.rest_fat,
    restCarbs: settings.rest_carbs,
    trainingProtein: settings.training_protein,
    trainingFat: settings.training_fat,
    dismissedKcal: settings.energy_goal_dismissed_kcal,
  });
}

async function writeTodayTargets(
  userId: string,
  today: string,
  plan: EnergyGoalPlan,
): Promise<DayWithMeals | null> {
  const day = await getDayByDate(userId, today);
  if (!day) {
    return null;
  }

  const targets = day.is_training_day ? plan.training : plan.rest;
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("days")
    .update({
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .eq("id", day.id)
    .eq("user_id", userId);

  if (updated.error) {
    throw updated.error;
  }

  return getDayByDate(userId, today);
}
