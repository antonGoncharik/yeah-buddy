import type { SlotPlan, TemplateSlot } from "@/lib/types";
import {
  exerciseLoadNeed,
  exerciseWeightLead,
} from "@/lib/workout/exercise-load-need";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const exercise = {
  id: "squat",
  formula_preset: "barbell" as const,
};

function slot(plan: SlotPlan): TemplateSlot {
  return { exercise_id: "squat", plan };
}

const percentPlan = {
  groups: [
    {
      sets: 5,
      reps: 5,
      reps_to: null,
      seconds: null,
      load: { type: "percent" as const, percent: 80 },
    },
  ],
  intensity: null,
  warmup: true,
  note: null,
};

const trackPlan = {
  ...percentPlan,
  groups: [
    {
      sets: 3,
      reps: 8,
      reps_to: null,
      seconds: null,
      load: { type: "track" as const, percent: 100, offset: 0 },
    },
  ],
};

const unseen = exerciseLoadNeed(exercise, null);
assert(
  unseen.max && !unseen.track,
  "unknown program asks only for the one-rep number",
);

const absent = exerciseLoadNeed(exercise, []);
assert(
  absent.max && !absent.track,
  "exercise outside the queue still uses its scheme",
);

const percent = exerciseLoadNeed(exercise, [
  {
    is_active: true,
    exercises: [exercise],
    slots: [slot(percentPlan)],
  },
]);
assert(percent.max && !percent.track, "percent day needs the one-rep number");

const kilos = exerciseLoadNeed(exercise, [
  {
    is_active: true,
    exercises: [exercise],
    slots: [slot(trackPlan)],
  },
]);
assert(!kilos.max && kilos.track, "kilogram day needs the working weight");

const idle = exerciseLoadNeed(exercise, [
  {
    is_active: false,
    exercises: [exercise],
    slots: [slot(trackPlan)],
  },
]);
assert(idle.max && !idle.track, "a parked day does not change the card");

const lead = exerciseWeightLead({
  need: percent,
  preset: "barbell",
  workoutType: "dynamic",
});
assert(lead.includes("50, 70, 80 и 90%"), "barbell warmup names its percents");
assert(lead.includes("не от этой цифры"), "warmup is not the one-rep number");

const trackLead = exerciseWeightLead({
  need: kilos,
  preset: "cable",
  workoutType: "dynamic",
});
assert(trackLead.includes("50 и 75%"), "cable warmup names its percents");

console.log("exercise load need ok");
