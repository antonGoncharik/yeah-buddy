export const OPEN_VIA_BOT = "Открой приложение в Telegram.";
export const BOT_START = `Yeah buddy! 👟
Это дневник еды и тренировок.

Записывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.

В личку можно кинуть текст, голосовое или фото тарелки — разберём и запишем в день. Фото, голос и текст — до четырёх в день. Фото ещё раз подтвердишь в дневнике.

Light weight. Погнали 🔥`;
export const MEAL_CHAT_HINT =
  "То же в личке бота: фото, строка текста или голосовое — без открытия дневника.";
export const OPEN_VIA_BOT_LEAD =
  "Фото, голос или текст — КБЖУ посчитано. В зале программа сама подскажет вес и подходы.";
export const OPEN_VIA_BOT_EYEBROW = "Yeah Buddy · в Telegram";
export const OPEN_VIA_BOT_HERO =
  "Еда и зал в одном дневнике — прямо в Telegram";
export const OPEN_VIA_BOT_FEATURES_TITLE = "Что умеет";
export const OPEN_VIA_BOT_FEATURES_LEAD =
  "Всё, за что обычно держат два приложения — в одном боте.";
export const OPEN_VIA_BOT_FEATURES = [
  {
    title: "Адаптивные калории",
    body: "Цель сверяет еду и вес. Предложение «Поставить» — только по твоему тапу.",
  },
  {
    title: "Карта мышц",
    body: "Видно, где подходов за неделю хватает и где ещё мало.",
  },
  {
    title: "Офлайн в зале",
    body: "Подходы и вес сохраняются на телефоне и догоняют сервер, когда сеть вернётся.",
  },
  {
    title: "Штрихкод и фото",
    body: "Сканируй упаковку или сфоткай тарелку — разбор с лимитом на ИИ в день.",
  },
  {
    title: "Тренер и пара",
    body: "По ссылке можно открыть неделю питания и вес — только если ты сам отправишь доступ.",
  },
  {
    title: "Голос и текст в боте",
    body: "Запись еды в личке, когда не хочется открывать дневник.",
  },
] as const;
export const OPEN_VIA_BOT_PRICING_TITLE = "Бесплатно сейчас";
export const OPEN_VIA_BOT_PRICING_BODY =
  "Дневник, программы и зал — без оплаты. Фото, голос, текст и разбор — по четыре в день, вопросы помощнику — тридцать. Платные тарифы появятся отдельно, когда будут готовы.";
export const PUBLIC_FOOTER_PRIVACY = "Политика конфиденциальности";
export const PUBLIC_FOOTER_TERMS = "Условия использования";
export const PUBLIC_FOOTER_CONTACT = {
  label: "Написать в Telegram",
  href: "https://t.me/YeahBuddyAppBot",
} as const;
export const PUBLIC_PROGRAMS_INDEX_TITLE = "Готовые программы";
export const PUBLIC_PROGRAMS_INDEX_LEAD =
  "Зал, дом, гантели и турник — выбери схему и поставь в дневник одной кнопкой.";
export const PUBLIC_PROGRAMS_ALL_LINK = "Все программы";
export const OFFLINE_CAPTURE_HINT =
  "Нет сети. Запись сохранится на телефоне, разбор фото и голоса заработают, когда интернет вернётся.";
export const OPEN_VIA_BOT_FAQ_TITLE = "Если остались вопросы";
export const OPEN_VIA_BOT_FAQ = [
  {
    question: "Нужно что-то скачивать?",
    answer:
      "Нет. Yeah Buddy открывается внутри Telegram — как обычный бот и мини-приложение.",
  },
  {
    question: "Можно пользоваться только дневником еды?",
    answer:
      "Да. Тренировки и программы не обязательны. В день без зала останутся только еда и твои цели.",
  },
  {
    question: "Сколько стоит и какие лимиты у ИИ?",
    answer:
      "Дневник и зал сейчас бесплатны. Фото, голос, текст и разбор — по четыре в день, вопросы помощнику — тридцать. Остаток виден в дневнике перед отправкой.",
  },
  {
    question: "Кто видит мой дневник?",
    answer:
      "По умолчанию никто. Режимы «тренер» и «пара» показывают только то, что ты сам откроешь по ссылке: неделю питания и вес, без скрытых записей.",
  },
  {
    question: "Как удалить данные?",
    answer:
      "В настройках дневника — удаление аккаунта с подтверждением. Экспорт данных — отдельной кнопкой перед удалением.",
  },
  {
    question: "Это медицинский совет?",
    answer:
      "Нет. Приложение считает калории и нагрузку по твоим целям, но не заменяет врача или диетолога.",
  },
] as const;
export const OPEN_VIA_BOT_CTA = "Открыть в Telegram";
export const OPEN_VIA_BOT_QR_CAPTION = "Наведи камеру — откроется бот.";
export const OPEN_VIA_BOT_POINTS = [
  {
    title: "Записал — посчитано",
    body: "Еду можно отправить текстом, голосом или фото. Бот разберёт и добавит в день.",
  },
  {
    title: "В зале без блокнота",
    body: "Подходы, повторы и рабочие веса в телефоне. История остаётся рядом.",
  },
  {
    title: "Вес не надо угадывать",
    body: "Программа знает прошлую тренировку и подсказывает, сколько ставить сегодня.",
  },
] as const;
export const OPEN_VIA_BOT_POINTS_TITLE = "Еда и тренировки — в одном дневнике";
export const OPEN_VIA_BOT_STEPS_TITLE = "Один обычный день";
export const OPEN_VIA_BOT_STEPS = [
  {
    title: "Поел",
    body: "Напиши, скажи или сфоткай. КБЖУ появится в дневнике.",
  },
  {
    title: "Пришёл в зал",
    body: "Открыл тренировку и пошёл по подходам. Вес уже рассчитан.",
  },
  {
    title: "Закрыл день",
    body: "Сразу видно, что получилось по еде и как прошла тренировка.",
  },
] as const;
export const OPEN_VIA_BOT_NOTE =
  "Бесплатно · без регистрации · еда и зал в одном боте";
export const OPEN_VIA_BOT_COMPARE_TITLE = "Один дневник вместо двух приложений";
export const OPEN_VIA_BOT_COMPARE_USUAL = "Обычно";
export const OPEN_VIA_BOT_COMPARE_HERE = "Здесь";
export const OPEN_VIA_BOT_COMPARE = [
  {
    usual: "Дневник калорий и отдельное приложение для зала",
    here: "Еда и тренировки в одном боте",
  },
  {
    usual: "Чат только про калории",
    here: "Еда, зал, программы и карта мышц",
  },
] as const;
export const OPEN_VIA_BOT_COMPARE_NOTE =
  "У NOMS и BioTrakk больше бесплатных разборов еды. Здесь фото, голос и текст — по четыре в день, вопросы помощнику — тридцать. Зато рядом зал, офлайн и адаптивная цель.";
export const OPEN_VIA_BOT_FINAL_TITLE = "Можно просто попробовать сегодня";
export const OPEN_VIA_BOT_FINAL_LEAD =
  "Открой бота. Настройка обычно занимает 7–9 шагов, программу зала можно не выбирать.";
export const PROGRAM_SHELF_TITLE = "Не знаешь, с чего начать?";
export const PROGRAM_SHELF_LEAD =
  "Возьми готовую программу. Есть зал, дом и варианты без оборудования.";
export const PROGRAM_PAGE_PROMISE =
  "В дневнике день отдыха и день зала с разными целями. Эта программа сама ставит рабочий вес.";
export const PROGRAM_PAGE_CTA = "Поставить в Telegram";
export const BARBELL_SHELF_TITLE = "Задача дня";
export const BARBELL_SHELF_LEAD =
  "Мини-игра про блины — можно кинуть друзьям в чат.";
export const BARBELL_PAGE_BACK = "На главную";
export const BARBELL_PUBLIC_LEAD =
  "Каждый день новый вес и своя стойка блинов. Набери ровно то, что просят, из того, что есть. Без зала — просто арифметика штанги.";
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
  const target = input.toTraining ? "тренировочный день" : "день отдыха";
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
export const BOT_OPEN_SETTINGS = "Открыть настройки";
export const BOT_OPEN_WEEK = "Открыть неделю";
export const BOT_HELP =
  "Команды: /today — дневник, /weight 82.5 — вес, /week — неделя, /settings — настройки, /donate — звёзды. Еду можно писать текстом или голосом.";
export const BOT_WEIGHT_USAGE = "Напиши вес: /weight 82.5";
export const BOT_WEIGHT_RECORDED = (kg: string) =>
  `Записал ${kg} кг на сегодня.`;
export const BOT_WEIGHT_WRITE_LOCKED =
  "Сегодня в дневнике только просмотр. Открой приложение и выбери день.";
export const INBOX_MEAL_CHAT_HOLD =
  "Сначала отправь письмо или нажми «Другое» в меню «Написать».";
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
  "Нет веса для плана. Для процентов — сколько поднимаешь один раз. Для лесенки — килограммы на штанге.";
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
export const AI_MEAL_PARSE_EMPTY_REFUND =
  "Ничего не нашёл. Попытка не потрачена.";
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
export const ACCOUNT_DELETE_TYPE_PROMPT =
  "Введи УДАЛИТЬ заглавными буквами, чтобы подтвердить.";
export const ACCOUNT_EXPORT_DONE = "JSON сохранён на устройстве.";
export const MEAL_UNDO_ACTION = "Вернуть";
export function mealRemovedUndoMessage(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") {
    return "Убрал из приёма.";
  }
  return `Убрал «${trimmed}».`;
}
export const DONATE_THANKS = "Спасибо";
export const DONATE_REJECT = "Этот счёт не принять.";
export const DONATE_HINT = "Звёзды Telegram. Уходят автору на протеин💪";
export const DONATE_STARS_INVALID = "От 1 до 10 000 звёзд.";
export const INBOX_SETTINGS_TITLE = "Написать";
export const INBOX_OPEN_CHAT = "Открыть чат";
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
export const MEAL_CHAT_PHOTO_EMPTY =
  "Не разобрал. Напиши текстом или в дневнике.";
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
