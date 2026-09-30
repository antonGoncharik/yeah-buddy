import {
  programQueueDayLabel,
  programVisitFrequencyLead,
  programVisitFrequencyShort,
} from "@/lib/workout/program-preset-visit";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

assertEqual(
  programQueueDayLabel(2),
  "2 разные тренировки",
  "two days in program",
);
assertEqual(
  programVisitFrequencyShort(2),
  "обычно 2–3 раза в неделю",
  "two-day frequency",
);
assert(
  programVisitFrequencyLead(2).includes("не календарь"),
  "two-day lead explains no calendar",
);
assert(programVisitFrequencyLead(3).includes("3 раза"), "three-day lead");

console.log("program preset visit ok");
