import type { WorkoutSet } from "@/lib/types";
import {
  firstWorkPlanScore,
  formatRecentSessionTrail,
  sessionCloseKind,
  sessionCloseKindLine,
  sessionCloseKindShort,
  setCopiedFromPlan,
} from "@/lib/workout/session-format";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function workSet(patch: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: "s",
    user_id: "u",
    session_exercise_id: "e",
    set_type: "work",
    set_number: 1,
    planned_weight: 80,
    planned_reps: 5,
    planned_reps_to: null,
    planned_seconds: null,
    planned_rir: null,
    actual_weight: 80,
    actual_reps: 5,
    actual_seconds: null,
    actual_rir: null,
    is_completed: true,
    logged: false,
    created_at: "",
    ...patch,
  };
}

assertEqual(
  sessionCloseKind([{ sets: [workSet()] }]),
  "as_planned",
  "copied work is as planned",
);
assertEqual(
  sessionCloseKind([{ sets: [workSet({ logged: true })] }]),
  "edited",
  "a logged set is edited",
);
assertEqual(
  sessionCloseKindLine("as_planned"),
  "Закрыл как план.",
  "as planned line",
);
assertEqual(sessionCloseKindLine("edited"), "Правил по ходу.", "edited line");
assertEqual(
  sessionCloseKindShort("as_planned"),
  "как план",
  "short as planned",
);
assertEqual(sessionCloseKindShort("edited"), "правил", "short edited");
assertEqual(
  setCopiedFromPlan(workSet({ is_completed: true, logged: false })),
  true,
  "completed copy",
);
assertEqual(
  setCopiedFromPlan(workSet({ is_completed: true, logged: true })),
  false,
  "logged is not a copy",
);
assertEqual(
  firstWorkPlanScore([workSet({ logged: false })]),
  { hit: 0, total: 0 },
  "copied plan does not score a hit",
);
assertEqual(
  firstWorkPlanScore([workSet({ logged: true })]),
  { hit: 1, total: 1 },
  "logged at plan counts",
);
assertEqual(
  firstWorkPlanScore([workSet({ logged: true, actual_reps: 3 })]),
  { hit: 0, total: 1 },
  "logged miss counts",
);
assertEqual(
  sessionCloseKind([
    { sets: [workSet({ logged: false, actual_weight: 82.5 })] },
  ]),
  "edited",
  "legacy fact vs plan is edited",
);
assertEqual(
  firstWorkPlanScore([workSet({ logged: false, actual_reps: 3 })]),
  { hit: 0, total: 1 },
  "legacy miss still scores",
);
assertEqual(
  setCopiedFromPlan(
    workSet({ is_completed: true, logged: false, actual_weight: 82.5 }),
  ),
  false,
  "different fact is not a copy",
);
assertEqual(
  formatRecentSessionTrail({
    summary: "Жим 80×5",
    close_kind: "as_planned",
  }),
  "как план · Жим 80×5",
  "trail leads with kind",
);
assertEqual(
  formatRecentSessionTrail({ summary: null, close_kind: "edited" }),
  "правил",
  "kind without summary",
);

console.log("session format close kind ok");
