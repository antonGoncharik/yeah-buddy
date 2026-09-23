import {
  emptyStartCopy,
  inRetentionTail,
  onboardingAgeDays,
  RETENTION_TAIL_DAYS,
} from "@/lib/retention";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(RETENTION_TAIL_DAYS, 3, "three-day tail");
assertEqual(
  onboardingAgeDays("2026-09-20T08:00:00.000Z", "2026-09-20", "UTC"),
  0,
  "onboarding day is age 0",
);
assertEqual(
  onboardingAgeDays("2026-09-20T08:00:00.000Z", "2026-09-21", "UTC"),
  1,
  "next morning is day 2",
);
assertEqual(
  onboardingAgeDays("2026-09-20T08:00:00.000Z", "2026-09-22", "UTC"),
  2,
  "third calendar day",
);
assertEqual(
  onboardingAgeDays("2026-09-20T08:00:00.000Z", "2026-09-27", "UTC"),
  7,
  "a week later",
);
assertEqual(
  onboardingAgeDays(null, "2026-09-21", "UTC"),
  null,
  "missing stamp",
);
assertEqual(
  onboardingAgeDays("nope", "2026-09-21", "UTC"),
  null,
  "invalid stamp",
);
assertEqual(
  onboardingAgeDays("2026-09-21T08:00:00.000Z", "2026-09-20", "UTC"),
  null,
  "future stamp",
);
assertEqual(
  onboardingAgeDays("2026-09-20T17:00:00.000Z", "2026-09-20", "Europe/Moscow"),
  0,
  "Moscow evening stays onboarding day",
);
assertEqual(
  onboardingAgeDays("2026-09-20T17:00:00.000Z", "2026-09-21", "Europe/Moscow"),
  1,
  "Moscow next morning is day 2",
);

assertEqual(inRetentionTail(0), true, "day 1 is in the tail");
assertEqual(inRetentionTail(2), true, "day 3 is in the tail");
assertEqual(inRetentionTail(3), false, "day 4 is after the tail");
assertEqual(inRetentionTail(null), false, "unknown age is not the tail");

assertEqual(
  emptyStartCopy({
    retentionTail: true,
    isToday: true,
    viewOnly: false,
    dayHasItems: false,
    yesterdayHasFood: true,
  }),
  "repeat",
  "day 2 with yesterday food",
);
assertEqual(
  emptyStartCopy({
    retentionTail: true,
    isToday: true,
    viewOnly: false,
    dayHasItems: false,
    yesterdayHasFood: false,
  }),
  "add",
  "day 2 with nothing to copy",
);
assertEqual(
  emptyStartCopy({
    retentionTail: true,
    isToday: true,
    viewOnly: false,
    dayHasItems: true,
    yesterdayHasFood: true,
  }),
  null,
  "filled today needs no hint",
);
assertEqual(
  emptyStartCopy({
    retentionTail: false,
    isToday: true,
    viewOnly: false,
    dayHasItems: false,
    yesterdayHasFood: false,
  }),
  null,
  "after the tail copy stays quiet",
);
assertEqual(
  emptyStartCopy({
    retentionTail: true,
    isToday: false,
    viewOnly: false,
    dayHasItems: false,
    yesterdayHasFood: true,
  }),
  null,
  "past day is not the morning hint",
);

console.log("retention tail ok");
