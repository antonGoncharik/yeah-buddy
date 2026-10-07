import { shiftIsoDate } from "@/lib/day/dates";
import {
  repeatYesterdayMealLabel,
  yesterdayMealSource,
} from "@/lib/nutrition/meals";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  repeatYesterdayMealLabel("breakfast"),
  "Как вчера утром",
  "breakfast tap",
);
assertEqual(repeatYesterdayMealLabel("lunch"), "Как вчера в обед", "lunch tap");
assertEqual(
  repeatYesterdayMealLabel("dinner"),
  "Как вчера вечером",
  "dinner tap",
);

const today = "2026-10-08";
const yesterday = shiftIsoDate(today, -1);
assertEqual(
  yesterdayMealSource(today, "breakfast", [
    { date: yesterday, mealTypes: ["breakfast", "lunch"] },
  ]),
  yesterday,
  "empty breakfast can repeat yesterday morning",
);
assertEqual(
  yesterdayMealSource(today, "dinner", [
    { date: yesterday, mealTypes: ["breakfast"] },
  ]),
  null,
  "dinner stays quiet when yesterday had no dinner",
);
assertEqual(
  yesterdayMealSource(today, "breakfast", [
    { date: shiftIsoDate(today, -2), mealTypes: ["breakfast"] },
  ]),
  null,
  "the day before yesterday is not this tap",
);
assertEqual(
  yesterdayMealSource("nope", "breakfast", [
    { date: yesterday, mealTypes: ["breakfast"] },
  ]),
  null,
  "bad date",
);
assert(
  yesterdayMealSource(today, "pre_workout", [
    { date: yesterday, mealTypes: ["pre_workout"] },
  ]) === yesterday,
  "training slot repeats too",
);

console.log("repeat yesterday meal ok");
