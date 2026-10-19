import { templateExercisesToAdd } from "@/lib/workout/session-rebuild";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  templateExercisesToAdd(["a", "b"], ["a", "b", "abs"]),
  ["abs"],
  "new template exercise is added",
);
assertEqual(
  templateExercisesToAdd(["a", "abs"], ["abs", "a"]),
  [],
  "already in the session stays put",
);
assertEqual(
  templateExercisesToAdd([], ["abs", "a"]),
  ["abs", "a"],
  "empty session takes the template order",
);

console.log("session rebuild sync ok");
