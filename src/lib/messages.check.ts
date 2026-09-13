import { switchRestToTrainingMessage } from "@/lib/messages";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  switchRestToTrainingMessage({ isToday: true, swapMeals: true }),
  "Этот день уже как отдых. Сделать тренировочным? Еда станет из шаблона тренировки.",
  "today swap",
);
assertEqual(
  switchRestToTrainingMessage({ isToday: true, swapMeals: false }),
  "Этот день уже как отдых. Сделать тренировочным? Цели еды сменятся. Записи не тронем.",
  "today keep",
);
assertEqual(
  switchRestToTrainingMessage({ isToday: false, swapMeals: true }),
  "За этот день еда уже как отдых. Сделать тренировочным? Еда станет из шаблона тренировки.",
  "other day swap",
);

console.log("messages ok");
