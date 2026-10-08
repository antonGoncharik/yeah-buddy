export const OPEN_VIA_BOT = "Открой приложение в Telegram.";
export const BOT_START = `Yeah buddy! 👟
Это дневник еды и тренировок.

Записывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.

В личку можно кинуть фото тарелки, текст или голосовое — разберём и запишем в день (фото — с подтверждением в дневнике).

Light weight. Погнали 🔥`;
export const MEAL_CHAT_HINT =
  "То же в личке бота: фото, строка текста или голосовое — без открытия дневника.";
export const MEAL_CHAT_INBOX_NOTE =
  "Написать админу — в «Написать» ниже: сначала выбери тему, потом текст или вложение.";
export const OPEN_VIA_BOT_LEAD =
  "День отдыха и день зала с разными целями. Программа сама ставит вес.";
export const OPEN_VIA_BOT_CTA = "Открыть в Telegram";
export const OPEN_VIA_BOT_QR_CAPTION = "Наведи камеру — откроется бот.";
export const OPEN_VIA_BOT_POINTS = [
  {
    title: "День отдыха",
    body: "Свои белок и калории.",
  },
  {
    title: "День зала",
    body: "Другие цели. Углеводов больше.",
  },
  {
    title: "Программа",
    body: "Сама ставит рабочий вес.",
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
    body: "Отдых или зал — цели разные. Еда в граммах.",
  },
  {
    title: "Вечером",
    body: "Около вечера — одно сообщение: белок, жир, углеводы и калории из цели, был ли зал.",
  },
] as const;
export const OPEN_VIA_BOT_NOTE = "В чат уходит только то, чем сам поделился.";
export const PROGRAM_SHELF_TITLE = "Программы";
export const PROGRAM_SHELF_LEAD =
  "5×5, дом и ягодицы. Поставишь — рабочий вес двигается сам.";
export const PROGRAM_PAGE_PROMISE =
  "В дневнике день отдыха и день зала с разными целями. Эта программа сама ставит рабочий вес.";
export const PROGRAM_PAGE_CTA = "Поставить в Telegram";
export const BARBELL_SHELF_TITLE = "Задача дня";
export const BARBELL_SHELF_LEAD =
  "Мини-игра про блины — можно кинуть друзьям в чат.";
export const BARBELL_PAGE_BACK = "На главную";
export const BARBELL_PUBLIC_LEAD =
  "Каждый день новый вес на олимпийский гриф. Жми блины с двух сторон, пока не сойдётся. Без зала и без записи подходов — просто арифметика штанги.";
export const BARBELL_PUBLIC_POINTS = [
  {
    title: "Пар",
    body: "Меньше блинов — лучше. Серия дней копится в приложении.",
  },
  {
    title: "В чат",
    body: "После победы — карточка в Telegram и кнопка в дневник.",
  },
] as const;
export const BARBELL_PLAY_CTA = "Собрать в Telegram";
export const BARBELL_QR_CAPTION =
  "Наведи камеру — откроется игра в мини-приложении.";
export const PROGRAM_PAGE_BACK = "На главную";
export const PROGRAM_QR_CAPTION = "Наведи камеру — бот поставит эту программу.";
export const LOAD_FAILED = "Не загрузилось.";
export const CHECK_FIELDS = "Проверь поля.";
export const CHECK_DATE = "Проверь дату.";
export const NOT_FOUND = "Запись не найдена.";
export const FOODS_EMPTY =
  "Пока пусто. Добавь продукты — из них соберёшь день.";
export const STARTER_CATALOG_NOTE = "";
export const DAY_EXISTS_REPLACE = "Заменить день?";
export const MEAL_EXISTS_REPLACE = "Заменить приём?";

export function switchDayTypeMessage(input: {
  toTraining: boolean;
  canSwapMeals: boolean;
}): string {
  const target = input.toTraining ? "тренировочным" : "днём отдыха";
  if (input.canSwapMeals) {
    return `Сменить на ${target}? «Подставить из шаблона» заменит приёмы. «Только цели» оставит записанную еду.`;
  }
  return `Сменить на ${target}? Записанная еда останется, цели пересчитаются.`;
}

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
export const EMPTY_START_ADD = "Еды ещё нет. Тарелка сама не запишется.";
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
export const EXIT_TO_CHATS_HINT = "Ещё раз «назад» — выйти в чаты";
export const NAMED_MEAL_EMPTY = "Сначала добавь продукты.";
export const NAMED_MEAL_LIMIT = "Слишком много сохранённых приёмов.";
export const BOT_OPEN_DIARY = "Открыть дневник";
export const BOT_PACK_START = "Start";
export const BOT_PROGRAM_START = "Поставить";
export const COACH_SHARE_TEXT =
  "Открываю тебе дневник. Еда, зал и утренний вес — только смотреть.";
export const COACH_BOT_TEXT =
  "Тебе открыли дневник. Еда, зал и утренний вес — только смотреть.";
export const COACH_BOT_OPEN = "Открыть дневник";
export const COACH_LINK_DEAD = "Ссылка уже не работает.";
export const COACH_LINK_TAKEN = "Эту ссылку уже открыл другой тренер.";
export const COACH_LINK_OWN = "Это твоя ссылка. Её открывает тренер.";
export const COACH_LINK_LIMIT = "Три ссылки уже живые. Закрой одну.";
export const COACH_LINK_UNAVAILABLE = "Не получилось собрать ссылку.";
export const BUDDY_SHARE_TEXT =
  "Смотри мой день — еда, белок и зал. Без веса и цифр.";
export const BUDDY_BOT_TEXT =
  "Друг открыл день — только закрыл или нет: еда, белок, зал.";
export const BUDDY_BOT_OPEN = "Посмотреть";
export const BUDDY_LINK_DEAD = "Ссылка уже не работает.";
export const BUDDY_LINK_TAKEN = "Эту ссылку уже открыл другой.";
export const BUDDY_LINK_OWN = "Это твоя ссылка. Её открывает друг.";
export const BUDDY_LINK_LIMIT = "Три ссылки уже живые. Закрой одну.";
export const BUDDY_LINK_UNAVAILABLE = "Не получилось собрать ссылку.";
export const MEAL_TEMPLATE_FILL_PROMPT =
  "Подставить еду из шаблона «Еда на день»? Цифры потом можно поправить.";
export const MEAL_TEMPLATE_FILL_CONFIRM = "Подставить";
export const MEAL_TEMPLATE_FILL_SKIP = "Сам заполню";
export const BOT_REMINDER_FOOD =
  "Еда за сегодня ещё пустая. Открой дневник — пока помнишь, что ел.";
export const BOT_REMINDER_FOOD_EARLY =
  "Еда за сегодня ещё пустая. Запиши пару приёмов — завтра будет что повторить.";
export const BOT_YEAH_BUDDY = "Yeah buddy.";
export const BOT_REMINDER_DONE = "День в порядке. На сегодня хватит.";
export const BOT_MIDDAY_REMINDER_FOOD =
  "День ещё пустой. Одна запись сейчас — и серия на Сегодня не оборвётся.";
export function botMiddayReminderGym(name: string): string {
  return `Тренировка «${name}» открыта — допиши, когда будешь готов.`;
}
export function botMiddayReminderProtein(remaining: string): string {
  return `Ещё ${remaining} г белка до цели.`;
}
export const EARLY_HABIT_REMINDER_NOTE =
  "В первые две недели, если день пустой, бот напомнит днём (около 13:00) и вечером (около 21:00).";

export function botReminderGym(name: string): string {
  return `Тренировка «${name}» ещё не закрыта. Штанга подождёт — допиши сейчас или оставь на завтра.`;
}
export const EXERCISES_EMPTY =
  "Пока пусто. Добавь упражнение — штанга сама не встанет.";
export const WORKOUTS_NEED_EXERCISES = "Сначала добавь упражнения.";
export const WORKOUTS_NEED_TEMPLATES =
  "Программа пустая. Поставь готовую или собери тренировку сам.";
export const WORKOUT_TEMPLATE_EMPTY =
  "В этой тренировке нет упражнений с планом подходов. Добавь их в программе.";
export const NEED_ALL_WORKING_WEIGHTS =
  "Для каждого упражнения напиши, сколько поднимаешь один раз.";
export const NEED_CYCLE_PHASES = "Сначала выбери этапы.";
export const CYCLE_RAISE_LATER =
  "Вес подрастёт на следующей неделе программы, не после одной тренировки.";
export const WORKOUT_NOT_FOUND = "Тренировка не найдена.";
export const SESSION_HISTORY_EMPTY = "Пока пусто. Первый подход ещё впереди.";
export const NUTRITION_HISTORY_EMPTY = "Пока пусто. Первый приём ещё впереди.";
export const WEEK_EMPTY = "Пока пусто. Неделя сама себя не запишет.";
export const WEEK_EMPTY_HINT =
  "Запиши еду или зал — день сам себя не нарисует.";
export const SESSION_HISTORY_EMPTY_HINT = "Сделай тренировку — она ляжет сюда.";
export const NUTRITION_HISTORY_EMPTY_HINT =
  "Запиши еду — день появится здесь. Сам не заполнится.";
export const WEEK_NO_FOOD = "еды нет";
export const WEEK_NO_GYM = "зала нет";
export const SESSION_PLAN_EMPTY =
  "Нет веса для плана. Напиши, сколько поднимаешь один раз, или первый кг — прямо здесь.";
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
export const AI_DICTATE_FAILED = "Не получилось разобрать.";
export const AI_DICTATE_EMPTY = "Еды не слышно. Скажи, что съел и сколько.";
export const AI_DICTATE_AUDIO_FAILED = "Не получилось прочитать запись.";
export const AI_DICTATE_RETRY = "Ещё раз эту запись";
export const AI_DICTATE_OFF = "Голос пока выключен. Запиши руками.";
export const AI_DICTATE_QUOTA = "На сегодня записи кончились. Запиши руками.";
export const AI_DICTATE_LIMIT = "Пока не разбирается. Запиши руками.";
export const AI_DICTATE_MIC = "Микрофон не открылся. Запиши руками.";
export const AI_DICTATE_SILENT = "Не слышно. Скажи ещё раз.";
export const AI_DICTATE_HEAVY = "Запись слишком длинная.";
export const AI_TEXT_MEAL_FAILED = "Не получилось разобрать.";
export const AI_TEXT_MEAL_EMPTY =
  "Напиши, что съел и сколько — например: овсянка 80 г, яйца 2 шт.";
export const AI_TEXT_MEAL_OFF = "Текстовый разбор выключен. Запиши руками.";
export const AI_TEXT_MEAL_QUOTA =
  "На сегодня текстовых разборов хватит. Запиши руками.";
export const AI_TEXT_MEAL_LIMIT = "Пока не разбирается. Запиши руками.";
export const REVIEW_CTA_HINT = "Посмотреть аналитику";
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
export const DONATE_HINT = "Звёзды Telegram. Уходят автору на протеин💪";
export const DONATE_STARS_INVALID = "От 1 до 10 000 звёзд.";
export const INBOX_SETTINGS_TITLE = "Написать";
export const INBOX_SETTINGS_HINT =
  "Что улучшить, пожаловаться или заказать программу питания и тренировок";
export const INBOX_MENU = "О чём написать?";
export const INBOX_TOPIC_IMPROVE = "Что улучшить";
export const INBOX_TOPIC_CHANGE = "Пожаловаться";
export const INBOX_TOPIC_PROGRAM = "Заказать программу питания или тренировок";
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
export const MEAL_CHAT_TEXT_LOGGED = "Записал в дневник.";
export const MEAL_CHAT_DRAFT_BUTTON = "Подтвердить в дневнике";
export const MEAL_CHAT_EDIT_BUTTON = "Изменить";
export const MEAL_CHAT_UNDO_BUTTON = "Отменить";
export const MEAL_CHAT_UNDO_DONE = "Убрал из дневника.";
export const MEAL_CHAT_UNDO_EXPIRED = "Уже нельзя отменить.";
export const MEAL_CHAT_LOCKED =
  "Сегодня в дневнике только просмотр. Открой приложение и выбери день.";
export const MEAL_CHAT_PHOTO_EMPTY = "Не разобрал. Напиши текстом или в дневнике.";
export const MEAL_CHAT_PHOTO_FAILED = "Фото не разобралось. Попробуй ещё раз.";
export const MEAL_CHAT_TEXT_FAILED =
  "Не записалось. Открой дневник и добавь вручную.";

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
