import { Suspense } from "react";
import { ScreenLoading } from "@/components/layout/screen-status";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-col justify-center px-4">
          <ScreenLoading />
        </main>
      }
    >
      <OnboardingScreen />
    </Suspense>
  );
}
