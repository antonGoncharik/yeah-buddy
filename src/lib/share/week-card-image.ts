import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { type WeekCard, weekCardSvg } from "@/lib/share/week-card";

let fontCss: Promise<string> | null = null;

export async function renderWeekCardJpeg(card: WeekCard): Promise<Buffer> {
  const svg = weekCardSvg(card, await loadFontCss());
  return sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
}

function loadFontCss(): Promise<string> {
  fontCss ??= readFonts();
  return fontCss;
}

async function readFonts(): Promise<string> {
  const dir = join(process.cwd(), "src/assets/fonts");
  const [medium, bold] = await Promise.all([
    readFile(join(dir, "Manrope-Medium.ttf")),
    readFile(join(dir, "Manrope-Bold.ttf")),
  ]);
  return `${face(medium, 500)}\n${face(bold, 700)}`;
}

function face(file: Buffer, weight: number): string {
  return `@font-face{font-family:'Manrope';font-weight:${weight};src:url(data:font/ttf;base64,${file.toString("base64")});}`;
}
