import {
  BOT_REMINDER_FOOD,
  BOT_YEAH_BUDDY,
  botReminderGym,
} from "@/lib/messages";

export interface ReminderFacts {
  foodLogged: boolean;
  gymLogged: boolean;
  nextTemplateName: string | null;
}

export function reminderText(facts: ReminderFacts): string | null {
  const lines: string[] = [];
  if (!facts.foodLogged) {
    lines.push(BOT_REMINDER_FOOD);
  }
  if (!facts.gymLogged && facts.nextTemplateName) {
    lines.push(botReminderGym(facts.nextTemplateName));
  }
  if (lines.length > 0) {
    return lines.join("\n");
  }
  if (facts.foodLogged && facts.gymLogged) {
    return BOT_YEAH_BUDDY;
  }

  return null;
}
