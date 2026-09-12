import {
  chromeBottomShift,
  extraBottomGap,
  isKeyboardOpen,
  keyboardOverlayInset,
} from "@/lib/telegram/viewport";

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
assertEqual(
  isKeyboardOpen(400, { stableHeight: 640 }),
  true,
  "Telegram keyboard is shorter than stable height",
);
assertEqual(
  isKeyboardOpen(640, { stableHeight: 640 }),
  false,
  "collapsed Mini App without keyboard is not open",
);
assertEqual(
  isKeyboardOpen(818, { stableHeight: 852 }),
  false,
  "home indicator is not a keyboard",
);
assertEqual(
  isKeyboardOpen(500, { baselineHeight: 800 }),
  true,
  "browser keyboard vs remembered visual height",
);
assertEqual(
  isKeyboardOpen(800, { baselineHeight: 800 }),
  false,
  "full visual height is not a keyboard",
);
assertEqual(keyboardOverlayInset(852, 400), 452, "keyboard overlay lift");
assertEqual(
  keyboardOverlayInset(852, 818),
  0,
  "home indicator is not an overlay lift",
);

console.log("telegram viewport ok");
