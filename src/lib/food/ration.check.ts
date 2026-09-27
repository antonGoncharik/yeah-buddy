import {
  type FittedRationDay,
  previewRation,
  RATION_IDS,
  RATIONS,
} from "@/lib/food/ration";
import { isStarterMealTemplate, STARTER_FOODS } from "@/lib/food/starter";
import { isMealVisible } from "@/lib/nutrition";
import { suggestMacroGoals } from "@/lib/nutrition/suggest-protein";
import type { DayType, UserGoal, UserSex } from "@/lib/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const names = new Set(STARTER_FOODS.map((food) => food.name));

for (const preset of RATIONS) {
  assert(preset.days.length === 2, `${preset.id} has both days`);
  for (const day of preset.days) {
    assert(day.items.length > 0, `${preset.id} ${day.dayType} empty`);
    const training = day.dayType === "training";
    for (const item of day.items) {
      assert(names.has(item.foodName), `${preset.id} food ${item.foodName}`);
      assert(item.grams > 0, `${preset.id} grams ${item.foodName}`);
      assert(
        isMealVisible(item.mealType, training),
        `${preset.id} ${day.dayType} hides ${item.mealType}`,
      );
    }
    assert(
      day.items.some((item) => item.role === "protein"),
      `${preset.id} protein lever`,
    );
    assert(
      day.items.some((item) => item.role === "carb"),
      `${preset.id} carb lever`,
    );
    assert(
      day.items.some(
        (item) => item.role === "fat" && !item.foodName.includes("масло"),
      ),
      `${preset.id} has a fat food besides oil`,
    );
  }
}

const people: Array<{
  label: string;
  sex: UserSex;
  weightKg: number;
  goal: UserGoal;
}> = [
  { label: "55 кг сушка", sex: "female", weightKg: 55, goal: "lose" },
  { label: "80 кг держать", sex: "male", weightKg: 80, goal: "keep" },
  { label: "100 кг набор", sex: "male", weightKg: 100, goal: "gain" },
];

for (const person of people) {
  const goals = suggestMacroGoals(person);
  assert(goals != null, person.label);
  if (!goals) {
    continue;
  }
  for (const id of RATION_IDS) {
    const preview = previewRation(id, goals);
    assert(preview != null, `${person.label} ${id}`);
    if (!preview) {
      continue;
    }
    assertDay(preview.rest, "rest", goals.rest, `${person.label} ${id}`);
    assertDay(
      preview.training,
      "training",
      goals.training,
      `${person.label} ${id}`,
    );
  }
}

const keep = suggestMacroGoals({
  sex: "male",
  weightKg: 80,
  goal: "keep",
});
assert(keep != null, "80 кг goals");
if (keep) {
  const fitted = previewRation("usual", keep);
  assert(fitted != null, "usual preview");
  if (fitted) {
    assert(
      !isStarterMealTemplate({
        day_type: "rest",
        items: fitted.rest.items.map((item) => ({
          meal_type: item.mealType,
          grams: item.grams,
          food: { name: item.foodName },
        })),
      }),
      "fitted usual still fills a new day",
    );
  }
}

console.log("rations ok");

function assertDay(
  day: FittedRationDay,
  dayType: DayType,
  target: { protein: number; fat: number; carbs: number; kcal: number },
  label: string,
): void {
  assert(day.dayType === dayType, `${label} day type`);
  const proteinDelta = Math.abs(day.totals.protein - target.protein);
  const kcalPct =
    target.kcal > 0 ? Math.abs(day.totals.kcal - target.kcal) / target.kcal : 0;
  assert(
    proteinDelta <= 8,
    `${label} ${dayType} protein ${day.totals.protein} vs ${target.protein}`,
  );
  assert(
    kcalPct <= 0.08,
    `${label} ${dayType} kcal ${day.totals.kcal} vs ${target.kcal}`,
  );
  for (const item of day.items) {
    assert(
      item.grams >= 5 && item.grams <= 1000 && item.grams % 5 === 0,
      `${label} grams ${item.foodName} ${item.grams}`,
    );
    if (item.foodName.includes("масло")) {
      assert(item.grams <= 25, `${label} oil ${item.foodName} ${item.grams}`);
    }
  }
}
