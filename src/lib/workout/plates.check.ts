import assert from "node:assert/strict";

import { platesLine, platesPerSide } from "@/lib/workout/plates";

assert.deepEqual(platesPerSide(60), [20]);
assert.deepEqual(platesPerSide(100), [25, 15]);
assert.equal(platesPerSide(20), null);
assert(platesLine(60)?.includes("20"));

export default Promise.resolve();
