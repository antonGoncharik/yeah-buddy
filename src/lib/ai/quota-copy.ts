import { AI_DICTATE_QUOTA, AI_PLATE_QUOTA } from "@/lib/messages";

export type AiKind = "plate" | "review" | "dictate";

export const PLATE_DAILY_LIMIT = 2;
export const REVIEW_DAILY_LIMIT = 1;
export const DICTATE_DAILY_LIMIT = 2;

export function dailyLimit(kind: AiKind): number {
  if (kind === "plate") {
    return PLATE_DAILY_LIMIT;
  }
  if (kind === "dictate") {
    return DICTATE_DAILY_LIMIT;
  }
  return REVIEW_DAILY_LIMIT;
}

export function remainingAfterUse(used: number, limit: number): number {
  return Math.max(0, limit - Math.max(0, used));
}

export function plateRemainingLine(remaining: number | null): string | null {
  if (remaining == null) {
    return null;
  }
  if (remaining <= 0) {
    return AI_PLATE_QUOTA;
  }
  if (remaining === 1) {
    return "Ещё одно фото сегодня.";
  }
  return `Ещё ${remaining} фото сегодня.`;
}

export function dictateRemainingLine(remaining: number | null): string | null {
  if (remaining == null) {
    return null;
  }
  if (remaining <= 0) {
    return AI_DICTATE_QUOTA;
  }
  if (remaining === 1) {
    return "Ещё одна запись сегодня.";
  }
  const noun = ruNoun(remaining, "запись", "записи", "записей");
  return `Ещё ${remaining} ${noun} сегодня.`;
}

function ruNoun(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}
