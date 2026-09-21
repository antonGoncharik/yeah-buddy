import { proteinClosed } from "@/lib/flavor";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { JoyDoodle } from "@/lib/share/joy";
import type { SessionStatus } from "@/lib/types";

export const DAY_INLINE_PREFIX = "day ";
export const DAY_SHARE_GYM = ["gym", "rest", "none"] as const;
export type DayShareGym = (typeof DAY_SHARE_GYM)[number];

export interface DayShareFacts {
  protein: number;
  kcal: number;
  gym: DayShareGym;
}

export function dayShareGym(input: {
  sessionStatus: SessionStatus | null;
  isTrainingDay: boolean | null;
}): DayShareGym {
  if (input.sessionStatus === "completed") {
    return "gym";
  }
  if (input.isTrainingDay === false) {
    return "rest";
  }
  return "none";
}

export function dayShareGymLine(gym: DayShareGym): string {
  if (gym === "gym") {
    return "Зал был";
  }
  if (gym === "rest") {
    return "Отдых";
  }
  return "Зала не было";
}

export function dayShareFacts(input: {
  protein: number;
  kcal: number;
  sessionStatus: SessionStatus | null;
  isTrainingDay: boolean | null;
}): DayShareFacts {
  return {
    protein: input.protein,
    kcal: input.kcal,
    gym: dayShareGym(input),
  };
}

export function dayShareCard(facts: DayShareFacts): string {
  return [
    `Б ${formatMacro(facts.protein)} г`,
    `${formatKcal(facts.kcal)} ккал`,
    dayShareGymLine(facts.gym),
  ].join("\n");
}

export function dayShareDoodle(input: {
  protein: number;
  targetProtein: number;
}): JoyDoodle {
  const remaining = input.targetProtein - input.protein;
  return proteinClosed(remaining, input.protein) ? "cookie" : "trex";
}

export function dayInlineQuery(
  facts: DayShareFacts,
  doodle: JoyDoodle = "trex",
): string {
  return [
    DAY_INLINE_PREFIX.trim(),
    formatShareNumber(facts.protein),
    String(Math.round(facts.kcal)),
    facts.gym,
    doodle,
  ].join(" ");
}

export function parseDayInlineQuery(
  query: string,
): { facts: DayShareFacts; doodle: JoyDoodle } | null {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if ((tokens[0] ?? "").toLowerCase() !== "day") {
    return null;
  }

  const protein = Number(tokens[1]);
  const kcal = Number(tokens[2]);
  const gym = tokens[3];
  if (!Number.isFinite(protein) || protein < 0 || protein > 1000) {
    return null;
  }
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > 20_000) {
    return null;
  }
  if (!isDayShareGym(gym)) {
    return null;
  }

  const doodle = tokens[4] === "cookie" ? "cookie" : "trex";
  return { facts: { protein, kcal, gym }, doodle };
}

function isDayShareGym(value: string | undefined): value is DayShareGym {
  return DAY_SHARE_GYM.some((gym) => gym === value);
}

function formatShareNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
