import { pluralDays, pluralExercises, pluralSets } from "@/lib/i18n/plural";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(pluralDays(1) === "день", "one day");
assert(pluralDays(3) === "дня", "few days");
assert(pluralDays(5) === "дней", "many days");
assert(pluralDays(11) === "дней", "eleven days");
assert(pluralSets(1) === "подход", "one set");
assert(pluralSets(2) === "подхода", "few sets");
assert(pluralSets(5) === "подходов", "many sets");
assert(pluralSets(11) === "подходов", "eleven sets");
assert(pluralSets(1.5) === "подхода", "fractional sets");
assert(pluralExercises(1) === "упражнение", "one exercise");
assert(pluralExercises(3) === "упражнения", "few exercises");
assert(pluralExercises(5) === "упражнений", "many exercises");
assert(pluralExercises(11) === "упражнений", "eleven exercises");
assert(pluralExercises(1.5) === "упражнения", "fractional exercises");

console.log("i18n plural ok");
