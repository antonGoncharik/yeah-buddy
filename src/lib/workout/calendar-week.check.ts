import assert from "node:assert/strict";

import { calendarWeekStart } from "@/lib/workout/calendar-week";

assert.equal(calendarWeekStart("2026-10-12"), "2026-10-12");
assert.equal(calendarWeekStart("2026-10-14"), "2026-10-12");

export default Promise.resolve();
