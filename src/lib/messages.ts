export const OPEN_VIA_BOT = "Открой приложение в Telegram.";
export const LOAD_FAILED = "Не загрузилось.";
export const CHECK_FIELDS = "Проверь поля.";
export const CHECK_DATE = "Проверь дату.";
export const NOT_FOUND = "Запись не найдена.";
export const FOODS_EMPTY =
  "Пока пусто. Добавь продукты — из них соберёшь день.";
export const DAY_EXISTS_REPLACE = "Заменить день?";
export const MEAL_EXISTS_REPLACE = "Заменить приём?";

export function switchRestToTrainingMessage(input: {
  isToday: boolean;
  swapMeals: boolean;
}): string {
  const prefix = input.isToday
    ? "Сейчас это день отдыха."
    : "Этот день записан как день отдыха.";
  const suffix = input.swapMeals
    ? "Приёмы пищи подставятся из шаблона тренировки."
    : "Цели поменяются, записанная еда останется.";
  return `${prefix} Сделать его тренировочным? ${suffix}`;
}
export const YESTERDAY_MISSING = "Вчера пусто.";
export const YESTERDAY_MEAL_EMPTY = "Вчера этот приём пустой.";
export const SOURCE_MEAL_EMPTY = "В выбранный день этот приём пустой.";
export const PAST_DAY_LOCKED = "Это старый день — уже не меняется.";
export const NAMED_MEAL_EMPTY = "Сначала добавь продукты.";
export const NAMED_MEAL_LIMIT = "Слишком много сохранённых приёмов.";
export const BOT_START = `Yeah buddy! 👟
Это дневник еды и тренировок.

Записывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.

Погнали 🔥`;
export const BOT_OPEN_DIARY = "Открыть дневник";
export const BOT_REMINDER_FOOD = "День еды пустой. Холодильник сам не запишет.";
export const BOT_YEAH_BUDDY = "Yeah buddy.";

export function botReminderGym(name: string): string {
  return `Сегодня ${name}.`;
}
export const EXERCISES_EMPTY = "Пока пусто. Добавь упражнение.";
export const WORKOUTS_NEED_EXERCISES = "Сначала добавь упражнения.";
export const WORKOUTS_NEED_TEMPLATES =
  "Программа пустая. Поставь готовую или собери тренировку сам.";
export const WORKOUT_TEMPLATE_EMPTY =
  "В этой тренировке нет упражнений с планом подходов. Добавь их в программе.";
export const NEED_ALL_WORKING_WEIGHTS = "Нужен 1ПМ у каждого упражнения.";
export const NEED_CYCLE_PHASES = "Сначала выбери этапы.";
export const CYCLE_RAISE_LATER =
  "Идёт цикл: вес растёт на смене недели, а не после одной тренировки.";
export const WORKOUT_NOT_FOUND = "Тренировка не найдена.";
export const SESSION_HISTORY_EMPTY =
  "Пока пусто. Здесь появятся сделанные тренировки.";
export const NUTRITION_HISTORY_EMPTY =
  "Пока пусто. Здесь появятся дни с записанной едой.";
export const WEEK_EMPTY =
  "Пока пусто. Запиши еду или тренировку — день появится здесь.";
export const WEEK_NO_FOOD = "еды нет";
export const WEEK_NO_GYM = "зала нет";
export const SESSION_PLAN_EMPTY =
  "Нет веса для плана. Напиши 1ПМ или первый кг — прямо здесь.";
export const TEMPLATE_MEAL_HIDDEN = "Этот приём в такой день скрыт.";
export const AI_REVIEW_EMPTY = "Пока мало записей, чтобы разобрать.";
export const AI_REVIEW_NO_KEY = "Пока недоступно.";
export const AI_REVIEW_FAILED = "Не получилось разобрать.";
export const AI_PLATE_FAILED = "Не получилось разобрать.";
export const AI_PLATE_EMPTY = "На фото не видно еды.";
export const AI_PLATE_PHOTO_FAILED = "Не получилось прочитать фото.";
export const AI_PLATE_RETRY = "Ещё раз";
export const REVIEW_CTA_HINT = "Еда, зал и вес за эти дни";
export const PACK_NOT_FOUND = "Ссылка уже не работает.";
export const PACK_LIMIT = "Слишком много сохранённых. Убери старые.";
export const PACK_EMPTY_MEALS = "Сначала собери еду на день.";
export const PACK_EMPTY_WORKOUTS = "Сначала поставь тренировки в программу.";
export const ACCOUNT_DELETE_CONFIRM =
  "Удалить дневник навсегда? Еда, зал и ссылки для друзей пропадут. Это нельзя отменить.";

export function readApiError(data: unknown): string | null {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return null;
}
