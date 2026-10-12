import { ReviewError } from "@/lib/ai/errors";
import type { PlateModelItem } from "@/lib/ai/plate-types";
import { AI_MEAL_PARSE_EMPTY_REFUND } from "@/lib/messages";

export function requireMealParseItems<T>(
  raw: PlateModelItem[] | null,
  items: T[],
  failedMessage: string,
): T[] {
  if (!raw) {
    throw new ReviewError("GEMINI", failedMessage);
  }
  if (raw.length === 0 || items.length === 0) {
    throw new ReviewError("EMPTY", AI_MEAL_PARSE_EMPTY_REFUND);
  }
  return items;
}
