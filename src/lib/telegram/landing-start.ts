const LANDING_SRC_PATTERN = /^[a-z0-9_-]{1,32}$/;

export function landingStartPayload(src: string): string {
  const safe = src.trim().toLowerCase();
  if (!LANDING_SRC_PATTERN.test(safe)) {
    return "lp_cta";
  }
  return `lp_${safe}`;
}

export function parseLandingStartPayload(
  value: string,
): { ref: string } | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("lp_") || trimmed.length <= 3) {
    return null;
  }
  const tail = trimmed.slice(3);
  if (!LANDING_SRC_PATTERN.test(tail)) {
    return null;
  }
  return { ref: trimmed };
}
