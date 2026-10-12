import { dayCountsAsFoodLogged } from "@/lib/nutrition/food-logged-day";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

assert(
  !dayCountsAsFoodLogged({ fact_kcal: 150, target_kcal: 2000 }),
  "light snack does not count",
);
assert(
  dayCountsAsFoodLogged({ fact_kcal: 1200, target_kcal: 2000 }),
  "half target counts",
);
assert(
  dayCountsAsFoodLogged({ fact_kcal: 900, target_kcal: 0 }),
  "800 floor counts",
);

console.log("food logged day ok");
