import {
  BOT_REMINDER_FOOD,
  BOT_YEAH_BUDDY,
  botReminderGym,
} from "@/lib/messages";
import type { SessionStatus } from "@/lib/types";

export interface ReminderFacts {
  foodLogged: boolean;
  gymDone: boolean;
  nextTemplateName: string | null;
}

export function gymDoneForReminder(input: {
  isTrainingDay: boolean | null;
  sessionStatus: SessionStatus | null;
}): boolean {
  if (
    input.sessionStatus === "completed" ||
    input.sessionStatus === "skipped"
  ) {
    return true;
  }
  if (input.sessionStatus === "planned") {
    return false;
  }
  return input.isTrainingDay === false;
}

export function reminderText(facts: ReminderFacts): string {
  const lines: string[] = [];
  if (!facts.foodLogged) {
    lines.push(BOT_REMINDER_FOOD);
  }
  if (!facts.gymDone && facts.nextTemplateName) {
    lines.push(botReminderGym(facts.nextTemplateName));
  }
  if (lines.length > 0) {
    return lines.join("\n");
  }

  return BOT_YEAH_BUDDY;
}
