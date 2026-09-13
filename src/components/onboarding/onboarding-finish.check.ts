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

assertEqual(onboardingExitHref(null), "/today", "after setup the diary opens");
assertEqual(
  onboardingExitHref("??"),
  "/today",
  "junk token does not steal today",
);

const token = createPackToken();
assertEqual(
  onboardingExitHref(token),
  packPath(token),
  "pending pack comes before today",
);

console.log("onboarding finish ok");
