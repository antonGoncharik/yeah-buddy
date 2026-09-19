import {
  CATCH_UP_EMPTY_HINT,
  CATCH_UP_MARK,
  CATCH_UP_TITLE,
  CATCH_UP_YESTERDAY_HINT,
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

console.log("messages ok");
