import {
  DIARY_RANGES,
  diaryRangeStart,
  historyNeedsOlder,
  isDiaryRange,
} from "@/lib/diary-range";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(DIARY_RANGES.join(), "14,30,90", "windows a trainee actually uses");
assert(isDiaryRange(90), "90 is a diary range");
assert(!isDiaryRange(7), "week is a separate screen");
assertEqual(
  diaryRangeStart("2026-09-17", 90),
  "2026-06-20",
  "90 days inclusive",
);
assertEqual(
  diaryRangeStart("2026-09-17", 14),
  "2026-09-04",
  "14 days inclusive",
);
assertEqual(diaryRangeStart("nope", 90), null, "bad today");
assertEqual(
  historyNeedsOlder("2026-06-01", "2026-06-01", "2026-09-17", 90),
  false,
  "covered",
);

console.log("diary range ok");
