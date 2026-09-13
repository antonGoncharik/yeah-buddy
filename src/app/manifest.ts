import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/brand";
import { LIGHT_THEME_COLOR } from "@/lib/theme";

const SHORTCUT_ICON = {
  src: "/icons/icon-96.png",
  sizes: "96x96",
  type: "image/png",
} as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    lang: "ru",
    dir: "ltr",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: LIGHT_THEME_COLOR,
    theme_color: LIGHT_THEME_COLOR,
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Сегодня",
        short_name: "Сегодня",
        description: "Еда и тренировка на день",
        url: "/today",
        icons: [SHORTCUT_ICON],
      },
      {
        name: "Тренировки",
        short_name: "Зал",
        description: "Очередь и рабочие веса",
        url: "/workouts",
        icons: [SHORTCUT_ICON],
      },
      {
        name: "Настройки",
        short_name: "Ещё",
        description: "Еда, журнал и тема",
        url: "/settings",
        icons: [SHORTCUT_ICON],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/today.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Сегодня — еда и тренировка",
      },
      {
        src: "/screenshots/workouts.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Очередь тренировок",
      },
      {
        src: "/screenshots/settings.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Настройки и ссылки для друзей",
      },
    ],
  };
}
