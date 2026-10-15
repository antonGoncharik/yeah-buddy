import assert from "node:assert/strict";

import {
  droppableWorkSetId,
  nextWorkSetPlan,
} from "@/lib/workout/session-set-add";

const next = nextWorkSetPlan([
  {
    set_type: "warmup",
    set_number: 1,
    planned_weight: 40,
    planned_reps: 5,
    planned_reps_to: null,
    planned_seconds: null,
    planned_rir: null,
  },
  {
    set_type: "work",
    set_number: 1,
    planned_weight: 80,
    planned_reps: 5,
    planned_reps_to: null,
    planned_seconds: null,
    planned_rir: 2,
  },
  {
    set_type: "work",
    set_number: 2,
    planned_weight: 82.5,
    planned_reps: 5,
    planned_reps_to: 6,
    planned_seconds: null,
    planned_rir: 1,
  },
]);

assert.deepEqual(next, {
  set_type: "work",
  set_number: 3,
  planned_weight: 82.5,
  planned_reps: 5,
  planned_reps_to: 6,
  planned_seconds: null,
  planned_rir: 1,
});
assert.equal(
  nextWorkSetPlan([
    {
      set_type: "warmup",
      set_number: 1,
      planned_weight: 40,
      planned_reps: 5,
      planned_reps_to: null,
      planned_seconds: null,
      planned_rir: null,
    },
  ]),
  null,
);

assert.equal(
  droppableWorkSetId([
    {
      id: "a",
      set_type: "work",
      set_number: 1,
      is_completed: true,
    },
    {
      id: "b",
      set_type: "work",
      set_number: 2,
      is_completed: false,
    },
  ]),
  "b",
);
assert.equal(
  droppableWorkSetId([
    {
      id: "a",
      set_type: "work",
      set_number: 1,
      is_completed: false,
    },
  ]),
  null,
);
assert.equal(
  droppableWorkSetId([
    {
      id: "a",
      set_type: "work",
      set_number: 1,
      is_completed: true,
    },
    {
      id: "b",
      set_type: "work",
      set_number: 2,
      is_completed: true,
    },
  ]),
  null,
);

console.log("session set add ok");
