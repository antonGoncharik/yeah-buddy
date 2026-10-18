import assert from "node:assert/strict";

import {
  GYM_NUDGE_AFTER_DAYS,
  noticeHourDue,
  WEIGH_IN_AFTER_DAYS,
} from "@/lib/telegram/reminder-schedule";

assert.equal(WEIGH_IN_AFTER_DAYS, 4, "weigh-in waits four full days");
assert.equal(GYM_NUDGE_AFTER_DAYS, 6, "gym nudge waits six days");

assert.equal(noticeHourDue(9, 9), true, "fires on the due hour");
assert.equal(noticeHourDue(11, 9), true, "catches up two hours late");
assert.equal(noticeHourDue(12, 9), false, "gives up after the catch-up window");
assert.equal(noticeHourDue(8, 9), false, "never fires early");
assert.equal(noticeHourDue(22, 20), true, "streak still goes out at 22:00");
assert.equal(noticeHourDue(23, 20), false, "streak stops before midnight");

export default Promise.resolve();
