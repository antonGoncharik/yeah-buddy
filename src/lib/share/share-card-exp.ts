export const SHARE_CARD_TTL_SEC = 7 * 24 * 60 * 60;

export function shareCardExpiresAt(
  nowSec = Math.floor(Date.now() / 1000),
): number {
  return nowSec + SHARE_CARD_TTL_SEC;
}

export function shareCardExpired(
  exp: number,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  return !Number.isFinite(exp) || exp < nowSec;
}
