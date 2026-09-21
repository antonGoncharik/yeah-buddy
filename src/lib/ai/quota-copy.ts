import { AI_PLATE_QUOTA } from "@/lib/messages";

export type AiKind = "plate" | "review";

export const PLATE_DAILY_LIMIT = 5;
export const REVIEW_DAILY_LIMIT = 2;

export function dailyLimit(kind: AiKind): number {
  return kind === "plate" ? PLATE_DAILY_LIMIT : REVIEW_DAILY_LIMIT;
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
