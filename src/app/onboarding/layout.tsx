import { TelegramGate } from "@/components/layout/telegram-gate";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelegramGate>
      <div className="mx-auto min-h-dvh w-full max-w-lg">{children}</div>
    </TelegramGate>
  );
}
