import type {
  Exercise,
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import { completeSessionLocally } from "@/lib/workout/session-complete-local";

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

const session: WorkoutSession = {
  id: "s1",
  user_id: "u",
  session_date: "2026-09-19",
  macro_cycle_id: null,
  phase_id: null,
  workout_type: "dynamic",
  template_id: null,
  status: "planned",
  note: null,
  feel: null,
  created_at: "",
};

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

const set: WorkoutSet = {
  id: "set-1",
  user_id: "u",
  session_exercise_id: "se1",
  set_type: "work",
  set_number: 1,
  planned_weight: 80,
  planned_reps: 5,
  planned_reps_to: null,
  planned_seconds: null,
  planned_rir: null,
  actual_weight: null,
  actual_reps: null,
  actual_seconds: null,
  actual_rir: null,
  is_completed: false,
  created_at: "",
};

const row: SessionExerciseDetail = {
  id: "se1",
  user_id: "u",
  session_id: "s1",
  exercise_id: "ex1",
  sort_order: 1,
  max_weight: 100,
  intensity: null,
  note: null,
  track_id: null,
  track_step: null,
  created_at: "",
  exercise,
  sets: [set],
  previous: null,
};

const detail: SessionDetail = {
  session,
  template: null,
  phase: null,
  exercises: [row],
  missing_maxes: [],
  missing_tracks: [],
  tracks: [],
  raise_offers: [],
};

const done = completeSessionLocally(detail, {
  note: "basement",
  feel: "close",
  sets: [
    {
      id: "set-1",
      actual_weight: 82.5,
      actual_reps: 4,
      actual_rir: 1,
    },
  ],
});

assertEqual(done.session.status, "completed", "marks completed");
assertEqual(done.session.note, "basement", "keeps note");
assertEqual(done.session.feel, "close", "keeps feel");
assertEqual(done.exercises[0]?.sets[0]?.actual_weight, 82.5, "logged weight");
assertEqual(done.exercises[0]?.sets[0]?.actual_reps, 4, "logged reps");
assertEqual(done.exercises[0]?.sets[0]?.is_completed, true, "set done");
assert(detail.session.status === "planned", "does not mutate input");

const asPlanned = completeSessionLocally(detail, {});
assertEqual(
  asPlanned.exercises[0]?.sets[0]?.actual_weight,
  80,
  "falls back to plan",
);

console.log("session complete local ok");
