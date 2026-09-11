import type { DayType, FoodState, MealType } from "@/lib/types";

export interface StarterFood {
  name: string;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number;
  default_portion_label: string;
  yield_from_g?: number;
  yield_to_g?: number;
}

export interface StarterTemplateItem {
  mealType: MealType;
  foodName: string;
  grams: number;
}

export interface StarterMealTemplate {
  name: string;
  dayType: DayType;
  items: StarterTemplateItem[];
}

export const FAVORITE_FOODS = new Set([
  "Куриное филе сырое",
  "Яйца куриные",
  "Овсянка сухая",
  "Рис сухой",
  "Творог 5%",
  "Банан",
  "Яблоко",
  "Оливковое масло",
  "Молоко 2.5%",
]);

export const STARTER_FOODS: StarterFood[] = [
  {
    ...food("Куриное филе сырое", "raw", 23, 2, 0, 110, 150),
    yield_from_g: 150,
    yield_to_g: 110,
  },
  food("Яйца куриные", "as_is", 13, 11, 1, 155, 50, "1 шт"),
  food("Творог 5%", "as_is", 17, 5, 2, 121, 150),
  {
    ...food("Овсянка сухая", "dry", 13, 6, 62, 370, 50),
    yield_from_g: 50,
    yield_to_g: 150,
  },
  {
    ...food("Рис сухой", "dry", 7, 1, 78, 350, 70),
    yield_from_g: 70,
    yield_to_g: 210,
  },
  food("Гречка сухая", "dry", 13, 3, 62, 330, 70),
  food("Макароны сухие", "dry", 13, 2, 71, 350, 80),
  food("Картофель варёный", "cooked", 2, 0, 16, 80, 200),
  food("Банан", "as_is", 1, 0, 23, 96, 120, "1 шт"),
  food("Яблоко", "as_is", 0, 0, 14, 52, 150, "1 шт"),
  food("Хлеб пшеничный", "as_is", 8, 3, 50, 260, 40, "1 ломтик"),
  food("Оливковое масло", "liquid", 0, 100, 0, 900, 10),
  food("Молоко 2.5%", "liquid", 3, 3, 5, 52, 200),
  food("Индейка филе сырое", "raw", 24, 1, 0, 105, 150),
  food("Говядина постная сырая", "raw", 20, 8, 0, 152, 150),
  food("Треска сырая", "raw", 18, 1, 0, 81, 150),
  food("Йогурт натуральный", "as_is", 4, 3, 4, 59, 150),
  food("Кефир 1%", "liquid", 3, 1, 4, 37, 200),
  food("Чечевица сухая", "dry", 25, 1, 53, 321, 70),
  food("Хлеб ржаной", "as_is", 7, 1, 40, 201, 40, "1 ломтик"),
  food("Сливочное масло", "as_is", 1, 83, 1, 755, 10),
  food("Огурец", "as_is", 1, 0, 4, 20, 100),
  food("Помидор", "as_is", 1, 0, 4, 20, 120),
  food("Морковь", "as_is", 1, 0, 7, 32, 80),
  food("Апельсин", "as_is", 1, 0, 12, 52, 150, "1 шт"),
  food("Куриное бедро сырое", "raw", 18, 9, 0, 153, 150),
  food("Тунец в собственном соку", "as_is", 26, 1, 0, 113, 120),
  food("Творог 0%", "as_is", 18, 0, 2, 80, 150),
  food("Перловка сухая", "dry", 10, 1, 66, 313, 70),
  food("Рис варёный", "cooked", 3, 0, 28, 124, 200),
  food("Брокколи", "as_is", 3, 0, 7, 40, 150),
  food("Капуста белокочанная", "as_is", 2, 0, 5, 28, 100),
  food("Груша", "as_is", 0, 0, 15, 60, 160, "1 шт"),
  food("Грецкий орех", "as_is", 15, 65, 14, 701, 30),
  food("Мёд", "as_is", 0, 0, 82, 328, 20),
  food("Куриное филе варёное", "cooked", 30, 4, 0, 156, 150),
  food("Минтай сырой", "raw", 16, 1, 0, 73, 150),
  food("Лосось сырой", "raw", 20, 13, 0, 197, 150),
  food("Креветки", "as_is", 18, 1, 1, 85, 100),
  food("Творог 9%", "as_is", 17, 9, 2, 157, 150),
  food("Сыр твёрдый", "as_is", 26, 27, 0, 347, 30),
  food("Сметана 15%", "as_is", 3, 15, 3, 159, 30),
  food("Гречка варёная", "cooked", 4, 1, 21, 109, 200),
  food("Макароны варёные", "cooked", 4, 1, 25, 125, 200),
  food("Подсолнечное масло", "liquid", 0, 100, 0, 900, 10),
  food("Авокадо", "as_is", 2, 15, 9, 161, 100),
  food("Арахисовая паста", "as_is", 25, 50, 20, 630, 20),
  food("Миндаль", "as_is", 21, 50, 22, 622, 30),
  food("Перец болгарский", "as_is", 1, 0, 5, 24, 100),
  food("Кабачок", "as_is", 1, 0, 4, 20, 150),
  food("Лук репчатый", "as_is", 1, 0, 9, 40, 80),
  food("Шампиньоны", "as_is", 4, 1, 1, 29, 100),
  food("Томатная паста", "as_is", 5, 0, 16, 84, 20),
  food("Киви", "as_is", 1, 0, 15, 64, 80, "1 шт"),
  food("Клубника", "as_is", 1, 0, 8, 36, 150),
  food("Протеин сывороточный", "dry", 80, 5, 8, 397, 30),
];

export const STARTER_MEAL_TEMPLATES: StarterMealTemplate[] = [
  {
    name: "День отдыха",
    dayType: "rest",
    items: [
      { mealType: "breakfast", foodName: "Овсянка сухая", grams: 80 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Рис сухой", grams: 70 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 10 },
      { mealType: "snack", foodName: "Яблоко", grams: 150 },
      { mealType: "dinner", foodName: "Творог 5%", grams: 200 },
      { mealType: "dinner", foodName: "Банан", grams: 120 },
    ],
  },
  {
    name: "День тренировки",
    dayType: "training",
    items: [
      { mealType: "breakfast", foodName: "Овсянка сухая", grams: 80 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Рис сухой", grams: 90 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 10 },
      { mealType: "pre_workout", foodName: "Банан", grams: 120 },
      { mealType: "post_workout", foodName: "Молоко 2.5%", grams: 200 },
      { mealType: "dinner", foodName: "Творог 5%", grams: 200 },
      { mealType: "dinner", foodName: "Яблоко", grams: 150 },
    ],
  },
];

function food(
  name: string,
  state: FoodState,
  protein: number,
  fat: number,
  carbs: number,
  kcal: number,
  portionG: number,
  piece?: string,
): StarterFood {
  const unit = state === "liquid" ? "мл" : "г";
  const base = `${portionG} ${unit}`;
  return {
    name,
    state,
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100: kcal,
    default_portion_g: portionG,
    default_portion_label: piece ? `${base} = ${piece}` : base,
  };
}
