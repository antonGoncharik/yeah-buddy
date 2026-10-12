import type { Metadata } from "next";

import { AppProviders } from "@/components/layout/app-providers";
import { TelegramGate } from "@/components/layout/telegram-gate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <TelegramGate>
        <div
          className="app-safe-pad mx-auto flex h-[var(--app-viewport-height)] w-full max-w-lg flex-col"
          data-onboarding-ui
        >
          {children}
        </div>
      </TelegramGate>
    </AppProviders>
  );
}
