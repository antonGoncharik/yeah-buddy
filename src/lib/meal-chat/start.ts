import { isPackToken, PACK_TOKEN_LENGTH } from "@/lib/share/token";

export const MEAL_DRAFT_START_PREFIX = "f_";

export function mealDraftStartPayload(token: string): string {
  return `${MEAL_DRAFT_START_PREFIX}${token}`;
}

export function parseMealDraftStartPayload(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith(MEAL_DRAFT_START_PREFIX)) {
    return null;
  }

  const token = trimmed.slice(MEAL_DRAFT_START_PREFIX.length);
  if (token.length !== PACK_TOKEN_LENGTH || !isPackToken(token)) {
    return null;
  }

  return token;
}
