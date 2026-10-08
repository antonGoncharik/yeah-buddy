import {
  AI_DICTATE_QUOTA,
  AI_PLATE_QUOTA,
  AI_TEXT_MEAL_QUOTA,
} from "@/lib/messages";

export type AiKind = "plate" | "review" | "dictate" | "text";

export const PLATE_DAILY_LIMIT = 3;
export const REVIEW_DAILY_LIMIT = 3;
export const DICTATE_DAILY_LIMIT = 3;
export const TEXT_MEAL_DAILY_LIMIT = 3;

export function dailyLimit(kind: AiKind): number {
  if (kind === "plate") {
    return PLATE_DAILY_LIMIT;
  }
  if (kind === "dictate") {
    return DICTATE_DAILY_LIMIT;
  }
  if (kind === "text") {
    return TEXT_MEAL_DAILY_LIMIT;
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

export function textMealRemainingLine(remaining: number | null): string | null {
  if (remaining == null) {
    return null;
  }
  if (remaining <= 0) {
    return AI_TEXT_MEAL_QUOTA;
  }
  if (remaining === 1) {
    return "Ещё одна строка сегодня.";
  }
  const noun = ruNoun(remaining, "строка", "строки", "строк");
  return `Ещё ${remaining} ${noun} сегодня.`;
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
