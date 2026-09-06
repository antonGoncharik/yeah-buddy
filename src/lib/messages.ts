export const OPEN_VIA_BOT = "Откройте приложение через Telegram-бота.";
export const LOAD_FAILED = "Не удалось загрузить данные.";
export const FOODS_EMPTY = "Продуктов пока нет.";
export const DAY_EXISTS_REPLACE = "Заменить день?";
export const YESTERDAY_MISSING = "Вчера пусто.";
export const BOT_START =
  "Привет! Это дневник питания и тренировок.\n\nПродукты, приёмы пищи, БЖУ за день и зал — в одном месте.";
export const BOT_OPEN_DIARY = "Открыть дневник";
export const EXERCISES_EMPTY = "Добавьте упражнение и максимум.";
export const EXERCISES_ARCHIVED_EMPTY = "В архиве пусто.";
export const WORKOUTS_NEED_EXERCISES = "Добавь упражнения и максимумы.";
export const WORKOUTS_NEED_TEMPLATES = "Собери очередь тренировок.";
export const SESSION_HISTORY_EMPTY = "После зала появятся здесь.";
export const NUTRITION_HISTORY_EMPTY =
  "Дней питания ещё нет — они появятся после «Сегодня».";
export const TEMPLATE_MEAL_HIDDEN = "Этот приём не для такого дня.";

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
