import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import { ConfirmProvider } from "@/components/layout/confirm-provider";
import { DayBackdrop, DayMoodProvider } from "@/components/layout/day-mood";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/brand";
import { siteOriginUrl } from "@/lib/site-url";
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
const ogImage = {
  url: "/icons/icon-512.png",
  width: 512,
  height: 512,
  alt: APP_NAME,
};

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: APP_SHORT_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_SHORT_NAME,
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
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: siteOrigin,
    images: [ogImage],
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [ogImage.url],
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

  return (
    <html
      lang="ru"
      className={cn("font-sans", manrope.variable, theme === "dark" && "dark")}
      style={{ colorScheme: theme }}
    >
      <body className="app-viewport-min bg-background text-foreground antialiased">
        <ThemeProvider initialTheme={theme}>
          <ConfirmProvider>
            <DayMoodProvider>
              <DayBackdrop />
              <div className="relative z-10">{children}</div>
            </DayMoodProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
