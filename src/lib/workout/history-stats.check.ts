import {
  formatFrequencyVsProgram,
  formatSessionRateHalves,
  sessionRateHalves,
} from "@/lib/workout/history-stats";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  formatFrequencyVsProgram(12, 90, 4),
  "0,9 в неделю · 4 в круге",
  "rate vs program circle",
);
assertEqual(
  formatFrequencyVsProgram(4, 14, 0),
  "2 в неделю",
  "no circle when there is no program",
);

const even = sessionRateHalves(
  ["2026-09-05", "2026-09-07", "2026-09-12", "2026-09-14"],
  "2026-09-04",
  "2026-09-17",
);
assertEqual(even, null, "same pace both halves is not a story");

const drop = sessionRateHalves(
  ["2026-09-05", "2026-09-06", "2026-09-07", "2026-09-14"],
  "2026-09-04",
  "2026-09-17",
);
assertEqual(drop, { first: 3, second: 1 }, "first half denser");
assertEqual(
  formatSessionRateHalves({ first: 3, second: 1 }),
  "сначала 3, потом 1 в неделю",
  "half-rate copy",
);

console.log("history stats ok");
