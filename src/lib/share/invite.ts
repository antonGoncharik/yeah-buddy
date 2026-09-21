import { isRecord } from "@/lib/read";

export const INVITE_HREF = "/settings/invite";
export const BOT_INVITE_LABEL = "Бот другу";
export const BOT_INVITE_HINT = "QR. Твоей еды и зала там нет.";
export const BOT_INVITE_SUBTITLE = "Ссылка на бот. Твоей еды и зала там нет.";

export function readInvitePayload(
  data: unknown,
): { url: string; text: string } | null {
  if (!isRecord(data) || typeof data.url !== "string") {
    return null;
  }

  const url = data.url.trim();
  if (url === "") {
    return null;
  }

  return {
    url,
    text: typeof data.text === "string" ? data.text : "",
  };
}
