const GYM_QUOTES = [
  "Yeah buddy.",
  "Light weight, baby.",
  "Ain't nothin' to it but to do it.",
] as const;

export function gymQuote(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % GYM_QUOTES.length;
  }
  return GYM_QUOTES[hash] ?? GYM_QUOTES[0];
}
