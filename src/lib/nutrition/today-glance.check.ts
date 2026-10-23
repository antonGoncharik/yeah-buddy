import { todayGlance } from "@/lib/nutrition/today-glance";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  todayGlance({
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
    targetProtein: 160,
    targetFat: 70,
    targetCarbs: 200,
    targetKcal: 900,
  }),
  null,
  "empty day",
);
assertEqual(
  todayGlance({
    protein: 118,
    fat: 40,
    carbs: 150,
    kcal: 860,
    targetProtein: 160,
    targetFat: 70,
    targetCarbs: 200,
    targetKcal: 900,
  }),
  {
    kcal: "860 / 900 ккал",
    macros: "Б 118/160 · Ж 40/70 · У 150/200",
  },
  "eaten kcal and macros",
);
assertEqual(
  todayGlance({
    protein: 160,
    fat: 80,
    carbs: 210,
    kcal: 980,
    targetProtein: 160,
    targetFat: 70,
    targetCarbs: 200,
    targetKcal: 900,
  }),
  {
    kcal: "980 / 900 ккал",
    macros: "Б 160/160 · Ж 80/70 · У 210/200",
  },
  "over the targets still shows what was eaten",
);

console.log("today glance ok");
