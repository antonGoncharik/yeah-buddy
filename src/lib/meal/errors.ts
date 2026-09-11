import { TEMPLATE_MEAL_HIDDEN } from "@/lib/messages";

export class MealTemplateItemNotFoundError extends Error {
  constructor() {
    super("Запись не найдена.");
  }
}

export class TemplateMealHiddenError extends Error {
  constructor() {
    super(TEMPLATE_MEAL_HIDDEN);
  }
}

export class FoodNotFoundError extends Error {
  constructor() {
    super("Продукт не найден.");
  }
}
