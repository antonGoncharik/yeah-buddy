import { grantExpiresAt, isGrantLive, personLabel } from "@/lib/grants/record";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(personLabel("  Антон ", "anton"), "Антон", "first name wins");
assertEqual(personLabel("   ", "anton"), "@anton", "username fallback");
assertEqual(personLabel(null, "  bob "), "@bob", "trimmed username");
assertEqual(personLabel("", ""), "", "empty label");
assertEqual(personLabel(null, null), "", "missing names");

const now = Date.parse("2026-01-01T00:00:00.000Z");
const live = { revoked_at: null, expires_at: grantExpiresAt(now) };
assertEqual(isGrantLive(live, now), true, "future grant is live");
assertEqual(
  isGrantLive({ ...live, revoked_at: live.expires_at }, now),
  false,
  "revoked grant is dead",
);
assertEqual(
  isGrantLive(
    { revoked_at: null, expires_at: new Date(now).toISOString() },
    now,
  ),
  false,
  "expiry at now is dead",
);
assertEqual(
  isGrantLive({ revoked_at: null, expires_at: "not-a-date" }, now),
  false,
  "bad expiry is dead",
);
assertEqual(
  Date.parse(grantExpiresAt(now)) - now,
  30 * 24 * 60 * 60 * 1000,
  "default lifetime is 30 days",
);
