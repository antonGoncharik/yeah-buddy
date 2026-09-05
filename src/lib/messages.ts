export const OPEN_VIA_BOT = "Откройте приложение через Telegram-бота.";
export const LOAD_FAILED = "Не удалось загрузить данные.";
export const FOODS_EMPTY = "Продуктов пока нет.";
export const TODAY_EMPTY = "Еды ещё нет. Отметь день — отдых или как в зале.";
export const TODAY_EMPTY_GYM =
  "Идёшь в зал — поставь тренировочный день. БЖУ сразу как в зале.";
export const DAY_EMPTY = "В этот день нет еды. Отдых или как в зале?";
export const DAY_EXISTS_REPLACE =
  "В этом дне уже есть записи. Заменить предыдущим днём?";
export const YESTERDAY_MISSING = "Вчерашнего дня нет.";
export const BOT_START =
  "Привет! Это дневник питания и тренировок.\n\nПродукты, приёмы пищи, БЖУ за день и зал — в одном месте.";
export const BOT_OPEN_DIARY = "Открыть дневник";
export const EXERCISES_EMPTY = "Добавьте упражнение и максимум.";
export const EXERCISES_ARCHIVED_EMPTY = "В архиве пусто.";
export const WORKOUTS_NEED_EXERCISES =
  "Сначала упражнения и рабочие максимумы — от них считаются веса.";
export const WORKOUTS_NEED_TEMPLATES =
  "Собери очередь: какие тренировки идут по кругу.";

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
