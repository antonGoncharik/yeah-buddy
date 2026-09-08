import { Suspense } from "react";

import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-col justify-center px-4">
          <p className="animate-fade py-10 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        </main>
      }
    >
      <OnboardingScreen />
    </Suspense>
  );
}
