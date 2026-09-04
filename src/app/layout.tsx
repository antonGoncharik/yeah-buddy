import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";

import { DayBackdrop, DayMoodProvider } from "@/components/layout/day-mood";
import { ThemeProvider } from "@/components/layout/theme-provider";
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

export const metadata: Metadata = {
  title: "Дневник",
  description: "Питание и тренировки",
};

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
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
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ThemeProvider initialTheme={theme}>
          <DayMoodProvider>
            <DayBackdrop />
            <div className="relative z-10">{children}</div>
          </DayMoodProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
