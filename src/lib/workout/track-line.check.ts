import { shiftTrackByKg } from "@/lib/workout/track-line";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  shiftTrackByKg([80, 82.5, 85], 2.5).join(","),
  "82.5,85,87.5",
  "a week bump shifts the whole kilogram line",
);
assertEqual(
  shiftTrackByKg([80], 2.5).join(","),
  "82.5",
  "a single current weight also grows",
);
assertEqual(
  shiftTrackByKg([80, 82.5], 0).join(","),
  "80,82.5",
  "zero kilograms leaves the line alone",
);

console.log("track line ok");
