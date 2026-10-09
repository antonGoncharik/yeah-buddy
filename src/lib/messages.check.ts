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
  OPEN_VIA_BOT_FINAL_LEAD,
  OPEN_VIA_BOT_FINAL_TITLE,
  OPEN_VIA_BOT_HERO,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_NOTE,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_POINTS_TITLE,
  OPEN_VIA_BOT_PREVIEW,
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
  "Сфотографируй еду — бот посчитает КБЖУ. В зале открой тренировку: подходы, веса и прогресс уже на месте.",
  "outside Telegram lead",
);
assertEqual(OPEN_VIA_BOT_EYEBROW, "Yeah Buddy · в Telegram", "landing eyebrow");
assertEqual(
  OPEN_VIA_BOT_HERO,
  "Ешь как обычно. Тренируйся по плану.",
  "landing hero",
);
assertEqual(
  OPEN_VIA_BOT_PREVIEW.workoutValue,
  "72,5 кг × 5",
  "landing product preview",
);
assertEqual(
  OPEN_VIA_BOT_FAQ_TITLE,
  "Если остались вопросы",
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
  "Сфоткал — записано: Еду можно отправить фото, голосом или текстом. Бот разберёт и добавит в день.\nВ зале без блокнота: Подходы, повторы и рабочие веса в телефоне. История остаётся рядом.\nВес не надо угадывать: Программа знает прошлую тренировку и подсказывает, сколько ставить сегодня.",
  "outside Telegram facts",
);
assertEqual(
  OPEN_VIA_BOT_POINTS_TITLE,
  "Еда и тренировки — в одном дневнике",
  "landing points title",
);
assertEqual(
  OPEN_VIA_BOT_STEPS_TITLE,
  "Один обычный день",
  "outside Telegram steps",
);
assertEqual(
  OPEN_VIA_BOT_STEPS.map((step) => `${step.title}: ${step.body}`).join("\n"),
  "Поел: Кинул фото тарелки в бот. КБЖУ появилось в дневнике.\nПришёл в зал: Открыл тренировку и пошёл по подходам. Вес уже рассчитан.\nЗакрыл день: Сразу видно, что получилось по еде и как прошла тренировка.",
  "outside Telegram steps copy",
);
assertEqual(
  OPEN_VIA_BOT_NOTE,
  "Бесплатно · без регистрации · открывается в Telegram",
  "outside Telegram note",
);
assertEqual(
  `${OPEN_VIA_BOT_FINAL_TITLE}: ${OPEN_VIA_BOT_FINAL_LEAD}`,
  "Можно просто попробовать сегодня: Открой бота и отправь ему то, что ел. Настройки и программа подождут.",
  "landing final call to action",
);
assertEqual(
  PROGRAM_SHELF_TITLE,
  "Не знаешь, с чего начать?",
  "program shelf title",
);
assertEqual(
  PROGRAM_SHELF_LEAD,
  "Возьми готовую программу. Есть зал, дом и варианты без оборудования.",
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
