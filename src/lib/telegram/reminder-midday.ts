import { proteinClosed } from "@/lib/flavor";
import {
  BOT_MIDDAY_REMINDER_FOOD,
  botMiddayReminderGym,
  botMiddayReminderProtein,
} from "@/lib/messages";
import { formatGrams } from "@/lib/nutrition";
import {
  foodLogStreakAtRisk,
  foodStreakLabel,
  liveFoodLogStreak,
} from "@/lib/retention/habit";
import type { SessionStatus } from "@/lib/types";
import { gymDoneForReminder } from "@/lib/telegram/reminder-text";

/** Minimum protein gap (g) before a midday nudge. */
export const MIDDAY_PROTEIN_GAP_GRAMS = 15;
/** Local hour (inclusive) when a protein-gap nudge may fire. */
export const MIDDAY_PROTEIN_AFTERNOON_HOUR = 15;

export interface MiddayReminderFacts {
  foodLogged: boolean;
  priorFoodLogDays: number;
  protein: number;
  targetProtein: number;
  isTrainingDay: boolean | null;
  sessionStatus: SessionStatus | null;
  gymTemplateName: string | null;
  localHour: number;
}

export function gymSessionOpenForMidday(input: {
  isTrainingDay: boolean | null;
  sessionStatus: SessionStatus | null;
}): boolean {
  return input.isTrainingDay === true && input.sessionStatus === "planned";
}

export function middayDayCompleteEnough(facts: MiddayReminderFacts): boolean {
  if (!facts.foodLogged) {
    return false;
  }
  const remaining = facts.targetProtein - facts.protein;
  if (!proteinClosed(remaining, facts.protein)) {
    return false;
  }
  return gymDoneForReminder({
    isTrainingDay: facts.isTrainingDay,
    sessionStatus: facts.sessionStatus,
  });
}

export function middayReminderText(facts: MiddayReminderFacts): string | null {
  if (middayDayCompleteEnough(facts)) {
    return null;
  }

  if (
    gymSessionOpenForMidday(facts) &&
    facts.gymTemplateName &&
    facts.gymTemplateName.length > 0
  ) {
    return botMiddayReminderGym(facts.gymTemplateName);
  }

  if (foodLogStreakAtRisk(facts.foodLogged, facts.priorFoodLogDays)) {
    return foodStreakLabel(
      liveFoodLogStreak(facts.foodLogged, facts.priorFoodLogDays),
      true,
    );
  }

  if (!facts.foodLogged) {
    return BOT_MIDDAY_REMINDER_FOOD;
  }

  const remaining = facts.targetProtein - facts.protein;
  if (
    facts.localHour >= MIDDAY_PROTEIN_AFTERNOON_HOUR &&
    facts.targetProtein > 0 &&
    !proteinClosed(remaining, facts.protein) &&
    remaining >= MIDDAY_PROTEIN_GAP_GRAMS
  ) {
    return botMiddayReminderProtein(formatGrams(remaining));
  }

  return null;
}
