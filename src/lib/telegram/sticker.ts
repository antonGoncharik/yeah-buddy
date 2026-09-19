import { join } from "node:path";

import { type Context, InputFile } from "grammy";

const TREX_STICKER = join("public", "stickers", "trex.webp");

let trexFileId: string | null = null;

export function trexStickerFileId(): string | null {
  return trexFileId;
}

export function rememberTrexStickerId(fileId: string | null | undefined): void {
  if (fileId) {
    trexFileId = fileId;
  }
}

export function trexStickerFile(): InputFile {
  return new InputFile(join(process.cwd(), TREX_STICKER));
}

export async function replyStartSticker(ctx: Context): Promise<void> {
  try {
    const message = await ctx.replyWithSticker(trexStickerFile());
    rememberTrexStickerId(message.sticker?.file_id);
  } catch (error) {
    console.error(error);
  }
}
