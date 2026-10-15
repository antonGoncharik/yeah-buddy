import assert from "node:assert/strict";

import { plateDeltaLine, platesLine, platesPerSide } from "@/lib/workout/plates";

assert.deepEqual(platesPerSide(60), [20]);
assert.deepEqual(platesPerSide(100), [25, 15]);
assert.equal(platesPerSide(20), null);
assert(platesLine(60)?.includes("20"));
assert.equal(plateDeltaLine(60, 80), "(+10 кг на сторону)");
assert.equal(plateDeltaLine(80, 70), "(−5 кг на сторону)");
assert.equal(plateDeltaLine(80, 80), null);
assert.equal(plateDeltaLine(12.5, 15), null);

export default Promise.resolve();
