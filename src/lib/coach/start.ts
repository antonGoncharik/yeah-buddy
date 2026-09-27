import { isPackToken, PACK_TOKEN_LENGTH } from "@/lib/share/token";

/** Longer than a pack token, so a random pack link is not a coach link. */
export const COACH_START_PREFIX = "c_";

export function coachStartPayload(token: string): string {
  return `${COACH_START_PREFIX}${token}`;
}

export function parseCoachStartPayload(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith(COACH_START_PREFIX)) {
    return null;
  }

  const token = trimmed.slice(COACH_START_PREFIX.length);
  if (token.length !== PACK_TOKEN_LENGTH || !isPackToken(token)) {
    return null;
  }

  return token;
}

export function readCoachToken(value: string): string | null {
  const trimmed = value.trim();
  return (
    parseCoachStartPayload(trimmed) ??
    parseCoachStartPayload(coachStartPayload(trimmed))
  );
}
