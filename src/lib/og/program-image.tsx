import { ImageResponse } from "next/og";

import { APP_NAME } from "@/lib/brand";
import {
  loadOgFonts,
  OG_CARD,
  OG_CLAY,
  OG_CONTENT_TYPE,
  OG_INK,
  OG_LINE,
  OG_MUTED,
  OG_PAPER,
  OG_SIZE,
} from "@/lib/og/landing-image";
import { publicProgramCards } from "@/lib/share/program-public";
import type { FeaturedProgramId } from "@/lib/share/program-start";
import { featuredProgramPreset } from "@/lib/share/program-start";

export const PROGRAM_OG_SIZE = OG_SIZE;
export const PROGRAM_OG_CONTENT_TYPE = OG_CONTENT_TYPE;

export async function programOgImage(
  id: FeaturedProgramId,
): Promise<ImageResponse> {
  const card = publicProgramCards().find((item) => item.id === id);
  const preset = featuredProgramPreset(id);
  const name = card?.name ?? preset.name;
  const summary = clip(card?.summary ?? preset.hint, 90);
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG_PAPER,
        color: OG_INK,
        fontFamily: "Manrope",
      }}
    >
      <div style={{ width: 20, height: "100%", background: OG_CLAY }} />
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
            color: OG_CLAY,
          }}
        >
          {APP_NAME.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 900,
              border: `1px solid ${OG_LINE}`,
              borderRadius: 28,
              background: OG_CARD,
              padding: "22px 28px",
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.35,
              color: OG_MUTED,
            }}
          >
            {summary}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: OG_CLAY,
          }}
        >
          TELEGRAM
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts,
    },
  );
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
