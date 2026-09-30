import {
  isPublicBarbellSlug,
  PUBLIC_BARBELL_PATH,
  publicBarbellCard,
  publicBarbellUrl,
} from "@/lib/share/barbell-public";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(PUBLIC_BARBELL_PATH, "/p/barbell", "barbell path");
assertEqual(isPublicBarbellSlug("barbell"), true, "barbell slug");
assertEqual(isPublicBarbellSlug("5x5"), false, "program slug is not barbell");
assertEqual(
  publicBarbellUrl("https://yeahbuddy.app"),
  "https://yeahbuddy.app/p/barbell",
  "barbell url",
);
assertEqual(publicBarbellCard().path, PUBLIC_BARBELL_PATH, "card path");

console.log("barbell public ok");
