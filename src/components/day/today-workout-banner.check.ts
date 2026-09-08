import { bannerFromTodayState } from "@/components/day/today-workout-banner";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(bannerFromTodayState(null, { isToday: true, isTrainingDay: false }), null, "empty");

assertEqual(
  bannerFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: true, isTrainingDay: false },
  ),
  {
    href: "/workouts",
    label: "В очереди",
    title: "Жим",
    hint: "Начать",
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
    hint: "Начать",
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
  },
  "open session wins",
);

console.log("today banner ok");
