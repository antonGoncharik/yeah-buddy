export const OPEN_VIA_BOT = "Открой приложение в Telegram.";
export const BOT_START = `Yeah buddy! 👟
Это дневник еды и тренировок.

Записывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.

Light weight. Погнали 🔥`;
export const OPEN_VIA_BOT_LEAD =
  "Дневник еды и зала в Telegram. Без регистрации.";
export const OPEN_VIA_BOT_CTA = "Открыть в Telegram";
export const OPEN_VIA_BOT_QR_CAPTION = "Наведи камеру — откроется бот.";
export const OPEN_VIA_BOT_POINTS = [
  {
    title: "Еда",
    body: "Свои продукты и каталог. Белок считается сам.",
  },
  {
    title: "Зал",
    body: "Программа, подходы, рабочий вес.",
  },
  {
    title: "Штрихкод",
    body: "Код с пачки — сразу в дневник.",
  },
] as const;
export const OPEN_VIA_BOT_STEPS_TITLE = "Как начать";
export const OPEN_VIA_BOT_STEPS = [
  {
    title: "Открой бота",
    body: "Кнопка или QR. Регистрации нет.",
  },
  {
    title: "Запиши день",
    body: "Еда в граммах, зал по программе.",
  },
  {
    title: "Вечером",
    body: "Одно сообщение: белок, калории, был ли зал.",
  },
] as const;
export const OPEN_VIA_BOT_NOTE = "В чат уходит только то, чем сам поделился.";
export const PROGRAM_SHELF_TITLE = "Программы";
export const PROGRAM_SHELF_LEAD = "Можно начать с готовой.";
export const PROGRAM_PAGE_BACK = "На главную";
export const PROGRAM_QR_CAPTION = "Наведи камеру — бот поставит эту программу.";
export const LOAD_FAILED = "Не загрузилось.";
export const CHECK_FIELDS = "Проверь поля.";
export const CHECK_DATE = "Проверь дату.";
export const NOT_FOUND = "Запись не найдена.";
export const FOODS_EMPTY =
  "Пока пусто. Добавь продукты — из них соберёшь день.";
export const STARTER_CATALOG_NOTE =
  "Обычные продукты на старте. Свой найдёшь по названию или штрихкоду. Лишние можно удалить.";
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
export const YESTERDAY_MISSING = "Вчера пусто. Нечего копировать.";
export const YESTERDAY_MEAL_EMPTY = "Вчера этот приём пустой.";
export const SOURCE_MEAL_EMPTY = "В выбранный день этот приём пустой.";
export const PAST_DAY_LOCKED = "Это старый день — уже не меняется.";
export const CATCH_UP_MARK = "догонял";
export const CATCH_UP_TITLE = "Догонял";
export const CATCH_UP_EMPTY_HINT =
  "День пустой. Можно догнать — в истории будет пометка «догонял».";
export const CATCH_UP_YESTERDAY_HINT = "Вчера пустой — можно догнать.";
export const EMPTY_START_REPEAT = "Вчера было так. Повторить.";
export const EMPTY_START_ADD = "Еды ещё нет. Добавь первое.";
export const DAY_TEMPLATE_EMPTY = "Нужен хотя бы один продукт из списка.";

export function saveDayTemplateLabel(isTrainingDay: boolean): string {
  return isTrainingDay
    ? "Запомнить на дни с залом"
    : "Запомнить на дни без зала";
}

export function saveDayTemplateReplace(isTrainingDay: boolean): string {
  return isTrainingDay
    ? "Уже есть еда на дни с залом. Заменить этим днём?"
    : "Уже есть еда на дни без зала. Заменить этим днём?";
}
export const PENDING_WRITES = "На телефоне. Когда появится сеть — уйдёт само.";
export const NAMED_MEAL_EMPTY = "Сначала добавь продукты.";
export const NAMED_MEAL_LIMIT = "Слишком много сохранённых приёмов.";
export const BOT_OPEN_DIARY = "Открыть дневник";
export const BOT_PACK_START = "Start";
export const BOT_PROGRAM_START = "Поставить";
export const BOT_REMINDER_FOOD = "День еды пустой. Холодильник сам не запишет.";
export const BOT_REMINDER_FOOD_EARLY =
  "День еды пустой. Запиши, что ешь — завтра будет что повторить.";
export const BOT_YEAH_BUDDY = "Yeah buddy.";

export function botReminderGym(name: string): string {
  return `В очереди ${name}.`;
}
export const EXERCISES_EMPTY =
  "Пока пусто. Добавь упражнение — штанга сама не встанет.";
export const WORKOUTS_NEED_EXERCISES = "Сначала добавь упражнения.";
export const WORKOUTS_NEED_TEMPLATES =
  "Программа пустая. Поставь готовую или собери тренировку сам.";
export const WORKOUT_TEMPLATE_EMPTY =
  "В этой тренировке нет упражнений с планом подходов. Добавь их в программе.";
export const NEED_ALL_WORKING_WEIGHTS =
  "Нужен максимум на раз у каждого упражнения.";
export const NEED_CYCLE_PHASES = "Сначала выбери этапы.";
export const CYCLE_RAISE_LATER =
  "Идёт цикл: вес растёт на смене недели, а не после одной тренировки.";
export const WORKOUT_NOT_FOUND = "Тренировка не найдена.";
export const SESSION_HISTORY_EMPTY = "Пока пусто. Первый подход ещё впереди.";
export const NUTRITION_HISTORY_EMPTY = "Пока пусто. Первый приём ещё впереди.";
export const WEEK_EMPTY = "Пока пусто. Неделя сама себя не запишет.";
export const WEEK_EMPTY_HINT = "Запиши еду или зал — день появится здесь.";
export const SESSION_HISTORY_EMPTY_HINT = "Сделай тренировку — она ляжет сюда.";
export const NUTRITION_HISTORY_EMPTY_HINT = "Запиши еду — день появится здесь.";
export const WEEK_NO_FOOD = "еды нет";
export const WEEK_NO_GYM = "зала нет";
export const SESSION_PLAN_EMPTY =
  "Нет веса для плана. Напиши максимум на раз или первый кг — прямо здесь.";
export const TEMPLATE_MEAL_HIDDEN = "Этот приём в такой день скрыт.";
export const AI_REVIEW_EMPTY = "Пока мало записей. Другу не о чем говорить.";
export const AI_REVIEW_NO_KEY = "Пока недоступно.";
export const AI_REVIEW_FAILED = "Не получилось разобрать.";
export const AI_REVIEW_QUOTA = "На сегодня разборов хватит. Цифры на месте.";
export const AI_REVIEW_LIMIT = "Пока не разбирается. Цифры на месте.";
export const AI_PLATE_FAILED = "Не получилось разобрать.";
export const AI_PLATE_EMPTY = "На фото еды не видно. Покажи тарелку ближе.";
export const AI_PLATE_PHOTO_FAILED = "Не получилось прочитать фото.";
export const AI_PLATE_RETRY = "Ещё раз это фото";
export const AI_PLATE_OFF = "Фото пока выключено. Запиши руками.";
export const AI_PLATE_QUOTA = "На сегодня фото кончились. Запиши руками.";
export const AI_PLATE_LIMIT = "Пока не разбирается. Запиши руками.";
export const REVIEW_CTA_HINT = "Как еда, зал и вес жили вместе";
export const PACK_NOT_FOUND = "Ссылка уже не работает.";
export const PACK_LIMIT = "Слишком много сохранённых. Убери старые.";
export const PACK_REMOVE_LINK =
  "Ссылка перестанет открываться. У кого уже поставлено — останется. Из списка пропадёт.";
export const PACK_REMOVE_SAVED = "Убрать из списка? Еда и зал не изменятся.";
export const PACK_EMPTY_MEALS = "Сначала собери еду на день.";
export const PACK_EMPTY_WORKOUTS = "Сначала поставь тренировки в программу.";
export const ACCOUNT_DELETE_CONFIRM =
  "Удалить дневник навсегда? Еда, зал и ссылки для друзей пропадут. Это нельзя отменить.";
export const DONATE_THANKS = "Спасибо";
export const DONATE_REJECT = "Этот счёт не принять.";
export const DONATE_HINT = "Звёзды Telegram. Уходят автору.";
export const DONATE_STARS_INVALID = "От 1 до 10 000 звёзд.";
export const INBOX_SETTINGS_TITLE = "Написать";
export const INBOX_SETTINGS_HINT =
  "Что улучшить, пожаловаться или заказать программу питания и тренировок.";
export const INBOX_MENU = "О чём написать?";
export const INBOX_TOPIC_IMPROVE = "Что улучшить";
export const INBOX_TOPIC_CHANGE = "Пожаловаться";
export const INBOX_TOPIC_PROGRAM =
  "Заказать программу питания или тренировок";
export const INBOX_OTHER = "Другая тема";
export const INBOX_HOLD = "Выбери тему — и это уйдёт.";
export const INBOX_PICK_FIRST = "Сначала выбери тему, потом пришли ещё раз.";
export const INBOX_SENT = "Ушло. Ответ придёт сюда.";
export const INBOX_FAILED = "Не ушло. Пришли ещё раз.";
export const INBOX_TEXT_ONLY = "Это не перешлю. Напиши текстом.";
export const INBOX_CLOSED = "Сюда пока не пишут.";
export const INBOX_AUTHOR =
  "Сюда приходят письма. Ответь на письмо — текст уйдёт человеку.";
export const INBOX_REPLY_NEED =
  "Не вижу, кому ответить. Ответь на само письмо.";
export const INBOX_REPLY_LOST = "Не дошло.";
export const INBOX_REPLY_CLOSED = "Человек закрыл бота.";

export function inboxAsk(topicLabel: string): string {
  return `${topicLabel}. Напиши сюда — ответ придёт в этот чат.`;
}

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
