import { BOT_REMINDER_FOOD, botReminderGym } from "@/lib/messages";

export interface ReminderFacts {
  foodLogged: boolean;
  gymLogged: boolean;
  nextTemplateName: string | null;
}

export function reminderText(facts: ReminderFacts): string | null {
  if (facts.foodLogged || facts.gymLogged) {
    return null;
  }

  const lines = [BOT_REMINDER_FOOD];
  if (facts.nextTemplateName) {
    lines.push(botReminderGym(facts.nextTemplateName));
  }

  return lines.join("\n");
}
