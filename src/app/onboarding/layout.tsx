import type { Metadata } from "next";

import { TelegramGate } from "@/components/layout/telegram-gate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelegramGate>
      <div className="app-safe-pad app-viewport-min mx-auto w-full max-w-lg">
        {children}
      </div>
    </TelegramGate>
  );
}
