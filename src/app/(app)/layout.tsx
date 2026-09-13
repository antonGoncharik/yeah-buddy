import { BottomNav } from "@/components/layout/bottom-nav";
import { ResetWindowScroll } from "@/components/layout/reset-window-scroll";
import { TelegramGate } from "@/components/layout/telegram-gate";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { PackCatcher } from "@/components/share/pack-catcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramGate>
      <OnboardingGate>
        <div className="app-safe-pad app-viewport-min mx-auto w-full max-w-lg pb-[var(--app-nav-clearance)]">
          <ResetWindowScroll />
          <PackCatcher>{children}</PackCatcher>
        </div>
        <BottomNav />
      </OnboardingGate>
    </TelegramGate>
  );
}
