import {
  assertWritableDayDate,
  CATCH_UP_DAY_LOOKBACK,
  calendarDateInTimeZone,
  calendarToday,
  earliestCatchUpDayDate,
  earliestWritableDayDate,
  inclusiveDayCount,
  isCatchUpWindowDate,
  isDayWritable,
  isHonestWritableDayDate,
  isIsoDate,
  isPastDayDate,
  isWritableDayDate,
  longestDateGap,
  nextIsoDate,
  nutritionHistoryHref,
  nutritionWeekHref,
  PastDayLockedError,
  previousIsoDate,
  shiftIsoDate,
  todayHistoryDayHref,
  todayHomeHref,
  WRITABLE_DAY_LOOKBACK,
  weekStartMonday,
  withDateQuery,
} from "@/lib/day/dates";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(isIsoDate("2026-09-09"), true, "valid iso date");
assertEqual(isIsoDate("2026-9-9"), false, "unpadded date");
assertEqual(isIsoDate("09-09-2026"), false, "wrong order");
assertEqual(isIsoDate("2026-02-31"), false, "impossible day");
assertEqual(isIsoDate("2026-13-01"), false, "impossible month");
assertEqual(isIsoDate("2026-02-29"), false, "non-leap feb 29");
assertEqual(isIsoDate("2024-02-29"), true, "leap feb 29");
assertEqual(inclusiveDayCount("2026-09-04", "2026-09-17"), 14, "14 inclusive");
assertEqual(
  longestDateGap("2026-09-01", "2026-09-17", ["2026-09-01", "2026-09-06"]),
  11,
  "trailing gym hole",
);
assertEqual(
  longestDateGap("2026-09-01", "2026-09-17", ["2026-09-04", "2026-09-06"]),
  11,
  "leading rest then a hole after last session",
);
assertEqual(weekStartMonday("2026-09-14"), "2026-09-14", "monday stays");
assertEqual(weekStartMonday("2026-09-17"), "2026-09-14", "thursday to monday");
assertEqual(weekStartMonday("2026-09-13"), "2026-09-07", "sunday to monday");
assertEqual(previousIsoDate("2026-03-01"), "2026-02-28", "month rollover");
assertEqual(previousIsoDate("2026-01-01"), "2025-12-31", "year rollover back");
assertEqual(nextIsoDate("2026-12-31"), "2027-01-01", "year rollover forward");
assertEqual(
  shiftIsoDate("2026-09-12", -13),
  "2026-08-30",
  "copy-days window start",
);
assertEqual(todayHomeHref(null), "/today", "missing date stays today");
assertEqual(todayHomeHref("2000-01-01"), "/today?date=2000-01-01", "past date");
assertEqual(todayHomeHref(calendarToday()), "/today", "today has no query");
assertEqual(
  todayHomeHref("2026-09-11", "2026-09-12"),
  "/today?date=2026-09-11",
  "user today keeps yesterday query",
);
assertEqual(
  todayHomeHref("2026-09-11", "2026-09-11"),
  "/today",
  "same calendar day drops query",
);
assertEqual(
  withDateQuery("/food/new", "2026-09-11", "2026-09-12"),
  "/food/new?date=2026-09-11",
  "user today keeps date on path",
);
assertEqual(
  withDateQuery("/food/new", "2000-01-01"),
  "/food/new?date=2000-01-01",
  "date query on path",
);
assertEqual(
  withDateQuery("/food/new?mealId=1", "2000-01-01"),
  "/food/new?mealId=1&date=2000-01-01",
  "date query joins existing",
);
assertEqual(
  withDateQuery("/food/new", calendarToday()),
  "/food/new",
  "today path",
);
assertEqual(isPastDayDate("2000-01-01"), true, "old day is past");
assertEqual(isPastDayDate(calendarToday()), false, "today is not past");
assertEqual(nutritionHistoryHref(), "/today/history", "history href");
assertEqual(
  nutritionHistoryHref(true),
  "/today/history?from=settings",
  "history from settings",
);
assertEqual(
  todayHistoryDayHref("2000-01-01"),
  "/today?date=2000-01-01&view=history",
  "history day href",
);
assertEqual(nutritionWeekHref(), "/today/week", "week href");
assertEqual(
  nutritionWeekHref(true),
  "/today/week?from=settings",
  "week from settings",
);

const today = "2026-09-11";
assertEqual(WRITABLE_DAY_LOOKBACK, 2, "two previous days stay open");
assertEqual(CATCH_UP_DAY_LOOKBACK, 7, "catch-up covers a week back");
assertEqual(
  earliestWritableDayDate(today),
  "2026-09-09",
  "honest lookback starts two days back",
);
assertEqual(
  earliestCatchUpDayDate(today),
  "2026-09-04",
  "catch-up lookback starts seven days back",
);
assertEqual(isWritableDayDate(today, today), true, "today is in write window");
assertEqual(
  isHonestWritableDayDate("2026-09-10", today),
  true,
  "yesterday is honest",
);
assertEqual(
  isHonestWritableDayDate("2026-09-09", today),
  true,
  "day before yesterday is honest",
);
assertEqual(
  isHonestWritableDayDate("2026-09-08", today),
  false,
  "three days back is not honest",
);
assertEqual(
  isCatchUpWindowDate("2026-09-08", today),
  true,
  "three days back is catch-up",
);
assertEqual(
  isCatchUpWindowDate("2026-09-04", today),
  true,
  "seven days back is catch-up",
);
assertEqual(
  isCatchUpWindowDate("2026-09-03", today),
  false,
  "eight days back is outside catch-up",
);
assertEqual(
  isWritableDayDate("2026-09-04", today),
  true,
  "seven days back stays in window",
);
assertEqual(
  isWritableDayDate("2026-09-03", today),
  false,
  "eight days back locked",
);
assertEqual(isWritableDayDate("2026-09-12", today), false, "future locked");
assertEqual(
  isDayWritable("2026-09-08", today, null),
  true,
  "empty catch-up day is writable",
);
assertEqual(
  isDayWritable("2026-09-08", today, { caught_up: false, has_food: false }),
  true,
  "opened empty catch-up day is writable",
);
assertEqual(
  isDayWritable("2026-09-08", today, { caught_up: false, has_food: true }),
  false,
  "logged catch-up window day stays locked",
);
assertEqual(
  isDayWritable("2026-09-08", today, { caught_up: true, has_food: true }),
  true,
  "catch-up day stays editable in window",
);
assertEqual(
  isDayWritable("2026-09-09", today, { caught_up: false, has_food: true }),
  true,
  "honest window can rewrite food",
);
assertEqual(
  calendarDateInTimeZone("Europe/Moscow", new Date("2026-09-11T21:30:00Z")),
  "2026-09-12",
  "moscow after utc midnight",
);
assertEqual(
  calendarDateInTimeZone(
    "America/Los_Angeles",
    new Date("2026-09-12T06:00:00Z"),
  ),
  "2026-09-11",
  "la still previous evening",
);

let locked = false;
try {
  assertWritableDayDate("2000-01-01", today);
} catch (error) {
  locked = error instanceof PastDayLockedError;
}
if (!locked) {
  throw new Error("past day should be locked");
}

let todayOk = true;
try {
  assertWritableDayDate("2026-09-10", today);
  assertWritableDayDate("2026-09-09", today);
  assertWritableDayDate("2026-09-04", today);
} catch {
  todayOk = false;
}
if (!todayOk) {
  throw new Error("honest window and catch-up lookback should stay writable");
}

console.log("day dates ok");
