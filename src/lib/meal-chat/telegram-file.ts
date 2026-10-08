import type { Context } from "grammy";

import { dictateAudioMime } from "@/lib/ai/dictate-audio";
import { DICTATE_AUDIO_MAX_BYTES } from "@/lib/ai/speech-wav";
import { getServerEnv } from "@/lib/env";
import { AI_DICTATE_HEAVY } from "@/lib/messages";

export async function downloadTelegramFile(
  ctx: Context,
  fileId: string,
  maxBytes = DICTATE_AUDIO_MAX_BYTES,
): Promise<{ buffer: Buffer; path: string }> {
  const file = await ctx.api.getFile(fileId);
  const path = file.file_path;
  if (!path) {
    throw new Error("Telegram file path missing");
  }

  const env = getServerEnv();
  const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Telegram file download failed");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new HeavyTelegramFileError(AI_DICTATE_HEAVY);
  }

  return { buffer, path };
}

export class HeavyTelegramFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeavyTelegramFileError";
  }
}

export function imageMimeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

export function audioMimeFromTelegram(
  path: string,
  declaredMime?: string,
): string | null {
  const fromDeclared = declaredMime
    ? dictateAudioMime(declaredMime)
    : null;
  if (fromDeclared) {
    return fromDeclared;
  }

  const lower = path.toLowerCase();
  if (lower.endsWith(".oga") || lower.endsWith(".ogg")) {
    return "audio/ogg";
  }
  if (lower.endsWith(".mp3")) {
    return "audio/mp3";
  }
  if (lower.endsWith(".m4a")) {
    return "audio/mp4";
  }
  if (lower.endsWith(".webm")) {
    return "audio/webm";
  }

  return dictateAudioMime("audio/ogg");
}
