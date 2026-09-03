export const OPEN_VIA_BOT = "Откройте приложение через Telegram-бота.";
export const LOAD_FAILED = "Не удалось загрузить данные.";
export const FOODS_EMPTY = "Продукты пока не добавлены.";
export const TODAY_EMPTY =
  "Сегодня нет записей. Создайте день отдыха или тренировочный день.";
export const DAY_EXISTS_REPLACE =
  "Сегодняшний день уже существует. Заменить его копией вчерашнего?";
export const YESTERDAY_MISSING = "Вчерашнего дня нет.";

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
