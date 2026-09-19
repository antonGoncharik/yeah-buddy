import type {
  Exercise,
  ExerciseWithMax,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  sessionDetailFromTemplate,
  sessionIdMap,
} from "@/lib/workout/session-local";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const exercise: Exercise = {
  id: "ex1",
  user_id: "u",
  name: "Bench",
  short_name: null,
  category: "base",
  workout_type: "dynamic",
  unit: "reps",
  weight_step: 2.5,
  formula_preset: "barbell",
  slot: null,
  is_active: true,
  created_at: "",
  updated_at: "",
  archived_at: null,
};

const catalog: ExerciseWithMax[] = [
  { ...exercise, current_max: null, max_history: [], track: null },
];

const template: WorkoutTemplateDetail = {
  id: "tmpl",
  user_id: "u",
  name: "Тело A",
  kind: "dynamic",
  sort_order: 10,
  is_active: true,
  created_at: "",
  updated_at: "",
  exercises: [exercise],
  slots: [
    {
      exercise_id: exercise.id,
      plan: {
        groups: [
          {
            sets: 3,
            reps: 5,
            reps_to: null,
            seconds: null,
            load: { type: "fixed", weight: 80 },
          },
        ],
        intensity: null,
        warmup: false,
        note: null,
      },
    },
  ],
};

const local = sessionDetailFromTemplate({
  sessionId: "temp:session:1",
  date: "2026-09-19",
  template,
  catalog,
  formulas: DEFAULT_WORKOUT_FORMULAS,
});

assertEqual(local.session.id, "temp:session:1", "temp session id");
assertEqual(local.session.template_id, "tmpl", "keeps template");
assertEqual(local.exercises.length, 1, "one exercise");
assertEqual(local.exercises[0]?.sets.length, 3, "three work sets");
assertEqual(local.exercises[0]?.sets[0]?.planned_weight, 80, "fixed kg");
assert(
  local.exercises[0]?.sets[0]?.id.startsWith("temp:") === true,
  "temp set",
);

const real = sessionDetailFromTemplate({
  sessionId: "real-session",
  date: "2026-09-19",
  template,
  catalog,
  formulas: DEFAULT_WORKOUT_FORMULAS,
});
const remapped = {
  ...real,
  exercises: real.exercises.map((item, index) => ({
    ...item,
    id: "real-ex",
    sets: item.sets.map((set, setIndex) => ({
      ...set,
      id: `real-set-${setIndex}`,
    })),
    exercise: local.exercises[index]?.exercise ?? item.exercise,
  })),
};
const ids = sessionIdMap(local, remapped);
assertEqual(ids.get("temp:session:1"), "real-session", "maps session");
assertEqual(
  ids.get(local.exercises[0]?.sets[0]?.id ?? ""),
  "real-set-0",
  "maps first set",
);

console.log("session local ok");
