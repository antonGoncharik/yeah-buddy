export const OPEN_VIA_BOT = "Открой приложение через Telegram-бота.";
export const LOAD_FAILED = "Не удалось загрузить данные.";
export const FOODS_EMPTY = "Продуктов пока нет.";
export const DAY_EXISTS_REPLACE = "Заменить день?";
export const YESTERDAY_MISSING = "Вчера пусто.";
export const BOT_START =
  "Привет! Это дневник питания и тренировок.\n\nПродукты, приёмы пищи, БЖУ за день и зал — в одном месте.\n\nРазбор лога: /razbor";
export const BOT_OPEN_DIARY = "Открыть дневник";
export const BOT_REVIEW_NEED_APP = "Сначала открой дневник в приложении.";
export const EXERCISES_EMPTY =
  "Пока пусто. Добавь упражнение и сколько сейчас жмёшь.";
export const WORKOUTS_NEED_EXERCISES =
  "Сначала упражнения и максимумы — без них план весов не из чего считать.";
export const WORKOUTS_NEED_TEMPLATES =
  "Собери очередь: в каком порядке идут тренировки.";
export const SESSION_HISTORY_EMPTY =
  "Когда сделаешь тренировку, она появится здесь.";
export const NUTRITION_HISTORY_EMPTY =
  "Дней ещё нет. Появятся, когда заведёшь «Сегодня».";
export const SESSION_PLAN_EMPTY =
  "В план не попало ни одного упражнения: нет максимума или схема «не считается». Задай максимум, потом добавь упражнение сюда.";
export const TEMPLATE_MEAL_HIDDEN = "Этот приём не для такого дня.";
export const AI_REVIEW_EMPTY =
  "Мало записей. Нужно несколько дней еды или закрытых тренировок.";
export const AI_REVIEW_NO_KEY =
  "Текст от Gemini появится, когда в env будет ключ.";
export const AI_REVIEW_FAILED = "Не получилось написать разбор.";

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
