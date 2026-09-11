import {
  NAMED_MEAL_EMPTY,
  NAMED_MEAL_LIMIT as NAMED_MEAL_LIMIT_MSG,
} from "@/lib/messages";

export class NamedMealEmptyError extends Error {
  constructor() {
    super(NAMED_MEAL_EMPTY);
  }
}

export class NamedMealLimitError extends Error {
  constructor() {
    super(NAMED_MEAL_LIMIT_MSG);
  }
}

export class NamedMealNotFoundError extends Error {
  constructor() {
    super("Сохранённый приём не найден.");
  }
}
