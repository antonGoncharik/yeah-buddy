import {
  type DedupeFoodCandidate,
  foodNameKey,
  pickFoodKeeper,
  STARTER_FOOD_NAME_KEYS,
} from "@/lib/food/dedupe-foods";
import { STARTER_FOODS } from "@/lib/food/starter";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  STARTER_FOOD_NAME_KEYS.size === STARTER_FOODS.length,
  "starter name keys must cover every starter food",
);
assert(
  STARTER_FOOD_NAME_KEYS.has(foodNameKey("Куриное филе сырое")),
  "chicken full name is a starter key",
);
assert(
  !STARTER_FOOD_NAME_KEYS.has(foodNameKey("филе")),
  "a short fragment alone must not count as a starter key",
);

const base: Omit<
  DedupeFoodCandidate,
  | "id"
  | "in_template"
  | "in_meal"
  | "in_named_meal"
  | "is_favorite"
  | "created_at"
> = {
  name: "Куриное филе сырое",
};

const withTemplate = pickFoodKeeper([
  {
    ...base,
    id: "a",
    in_template: false,
    in_meal: true,
    in_named_meal: false,
    is_favorite: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    ...base,
    id: "b",
    in_template: true,
    in_meal: false,
    in_named_meal: false,
    is_favorite: false,
    created_at: "2026-01-02T00:00:00Z",
  },
]);
assert(withTemplate.id === "b", "prefer the food that is in a template");

const withMeal = pickFoodKeeper([
  {
    ...base,
    id: "a",
    in_template: false,
    in_meal: false,
    in_named_meal: true,
    is_favorite: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    ...base,
    id: "b",
    in_template: false,
    in_meal: true,
    in_named_meal: false,
    is_favorite: false,
    created_at: "2026-01-02T00:00:00Z",
  },
]);
assert(withMeal.id === "b", "prefer the food used in a day meal");

const withFavorite = pickFoodKeeper([
  {
    ...base,
    id: "a",
    in_template: false,
    in_meal: false,
    in_named_meal: false,
    is_favorite: false,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    ...base,
    id: "b",
    in_template: false,
    in_meal: false,
    in_named_meal: false,
    is_favorite: true,
    created_at: "2026-01-02T00:00:00Z",
  },
]);
assert(withFavorite.id === "b", "prefer the favorited copy when unused");

const older = pickFoodKeeper([
  {
    ...base,
    id: "newer",
    in_template: false,
    in_meal: false,
    in_named_meal: false,
    is_favorite: false,
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    ...base,
    id: "older",
    in_template: false,
    in_meal: false,
    in_named_meal: false,
    is_favorite: false,
    created_at: "2026-01-01T00:00:00Z",
  },
]);
assert(older.id === "older", "prefer the older row when ties remain");

console.log("dedupe foods ok");
