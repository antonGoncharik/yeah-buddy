import { parseProgramStartPayload } from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";

export function isIncomingStartPayload(value: string): boolean {
  return parseProgramStartPayload(value) != null || isPackToken(value);
}

export function pickStartPayload(
  candidates: ReadonlyArray<string | null | undefined>,
): string | null {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed && isIncomingStartPayload(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export function startPayloadFromLocation(input: {
  telegramStartParam?: string | null;
  search: string;
  hash: string;
}): string | null {
  const candidates: string[] = [];
  if (input.telegramStartParam) {
    candidates.push(input.telegramStartParam);
  }

  const search = new URLSearchParams(stripPrefix(input.search, "?"));
  for (const key of ["startapp", "pack", "start"]) {
    const value = search.get(key);
    if (value) {
      candidates.push(value);
    }
  }

  const hash = stripPrefix(input.hash, "#");
  if (hash) {
    const hashed = new URLSearchParams(hash);
    for (const key of ["tgWebAppStartParam", "startapp"]) {
      const value = hashed.get(key);
      if (value) {
        candidates.push(value);
      }
    }
  }

  return pickStartPayload(candidates);
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
