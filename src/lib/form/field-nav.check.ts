import {
  fieldScrollDelta,
  scrollSlackPx,
  visibleFieldBand,
} from "@/lib/form/field-nav";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const viewport = { height: 400, offsetTop: 100 };
const band = visibleFieldBand(viewport, null);

assertEqual(band.top, 116, "band starts a gap below the visual top");
assertEqual(band.bottom, 484, "band ends a gap above the visual bottom");

assertEqual(
  fieldScrollDelta({ top: 200, bottom: 240 }, band),
  0,
  "field inside the band stays put",
);
assertEqual(
  fieldScrollDelta({ top: 90, bottom: 130 }, band),
  -26,
  "field above the band scrolls down",
);
assertEqual(
  fieldScrollDelta({ top: 460, bottom: 520 }, band),
  36,
  "field under the keyboard scrolls up to the band edge",
);
assertEqual(
  fieldScrollDelta({ top: 148, bottom: 484 }, band),
  0,
  "field sitting on the band edge stays put",
);

const withChrome = visibleFieldBand(viewport, 420);
assertEqual(withChrome.bottom, 404, "bottom chrome lifts the band");
assertEqual(
  fieldScrollDelta({ top: 360, bottom: 420 }, withChrome),
  16,
  "field under the nav scrolls above it",
);

const tall = { top: 300, bottom: 900 };
assertEqual(
  fieldScrollDelta(tall, band),
  416,
  "tall field keeps its bottom on the band",
);
assertEqual(
  fieldScrollDelta({ top: 0, bottom: 484 }, band),
  0,
  "tall field already showing its bottom does not bounce",
);

assertEqual(scrollSlackPx(80, 30), 0, "existing room needs no spacer");
assertEqual(scrollSlackPx(10, 40), 30, "spacer covers the missing scroll");
assertEqual(scrollSlackPx(0, 0), 0, "no scroll needs no spacer");

console.log("field-nav ok");
