import assert from "node:assert/strict";

import {
  inQuietHours,
  reminderExtraBlocked,
} from "@/lib/telegram/reminder-log";
import { weeklyDigestText } from "@/lib/telegram/weekly-digest";

assert.equal(inQuietHours(22, 22, 8), true);
assert.equal(inQuietHours(12, 22, 8), false);
assert.equal(reminderExtraBlocked(1), false);
assert.equal(reminderExtraBlocked(2), true);
const digest = weeklyDigestText({
  proteinHit: 5,
  proteinDays: 7,
  gymSessions: 3,
  gymPlanned: 4,
  weightDelta: -0.4,
  records: 1,
});
assert(digest.includes("5/7"), "digest counts protein days");
assert(digest.includes("3 из 4"), "digest shows sessions against the plan");
assert(digest.includes("прошлой неделе"), "digest compares week averages");
assert(digest.includes("рекорд"), "digest names a new record");
assert(
  !weeklyDigestText({
    proteinHit: 0,
    proteinDays: 0,
    gymSessions: 2,
    gymPlanned: 0,
    weightDelta: null,
    records: 0,
  }).includes("из"),
  "no plan means no fraction",
);

export default Promise.resolve();
