import { TelegramGate } from "@/components/layout/telegram-gate";

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
