import assert from "node:assert/strict";

import {
  templateSessionLine,
  templateSessionOutline,
} from "@/lib/workout/session-preview";

const group = (sets: number) => ({ plan: { groups: [{ sets }] } });

const outline = templateSessionOutline([
  group(3),
  group(3),
  group(3),
  group(3),
]);

assert.deepEqual(outline, {
  exercises: 4,
  workSets: 12,
  minutes: 40,
});
assert.equal(
  outline ? templateSessionLine(outline) : "",
  "4 упражнения · 12 рабочих подходов · ~40 мин",
);
assert.equal(templateSessionOutline([]), null);
assert.equal(
  templateSessionOutline([{ plan: null }])?.workSets,
  3,
  "a slot without its own scheme still counts three work sets",
);

console.log("session preview ok");
