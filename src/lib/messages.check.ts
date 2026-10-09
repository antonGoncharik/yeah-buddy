import {
  BOT_START,
  CATCH_UP_EMPTY_HINT,
  CATCH_UP_MARK,
  CATCH_UP_TITLE,
  CATCH_UP_YESTERDAY_HINT,
  EMPTY_START_ADD,
  EMPTY_START_REPEAT,
  OPEN_VIA_BOT_CTA,
  OPEN_VIA_BOT_EYEBROW,
  OPEN_VIA_BOT_FAQ,
  OPEN_VIA_BOT_FAQ_TITLE,
  OPEN_VIA_BOT_FEATURES_TITLE,
  OPEN_VIA_BOT_HERO,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_NOTE,
  OPEN_VIA_BOT_PILLS,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_QR_CAPTION,
  OPEN_VIA_BOT_STEPS,
  OPEN_VIA_BOT_STEPS_TITLE,
  PENDING_WRITES,
  PROGRAM_PAGE_BACK,
  PROGRAM_PAGE_CTA,
  PROGRAM_PAGE_PROMISE,
  PROGRAM_QR_CAPTION,
  PROGRAM_SHELF_LEAD,
  PROGRAM_SHELF_TITLE,
  STARTER_CATALOG_NOTE,
  saveDayTemplateLabel,
  saveDayTemplateReplace,
  switchRestToTrainingMessage,
} from "@/lib/messages";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  switchRestToTrainingMessage({ isToday: true, swapMeals: true }),
  "Сейчас это день отдыха. Сделать его тренировочным? Приёмы пищи подставятся из шаблона тренировки.",
  "today swap",
);
assertEqual(
  switchRestToTrainingMessage({ isToday: true, swapMeals: false }),
  "Сейчас это день отдыха. Сделать его тренировочным? Цели поменяются, записанная еда останется.",
  "today keep",
);
assertEqual(
  switchRestToTrainingMessage({ isToday: false, swapMeals: true }),
  "Этот день записан как день отдыха. Сделать его тренировочным? Приёмы пищи подставятся из шаблона тренировки.",
  "other day swap",
);

assertEqual(
  PENDING_WRITES,
  "На телефоне. Когда появится сеть — уйдёт само.",
  "offline queue copy",
);
assertEqual(CATCH_UP_MARK, "догонял", "catch-up mark");
assertEqual(CATCH_UP_TITLE, "Догонял", "catch-up title");
assertEqual(
  CATCH_UP_EMPTY_HINT,
  "День пустой. Можно догнать — в истории будет пометка «догонял».",
  "catch-up empty hint",
);
assertEqual(
  CATCH_UP_YESTERDAY_HINT,
  "Вчера пустой — можно догнать.",
  "today after a hole",
);
assertEqual(
  EMPTY_START_REPEAT,
  "Вчера было так. Повторить.",
  "empty today after a logged yesterday",
);
assertEqual(
  EMPTY_START_ADD,
  "Еды ещё нет. Тарелка сама не запишется.",
  "empty today with nothing to copy",
);
assertEqual(
  saveDayTemplateLabel(false),
  "Запомнить на дни без зала",
  "rest day template action",
);
assertEqual(
  saveDayTemplateLabel(true),
  "Запомнить на дни с залом",
  "training day template action",
);
assertEqual(
  saveDayTemplateReplace(false),
  "Уже есть еда на дни без зала. Заменить этим днём?",
  "rest day template replace",
);
assertEqual(
  saveDayTemplateReplace(true),
  "Уже есть еда на дни с залом. Заменить этим днём?",
  "training day template replace",
);
assertEqual(STARTER_CATALOG_NOTE, "", "starter catalog explains itself");
assertEqual(
  OPEN_VIA_BOT_LEAD,
  "День отдыха и день зала с разными целями. Программа сама ставит вес.",
  "outside Telegram lead",
);
assertEqual(OPEN_VIA_BOT_EYEBROW, "Дневник в Telegram", "landing eyebrow");
assertEqual(
  OPEN_VIA_BOT_HERO,
  "Зал или отдых — цели и вес уже правильные.",
  "landing hero",
);
assertEqual(
  OPEN_VIA_BOT_PILLS.join(" · "),
  "Без регистрации · Фото и голос в боте · Программы с авто-весом",
  "landing pills",
);
assertEqual(
  OPEN_VIA_BOT_FEATURES_TITLE,
  "Не два приложения",
  "landing features title",
);
assertEqual(
  OPEN_VIA_BOT_FAQ_TITLE,
  "Коротко о важном",
  "landing faq title",
);
assertEqual(OPEN_VIA_BOT_FAQ.length, 4, "landing faq count");
assertEqual(OPEN_VIA_BOT_CTA, "Открыть в Telegram", "outside Telegram cta");
assertEqual(
  OPEN_VIA_BOT_QR_CAPTION,
  "Наведи камеру — откроется бот.",
  "outside Telegram qr",
);
assertEqual(
  OPEN_VIA_BOT_POINTS.map((point) => `${point.title}: ${point.body}`).join(
    "\n",
  ),
  "День отдыха: Свои белок и калории.\nДень зала: Другие цели. Углеводов больше.\nПрограмма: Сама ставит рабочий вес.",
  "outside Telegram facts",
);
assertEqual(OPEN_VIA_BOT_STEPS_TITLE, "Как начать", "outside Telegram steps");
assertEqual(
  OPEN_VIA_BOT_STEPS.map((step) => `${step.title}: ${step.body}`).join("\n"),
  "Открой бота: Кнопка или QR. Регистрации нет.\nЗапиши день: Отдых или зал — цели разные. Еда в граммах.\nВечером: Около вечера — одно сообщение: белок, жир, углеводы и калории из цели, был ли зал.",
  "outside Telegram steps copy",
);
assertEqual(
  OPEN_VIA_BOT_NOTE,
  "В чат уходит только то, чем сам поделился.",
  "outside Telegram note",
);
assertEqual(PROGRAM_SHELF_TITLE, "Программы", "program shelf title");
assertEqual(
  PROGRAM_SHELF_LEAD,
  "5×5, дом и ягодицы. Поставишь — рабочий вес двигается сам.",
  "program shelf lead",
);
assertEqual(
  PROGRAM_PAGE_PROMISE,
  "В дневнике день отдыха и день зала с разными целями. Эта программа сама ставит рабочий вес.",
  "program page promise",
);
assertEqual(PROGRAM_PAGE_CTA, "Поставить в Telegram", "program page cta");
assertEqual(PROGRAM_PAGE_BACK, "На главную", "program page back");
assertEqual(
  PROGRAM_QR_CAPTION,
  "Наведи камеру — бот поставит эту программу.",
  "program qr",
);
assertEqual(
  BOT_START,
  "Yeah buddy! 👟\nЭто дневник еды и тренировок.\n\nЗаписывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.\n\nВ личку можно кинуть фото тарелки, текст или голосовое — разберём и запишем в день (фото — с подтверждением в дневнике).\n\nLight weight. Погнали 🔥",
  "/start copy",
);

console.log("messages ok");
