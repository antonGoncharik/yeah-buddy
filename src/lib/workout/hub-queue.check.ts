import assert from "node:assert/strict";

import { recomputeHubQueue } from "@/lib/workout/hub-queue";

const active = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

const skipB = recomputeHubQueue(active, ["b"], null);
assert.equal(skipB.nextTemplate?.id, "a");
assert.equal(skipB.followingTemplate?.id, "b");

const afterSkipA = recomputeHubQueue(active, ["a"], null);
assert.equal(afterSkipA.nextTemplate?.id, "b");
assert.equal(afterSkipA.followingTemplate?.id, "c");

const skipBandA = recomputeHubQueue(active, ["b", "a"], null);
assert.equal(skipBandA.nextTemplate?.id, "c");

console.log("hub queue ok");
