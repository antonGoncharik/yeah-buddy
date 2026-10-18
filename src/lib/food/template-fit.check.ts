import { STARTER_FOODS } from "@/lib/food/starter";
import {
  reviewVisibleTemplate,
  reviewVisibleTemplates,
} from "@/lib/food/template-audit";
import {
  type FitItem,
  fitTemplateItems,
  inferRationRole,
  visibleTemplateFitItems,
} from "@/lib/food/template-fit";
import {
  calcMacrosFromPer100,
  type Macros,
  roundMacros,
} from "@/lib/nutrition";
import type {
  DayType,
  Food,
  MealTemplateDetail,
  MealTemplateItemView,
  MealType,
} from "@/lib/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function per100(name: string): Macros {
  const food = STARTER_FOODS.find((row) => row.name === name);
  if (!food) {
    throw new Error(name);
  }
  return {
    protein: food.protein_per_100,
    fat: food.fat_per_100,
    carbs: food.carbs_per_100,
    kcal: food.kcal_per_100,
  };
}

const roles: Array<[string, ReturnType<typeof inferRationRole>]> = [
  ["Куриное филе сырое", "protein"],
  ["Яйца куриные", "protein"],
  ["Творог 5%", "protein"],
  ["Творог 9%", "protein"],
  ["Лосось сырой", "protein"],
  ["Протеин сывороточный", "protein"],
  ["Овсянка сухая", "carb"],
  ["Рис сухой", "carb"],
  ["Картофель варёный", "carb"],
  ["Банан", "carb"],
  ["Мёд", "carb"],
  ["Яблоко", "anchor"],
  ["Молоко 2.5%", "anchor"],
  ["Огурец", "anchor"],
  ["Пельмени", "anchor"],
  ["Оливковое масло", "fat"],
  ["Грецкий орех", "fat"],
  ["Арахисовая паста", "fat"],
  ["Сыр твёрдый", "fat"],
  ["Авокадо", "fat"],
];

for (const [name, role] of roles) {
  assert(inferRationRole(per100(name)) === role, `${name} is ${role}`);
}

function line(
  id: string,
  mealType: MealType,
  name: string,
  grams: number,
): FitItem {
  return { id, mealType, name, grams, per100: per100(name) };
}

const shortTarget: Macros = { protein: 160, fat: 60, carbs: 220, kcal: 2000 };
const fitted = fitTemplateItems(
  [
    line("chicken", "lunch", "Куриное филе сырое", 150),
    line("rice", "lunch", "Рис сухой", 70),
    line("oil", "lunch", "Оливковое масло", 10),
    line("apple", "snack", "Яблоко", 150),
  ],
  shortTarget,
);
assert(fitted.changed, "short day can be fitted");
const chicken = fitted.grams.find((row) => row.id === "chicken");
const rice = fitted.grams.find((row) => row.id === "rice");
const oil = fitted.grams.find((row) => row.id === "oil");
const apple = fitted.grams.find((row) => row.id === "apple");
assert(chicken != null && chicken.grams > 200, "chicken grows toward protein");
assert(rice != null && rice.grams > 70, "rice grows toward carbs");
assert(oil != null && oil.grams <= 25, "oil stays capped");
assert(apple != null && apple.grams === 150, "apple portion stays");

const proteinAfter =
  (per100("Куриное филе сырое").protein * (chicken?.grams ?? 0)) / 100;
assert(proteinAfter > 100, "fitted chicken carries the protein");

const apples = fitTemplateItems(
  [line("apple", "snack", "Яблоко", 150)],
  shortTarget,
);
assert(!apples.changed, "anchor alone is not scaled");

const close = reviewVisibleTemplate(
  day("rest", [
    portion("eggs", "breakfast", "Яйца куриные", 150),
    portion("rice", "lunch", "Рис сухой", 40),
    portion("oil", "lunch", "Оливковое масло", 10),
  ]),
  goals(25, 30, 35, 25, 30, 35),
);
assert(
  close.lines.some((row) => row.includes("Близко к цели")),
  "close day stays quiet",
);
assert(!close.canFit, "close day does not offer a fit");

const hungry = reviewVisibleTemplate(
  day("training", [portion("apple", "lunch", "Яблоко", 150)]),
  goals(160, 60, 200, 180, 60, 250),
);
assert(
  hungry.lines.some((row) => row.includes("белок не добрать")),
  "no protein lever is named",
);
assert(!hungry.canFit, "nothing to scale");

const scalable = reviewVisibleTemplate(
  day("training", [
    portion("chicken", "lunch", "Куриное филе сырое", 150),
    portion("rice", "lunch", "Рис сухой", 70),
    portion("oil", "dinner", "Оливковое масло", 10),
  ]),
  goals(120, 50, 180, 180, 60, 280),
);
assert(scalable.canFit, "own foods can be fitted");
assert(
  scalable.lines.some((row) => row.includes("не хватает")),
  "gap is spelled out",
);

const clump = reviewVisibleTemplate(
  day("rest", [
    portion("eggs", "breakfast", "Яйца куриные", 50),
    portion("chicken", "dinner", "Куриное филе сырое", 400),
    portion("oil", "dinner", "Оливковое масло", 15),
  ]),
  goals(100, 20, 20, 100, 20, 20),
);
assert(
  clump.lines.some((row) => row.includes("ужин") && row.includes("завтрак")),
  "protein clump names both meals",
);

const beforeGym = reviewVisibleTemplate(
  day("training", [
    portion("butter", "pre_workout", "Арахисовая паста", 40),
    portion("chicken", "dinner", "Куриное филе сырое", 200),
    portion("rice", "dinner", "Рис сухой", 80),
  ]),
  goals(50, 20, 70, 50, 25, 70),
);
assert(
  beforeGym.lines.some((row) => row.includes("До тренировки")),
  "pre-workout fat is called out",
);

const pair = reviewVisibleTemplates(
  [
    day("rest", [portion("rice", "lunch", "Рис сухой", 200)]),
    day("training", [portion("rice", "lunch", "Рис сухой", 40)]),
  ],
  goals(20, 10, 140, 20, 10, 250),
  true,
);
assert(
  pair.lines.some((row) => row.includes("В зал должно уходить больше")),
  "training carbs below rest are flagged",
);

const hidden = reviewVisibleTemplate(
  day("training", [
    portion("chicken", "snack", "Куриное филе сырое", 800),
    portion("apple", "lunch", "Яблоко", 150),
  ]),
  goals(160, 60, 200, 180, 60, 250),
);
assert(
  hidden.lines.some((row) => row.includes("белок не добрать")),
  "hidden snack does not count as the training day",
);
assert(
  !visibleTemplateFitItems(
    day("training", [portion("chicken", "snack", "Куриное филе сырое", 800)]),
  ).some((item) => item.id === "chicken"),
  "training snack is not fitted",
);

const foodOnly = reviewVisibleTemplates(
  [
    day("rest", []),
    day("training", [portion("apple", "lunch", "Яблоко", 150)]),
  ],
  goals(120, 60, 200, 120, 60, 200),
  false,
);
assert(
  foodOnly.lines.every((row) => !row.includes("трениров")),
  "gym off skips the training template",
);

console.log("template fit ok");

function goals(
  restProtein: number,
  restFat: number,
  restCarbs: number,
  trainingProtein: number,
  trainingFat: number,
  trainingCarbs: number,
) {
  return {
    rest_protein: restProtein,
    rest_fat: restFat,
    rest_carbs: restCarbs,
    training_protein: trainingProtein,
    training_fat: trainingFat,
    training_carbs: trainingCarbs,
  };
}

function day(
  dayType: DayType,
  items: MealTemplateItemView[],
): MealTemplateDetail {
  return {
    id: dayType,
    user_id: "u",
    name: dayType,
    day_type: dayType,
    is_active: true,
    created_at: "",
    updated_at: "",
    items,
  };
}

function portion(
  id: string,
  mealType: MealType,
  name: string,
  grams: number,
): MealTemplateItemView {
  const starter = STARTER_FOODS.find((row) => row.name === name);
  if (!starter) {
    throw new Error(name);
  }
  const macros = roundMacros(
    calcMacrosFromPer100(
      {
        protein: starter.protein_per_100,
        fat: starter.fat_per_100,
        carbs: starter.carbs_per_100,
        kcal: starter.kcal_per_100,
      },
      grams,
    ),
  );
  const food: Food = {
    id,
    user_id: "u",
    name: starter.name,
    brand: null,
    state: starter.state,
    protein_per_100: starter.protein_per_100,
    fat_per_100: starter.fat_per_100,
    carbs_per_100: starter.carbs_per_100,
    kcal_per_100: starter.kcal_per_100,
    default_portion_g: starter.default_portion_g,
    default_portion_label: starter.default_portion_label,
    yield_from_g: starter.yield_from_g ?? null,
    yield_to_g: starter.yield_to_g ?? null,
    is_favorite: false,
    barcode: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };
  return {
    id,
    user_id: "u",
    template_id: "t",
    meal_type: mealType,
    food_id: id,
    grams,
    sort_order: 1,
    created_at: "",
    food,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}
