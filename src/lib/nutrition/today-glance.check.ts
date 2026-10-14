import { todayGlanceLine } from "@/lib/nutrition/today-glance";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

assertEqual(
  todayGlanceLine({
    protein: 0,
    kcal: 0,
    targetProtein: 160,
    targetKcal: 2000,
  }),
  null,
  "empty day",
);
assertEqual(
  todayGlanceLine({
    protein: 118,
    kcal: 1360,
    targetProtein: 160,
    targetKcal: 2000,
  }),
  "ещё 640 ккал · ещё 42 г белка",
  "remaining",
);
assertEqual(
  todayGlanceLine({
    protein: 160,
    kcal: 2200,
    targetProtein: 160,
    targetKcal: 2000,
  }),
  "перебор 200 ккал · белок закрыт",
  "over and closed",
);

console.log("today glance ok");
