import { isPackToken } from "@/lib/share/token";

export function isTelegramMeUrl(value: string): boolean {
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

export function withStartApp(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("startapp", token);
  return parsed.toString();
}

export function resolveAppShareUrl(input: {
  miniAppUrl: string | null;
  botUsername: string | null;
}): string | null {
  const mini = input.miniAppUrl;
  if (mini && isTelegramMeUrl(mini)) {
    return mini;
  }
  if (input.botUsername) {
    return `https://t.me/${input.botUsername}`;
  }
  return mini;
}

export function resolvePackShareUrl(
  token: string,
  appUrl: string | null,
): string | null {
  if (!appUrl || !isPackToken(token)) {
    return null;
  }

  return withStartApp(appUrl, token);
}
