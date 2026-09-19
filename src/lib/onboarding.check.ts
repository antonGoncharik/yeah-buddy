import {
  defaultOnboardingCircle,
  isExtraProgram,
  scaledTemplateGrams,
} from "@/lib/onboarding/setup";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  RECOMMENDED_PROGRAM_PRESET_ID === "full_body",
  "recommended start is full body",
);
assert(
  defaultOnboardingCircle("empty", false) === "full_body",
  "empty first run picks full body",
);
assert(
  defaultOnboardingCircle("empty", true) === "empty",
  "replay keeps empty circle",
);
assert(
  defaultOnboardingCircle("ppl", false) === "ppl",
  "existing program stays",
);
assert(!isExtraProgram("full_body"), "full body is beginner");
assert(isExtraProgram("ppl"), "ppl is extra");
assert(!isExtraProgram("empty"), "empty is not extra");

assert(
  scaledTemplateGrams(
    [
      { id: "a", grams: 100, protein: 50 },
      { id: "b", grams: 100, protein: 50 },
    ],
    100,
  ).length === 0,
  "same protein does not rewrite meals",
);

const scaled = scaledTemplateGrams(
  [
    { id: "a", grams: 100, protein: 50 },
    { id: "b", grams: 100, protein: 50 },
  ],
  150,
);
assert(scaled.length === 2, "scales both items");
assert(scaled[0]?.grams === 150 && scaled[1]?.grams === 150, "1.5x portions");

assert(
  scaledTemplateGrams([{ id: "oil", grams: 10, protein: 0 }], 150).length === 0,
  "no protein — no scale",
);

console.log("onboarding setup ok");
