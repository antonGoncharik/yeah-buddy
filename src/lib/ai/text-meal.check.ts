import assert from "node:assert/strict";

import { normalizeMealLogText } from "@/lib/ai/text-meal-input";

assert.equal(
  normalizeMealLogText("  овсянка   80 г "),
  "овсянка 80 г",
  "collapses spaces",
);
assert.equal(normalizeMealLogText(""), null, "empty");
assert.equal(normalizeMealLogText("a".repeat(601)), null, "too long");

console.log("text meal ok");
