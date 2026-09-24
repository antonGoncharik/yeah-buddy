import {
  BOT_REMINDER_DONE,
  BOT_REMINDER_FOOD,
  BOT_REMINDER_FOOD_EARLY,
  botReminderGym,
} from "@/lib/messages";
import type { SessionStatus } from "@/lib/types";

export interface ReminderFacts {
  foodLogged: boolean;
  gymDone: boolean;
  gymClosed?: boolean;
  nextTemplateName: string | null;
  early?: boolean;
}

export function gymDoneForReminder(input: {
  isTrainingDay: boolean | null;
  sessionStatus: SessionStatus | null;
}): boolean {
  if (gymClosedForReminder(input.sessionStatus)) {
    return true;
  }
  if (input.sessionStatus === "planned") {
    return false;
  }
  return input.isTrainingDay === false;
}

export function gymClosedForReminder(
  sessionStatus: SessionStatus | null,
): boolean {
  return sessionStatus === "completed" || sessionStatus === "skipped";
}

export function reminderText(facts: ReminderFacts): string {
  const lines: string[] = [];
  if (!facts.foodLogged) {
    lines.push(facts.early ? BOT_REMINDER_FOOD_EARLY : BOT_REMINDER_FOOD);
  }
  const closed = facts.gymClosed ?? facts.gymDone;
  const nagGym =
    Boolean(facts.nextTemplateName) && (facts.early ? !closed : !facts.gymDone);
  if (nagGym && facts.nextTemplateName) {
    lines.push(botReminderGym(facts.nextTemplateName));
  }
  if (lines.length > 0) {
    return lines.join("\n");
  }

  return BOT_REMINDER_DONE;
}
