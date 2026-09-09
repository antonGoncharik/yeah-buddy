import { chromeBottomShift, extraBottomGap } from "@/lib/telegram/viewport";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(chromeBottomShift(852, 852), 0, "fullscreen: no chrome shift");
assertEqual(
  chromeBottomShift(852, 640),
  212,
  "collapsed Mini App lifts chrome into the visible area",
);
assertEqual(
  chromeBottomShift(800, 0),
  0,
  "missing stable height does not shift",
);
assertEqual(extraBottomGap(852, 818), 34, "iPhone home indicator gap");
assertEqual(
  extraBottomGap(852, 852),
  0,
  "no leftover under the visual viewport",
);
assertEqual(
  extraBottomGap(852, 500),
  0,
  "keyboard-sized gaps are not a home indicator",
);

console.log("telegram viewport ok");

