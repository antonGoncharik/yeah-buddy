import { coachGymReport, proteinLeftShort } from "@/lib/coach/report";
import type { WorkoutSet } from "@/lib/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function workSet(patch: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: "set",
    user_id: "user",
    session_exercise_id: "exercise",
    set_type: "work",
    set_number: 1,
    planned_weight: 80,
    planned_reps: 8,
    planned_reps_to: null,
    planned_seconds: null,
    planned_rir: null,
    actual_weight: null,
    actual_reps: null,
    actual_seconds: null,
    actual_rir: null,
    is_completed: true,
    logged: false,
    created_at: "",
    ...patch,
  };
}

assertEqual(
  coachGymReport({
    status: "none",
    date: "2026-09-27",
    today: "2026-09-27",
    exercises: [],
  }),
  { tone: "none", headline: "Зала нет", lines: [] },
  "no gym",
);

assertEqual(
  coachGymReport({
    status: "skipped",
    date: "2026-09-27",
    today: "2026-09-27",
    exercises: [],
  }).headline,
  "Пропустил",
  "skipped",
);

assertEqual(
  coachGymReport({
    status: "planned",
    date: "2026-09-27",
    today: "2026-09-27",
    exercises: [],
  }).headline,
  "Ещё не закрыл",
  "open today",
);

assertEqual(
  coachGymReport({
    status: "planned",
    date: "2026-09-26",
    today: "2026-09-27",
    exercises: [],
  }),
  { tone: "miss", headline: "Не закрыл", lines: [] },
  "left open",
);

assertEqual(
  coachGymReport({
    status: "completed",
    date: "2026-09-27",
    today: "2026-09-27",
    exercises: [{ name: "Жим", sets: [workSet({})] }],
  }).headline,
  "По плану",
  "copied plan is not a miss",
);

assertEqual(
  coachGymReport({
    status: "completed",
    date: "2026-09-27",
    today: "2026-09-27",
    exercises: [
      {
        name: "Жим",
        sets: [workSet({ logged: true, actual_weight: 80, actual_reps: 8 })],
      },
    ],
  }).headline,
  "Сделал",
  "logged the plan",
);

const short = coachGymReport({
  status: "completed",
  date: "2026-09-27",
  today: "2026-09-27",
  exercises: [
    {
      name: "Жим",
      sets: [workSet({ logged: true, actual_weight: 70, actual_reps: 6 })],
    },
  ],
});
assertEqual(short.tone, "short", "below plan tone");
assertEqual(short.headline, "Ниже плана", "below plan headline");
assertEqual(short.lines, ["Жим 70×6 · план 80×8"], "below plan line");

assert(proteinLeftShort(100, 180), "protein well under");
assert(!proteinLeftShort(160, 180), "protein close enough");
assert(!proteinLeftShort(0, 180), "empty day is not a shortfall");

console.log("coach report ok");
