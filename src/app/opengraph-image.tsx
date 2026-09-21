import {
  landingOgImage,
  OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og/landing-image";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default function Image() {
  return landingOgImage();
}
