import type { SlotPlan, WorkoutFormulas } from "@/lib/types";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  normalizeSlotPlan,
  parseRepsRange,
  plannedSetsForSlot,
  type SlotPlanContext,
  slotNeedsMax,
  slotNeedsTrack,
  slotPlanSummary,
} from "@/lib/workout/slot-plan";
import { parseSlotPlan } from "@/lib/workout/slot-plan-schema";
import {
  generateTrackSteps,
  nextTrackProposal,
  trackFinished,
  trackSummary,
  trackWeightAt,
} from "@/lib/workout/track-line";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const barbell = { weight_step: 2.5, formula_preset: "barbell" as const };

function ctx(patch: Partial<SlotPlanContext> = {}): SlotPlanContext {
  return {
    kind: "dynamic",
    exercise: barbell,
    formulas: DEFAULT_WORKOUT_FORMULAS,
    phaseKey: null,
    maxWeight: 100,
    trackWeight: null,
    feelWeight: null,
    ...patch,
  };
}

function line(rows: ReturnType<typeof plannedSetsForSlot>): string[] {
  return (rows ?? []).map((row) => {
    const reps =
      row.planned_reps_to != null
        ? `${row.planned_reps}–${row.planned_reps_to}`
        : String(row.planned_reps);
    const rir = row.planned_rir != null ? ` rir${row.planned_rir}` : "";
    return `${row.set_type[0]}${row.set_number}:${row.planned_weight}×${reps}${rir}`;
  });
}

// ---------- Vlad's bench: top 2×2 by the line, back-off 3×6 ten kilos lighter ----------

const bench: SlotPlan = {
  groups: [
    {
      sets: 2,
      reps: 2,
      reps_to: null,
      seconds: null,
      load: { type: "track", percent: 100, offset: 0 },
    },
    {
      sets: 3,
      reps: 6,
      reps_to: null,
      seconds: null,
      load: { type: "track", percent: 100, offset: -10 },
    },
  ],
  intensity: null,
  warmup: true,
  note: null,
};

assertEqual(
  line(plannedSetsForSlot(bench, ctx({ maxWeight: null, trackWeight: 80 }))),
  [
    "w1:50×5",
    "w2:70×3",
    "w3:80×1",
    "w4:80×2",
    "w5:80×2",
    "w6:70×6",
    "w7:70×6",
    "w8:70×6",
  ],
  "bench by the line: warmup derived from the top set, no working weight needed",
);

assertEqual(
  plannedSetsForSlot(bench, ctx({ trackWeight: null })),
  null,
  "track slot without a line cannot be planned",
);

assertEqual(slotNeedsTrack(bench), true, "bench needs a line");
assertEqual(slotNeedsMax(bench, barbell), false, "bench does not need a max");

// ---------- heavy base lift: 4×6–8 at 80 %, last set to failure ----------

const heavyPulls: SlotPlan = {
  groups: [
    {
      sets: 4,
      reps: 6,
      reps_to: 8,
      seconds: null,
      load: { type: "percent", percent: 80 },
    },
  ],
  intensity: "heavy",
  warmup: true,
  note: null,
};

assertEqual(
  line(plannedSetsForSlot(heavyPulls, ctx())),
  [
    "w1:50×5",
    "w2:70×3",
    "w3:80×1",
    "w4:80×6–8",
    "w5:80×6–8",
    "w6:80×6–8",
    "w7:80×6–8 rir0",
  ],
  "heavy: rep range kept, RIR 0 only on the last work set",
);

assertEqual(
  plannedSetsForSlot(heavyPulls, ctx({ maxWeight: null })),
  null,
  "percent slot without a working weight cannot be planned",
);

assertEqual(
  line(plannedSetsForSlot({ ...heavyPulls, intensity: "light" }, ctx())).at(-1),
  "w7:80×6–8 rir2",
  "light: last work set keeps 2 in reserve",
);

// ---------- isolation by feel: weight from last time, none on the first go ----------

const feel: SlotPlan = {
  groups: [
    { sets: 4, reps: 15, reps_to: null, seconds: null, load: { type: "feel" } },
  ],
  intensity: null,
  warmup: false,
  note: "около отказа",
};

assertEqual(
  line(plannedSetsForSlot(feel, ctx({ maxWeight: null, feelWeight: null }))),
  ["w1:null×15", "w2:null×15", "w3:null×15", "w4:null×15"],
  "feel without history still plans the sets, weight left open",
);
assertEqual(
  line(plannedSetsForSlot(feel, ctx({ feelWeight: 12.5 })))[0],
  "w1:12.5×15",
  "feel picks up last lifted weight",
);

// ---------- cycle phases still apply to custom slots ----------

const withPhases: WorkoutFormulas = {
  ...DEFAULT_WORKOUT_FORMULAS,
  cycle: [
    {
      key: "volume",
      name: "Объём",
      skip_warmup: false,
      increase_on_end: false,
      percent_scale: 0.9,
    },
    {
      key: "deload",
      name: "Разгрузка",
      skip_warmup: true,
      increase_on_end: false,
    },
  ],
};

assertEqual(
  line(
    plannedSetsForSlot(
      heavyPulls,
      ctx({ formulas: withPhases, phaseKey: "volume" }),
    ),
  ).at(-1),
  "w7:70×6–8 rir0",
  "percent_scale 0.9 turns 80 % into 72 → 70 by the 2.5 step",
);

assertEqual(
  line(
    plannedSetsForSlot(
      heavyPulls,
      ctx({ formulas: withPhases, phaseKey: "deload" }),
    ),
  ).length,
  4,
  "deload phase drops the warmup of a custom slot",
);

// ---------- shared scheme with an intensity tag only ----------

const sharedHeavy: SlotPlan = {
  groups: null,
  intensity: "heavy",
  warmup: true,
  note: null,
};
const shared = plannedSetsForSlot(sharedHeavy, ctx());
assertEqual(
  shared?.filter((row) => row.set_type === "work").at(-1)?.planned_rir,
  0,
  "shared scheme gets RIR on the last work set",
);
assertEqual(
  shared?.filter((row) => row.planned_rir != null).length,
  1,
  "only one set carries the RIR",
);

assertEqual(
  plannedSetsForSlot(
    null,
    ctx({ exercise: { weight_step: 1, formula_preset: "none" } }),
  ),
  null,
  "no-formula exercise without a custom scheme has no plan",
);

// ---------- fixed kilograms, no formula preset: no warmup ----------

const fixedNone: SlotPlan = {
  groups: [
    {
      sets: 3,
      reps: 15,
      reps_to: null,
      seconds: null,
      load: { type: "fixed", weight: 10 },
    },
  ],
  intensity: null,
  warmup: true,
  note: null,
};
assertEqual(
  line(
    plannedSetsForSlot(
      fixedNone,
      ctx({ exercise: { weight_step: 1, formula_preset: "none" } }),
    ),
  ),
  ["w1:10×15", "w2:10×15", "w3:10×15"],
  "fixed kg on a no-formula lift: work only",
);

// ---------- normalize / parse / labels ----------

assertEqual(
  normalizeSlotPlan({
    groups: null,
    intensity: null,
    warmup: true,
    note: null,
  }),
  null,
  "a plan with nothing in it is stored as null",
);
assertEqual(
  normalizeSlotPlan({
    groups: null,
    intensity: null,
    warmup: true,
    note: "хват шире",
  }) != null,
  true,
  "a note alone keeps the plan",
);

assertEqual(parseRepsRange("6-8"), { reps: 6, reps_to: 8 }, "dash range");
assertEqual(
  parseRepsRange(" 6 – 8 "),
  { reps: 6, reps_to: 8 },
  "en dash range",
);
assertEqual(
  parseRepsRange("8-6"),
  { reps: 8, reps_to: null },
  "inverted range keeps the low end",
);
assertEqual(parseRepsRange("abc"), null, "garbage is not reps");

assertEqual(
  slotPlanSummary(bench),
  "2×2 линейка · 3×6 линейка −10 кг",
  "bench summary",
);
assertEqual(
  slotPlanSummary({ ...feel }),
  "4×15 по самочувствию · без разминки · около отказа",
  "feel summary",
);

assertEqual(
  parseSlotPlan({
    groups: [{ sets: 3, reps: 5, load: { type: "percent", percent: 80 } }],
  })?.groups?.[0],
  {
    sets: 3,
    reps: 5,
    reps_to: null,
    seconds: null,
    load: { type: "percent", percent: 80 },
  },
  "schema fills defaults",
);
assertEqual(
  parseSlotPlan({
    groups: [{ sets: 3, reps: 5, seconds: 10, load: { type: "feel" } }],
  }),
  null,
  "reps and seconds together are rejected",
);
assertEqual(parseSlotPlan("nope"), null, "malformed plan reads as shared");

// ---------- weight lines ----------

const steps = generateTrackSteps({ start: 80, step: 2.5, count: 6 });
assertEqual(steps, [80, 82.5, 85, 87.5, 90, 92.5], "six weekly steps of 2.5");
assertEqual(
  generateTrackSteps({
    start: 80,
    step: 2.5,
    count: 6,
    deload: true,
    weightStep: 2.5,
  }).at(-1),
  62.5,
  "deload step is ~80 % of the start, floored to the step",
);
assertEqual(
  trackWeightAt({ steps }, 99),
  92.5,
  "past the end the line holds its last weight",
);
assertEqual(
  trackFinished({ steps, position: 6 }),
  true,
  "position past the last step is finished",
);
assertEqual(
  trackFinished({ steps, position: 5 }),
  false,
  "last step is still running",
);
assertEqual(
  nextTrackProposal({ steps }, 2.5),
  [85, 87.5, 90, 92.5, 95, 97.5],
  "next line starts +5",
);
assertEqual(
  trackSummary({ steps, position: 0 }),
  "80 → 92.5 кг · шаг 1 из 6",
  "summary at start",
);
assertEqual(
  trackSummary({ steps, position: 6 }),
  "80 → 92.5 кг · пройдена",
  "summary when done",
);

console.log("slot plans ok");
