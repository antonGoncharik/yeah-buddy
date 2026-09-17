import { reviewScoreboardSignals } from "@/lib/ai/signal-lines";

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
