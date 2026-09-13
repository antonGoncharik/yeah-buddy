import { onboardingExitHref } from "@/components/onboarding/onboarding-finish";
import { packPath } from "@/lib/share/pending";
import { createPackToken } from "@/lib/share/token";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  onboardingExitHref({ replay: false, pendingToken: null }),
  "/onboarding?tour=1",
  "first run opens the walkthrough",
);
assertEqual(
  onboardingExitHref({ replay: true, pendingToken: null }),
  "/today",
  "protein replay skips the walkthrough",
);
assertEqual(
  onboardingExitHref({
    replay: false,
    pendingToken: "??",
  }),
  "/onboarding?tour=1",
  "junk token does not steal the walkthrough",
);

const token = createPackToken();
assertEqual(
  onboardingExitHref({ replay: false, pendingToken: token }),
  packPath(token),
  "pending pack comes before the walkthrough",
);

console.log("onboarding finish ok");
