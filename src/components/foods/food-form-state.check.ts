import { toFormState, toPayload } from "@/components/foods/food-form-state";
import type { Food } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const food: Food = {
  id: "f1",
  user_id: "u1",
  name: "Овсянка",
  brand: "Myllyn Paras",
  state: "dry",
  protein_per_100: 13,
  fat_per_100: 6,
  carbs_per_100: 62,
  kcal_per_100: 370,
  default_portion_g: 50,
  default_portion_label: null,
  yield_from_g: 50,
  yield_to_g: 150,
  is_favorite: true,
  notes: "hidden",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const form = toFormState(food);
assertEqual(form.state, "dry", "form keeps state");
assertEqual(form.yield_from_g, "50", "form keeps yield from");
assertEqual(form.yield_to_g, "150", "form keeps yield to");
assertEqual(form.brand, "Myllyn Paras", "brand stays in state");

const created = toFormState();
assertEqual(created.state, "as_is", "new food defaults as_is");

const payload = toPayload(
  {
    ...form,
    brand: "Myllyn Paras",
    notes: "hidden",
  },
  370,
);
assertEqual(payload?.state, "dry", "payload sends state");
assertEqual(payload?.yield_from_g, 50, "payload sends yield from");
assertEqual(payload?.yield_to_g, 150, "payload sends yield to");
assertEqual(payload?.brand, "Myllyn Paras", "payload keeps hidden brand");

assertEqual(
  toPayload({ ...form, yield_to_g: "" }, 370),
  null,
  "incomplete yield rejected",
);

console.log("food form state ok");
