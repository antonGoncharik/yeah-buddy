import { BottomNav } from "@/components/layout/bottom-nav";
import { TelegramGate } from "@/components/layout/telegram-gate";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramGate>
      <OnboardingGate>
        <div className="mx-auto min-h-dvh w-full max-w-lg pb-28">
          {children}
        </div>
        <BottomNav />
      </OnboardingGate>
    </TelegramGate>
  );
}
