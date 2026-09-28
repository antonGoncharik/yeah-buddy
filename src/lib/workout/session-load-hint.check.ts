import type { Exercise, SessionPreviousWork, SlotPlan } from "@/lib/types";
import {
  formatNextLoadHint,
  slotWantsLoadHint,
} from "@/lib/workout/session-load-hint";
import { feelLoad, percentLoad, trackLoad } from "@/lib/workout/slot-plan";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const barbell: Pick<Exercise, "formula_preset"> = { formula_preset: "barbell" };

function previous(
  patch: Partial<SessionPreviousWork> = {},
): SessionPreviousWork {
  return {
    weight: 100,
    reps: 8,
    seconds: null,
    rir: 1,
    feel: "close",
    same_phase: true,
    hold: false,
    ...patch,
  };
}

const both = "План на сегодня: 102.5 кг на 7–8 повт. или 100 кг на 9–10 повт.";

assertEqual(
  formatNextLoadHint({
    previous: previous(),
    step: 2.5,
    reps: 8,
    repsTo: null,
    enabled: true,
  }),
  both,
  "one in reserve offers weight or reps",
);

assertEqual(
  formatNextLoadHint({
    previous: previous(),
    step: 2.5,
    reps: 6,
    repsTo: 10,
    enabled: true,
  }),
  both,
  "range 6–10 still fits both windows",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 8 }),
    step: 2.5,
    reps: 8,
    repsTo: 12,
    enabled: true,
  }),
  "План на сегодня: 102.5 кг на 8 повт. или 100 кг на 9–10 повт.",
  "heavier window clamps to the bottom of the range",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 12, rir: 1 }),
    step: 2.5,
    reps: 8,
    repsTo: 12,
    enabled: true,
  }),
  "План на сегодня: 102.5 кг на 11–12 повт.",
  "top of the range drops the rep option",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 13, rir: 2, feel: "easy" }),
    step: 2.5,
    reps: 8,
    repsTo: 12,
    enabled: true,
  }),
  "План на сегодня: 102.5 кг на 8 повт.",
  "easy above the range resets to the bottom",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 4, rir: 0 }),
    step: 2.5,
    reps: 6,
    repsTo: 10,
    enabled: true,
  }),
  "План на сегодня: 100 кг на 6–10 повт.",
  "failure under the range keeps the weight",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 8, rir: 0 }),
    step: 2.5,
    reps: 6,
    repsTo: 10,
    enabled: true,
  }),
  "План на сегодня: 100 кг на 8 повт.",
  "failure inside the range does not add weight",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ hold: true, rir: 2 }),
    step: 2.5,
    reps: 6,
    repsTo: 10,
    enabled: true,
  }),
  "План на сегодня: 100 кг на 6–10 повт.",
  "two misses hold the weight",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ rir: null }),
    step: 2.5,
    reps: null,
    repsTo: null,
    enabled: true,
  }),
  null,
  "no logged reserve, no hint",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ seconds: 6, reps: null }),
    step: 2.5,
    reps: null,
    repsTo: null,
    enabled: true,
  }),
  null,
  "static work has no hint",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ same_phase: false }),
    step: 2.5,
    reps: 8,
    repsTo: null,
    enabled: true,
  }),
  null,
  "new phase stays quiet",
);

assertEqual(
  formatNextLoadHint({
    previous: previous(),
    step: 2.5,
    reps: 8,
    repsTo: null,
    enabled: false,
  }),
  null,
  "track and fixed slots stay quiet",
);

assertEqual(
  formatNextLoadHint({
    previous: previous({ reps: 1 }),
    step: 2.5,
    reps: null,
    repsTo: null,
    enabled: true,
  }),
  "План на сегодня: 102.5 кг на 1 повт. или 100 кг на 2–3 повт.",
  "rep window does not drop to zero",
);

const percent: SlotPlan = {
  groups: [
    { sets: 3, reps: 8, reps_to: 10, seconds: null, load: percentLoad(80) },
  ],
  intensity: null,
  warmup: true,
  note: null,
};
const feel: SlotPlan = {
  groups: [{ sets: 3, reps: 10, reps_to: 12, seconds: null, load: feelLoad() }],
  intensity: null,
  warmup: false,
  note: null,
};
const track: SlotPlan = {
  groups: [
    { sets: 3, reps: 8, reps_to: null, seconds: null, load: trackLoad() },
  ],
  intensity: null,
  warmup: false,
  note: null,
};
const fixed: SlotPlan = {
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
};

assertEqual(slotWantsLoadHint(percent, barbell, null), true, "percent hints");
assertEqual(slotWantsLoadHint(feel, barbell, null), true, "feel hints");
assertEqual(slotWantsLoadHint(track, barbell, null), false, "track is quiet");
assertEqual(slotWantsLoadHint(fixed, barbell, null), false, "fixed is quiet");
assertEqual(
  slotWantsLoadHint(null, { formula_preset: "barbell" }, null),
  true,
  "shared percent scheme hints",
);
assertEqual(
  slotWantsLoadHint(null, { formula_preset: "none" }, null),
  false,
  "no scheme, no hint",
);

console.log("session load hint ok");
