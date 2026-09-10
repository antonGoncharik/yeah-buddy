import { mapDayWithMeals, parseDayHistoryPayload } from "@/lib/day/map";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const item = {
  id: "item-1",
  user_id: "user-1",
  meal_id: "meal-1",
  food_id: "food-1",
  name_snapshot: "Овсянка",
  grams: 80,
  protein: 10,
  fat: 5,
  carbs: 50,
  kcal: 285,
  per_100_snapshot: { protein: 12.5, fat: 6.3, carbs: 62.5, kcal: 356 },
  created_at: "2026-09-09T08:00:00.000Z",
  updated_at: "2026-09-09T08:00:00.000Z",
};

const dayBase = {
  id: "day-1",
  user_id: "user-1",
  date: "2026-09-09T00:00:00.000Z",
  is_training_day: true,
  target_protein: 120,
  target_fat: 70,
  target_carbs: 250,
  target_kcal: 2110,
  notes: null,
  created_at: "2026-09-09T07:00:00.000Z",
  updated_at: "2026-09-09T07:00:00.000Z",
};

const fromSupabase = mapDayWithMeals({
  ...dayBase,
  meals: [
    {
      id: "meal-1",
      user_id: "user-1",
      day_id: "day-1",
      meal_type: "breakfast",
      sort_order: 1,
      created_at: "2026-09-09T07:00:00.000Z",
      meal_items: [item],
    },
  ],
});

assertEqual(fromSupabase.date, "2026-09-09", "date trimmed");
assertEqual(fromSupabase.meals[0]?.items.length, 1, "supabase meal_items");
assertEqual(fromSupabase.meals[0]?.items[0]?.name_snapshot, "Овсянка", "name");

const remapped = mapDayWithMeals(
  fromSupabase as unknown as Record<string, unknown>,
);
assertEqual(remapped.meals[0]?.items.length, 1, "already-mapped items kept");
assertEqual(remapped.meals[0]?.items[0]?.grams, 80, "grams after remap");

const history = parseDayHistoryPayload({
  date: "2026-09-09",
  is_training_day: true,
  target_protein: 120,
  fact_protein: 10,
  fact_kcal: 285,
});
assertEqual(history?.date, "2026-09-09", "history date");
assertEqual(history?.fact_protein, 10, "history protein");
assertEqual(history?.target_fat, 0, "missing target is 0");
assertEqual(parseDayHistoryPayload({}), null, "history without date");

console.log("day map ok");
