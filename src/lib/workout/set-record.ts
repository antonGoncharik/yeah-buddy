import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { parseDecimal } from "@/lib/workout/numbers";

export function heavierThanLine(priorOn: string | null): string {
  if (!priorOn) {
    return "тяжелее, чем было";
  }
  try {
    return `тяжелее, чем ${format(parseISO(priorOn), "d MMMM", { locale: ru })}`;
  } catch {
    return "тяжелее, чем было";
  }
}

export function liveSetRecord(input: {
  weight: number | null;
  priorPeak: number | null;
  priorOn: string | null;
}): string | null {
  if (input.priorPeak == null || !(input.priorPeak > 0)) {
    return null;
  }
  if (input.weight == null || input.weight <= input.priorPeak) {
    return null;
  }
  return heavierThanLine(input.priorOn);
}

/** Heaviest working weight currently on the card, including an open draft. */
export function liveWorkWeight(
  sets: ReadonlyArray<{
    id: string;
    set_type: string;
    actual_weight: number | null;
    planned_weight: number | null;
  }>,
  drafts: Readonly<Record<string, { weight: string } | undefined>>,
): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.set_type !== "work") {
      continue;
    }
    const draft = drafts[set.id]?.weight;
    const weight =
      draft != null && draft.trim() !== ""
        ? parseDecimal(draft)
        : (set.actual_weight ?? set.planned_weight);
    if (weight == null || !(weight > 0)) {
      continue;
    }
    if (best == null || weight > best) {
      best = weight;
    }
  }
  return best;
}
