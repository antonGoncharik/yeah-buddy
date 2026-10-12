import {
  ageInputFromBirthYear,
  ageYearsLabel,
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  BODY_AGE_DEFAULT,
  BODY_HEIGHT_FEMALE_CM,
  BODY_HEIGHT_MALE_CM,
  birthYearFromAge,
  bodyAgeOptions,
  defaultBodyHeightCm,
  explicitOrStored,
  parseAgeInput,
  parseHeightInput,
  profileAgeYears,
  profileHeightCm,
} from "@/lib/nutrition/body-profile";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const year = 2026;

assertEqual(
  defaultBodyHeightCm("female"),
  BODY_HEIGHT_FEMALE_CM,
  "female height",
);
assertEqual(defaultBodyHeightCm("male"), BODY_HEIGHT_MALE_CM, "male height");
assertEqual(
  defaultBodyHeightCm(null),
  BODY_HEIGHT_MALE_CM,
  "unknown sex height",
);

assertEqual(profileHeightCm("", "female"), 165, "empty height uses sex");
assertEqual(profileHeightCm("180.4", "male"), 180, "height rounds to cm");
assertEqual(profileHeightCm("10", "male"), 175, "invalid height uses default");

assertEqual(birthYearFromAge(30, year), 1996, "age 30 in 2026");
assertEqual(birthYearFromAge(11, year), BIRTH_YEAR_MAX, "youngest stored year");
assertEqual(birthYearFromAge(86, year), BIRTH_YEAR_MIN, "oldest stored year");
assertEqual(birthYearFromAge(10, year), null, "age 10 is outside 2015");
assertEqual(birthYearFromAge(87, year), null, "age 87 is before 1940");
assertEqual(birthYearFromAge(30.5, year), null, "fractional age");

assertEqual(profileAgeYears("", year), BODY_AGE_DEFAULT, "empty year is 30");
assertEqual(profileAgeYears("1990", year), 36, "1990 is 36 in 2026");
assertEqual(bodyAgeOptions(year)[0], 11, "wheel starts at 11");
assertEqual(bodyAgeOptions(year).at(-1), 86, "wheel ends at 86");

assertEqual(ageYearsLabel(1), "год", "1 год");
assertEqual(ageYearsLabel(2), "года", "2 года");
assertEqual(ageYearsLabel(5), "лет", "5 лет");
assertEqual(ageYearsLabel(11), "лет", "11 лет");
assertEqual(ageYearsLabel(21), "год", "21 год");
assertEqual(ageYearsLabel(22), "года", "22 года");
assertEqual(ageYearsLabel(25), "лет", "25 лет");

assertEqual(ageInputFromBirthYear(1990, year), "36", "settings shows age");
assertEqual(ageInputFromBirthYear(null, year), "", "missing year is blank");
assertEqual(parseAgeInput("", year), { ok: true, year: null }, "blank age");
assertEqual(parseAgeInput("36", year), { ok: true, year: 1990 }, "age 36");
assertEqual(parseAgeInput("3", year), { ok: false }, "age 3 rejected");
assertEqual(parseHeightInput(""), { ok: true, cm: null }, "blank height");
assertEqual(parseHeightInput("180"), { ok: true, cm: 180 }, "height 180");
assertEqual(parseHeightInput("119"), { ok: false }, "short height rejected");

assertEqual(explicitOrStored(undefined, 180), 180, "omitted stat stays");
assertEqual(explicitOrStored(null, 180), null, "skipped stat clears");
assertEqual(explicitOrStored(170, 180), 170, "chosen stat replaces");
