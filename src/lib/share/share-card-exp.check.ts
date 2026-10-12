import {
  SHARE_CARD_TTL_SEC,
  shareCardExpired,
  shareCardExpiresAt,
} from "@/lib/share/share-card-exp";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const now = 1_700_000_000;
assertEqual(shareCardExpiresAt(now), now + SHARE_CARD_TTL_SEC, "exp offset");
assertEqual(shareCardExpired(now + 1, now), false, "not expired");
assertEqual(shareCardExpired(now - 1, now), true, "expired");
