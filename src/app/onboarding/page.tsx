import { Suspense } from "react";
import { ScreenLoading } from "@/components/layout/screen-status";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="app-viewport-min flex flex-col justify-center px-4">
          <ScreenLoading />
        </main>
      }
    >
      <OnboardingScreen />
    </Suspense>
  );
}
