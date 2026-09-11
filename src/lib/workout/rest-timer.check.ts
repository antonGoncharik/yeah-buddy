import {
  formatRestClock,
  nextRestLeft,
  REST_ADJUST_SECONDS,
  WORK_REST_SECONDS,
  workSetsNeedRest,
} from "@/lib/workout/rest-timer";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(WORK_REST_SECONDS, 180, "default rest is 3:00");
assertEqual(REST_ADJUST_SECONDS, 30, "adjust step");
assertEqual(formatRestClock(180), "3:00", "three minutes");
assertEqual(formatRestClock(65), "1:05", "minute and five");
assertEqual(formatRestClock(9), "0:09", "under ten seconds");
assertEqual(formatRestClock(0), "0:00", "zero");
assertEqual(formatRestClock(-4), "0:00", "negative clamps");
assertEqual(nextRestLeft(180, 30), 210, "plus 30");
assertEqual(nextRestLeft(20, -30), 0, "minus 30 floors at zero");
assertEqual(
  workSetsNeedRest([
    { set_type: "warmup", planned_seconds: null },
    { set_type: "work", planned_seconds: null },
  ]),
  true,
  "dynamic work gets rest",
);
assertEqual(
  workSetsNeedRest([
    { set_type: "warmup", planned_seconds: null },
    { set_type: "work", planned_seconds: 6 },
  ]),
  false,
  "static hold is not rest",
);
assertEqual(
  workSetsNeedRest([{ set_type: "warmup", planned_seconds: null }]),
  false,
  "warmup alone is not rest",
);

console.log("rest timer ok");
