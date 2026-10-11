const DAY_MS = 24 * 60 * 60 * 1000;

export function personLabel(firstName: unknown, username: unknown): string {
  if (typeof firstName === "string" && firstName.trim() !== "") {
    return firstName.trim();
  }
  if (typeof username === "string" && username.trim() !== "") {
    return `@${username.trim()}`;
  }
  return "";
}

export function isGrantLive(
  row: { revoked_at: string | null; expires_at: string },
  now = Date.now(),
): boolean {
  return row.revoked_at == null && Date.parse(row.expires_at) > now;
}

export function grantExpiresAt(now = Date.now(), days = 30): string {
  return new Date(now + days * DAY_MS).toISOString();
}
