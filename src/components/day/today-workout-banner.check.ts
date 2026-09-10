import { bannerFromTodayState } from "@/components/day/today-workout-banner";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  bannerFromTodayState(null, { isToday: true, isTrainingDay: false }),
  null,
  "empty",
);

assertEqual(
  bannerFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: true, isTrainingDay: false },
  ),
  {
    href: "/workouts",
    label: "Следующая",
    title: "Жим",
    hint: "Открыть",
    templateId: null,
  },
  "queue on empty today",
);

assertEqual(
  bannerFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: true, isTrainingDay: true },
  ),
  {
    href: "/workouts",
    label: "В зале",
    title: "Жим",
    hint: "Открыть",
    templateId: null,
  },
  "queue on training today",
);

assertEqual(
  bannerFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: false, isTrainingDay: false },
  ),
  null,
  "no queue on past day",
);

assertEqual(
  bannerFromTodayState(
    {
      session: { id: "s1", workout_type: "dynamic", status: "planned" },
      session_template: { name: "Тяга" },
      next_template: { name: "Жим" },
    },
    { isToday: true, isTrainingDay: true },
  ),
  {
    href: "/workouts/sessions/s1",
    label: "В зале",
    title: "Тяга",
    hint: "В плане",
    templateId: null,
  },
  "open session wins",
);

assertEqual(
  bannerFromTodayState(
    {
      next_template: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Жим",
      },
    },
    { isToday: true, isTrainingDay: true },
  ),
  {
    href: "/workouts",
    label: "В зале",
    title: "Жим",
    hint: "Начать",
    templateId: "11111111-1111-1111-1111-111111111111",
  },
  "queue with id can start",
);

console.log("today banner ok");
