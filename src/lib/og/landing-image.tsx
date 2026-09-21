import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

import { APP_NAME } from "@/lib/brand";
import { OPEN_VIA_BOT_LEAD } from "@/lib/messages";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = `${APP_NAME} — дневник еды и зала в Telegram`;

const PAPER = "#F3EEE4";
const INK = "#2C211C";
const MUTED = "#6E5B52";
const CLAY = "#A34B2E";
const CARD = "#FFF9F3";
const LINE = "#E7D9CC";

const CHIPS = [
  { title: "Еда", body: "Белок считается сам" },
  { title: "Зал", body: "Программа и вес" },
  { title: "Штрих", body: "Код с пачки" },
] as const;

const FONT_FILES = [
  ["Manrope-Medium.ttf", 500],
  ["Manrope-Bold.ttf", 700],
] as const;

export async function landingOgImage(): Promise<ImageResponse> {
  const fonts = await Promise.all(
    FONT_FILES.map(async ([file, weight]) => {
      const bytes = await readFile(
        new URL(`../../assets/fonts/${file}`, import.meta.url),
      );
      return {
        name: "Manrope",
        data: bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        weight,
        style: "normal" as const,
      };
    }),
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: PAPER,
        color: INK,
        fontFamily: "Manrope",
      }}
    >
      <div style={{ width: 20, height: "100%", background: CLAY }} />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: CLAY,
          }}
        >
          TELEGRAM
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              maxWidth: 860,
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.35,
              color: MUTED,
            }}
          >
            {OPEN_VIA_BOT_LEAD}
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {CHIPS.map((chip) => (
            <div
              key={chip.title}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 300,
                border: `1px solid ${LINE}`,
                borderRadius: 28,
                background: CARD,
                padding: "22px 26px",
              }}
            >
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
                {chip.title}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  fontSize: 22,
                  fontWeight: 500,
                  color: MUTED,
                }}
              >
                {chip.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts,
    },
  );
}
