import type { Metadata } from "next";
import { BuddyCatcher } from "@/components/buddy/buddy-catcher";
import { CoachCatcher } from "@/components/coach/coach-catcher";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OutboxSync } from "@/components/layout/outbox-sync";
import { ResetWindowScroll } from "@/components/layout/reset-window-scroll";
import { TelegramBackSwipeGuard } from "@/components/layout/telegram-back-swipe-guard";
import { TelegramGate } from "@/components/layout/telegram-gate";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { MealDraftCatcher } from "@/components/meal-chat/meal-draft-catcher";
import { PackCatcher } from "@/components/share/pack-catcher";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramGate>
      <OnboardingGate>
        <div
          className="app-safe-pad app-viewport-min mx-auto w-full min-w-0 max-w-lg pb-[var(--app-nav-clearance)]"
          data-diary-compact-scope
        >
          <ResetWindowScroll />
          <TelegramBackSwipeGuard />
          <CoachCatcher>
            <BuddyCatcher>
              <MealDraftCatcher>
                <PackCatcher>{children}</PackCatcher>
              </MealDraftCatcher>
            </BuddyCatcher>
          </CoachCatcher>
          <OutboxSync />
        </div>
        <BottomNav />
      </OnboardingGate>
    </TelegramGate>
  );
}
