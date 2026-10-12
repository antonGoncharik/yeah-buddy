import { pluralDays } from "@/lib/i18n/plural";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(pluralDays(1) === "день", "one day");
assert(pluralDays(3) === "дня", "few days");
assert(pluralDays(5) === "дней", "many days");
assert(pluralDays(11) === "дней", "eleven days");

console.log("i18n plural ok");
