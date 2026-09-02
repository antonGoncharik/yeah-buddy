import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const INIT_DATA_MAX_AGE_SECONDS = 60 * 60 * 24;

const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

export type TelegramWebAppUser = {
  id: number;
  username: string | null;
  first_name: string | null;
  language_code: string | null;
};

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
): TelegramWebAppUser | null {
  if (!initData || !botToken) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeEqualHex(hash, computedHash)) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60 || now - authDate > INIT_DATA_MAX_AGE_SECONDS) {
    return null;
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    return null;
  }

  try {
    const parsed = telegramUserSchema.safeParse(JSON.parse(userRaw));
    if (!parsed.success) {
      return null;
    }

    return {
      id: parsed.data.id,
      username: emptyToNull(parsed.data.username),
      first_name: emptyToNull(parsed.data.first_name),
      language_code: emptyToNull(parsed.data.language_code),
    };
  } catch {
    return null;
  }
}

function emptyToNull(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return value;
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}
