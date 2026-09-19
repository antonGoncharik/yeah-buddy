import { AI_PLATE_QUOTA } from "@/lib/messages";

export type AiKind = "plate" | "review";

export const DEFAULT_PLATE_DAILY_LIMIT = 8;
export const DEFAULT_REVIEW_DAILY_LIMIT = 6;

export function readDailyLimit(
  kind: AiKind,
  env: Record<string, string | undefined> = process.env,
): number | null {
  const raw =
    kind === "plate"
      ? env.GEMINI_PLATE_DAILY_LIMIT
      : env.GEMINI_REVIEW_DAILY_LIMIT;
  if (raw == null || raw.trim() === "") {
    return kind === "plate"
      ? DEFAULT_PLATE_DAILY_LIMIT
      : DEFAULT_REVIEW_DAILY_LIMIT;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return kind === "plate"
      ? DEFAULT_PLATE_DAILY_LIMIT
      : DEFAULT_REVIEW_DAILY_LIMIT;
  }
  if (parsed === 0) {
    return null;
  }
  return parsed;
}

export function remainingAfterUse(
  used: number,
  limit: number | null,
): number | null {
  if (limit == null) {
    return null;
  }
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
