const LOCAL_ORIGIN = "http://localhost:3000";

export function siteOriginUrl(
  candidates: Array<string | undefined | null> = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.TELEGRAM_MINI_APP_URL,
  ],
): URL {
  for (const raw of candidates) {
    const origin = publicHttpOrigin(raw);
    if (origin) {
      return origin;
    }
  }

  return new URL(LOCAL_ORIGIN);
}

export function publicHttpOrigin(value: string | undefined | null): URL | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.hostname === "t.me" || parsed.hostname.endsWith(".t.me")) {
      return null;
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = "/";
    return parsed;
  } catch {
    return null;
  }
}
