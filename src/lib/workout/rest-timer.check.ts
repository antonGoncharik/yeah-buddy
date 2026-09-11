import {
  clearStoredRest,
  formatRestClock,
  nextRestLeft,
  parseRestEndsAt,
  REST_ADJUST_SECONDS,
  restLeftAt,
  restTimerKey,
  serializeRestEndsAt,
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
assertEqual(restTimerKey("abc"), "yb.rest:abc", "storage key");
assertEqual(parseRestEndsAt(null), null, "empty storage");
assertEqual(parseRestEndsAt("nope"), null, "bad json");
assertEqual(
  parseRestEndsAt(serializeRestEndsAt(1_700_000_000_000)),
  1_700_000_000_000,
  "roundtrip endsAt",
);
assertEqual(restLeftAt(1_000, 1_000), 0, "due now");
assertEqual(restLeftAt(2_400, 1_000), 2, "ceils leftover ms");
assertEqual(restLeftAt(500, 1_000), 0, "past endsAt is zero");
clearStoredRest("abc");

console.log("rest timer ok");
