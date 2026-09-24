import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { ConfirmProvider } from "@/components/layout/confirm-provider";
import { DayBackdrop, DayMoodProvider } from "@/components/layout/day-mood";
import { DiaryDensityProvider } from "@/components/layout/diary-density-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_SHORT_NAME,
  APP_TITLE,
} from "@/lib/brand";
import { DIARY_DENSITY_COOKIE, parseDiaryDensity } from "@/lib/diary-density";
import { siteOriginUrl } from "@/lib/site-url";
import { TELEGRAM_BOOT_SCRIPT } from "@/lib/telegram/boot-script";
import {
  DARK_THEME_COLOR,
  LIGHT_THEME_COLOR,
  parseTheme,
  THEME_COOKIE,
} from "@/lib/theme";
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

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    interactiveWidget: "overlays-content",
    themeColor: theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const density = parseDiaryDensity(
    cookieStore.get(DIARY_DENSITY_COOKIE)?.value,
  );

  return (
    <html
      lang="ru"
      data-density={density}
      className={cn("font-sans", manrope.variable, theme === "dark" && "dark")}
      style={{ colorScheme: theme }}
    >
      <body className="app-viewport-min bg-background text-foreground antialiased">
        <Script id="telegram-init-params" strategy="beforeInteractive">
          {TELEGRAM_BOOT_SCRIPT}
        </Script>
        <ThemeProvider initialTheme={theme}>
          <DiaryDensityProvider initialDensity={density}>
            <ConfirmProvider>
              <DayMoodProvider>
                <DayBackdrop />
                <div className="relative z-10">{children}</div>
              </DayMoodProvider>
            </ConfirmProvider>
          </DiaryDensityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
