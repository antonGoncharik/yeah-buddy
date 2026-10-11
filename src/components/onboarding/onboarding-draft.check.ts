import {
  emptyLiftAnswers,
  optionalBirthYear,
  optionalHeightCm,
  parseLiftKg,
  proteinValid,
  weightAfterSexPick,
  weightDraftOk,
  weightValid,
} from "@/components/onboarding/onboarding-draft";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(weightValid(null), false, "missing weight");
assertEqual(weightValid(29), false, "weight below floor");
assertEqual(weightValid(30), true, "weight floor");
assertEqual(weightValid(250), true, "weight ceiling");
assertEqual(weightValid(251), false, "weight above ceiling");

assertEqual(proteinValid(0), false, "zero protein");
assertEqual(proteinValid(1), true, "protein floor");
assertEqual(proteinValid(400), true, "protein ceiling");
assertEqual(proteinValid(401), false, "protein above ceiling");

assertEqual(weightDraftOk(""), false, "empty weight draft");
assertEqual(weightDraftOk("80"), true, "plain weight draft");
assertEqual(weightDraftOk("12"), false, "short weight draft");

assertEqual(weightAfterSexPick("female", ""), "60", "empty weight follows sex");
assertEqual(
  weightAfterSexPick("female", "80"),
  "60",
  "preset weight follows sex",
);
assertEqual(weightAfterSexPick("male", "72.5"), "72.5", "custom weight stays");

assertEqual(parseLiftKg(null), null, "missing lift");
assertEqual(parseLiftKg("  "), null, "blank lift");
assertEqual(parseLiftKg("0"), null, "zero lift");
assertEqual(parseLiftKg("100"), 100, "lift kg");
assertEqual(parseLiftKg("501"), null, "lift above ceiling");
assertEqual(
  emptyLiftAnswers(),
  { squat: "", bench: "", deadlift: "" },
  "empty lifts",
);

assertEqual(optionalHeightCm(""), { ok: true, cm: null }, "skipped height");
assertEqual(optionalHeightCm("180"), { ok: true, cm: 180 }, "height ok");
assertEqual(optionalHeightCm("119"), { ok: false, cm: null }, "short height");
assertEqual(optionalBirthYear(""), { ok: true, year: null }, "skipped year");
assertEqual(optionalBirthYear("1990"), { ok: true, year: 1990 }, "year ok");
assertEqual(
  optionalBirthYear("1939"),
  { ok: false, year: null },
  "year too early",
);
