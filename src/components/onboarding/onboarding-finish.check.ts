import {
  onboardingExitHref,
  onboardingFinishCircle,
} from "@/components/onboarding/onboarding-finish";
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

assertEqual(
  onboardingFinishCircle({
    pendingProgramId: "full_body",
    pendingKind: null,
    replay: false,
    circle: "ppl",
  }),
  "full_body",
  "bot program is applied on finish",
);
assertEqual(
  onboardingFinishCircle({
    pendingProgramId: null,
    pendingKind: "workouts",
    replay: false,
    circle: "ppl",
  }),
  "keep",
  "workout pack still waits for the pack screen",
);
assertEqual(
  onboardingFinishCircle({
    pendingProgramId: null,
    pendingKind: null,
    replay: false,
    circle: "ppl",
  }),
  "ppl",
  "ordinary finish keeps the picked circle",
);

console.log("onboarding finish ok");
