import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_SHORT_NAME,
  APP_TITLE,
} from "@/lib/brand";
import { siteOriginUrl } from "@/lib/site-url";
import {
  TELEGRAM_BOOT_SCRIPT,
  TELEGRAM_BOOT_STYLE,
} from "@/lib/telegram/boot-script";
import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "@/lib/theme";
import { cn } from "@/lib/utils";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const siteOrigin = siteOriginUrl();

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: APP_TITLE,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "дневник питания",
    "дневник тренировок",
    "белок",
    "калории",
    "Telegram",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: LIGHT_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: DARK_THEME_COLOR },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={cn("font-sans", manrope.variable)}>
      <head>
        <style>{TELEGRAM_BOOT_STYLE}</style>
        <script>{TELEGRAM_BOOT_SCRIPT}</script>
      </head>
      <body className="app-viewport-min bg-background text-foreground antialiased">
        <div className="relative z-10 min-w-0">{children}</div>
      </body>
    </html>
  );
}
