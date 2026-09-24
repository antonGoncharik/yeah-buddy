import { readFileSync } from "node:fs";
import { join } from "node:path";
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

const completeSource = readFileSync(
  join(process.cwd(), "src/lib/onboarding/complete.ts"),
  "utf8",
);
const maxesAt = completeSource.indexOf("await applyStartingMaxes(");
const presetAt = completeSource.indexOf("await applyProgramPreset(");
assert(maxesAt >= 0 && presetAt >= 0, "complete.ts still writes maxes and preset");
assert(
  maxesAt < presetAt,
  "starting maxes must land before the program preset so cycle phases inherit them",
);

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
assert(!isExtraProgram("full_body"), "full body is the featured start");
assert(isExtraProgram("one_day"), "other beginner sits under more");
assert(isExtraProgram("five_by_five"), "5×5 sits under more");
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
