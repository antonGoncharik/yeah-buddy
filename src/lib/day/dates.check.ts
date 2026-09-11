import {
  assertWritableDayDate,
  calendarDateInTimeZone,
  calendarToday,
  isIsoDate,
  isPastDayDate,
  isWritableDayDate,
  nextIsoDate,
  nutritionHistoryHref,
  PastDayLockedError,
  previousIsoDate,
  todayHistoryDayHref,
  todayHomeHref,
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
assertEqual(previousIsoDate("2026-03-01"), "2026-02-28", "month rollover");
assertEqual(previousIsoDate("2026-01-01"), "2025-12-31", "year rollover back");
assertEqual(nextIsoDate("2026-12-31"), "2027-01-01", "year rollover forward");
assertEqual(todayHomeHref(null), "/today", "missing date stays today");
assertEqual(todayHomeHref("2000-01-01"), "/today?date=2000-01-01", "past date");
assertEqual(todayHomeHref(calendarToday()), "/today", "today has no query");
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

const today = "2026-09-11";
assertEqual(isWritableDayDate(today, today), true, "today is writable");
assertEqual(
  isWritableDayDate("2026-09-10", today),
  true,
  "yesterday is writable",
);
assertEqual(
  isWritableDayDate("2026-09-09", today),
  false,
  "day before yesterday locked",
);
assertEqual(isWritableDayDate("2026-09-12", today), false, "future locked");
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
} catch {
  todayOk = false;
}
if (!todayOk) {
  throw new Error("yesterday should stay writable");
}

console.log("day dates ok");
