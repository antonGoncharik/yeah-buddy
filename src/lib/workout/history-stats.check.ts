import {
  formatFrequencyVsProgram,
  formatGymGap,
  formatSessionCloseMix,
  formatSessionFeels,
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
assertEqual(
  formatGymGap("2026-09-01", "2026-09-17", ["2026-09-01", "2026-09-06"]),
  "дыра 11 дн.",
  "week-plus without gym",
);
assertEqual(
  formatGymGap("2026-09-01", "2026-09-17", [
    "2026-09-04",
    "2026-09-07",
    "2026-09-11",
  ]),
  null,
  "normal 3× rest is not a hole",
);
assertEqual(
  formatGymGap("2026-09-01", "2026-09-17", []),
  null,
  "empty window has no hole line",
);
assertEqual(
  formatSessionFeels({ easy: 3, close: 1, miss: 0 }),
  "легко 3 · впритык 1",
  "feel mix",
);
assertEqual(
  formatSessionFeels({ easy: 0, close: 0, miss: 0 }),
  null,
  "no feels yet",
);
assertEqual(formatSessionCloseMix(3, 3), "закрыты как план", "all as planned");
assertEqual(formatSessionCloseMix(2, 5), "2 как план", "mix");
assertEqual(formatSessionCloseMix(0, 4), null, "all edited is silent");

console.log("history stats ok");
