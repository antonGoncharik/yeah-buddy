import { PACK_EMPTY_MEALS, PACK_EMPTY_WORKOUTS } from "@/lib/messages";
import {
  buildMealsPayload,
  buildWorkoutsPayload,
  defaultMealsTitle,
  foodMatchKey,
  formulaHint,
  PackEmptyError,
  packShareText,
  parseSharePayload,
} from "@/lib/share/payload";
import { createPackToken, isPackToken } from "@/lib/share/token";
import type {
  Food,
  MealTemplateDetail,
  UserSettings,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const token = createPackToken();
assert(token.length === 12, "token length");
assert(isPackToken(token), "token charset");
assert(!isPackToken("bad token"), "token rejects space");
assert(!isPackToken("short"), "token rejects short");

assert(
  foodMatchKey({
    name: "Творог 5%",
    state: "as_is",
    protein_per_100: 17,
    fat_per_100: 5,
    carbs_per_100: 2,
  }) ===
    foodMatchKey({
      name: "творог 5%",
      state: "as_is",
      protein_per_100: 17,
      fat_per_100: 5,
      carbs_per_100: 2,
    }),
  "food key ignores case",
);

assert(
  foodMatchKey({
    name: "Творог 5%",
    state: "as_is",
    protein_per_100: 17,
    fat_per_100: 5,
    carbs_per_100: 2,
  }) !==
    foodMatchKey({
      name: "Творог 5%",
      state: "as_is",
      protein_per_100: 16,
      fat_per_100: 5,
      carbs_per_100: 2,
    }),
  "food key keeps macros",
);

const settings: UserSettings = {
  user_id: "u1",
  rest_protein: 120,
  rest_fat: 70,
  rest_carbs: 200,
  training_protein: 120,
  training_fat: 70,
  training_carbs: 250,
  onboarding_completed_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const food: Food = {
  id: "f1",
  user_id: "u1",
  name: "Творог 5%",
  brand: null,
  state: "as_is",
  protein_per_100: 17,
  fat_per_100: 5,
  carbs_per_100: 2,
  kcal_per_100: 121,
  default_portion_g: 150,
  default_portion_label: "150 г",
  is_favorite: true,
  notes: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const emptyRest: MealTemplateDetail = {
  id: "t-rest",
  user_id: "u1",
  name: "День отдыха",
  day_type: "rest",
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  items: [],
};

const emptyTraining: MealTemplateDetail = {
  ...emptyRest,
  id: "t-train",
  name: "День тренировки",
  day_type: "training",
};

try {
  buildMealsPayload(settings, [emptyRest, emptyTraining]);
  throw new Error("empty meals should fail");
} catch (error) {
  assert(error instanceof PackEmptyError, "empty meals type");
  assert(
    error instanceof Error && error.message === PACK_EMPTY_MEALS,
    "empty meals text",
  );
}

const filledRest: MealTemplateDetail = {
  ...emptyRest,
  items: [
    {
      id: "i1",
      user_id: "u1",
      template_id: "t-rest",
      meal_type: "breakfast",
      food_id: "f1",
      grams: 150,
      sort_order: 10,
      created_at: "2026-01-01",
      food,
      protein: 25.5,
      fat: 7.5,
      carbs: 3,
      kcal: 181.5,
    },
  ],
};

const meals = buildMealsPayload(settings, [filledRest, emptyTraining]);
assert(meals.foods.length === 1, "meals foods");
assert(meals.templates[0]?.items.length === 1, "rest item kept");
assert(meals.templates[1]?.items.length === 0, "training may be empty");
assert(parseSharePayload("meals", meals) != null, "meals payload parses");
assert(defaultMealsTitle(meals).includes("ккал"), "meals title has kcal");
assert(
  packShareText("meals", defaultMealsTitle(meals)) ===
    `${defaultMealsTitle(meals)} — Yeah Buddy`,
  "share text uses meals title",
);
assert(
  packShareText("workouts", "  Тело A / Тело B  ") ===
    "Тело A / Тело B — Yeah Buddy",
  "share text trims workout title",
);
assert(
  packShareText("meals", "  ") === "Еда на день из Yeah Buddy",
  "share text meals fallback",
);
assert(
  packShareText("workouts") === "Тренировки из Yeah Buddy",
  "share text workouts fallback",
);

const emptyWorkouts = buildWorkoutsPayloadFail();
assert(emptyWorkouts === PACK_EMPTY_WORKOUTS, "empty workouts text");

const squat: WorkoutTemplateDetail["exercises"][number] = {
  id: "e1",
  user_id: "u1",
  name: "Приседания со штангой",
  short_name: "Присед",
  category: "base",
  workout_type: "dynamic",
  unit: "reps",
  weight_step: 2.5,
  formula_preset: "barbell",
  slot: null,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  archived_at: null,
};

const workouts = buildWorkoutsPayload(
  {
    user_id: "u1",
    max_increase_percent: 5,
    formulas: DEFAULT_WORKOUT_FORMULAS,
    skip_template_ids: [],
    updated_at: "2026-01-01",
  },
  [
    {
      id: "w1",
      user_id: "u1",
      name: "Сила A",
      kind: "dynamic",
      sort_order: 10,
      is_active: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      exercises: [squat],
    },
    {
      id: "w2",
      user_id: "u1",
      name: "Черновик",
      kind: "dynamic",
      sort_order: 20,
      is_active: false,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
      exercises: [squat],
    },
  ],
);

assert(workouts.templates.length === 1, "only active circle");
assert(workouts.templates[0]?.name === "Сила A", "active day name");
assert(workouts.exercises.length === 1, "exercise snapshot");
assert(
  parseSharePayload("workouts", workouts) != null,
  "workouts payload parses",
);
assert(formulaHint(DEFAULT_WORKOUT_FORMULAS) === "3×5", "3x5 hint");

function buildWorkoutsPayloadFail(): string {
  try {
    buildWorkoutsPayload(
      {
        user_id: "u1",
        max_increase_percent: 5,
        formulas: DEFAULT_WORKOUT_FORMULAS,
        skip_template_ids: [],
        updated_at: "2026-01-01",
      },
      [],
    );
    return "no-throw";
  } catch (error) {
    return error instanceof Error ? error.message : "unknown";
  }
}

console.log("share packs ok");
