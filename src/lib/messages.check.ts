import {
  BOT_START,
  CATCH_UP_EMPTY_HINT,
  CATCH_UP_MARK,
  CATCH_UP_TITLE,
  CATCH_UP_YESTERDAY_HINT,
  EMPTY_START_REPEAT,
  EMPTY_START_SCAN,
  OPEN_VIA_BOT_CTA,
  OPEN_VIA_BOT_LEAD,
  OPEN_VIA_BOT_NOTE,
  OPEN_VIA_BOT_POINTS,
  OPEN_VIA_BOT_QR_CAPTION,
  OPEN_VIA_BOT_STEPS,
  OPEN_VIA_BOT_STEPS_TITLE,
  PENDING_WRITES,
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
  EMPTY_START_SCAN,
  "Отсканируй то, что ешь каждый день.",
  "empty today with nothing to copy",
);
assertEqual(
  OPEN_VIA_BOT_LEAD,
  "Дневник еды и зала в Telegram. Без регистрации.",
  "outside Telegram lead",
);
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
  "Еда: Свои продукты и каталог. Белок считается сам.\nЗал: Программа, подходы, рабочий вес.\nШтрихкод: Код с пачки — сразу в дневник.",
  "outside Telegram facts",
);
assertEqual(OPEN_VIA_BOT_STEPS_TITLE, "Как начать", "outside Telegram steps");
assertEqual(
  OPEN_VIA_BOT_STEPS.map((step) => `${step.title}: ${step.body}`).join("\n"),
  "Открой бота: Кнопка или QR. Регистрации нет.\nЗапиши день: Еда в граммах, зал по программе.\nВечером: Одно сообщение: белок, калории, был ли зал.",
  "outside Telegram steps copy",
);
assertEqual(
  OPEN_VIA_BOT_NOTE,
  "В чат уходит только то, чем сам поделился.",
  "outside Telegram note",
);
assertEqual(
  BOT_START,
  "Yeah buddy! 👟\nЭто дневник еды и тренировок.\n\nЗаписывай, что съел и что сделал в зале — белок, калории и план подходов посчитаются сами.\n\nLight weight. Погнали 🔥",
  "/start copy",
);

console.log("messages ok");
