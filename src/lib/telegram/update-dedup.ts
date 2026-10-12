const TTL_MS = 48 * 60 * 60 * 1000;
const seen = new Map<number, number>();

export function isDuplicateTelegramUpdate(
  updateId: number,
  now = Date.now(),
): boolean {
  if (!Number.isInteger(updateId) || updateId < 0) {
    return false;
  }
  prune(now);
  const expires = seen.get(updateId);
  return expires != null && expires > now;
}

export function rememberTelegramUpdate(
  updateId: number,
  now = Date.now(),
): void {
  if (!Number.isInteger(updateId) || updateId < 0) {
    return;
  }
  seen.set(updateId, now + TTL_MS);
  prune(now);
}

function prune(now: number): void {
  if (seen.size < 500) {
    return;
  }
  for (const [id, expires] of seen) {
    if (expires <= now) {
      seen.delete(id);
    }
  }
}
