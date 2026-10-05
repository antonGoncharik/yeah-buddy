import {
  completeSetOverrides,
  draftChanged,
  draftFromPlan,
  draftFromSet,
  draftMatchesPlan,
  formatVisibleSetLine,
  stepDraftValue,
  visibleSetRirLabel,
} from "@/components/workout/session-drafts";
import type {
  Exercise,
  SessionDetail,
  SessionExerciseDetail,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
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
  logged: false,
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
  load_hint: false,
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
  beats: null,
};

const untouched = draftFromSet(set);
assertEqual(
  draftMatchesPlan(set, untouched),
  true,
  "untouched draft matches plan",
);
assertEqual(
  draftMatchesPlan(set, draftFromPlan(set)),
  true,
  "plan draft matches plan",
);
assertEqual(
  draftMatchesPlan(set, { ...untouched, weight: "90" }),
  false,
  "edited weight is off plan",
);
assertEqual(draftChanged(set, untouched), false, "same draft is not dirty");
assertEqual(
  draftChanged(set, { ...untouched, weight: "82.5" }),
  true,
  "weight edit is dirty",
);
assertEqual(
  completeSetOverrides(detail, { "set-1": untouched }),
  [],
  "untouched sets are not sent",
);
assertEqual(
  completeSetOverrides(detail, {
    "set-1": { ...untouched, reps: "4" },
  }),
  [
    {
      id: "set-1",
      actual_weight: 80,
      actual_reps: 4,
      actual_seconds: null,
      actual_rir: null,
    },
  ],
  "edited set is sent",
);

const ranged = { ...set, planned_reps_to: 8, planned_rir: 2 };
const rangedDraft = draftFromSet(ranged);
assertEqual(
  formatVisibleSetLine(ranged, rangedDraft),
  "80 × 5–8",
  "untouched draft keeps the range",
);
assertEqual(
  formatVisibleSetLine(ranged, { ...rangedDraft, weight: "82.5" }),
  "82.5 × 5",
  "weight edit replaces the line",
);
assertEqual(
  formatVisibleSetLine(ranged, { ...rangedDraft, reps: "" }, { compact: true }),
  "80×—",
  "cleared reps show on the line",
);
assertEqual(
  visibleSetRirLabel(ranged, rangedDraft, false),
  "запас 2",
  "planned reserve stays until edited",
);
assertEqual(
  visibleSetRirLabel(ranged, { ...rangedDraft, weight: "90" }, false),
  "запас 2",
  "weight edit does not drop the reserve",
);
assertEqual(
  visibleSetRirLabel(ranged, { ...rangedDraft, rir: "0" }, false),
  "до отказа",
  "typed reserve replaces the planned one",
);
assertEqual(
  formatVisibleSetLine(ranged, { ...rangedDraft, rir: "0" }),
  "80 × 5–8",
  "reserve edit keeps the rep range",
);
assertEqual(stepDraftValue("80", 1, 2.5, "weight"), "82.5", "weight steps up");
assertEqual(
  stepDraftValue("2.5", -1, 2.5, "weight"),
  "0",
  "weight stops at zero",
);
assertEqual(stepDraftValue("5", -1, 1, "reps"), "4", "reps step down");
assertEqual(stepDraftValue("1", -1, 1, "reps"), "1", "reps stay at one");
assertEqual(stepDraftValue("30", 1, 5, "seconds"), "35", "hold steps by five");
assertEqual(
  stepDraftValue("", 1, 2.5, "weight"),
  "2.5",
  "empty weight starts at a step",
);

console.log("session drafts close kind ok");
