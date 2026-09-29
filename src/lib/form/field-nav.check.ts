import { fieldNeedsReveal } from "@/lib/form/field-nav";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const viewport = { height: 400, offsetTop: 100 };

assertEqual(
  fieldNeedsReveal({ top: 200, bottom: 240 }, viewport),
  false,
  "centered field fits the visual viewport",
);
assertEqual(
  fieldNeedsReveal({ top: 90, bottom: 130 }, viewport),
  true,
  "field above the visible band needs reveal",
);
assertEqual(
  fieldNeedsReveal({ top: 500, bottom: 540 }, viewport),
  true,
  "field below the visible band needs reveal",
);
assertEqual(
  fieldNeedsReveal({ top: 148, bottom: 188 }, viewport),
  false,
  "field on the margin edge still fits",
);

console.log("field-nav ok");
