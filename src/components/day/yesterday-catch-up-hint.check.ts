import { showYesterdayCatchUpHint } from "@/components/day/yesterday-catch-up-hint";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  showYesterdayCatchUpHint({
    isToday: true,
    yesterdayExists: false,
    viewOnly: false,
  }),
  true,
  "empty today after a hole",
);
assertEqual(
  showYesterdayCatchUpHint({
    isToday: true,
    yesterdayExists: true,
    viewOnly: false,
  }),
  false,
  "yesterday already logged",
);
assertEqual(
  showYesterdayCatchUpHint({
    isToday: false,
    yesterdayExists: false,
    viewOnly: false,
  }),
  false,
  "past empty day keeps its own catch-up hint",
);
assertEqual(
  showYesterdayCatchUpHint({
    isToday: true,
    yesterdayExists: false,
    viewOnly: true,
  }),
  false,
  "history does not offer catch-up",
);
assertEqual(
  showYesterdayCatchUpHint({
    isToday: true,
    yesterdayExists: false,
    viewOnly: false,
    retentionTail: true,
  }),
  false,
  "first days do not send the person to catch up yesterday",
);

console.log("yesterday catch-up hint ok");
