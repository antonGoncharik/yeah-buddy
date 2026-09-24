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

const GRAM_GAP = 0.5;
const KCAL_GAP = 50;

export function reminderDayCard(input: {
  protein: number;
  fat?: number;
  carbs?: number;
  kcal: number;
  targetProtein: number;
  targetFat?: number;
  targetCarbs?: number;
  targetKcal?: number;
  gym: DayShareGym;
  gymName?: string | null;
  nextName?: string | null;
}): string {
  const logged = dayWasLogged(input);
  const lines = [
    gramsLine("Белок", input.protein, input.targetProtein, logged),
  ];
  if (logged) {
    pushMacro(lines, "Жир", input.fat ?? 0, input.targetFat ?? 0);
    pushMacro(lines, "Углеводы", input.carbs ?? 0, input.targetCarbs ?? 0);
  }
  lines.push(kcalLine(input.kcal, input.targetKcal ?? 0, logged));
  lines.push(gymLine(input.gym, input.gymName, input.nextName));
  return lines.join("\n");
}

function dayWasLogged(input: {
  protein: number;
  fat?: number;
  carbs?: number;
  kcal: number;
}): boolean {
  return (
    input.protein > GRAM_GAP ||
    (input.fat ?? 0) > GRAM_GAP ||
    (input.carbs ?? 0) > GRAM_GAP ||
    input.kcal >= 1
  );
}

function pushMacro(
  lines: string[],
  label: string,
  fact: number,
  target: number,
): void {
  if (target <= 0 && fact <= GRAM_GAP) {
    return;
  }
  lines.push(gramsLine(label, fact, target, true));
}

function gramsLine(
  label: string,
  fact: number,
  target: number,
  showGap: boolean,
): string {
  if (target <= 0) {
    return `${label} ${formatMacro(fact)} г`;
  }
  const base = `${label} ${formatMacro(fact)} из ${formatMacro(target)} г`;
  if (!showGap) {
    return base;
  }
  const delta = fact - target;
  if (Math.abs(delta) <= GRAM_GAP) {
    return base;
  }
  if (delta > 0) {
    return `${base} · +${formatMacro(delta)}`;
  }
  return `${base} · ещё ${formatMacro(-delta)}`;
}

function kcalLine(fact: number, target: number, showGap: boolean): string {
  const factText = formatKcal(fact);
  if (target <= 0) {
    return `${factText} ккал`;
  }
  const base = `${factText} из ${formatKcal(target)} ккал`;
  if (!showGap) {
    return base;
  }
  const delta = Math.round(fact) - Math.round(target);
  if (Math.abs(delta) < KCAL_GAP) {
    return base;
  }
  if (delta > 0) {
    return `${base} · +${formatKcal(delta)}`;
  }
  return `${base} · ещё ${formatKcal(-delta)}`;
}

function gymLine(
  gym: DayShareGym,
  gymName: string | null | undefined,
  nextName: string | null | undefined,
): string {
  let line = dayShareGymLine(gym);
  if (gym === "gym" && gymName) {
    line = `${line} «${gymName}»`;
  }
  if (gym !== "none" && nextName) {
    line = `${line} · дальше «${nextName}»`;
  }
  return line;
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
