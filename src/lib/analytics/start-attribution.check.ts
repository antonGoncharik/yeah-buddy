import { classifyStartAttribution } from "@/lib/analytics/start-attribution";
import { buddyStartPayload } from "@/lib/buddy/start";
import { coachStartPayload } from "@/lib/coach/start";
import { mealDraftStartPayload } from "@/lib/meal-chat/start";
import { programStartPayload } from "@/lib/share/program-start";
import { createPackToken } from "@/lib/share/token";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const pack = createPackToken();
const coach = classifyStartAttribution(coachStartPayload(pack));
assert(coach?.kind === "coach", "coach link");

const buddy = classifyStartAttribution(buddyStartPayload(pack));
assert(buddy?.kind === "buddy", "buddy link");

const meal = classifyStartAttribution(mealDraftStartPayload(pack));
assert(meal?.kind === "meal", "meal draft link");

const barbell = classifyStartAttribution("barbell");
assert(barbell?.kind === "barbell", "barbell");

const program = classifyStartAttribution(programStartPayload("full_body"));
assert(program?.kind === "program", "program");

const plainPack = classifyStartAttribution(pack);
assert(plainPack?.kind === "pack", "pack token");

assert(classifyStartAttribution("") == null, "empty");

console.log("start attribution ok");
