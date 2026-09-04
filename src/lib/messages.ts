export const OPEN_VIA_BOT = "Откройте приложение через Telegram-бота.";
export const LOAD_FAILED = "Не удалось загрузить данные.";
export const FOODS_EMPTY = "Продукты пока не добавлены.";
export const TODAY_EMPTY =
  "Сегодня нет записей. Создайте день отдыха или тренировочный день.";
export const DAY_EXISTS_REPLACE =
  "Сегодняшний день уже существует. Заменить его копией вчерашнего?";
export const YESTERDAY_MISSING = "Вчерашнего дня нет.";
export const BOT_START =
  "Привет! Это дневник питания.\n\nЗдесь можно вести свои продукты, быстро добавлять приёмы пищи и видеть итог БЖУ за день.";
export const BOT_OPEN_DIARY = "Открыть дневник питания";
export const EXERCISES_EMPTY =
  "Упражнений пока нет. Добавьте упражнение и укажите начальный максимум.";
export const EXERCISES_ARCHIVED_EMPTY = "Архивных упражнений нет.";
export const WORKOUTS_NEED_EXERCISES =
  "Сначала добавьте упражнения — без них нельзя создать макроцикл.";
export const WORKOUTS_NEED_TEMPLATES =
  "Соберите шаблон тренировки — без него нечего начинать.";

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
