import {
  FAVORITE_FOODS,
  STARTER_FOODS,
  STARTER_MEAL_TEMPLATES,
} from "@/lib/starter-foods";
import {
  STARTER_EXERCISES,
  STARTER_WORKOUT_TEMPLATES,
} from "@/lib/workout/starter-exercises";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueNames(names: string[], label: string): Set<string> {
  const seen = new Set<string>();
  for (const name of names) {
    assert(name.trim() === name && name.length > 0, `${label} blank: ${name}`);
    assert(!seen.has(name), `${label} duplicate: ${name}`);
    seen.add(name);
  }
  return seen;
}

const foodNames = uniqueNames(
  STARTER_FOODS.map((food) => food.name),
  "starter food",
);

for (const name of FAVORITE_FOODS) {
  assert(foodNames.has(name), `favorite missing from catalog: ${name}`);
}

for (const food of STARTER_FOODS) {
  assert(food.default_portion_g > 0, `portion g: ${food.name}`);
  assert(
    food.default_portion_label.startsWith(`${food.default_portion_g} `),
    `portion label: ${food.name}`,
  );
}

for (const template of STARTER_MEAL_TEMPLATES) {
  assert(template.items.length > 0, `empty meal template: ${template.name}`);
  for (const item of template.items) {
    assert(
      foodNames.has(item.foodName),
      `${template.name} unknown food: ${item.foodName}`,
    );
    assert(item.grams > 0, `${template.name} grams: ${item.foodName}`);
  }
}

uniqueNames(
  STARTER_EXERCISES.map((exercise) => exercise.name),
  "starter exercise",
);

const workoutSlots = new Set(STARTER_WORKOUT_TEMPLATES.map((row) => row.slot));
assert(workoutSlots.has("a"), "workout templates missing slot a");
assert(workoutSlots.has("b"), "workout templates missing slot b");
assert(workoutSlots.has("c"), "workout templates missing slot c");

console.log("starter catalog ok");
