import assert from "node:assert/strict";

import { prPushLine } from "@/lib/telegram/pr-push";

assert.equal(prPushLine([]), null);
assert(prPushLine(["присед"])?.includes("присед"));

export default Promise.resolve();
