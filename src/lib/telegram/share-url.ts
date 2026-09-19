import {
  type FeaturedProgramId,
  programStartPayload,
} from "@/lib/share/program-start";
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

/** Chat with the bot, not the Mini App path or startapp. */
export function telegramBotChatUrl(url: string): string | null {
  if (!isTelegramMeUrl(url)) {
    return null;
  }

  const username = new URL(url).pathname.split("/").filter(Boolean)[0];
  if (!username) {
    return null;
  }

  return `https://t.me/${username}`;
}

export function withStartApp(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("startapp", token);
  return parsed.toString();
}

export function withStart(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("start", token);
  return parsed.toString();
}

/** Friend links open the bot so the person can press Start. */
export function resolveAppShareUrl(input: {
  miniAppUrl: string | null;
  botUsername: string | null;
}): string | null {
  if (input.botUsername) {
    return `https://t.me/${input.botUsername}`;
  }
  if (input.miniAppUrl) {
    return telegramBotChatUrl(input.miniAppUrl) ?? input.miniAppUrl;
  }
  return null;
}

export function resolvePackShareUrl(
  token: string,
  appUrl: string | null,
): string | null {
  if (!appUrl || !isPackToken(token)) {
    return null;
  }

  return botOrAppStart(appUrl, token);
}

export function resolveProgramShareUrl(
  id: FeaturedProgramId,
  appUrl: string | null,
): string | null {
  if (!appUrl) {
    return null;
  }

  return botOrAppStart(appUrl, programStartPayload(id));
}

function botOrAppStart(appUrl: string, payload: string): string {
  const bot = telegramBotChatUrl(appUrl);
  if (bot) {
    return withStart(bot, payload);
  }

  return withStartApp(appUrl, payload);
}
