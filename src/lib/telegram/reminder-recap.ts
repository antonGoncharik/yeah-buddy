import { reviewScoreboardSignals } from "@/lib/ai/signal-lines";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { type DayShareGym, dayShareGymLine } from "@/lib/share/day";

const RECAP_LINES = 5;

export function weekRecapText(signals: string[]): string | null {
  const lines = reviewScoreboardSignals(signals).slice(0, RECAP_LINES);
  if (lines.length === 0) {
    return null;
  }

  return ["За 14 дней:", ...lines].join("\n");
}

export function composeReminderMessage(
  nag: string | null,
  recap: string | null,
): string | null {
  if (nag && recap) {
    return `${nag}\n\n${recap}`;
  }

  return nag ?? recap;
}

export function reminderDayCard(input: {
  protein: number;
  targetProtein: number;
  kcal: number;
  gym: DayShareGym;
}): string {
  const protein =
    input.targetProtein > 0
      ? `Белок ${formatMacro(input.protein)} из ${formatMacro(input.targetProtein)} г`
      : `Белок ${formatMacro(input.protein)} г`;
  return [
    protein,
    `${formatKcal(input.kcal)} ккал`,
    dayShareGymLine(input.gym),
  ].join("\n");
}

/** Evening chat text: nag, optional Sunday recap, then today's numbers. */
export function composeEveningMessage(
  nag: string | null,
  recap: string | null,
  dayCard: string,
): string {
  const text = composeReminderMessage(nag, recap);
  if (text) {
    return `${text}\n\n${dayCard}`;
  }
  return dayCard;
}
