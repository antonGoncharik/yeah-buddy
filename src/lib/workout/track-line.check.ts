import {
  asWorkingKg,
  shiftTrackByKg,
  shiftWorkingKg,
} from "@/lib/workout/track-line";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(asWorkingKg(80).join(","), "80", "working kg is a single weight");

assertEqual(
  shiftWorkingKg({ steps: [80], position: 0 }, 2.5).join(","),
  "82.5",
  "a week bump raises the working kilogram",
);
assertEqual(
  shiftWorkingKg({ steps: [80, 82.5, 85], position: 1 }, 2.5).join(","),
  "85",
  "an old ladder collapses to the current step plus the bump",
);
assertEqual(
  shiftWorkingKg({ steps: [80], position: 0 }, 0).join(","),
  "80",
  "zero kilograms leaves the weight alone",
);
assertEqual(
  shiftTrackByKg([80, 82.5, 85], 2.5).join(","),
  "82.5,85,87.5",
  "legacy shift still moves every stored step",
);

console.log("track line ok");
