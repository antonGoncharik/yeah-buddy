import { gymLoopFromTodayState, proteinLoopLine } from "@/lib/day/loop";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(proteinLoopLine(40, 80), "осталось 40 г", "leftover grams");
assertEqual(proteinLoopLine(40.4, 80), "осталось 40,4 г", "leftover fraction");
assertEqual(proteinLoopLine(0.4, 160), "закрыт", "closed leftover");
assertEqual(proteinLoopLine(-12, 180), "закрыт", "overflow is closed");
assertEqual(proteinLoopLine(160, 0), "осталось 160 г", "empty day leftover");

assertEqual(
  gymLoopFromTodayState(null, { isToday: true, isTrainingDay: false }),
  {
    kind: "rest",
    label: "отдых",
    href: null,
    templateId: null,
  },
  "rest today",
);

assertEqual(
  gymLoopFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: true, isTrainingDay: false },
  ),
  {
    kind: "rest",
    label: "отдых",
    href: null,
    templateId: null,
  },
  "rest day keeps queue off the header",
);

assertEqual(
  gymLoopFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: true, isTrainingDay: true },
  ),
  {
    kind: "queue",
    label: "Жим",
    href: "/workouts",
    templateId: null,
  },
  "queue name on training today",
);

assertEqual(
  gymLoopFromTodayState(
    { next_template: { name: "Жим" } },
    { isToday: false, isTrainingDay: true },
  ),
  {
    kind: "rest",
    label: "отдых",
    href: null,
    templateId: null,
  },
  "no queue on a past day",
);

assertEqual(
  gymLoopFromTodayState(
    {
      session: { id: "s1", workout_type: "dynamic", status: "planned" },
      session_template: { name: "Тяга" },
      next_template: { name: "Жим" },
    },
    { isToday: true, isTrainingDay: true },
  ),
  {
    kind: "open",
    label: "Тяга",
    href: "/workouts/sessions/s1",
    templateId: null,
  },
  "open session wins",
);

assertEqual(
  gymLoopFromTodayState(
    {
      session: { id: "s1", workout_type: "dynamic", status: "completed" },
      session_template: { name: "Тяга" },
    },
    { isToday: true, isTrainingDay: true },
  ),
  {
    kind: "done",
    label: "Готово",
    href: "/workouts/sessions/s1",
    templateId: null,
  },
  "completed is done",
);

assertEqual(
  gymLoopFromTodayState(
    {
      session: { id: "s1", workout_type: "dynamic", status: "planned" },
      session_template: { name: "Тяга" },
    },
    { isToday: true, isTrainingDay: false },
  ),
  {
    kind: "open",
    label: "Тяга",
    href: "/workouts/sessions/s1",
    templateId: null,
  },
  "open session still shows on rest day",
);

assertEqual(
  gymLoopFromTodayState(
    {
      next_template: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Жим",
      },
    },
    { isToday: true, isTrainingDay: true },
  ),
  {
    kind: "queue",
    label: "Жим",
    href: "/workouts",
    templateId: "11111111-1111-1111-1111-111111111111",
  },
  "queue with id can start",
);

assertEqual(
  gymLoopFromTodayState(null, { isToday: true, isTrainingDay: true }),
  {
    kind: "rest",
    label: "нет очереди",
    href: "/workouts",
    templateId: null,
  },
  "training today without a program",
);

console.log("day loop ok");
