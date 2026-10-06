import {
  buildHabitBridgeSnapshot,
  inHabitBridgeWindow,
} from "@/lib/retention/habit-bridge";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(inHabitBridgeWindow(13), false, "still early habit");
assertEqual(inHabitBridgeWindow(14), true, "bridge starts");
assertEqual(inHabitBridgeWindow(29), true, "last bridge day");
assertEqual(inHabitBridgeWindow(30), false, "after bridge");

const snapshot = buildHabitBridgeSnapshot({
  today: "2026-10-06",
  recentDays: [
    {
      date: "2026-10-06",
      fact_protein: 120,
      target_protein: 120,
      fact_kcal: 2000,
      fact_fat: 60,
      fact_carbs: 200,
    },
    {
      date: "2026-10-05",
      fact_protein: 50,
      target_protein: 120,
      fact_kcal: 1500,
      fact_fat: 40,
      fact_carbs: 150,
    },
  ],
  gymSessionsWeek: 1,
  reviewReady: false,
});
assertEqual(snapshot.foodDaysWeek, 2, "two food days in week window");
assertEqual(snapshot.proteinHitDaysWeek, 1, "one protein hit");

console.log("habit bridge ok");
