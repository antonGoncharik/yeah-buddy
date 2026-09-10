import {
  FAVORITE_FOODS,
  STARTER_FOODS,
  STARTER_MEAL_TEMPLATES,
} from "@/lib/starter-foods";
import { FORMULA_SYSTEMS } from "@/lib/workout/default-formulas";
import {
  PROGRAM_PRESETS,
  unknownProgramExercises,
} from "@/lib/workout/program-presets";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

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

uniqueNames(
  PROGRAM_PRESETS.map((preset) => preset.id),
  "program preset id",
);
uniqueNames(
  PROGRAM_PRESETS.map((preset) => preset.name),
  "program preset name",
);

for (const preset of PROGRAM_PRESETS) {
  assert(preset.templates.length > 0, `empty program: ${preset.id}`);
  uniqueNames(
    preset.templates.map((day) => day.name),
    `${preset.id} day`,
  );
  for (const day of preset.templates) {
    assert(day.exercises.length > 0, `empty day: ${preset.id} ${day.name}`);
  }
}

const unknownProgram = unknownProgramExercises();
assert(
  unknownProgram.length === 0,
  `program preset unknown lifts: ${unknownProgram.join(", ")}`,
);

uniqueNames(
  FORMULA_SYSTEMS.map((system) => system.id),
  "formula system id",
);
for (const system of FORMULA_SYSTEMS) {
  for (const phase of ["ramp", "volume", "peak", "deload"] as const) {
    assert(
      system.formulas.dynamic[phase].work.length > 0,
      `${system.id} ${phase} has no work sets`,
    );
  }
}

console.log("starter catalog ok");
