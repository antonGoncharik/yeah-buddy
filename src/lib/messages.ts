export const OPEN_VIA_BOT = "Открой приложение в Telegram.";
export const LOAD_FAILED = "Не загрузилось.";
export const CHECK_FIELDS = "Проверь поля.";
export const CHECK_DATE = "Проверь дату.";
export const NOT_FOUND = "Запись не найдена.";
export const FOODS_EMPTY = "Продуктов пока нет.";
export const DAY_EXISTS_REPLACE = "Заменить день?";
export const YESTERDAY_MISSING = "Вчера пусто.";
export const PAST_DAY_LOCKED = "Это старый день — уже не меняется.";
export const BOT_START = `Yeah buddy! 👟
Твой личный дневник еды и железа.

Всё просто: записывай, что съел и что поднял. Приложение само раскидает нагрузку от твоих рабочих весов, пока ты переводишь дыхание.
Меньше слов.

Погнали🔥`;
export const BOT_OPEN_DIARY = "Открыть дневник";
export const BOT_REMINDER_FOOD = "День еды пустой.";

export function botReminderGym(name: string): string {
  return `Сегодня ${name}.`;
}
export const EXERCISES_EMPTY = "Пока пусто. Добавь упражнение и рабочий вес.";
export const WORKOUTS_NEED_EXERCISES = "Сначала упражнения и рабочие веса.";
export const WORKOUTS_NEED_TEMPLATES =
  "Поставь программу или собери тренировку.";
export const WORKOUTS_NEED_MAXES = "Напиши рабочие веса.";
export const NEED_ALL_WORKING_WEIGHTS =
  "Нужен рабочий вес у каждого упражнения.";
export const NEED_CYCLE_PHASES = "Сначала этапы.";
export const WORKOUT_NOT_FOUND = "Тренировка не найдена.";
export const SESSION_HISTORY_EMPTY =
  "Когда сделаешь тренировку, она появится здесь.";
export const NUTRITION_HISTORY_EMPTY =
  "Дней ещё нет. Появятся, когда заведёшь «Сегодня».";
export const SESSION_PLAN_EMPTY =
  "Нет рабочего веса. Напиши его в упражнении и зайди ещё раз.";
export const TEMPLATE_MEAL_HIDDEN = "Этот приём не для такого дня.";
export const AI_REVIEW_EMPTY = "Пока мало записей.";
export const AI_REVIEW_NO_KEY = "Пока недоступно.";
export const AI_REVIEW_FAILED = "Не получилось написать.";
export const REVIEW_CTA_HINT = "Как прошло за эти дни";
export const PACK_NOT_FOUND = "Ссылка уже не работает.";
export const PACK_LIMIT = "Слишком много сохранённых. Убери старые.";
export const PACK_EMPTY_MEALS = "Сначала собери еду на день.";
export const PACK_EMPTY_WORKOUTS = "Сначала поставь тренировки в очередь.";

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
