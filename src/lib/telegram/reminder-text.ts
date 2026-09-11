import { BOT_REMINDER_FOOD, botReminderGym } from "@/lib/messages";

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

  return lines.length === 0 ? null : lines.join("\n");
}
