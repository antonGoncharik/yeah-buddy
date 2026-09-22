export function readInboxOpenUrl(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("url" in data)) {
    return null;
  }

  const url = data.url;
  if (typeof url !== "string" || !isTelegramBotUrl(url)) {
    return null;
  }

  return url;
}

function isTelegramBotUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "t.me" || parsed.hostname === "www.t.me")
    );
  } catch {
    return false;
  }
}
