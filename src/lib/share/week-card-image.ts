import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

import { type WeekCard, weekCardSvg } from "@/lib/share/week-card";

const FONT_FILES = ["Manrope-Medium.ttf", "Manrope-Bold.ttf"] as const;

let fontFiles: Promise<string[]> | null = null;

export async function renderWeekCardJpeg(card: WeekCard): Promise<Buffer> {
  return renderShareSvgJpeg(weekCardSvg(card));
}

export async function renderShareSvgJpeg(svg: string): Promise<Buffer> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "original" },
    textRendering: 1,
    font: {
      fontFiles: await loadFontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: "Manrope",
      sansSerifFamily: "Manrope",
    },
  });
  const png = resvg.render().asPng();
  return sharp(png).jpeg({ quality: 86 }).toBuffer();
}

function loadFontFiles(): Promise<string[]> {
  fontFiles ??= readFontFiles();
  return fontFiles;
}

async function readFontFiles(): Promise<string[]> {
  const dir = join(process.cwd(), "src/assets/fonts");
  const paths = FONT_FILES.map((name) => join(dir, name));
  await Promise.all(
    paths.map((path) => readFile(/* turbopackIgnore: true */ path)),
  );
  return paths;
}
