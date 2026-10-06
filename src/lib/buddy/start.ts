import { isPackToken, PACK_TOKEN_LENGTH } from "@/lib/share/token";

/** Longer than a pack token, so a random pack link is not a buddy link. */
export const BUDDY_START_PREFIX = "b_";

export function buddyStartPayload(token: string): string {
  return `${BUDDY_START_PREFIX}${token}`;
}

export function parseBuddyStartPayload(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith(BUDDY_START_PREFIX)) {
    return null;
  }

  const token = trimmed.slice(BUDDY_START_PREFIX.length);
  if (token.length !== PACK_TOKEN_LENGTH || !isPackToken(token)) {
    return null;
  }

  return token;
}

export function readBuddyToken(value: string): string | null {
  const trimmed = value.trim();
  return (
    parseBuddyStartPayload(trimmed) ??
    parseBuddyStartPayload(buddyStartPayload(trimmed))
  );
}
