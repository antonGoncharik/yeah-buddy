import {
  canShiftYearMonthForward,
  clampYearMonth,
  isYearMonth,
  monthGrid,
  monthGridStart,
  shiftYearMonth,
  WEEKDAY_LABELS,
  yearMonthFromIso,
} from "@/lib/day/month-grid";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(WEEKDAY_LABELS.length, 7, "seven weekday labels");
assertEqual(isYearMonth("2026-09"), true, "valid year-month");
assertEqual(isYearMonth("2026-9"), false, "unpadded month");
assertEqual(isYearMonth("2026-13"), false, "impossible month");
assertEqual(isYearMonth("2026-00"), false, "month zero");
assertEqual(yearMonthFromIso("2026-09-13"), "2026-09", "iso to year-month");
assertEqual(shiftYearMonth("2026-12", 1), "2027-01", "year rollover forward");
assertEqual(shiftYearMonth("2026-01", -1), "2025-12", "year rollover back");
assertEqual(
  clampYearMonth("2026-10", "2026-09-13"),
  "2026-09",
  "future month clamps to today",
);
assertEqual(
  clampYearMonth("2026-08", "2026-09-13"),
  "2026-08",
  "past month stays",
);
assertEqual(
  canShiftYearMonthForward("2026-09", "2026-09-13"),
  false,
  "current month has no next",
);
assertEqual(
  canShiftYearMonthForward("2026-08", "2026-09-13"),
  true,
  "past month can go forward",
);

assertEqual(monthGridStart("2026-09"), "2026-08-31", "sept 2026 starts monday");
assertEqual(monthGridStart("2026-02"), "2026-01-26", "feb 2026 sunday first");
assertEqual(monthGridStart("2024-02"), "2024-01-29", "leap feb thursday first");

const today = "2026-09-13";
const cells = monthGrid("2026-09", today);
assertEqual(cells.length, 35, "september 2026 is five weeks");
assertEqual(cells[0]?.date, "2026-08-31", "leading monday");
assertEqual(cells[0]?.inMonth, false, "leading day out of month");
assertEqual(cells[1]?.date, "2026-09-01", "first of september");
assertEqual(cells[1]?.inMonth, true, "first is in month");
assertEqual(cells.at(-1)?.date, "2026-10-04", "trailing sunday");

const selected = cells.find((cell) => cell.date === today);
assertEqual(selected?.disabled, false, "today is enabled");
assertEqual(selected?.writable, true, "today is writable");

const yesterday = cells.find((cell) => cell.date === "2026-09-12");
assertEqual(yesterday?.writable, true, "yesterday is writable");

const dayBefore = cells.find((cell) => cell.date === "2026-09-11");
assertEqual(dayBefore?.writable, true, "day before yesterday is writable");

const locked = cells.find((cell) => cell.date === "2026-09-05");
assertEqual(locked?.writable, false, "older than a week is locked");
assertEqual(locked?.disabled, false, "older day is still selectable");

const catchUp = cells.find((cell) => cell.date === "2026-09-10");
assertEqual(catchUp?.writable, true, "catch-up window day is writable");

const future = cells.find((cell) => cell.date === "2026-09-14");
assertEqual(future?.disabled, true, "tomorrow is disabled");
assertEqual(future?.writable, false, "tomorrow is not writable");

console.log("month grid ok");
