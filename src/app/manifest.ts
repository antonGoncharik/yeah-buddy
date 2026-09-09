import type { MetadataRoute } from "next";

import { LIGHT_THEME_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Дневник",
    short_name: "Дневник",
    description: "Питание и тренировки",
    start_url: "/",
    display: "standalone",
    background_color: LIGHT_THEME_COLOR,
    theme_color: LIGHT_THEME_COLOR,
    icons: [
      {
        src: "/icons/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
