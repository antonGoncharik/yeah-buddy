import {
  middayDayCompleteEnough,
  middayReminderText,
  MIDDAY_PROTEIN_AFTERNOON_HOUR,
} from "@/lib/telegram/reminder-midday";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const base = {
  foodLogged: true,
  priorFoodLogDays: 0,
  protein: 150,
  targetProtein: 150,
  isTrainingDay: false,
  sessionStatus: null as const,
  gymTemplateName: null,
  localHour: 16,
};

assertEqual(
  middayDayCompleteEnough(base),
  true,
  "rest day with food and protein closed",
);
assertEqual(
  middayReminderText(base),
  null,
  "complete day skips",
);
assertEqual(
  middayReminderText({
    ...base,
    foodLogged: false,
    protein: 0,
    priorFoodLogDays: 2,
    localHour: 14,
  }),
  "2 дня с едой в дневнике. Сегодня ещё пусто — не оборви.",
  "streak at risk beats empty food",
);
assertEqual(
  middayReminderText({
    ...base,
    foodLogged: false,
    protein: 0,
    priorFoodLogDays: 0,
    localHour: 14,
  }),
  "День ещё пустой. Одна запись сейчас — и серия на Сегодня не оборвётся.",
  "empty food without streak",
);
assertEqual(
  middayReminderText({
    ...base,
    foodLogged: false,
    protein: 0,
    priorFoodLogDays: 1,
    isTrainingDay: true,
    sessionStatus: "planned",
    gymTemplateName: "День 1",
    localHour: 14,
  }),
  "Тренировка «День 1» открыта — допиши, когда будешь готов.",
  "open gym beats streak",
);
assertEqual(
  middayReminderText({
    ...base,
    protein: 120,
    targetProtein: 150,
    localHour: MIDDAY_PROTEIN_AFTERNOON_HOUR,
  }),
  "Ещё 30 г белка до цели.",
  "protein gap afternoon",
);
assertEqual(
  middayReminderText({
    ...base,
    protein: 120,
    targetProtein: 150,
    localHour: 14,
  }),
  null,
  "protein gap waits until afternoon hour",
);
assertEqual(
  middayReminderText({
    ...base,
    protein: 140,
    targetProtein: 150,
    localHour: 17,
  }),
  null,
  "small protein gap stays quiet",
);
assertEqual(
  middayReminderText({
    ...base,
    isTrainingDay: true,
    sessionStatus: "planned",
    gymTemplateName: "День 2",
    protein: 100,
    targetProtein: 150,
    localHour: 17,
  }),
  "Тренировка «День 2» открыта — допиши, когда будешь готов.",
  "open gym beats protein gap",
);
assertEqual(
  middayReminderText({
    ...base,
    isTrainingDay: true,
    sessionStatus: "completed",
  }),
  null,
  "training done with protein closed",
);

console.log("midday reminders ok");
