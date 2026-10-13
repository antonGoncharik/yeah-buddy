import { pluralDays, pluralSets } from "@/lib/i18n/plural";

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

console.log("i18n plural ok");
