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
assert(
  weeklyDigestText({
    proteinHit: 5,
    proteinDays: 7,
    gymSessions: 3,
    weightDelta: -0.4,
  }).includes("5/7"),
);

export default Promise.resolve();
