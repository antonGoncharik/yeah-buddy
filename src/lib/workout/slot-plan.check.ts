import type { SlotPlan, WorkoutFormulas } from "@/lib/types";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  normalizeSlotPlan,
  parseRepsRange,
  plannedSetsForSlot,
  type SlotPlanContext,
  setSlotPhaseGroups,
  slotAllGroups,
  slotGroupsForPhase,
  slotIsCustom,
  slotNeedsMax,
  slotNeedsTrack,
  slotPhaseKeys,
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

const barbell = {
  weight_step: 2.5,
  formula_preset: "barbell" as const,
};

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

// ---------- Bench: top 2×2 by the line, back-off 3×6 ten kilos lighter ----------

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
  "bench by the line: warmup derived from the top set, no 1RM needed",
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
  "percent slot without 1RM cannot be planned",
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
      ctx({
        exercise: { weight_step: 1, formula_preset: "none" },
      }),
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

assertEqual(slotPlanSummary(bench), "2×2 кг · 3×6 кг −10 кг", "bench summary");
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
  "80 кг",
  "summary is the current working kilogram",
);
assertEqual(
  trackSummary({ steps, position: 6 }),
  "92.5 кг",
  "past the end still names the last kilogram",
);

// ---------- table: own scheme per cycle phase ----------

const weeklyCycle: WorkoutFormulas = {
  ...DEFAULT_WORKOUT_FORMULAS,
  cycle: [
    { key: "w1", name: "Неделя 1", skip_warmup: false, increase_on_end: false },
    {
      key: "w2",
      name: "Неделя 2",
      skip_warmup: false,
      increase_on_end: false,
      percent_scale: 1.1,
    },
    { key: "deload", name: "Сброс", skip_warmup: true, increase_on_end: false },
  ],
};

const squatTable: SlotPlan = {
  groups: [
    {
      sets: 4,
      reps: 9,
      reps_to: null,
      seconds: null,
      load: { type: "percent", percent: 70 },
    },
  ],
  phases: {
    w2: [
      {
        sets: 5,
        reps: 7,
        reps_to: null,
        seconds: null,
        load: { type: "percent", percent: 75 },
      },
    ],
  },
  intensity: null,
  warmup: false,
  note: null,
};

assertEqual(
  line(
    plannedSetsForSlot(
      squatTable,
      ctx({ formulas: weeklyCycle, phaseKey: "w1" }),
    ),
  ),
  ["w1:70×9", "w2:70×9", "w3:70×9", "w4:70×9"],
  "a phase without its own scheme uses the slot scheme",
);
assertEqual(
  line(
    plannedSetsForSlot(
      squatTable,
      ctx({ formulas: weeklyCycle, phaseKey: "w2" }),
    ),
  ),
  ["w1:75×7", "w2:75×7", "w3:75×7", "w4:75×7", "w5:75×7"],
  "the scheme of the running phase wins, and its percent is taken as written",
);
assertEqual(
  line(
    plannedSetsForSlot(
      squatTable,
      ctx({ formulas: weeklyCycle, phaseKey: "unknown" }),
    ),
  ),
  ["w1:70×9", "w2:70×9", "w3:70×9", "w4:70×9"],
  "an unknown phase falls back to the slot scheme",
);
assertEqual(
  line(
    plannedSetsForSlot(
      { ...squatTable, phases: undefined },
      ctx({ formulas: weeklyCycle, phaseKey: "w2" }),
    ),
  ),
  ["w1:75×9", "w2:75×9", "w3:75×9", "w4:75×9"],
  "without its own scheme the slot still follows the phase percent",
);

assertEqual(
  slotGroupsForPhase(squatTable, "w2").fromPhase,
  true,
  "the resolver reports a phase scheme",
);
assertEqual(
  slotAllGroups(squatTable)?.length,
  2,
  "all groups: the slot scheme plus every phase scheme",
);
assertEqual(slotPhaseKeys(squatTable), ["w2"], "phases with their own scheme");
assertEqual(
  slotIsCustom({ ...squatTable, groups: null }),
  true,
  "a slot with only a phase scheme is custom",
);

const weekTrack: SlotPlan = {
  groups: [
    {
      sets: 3,
      reps: 5,
      reps_to: null,
      seconds: null,
      load: { type: "percent", percent: 80 },
    },
  ],
  phases: {
    w2: [
      {
        sets: 1,
        reps: 3,
        reps_to: null,
        seconds: null,
        load: { type: "track", percent: 100, offset: 0 },
      },
    ],
  },
  intensity: null,
  warmup: false,
  note: null,
};
assertEqual(
  [slotNeedsTrack(weekTrack), slotNeedsTrack(weekTrack, "w1")],
  [true, false],
  "the line is needed somewhere in the cycle, but not in week 1",
);
assertEqual(
  slotNeedsTrack(weekTrack, "w2"),
  true,
  "in week 2 the slot goes by the line",
);

assertEqual(
  normalizeSlotPlan({
    groups: null,
    phases: { w2: [] },
    intensity: null,
    warmup: true,
    note: null,
  }),
  null,
  "empty phase schemes are not stored",
);
assertEqual(
  setSlotPhaseGroups(squatTable, "w2", null).phases,
  undefined,
  "removing the last phase scheme clears the map",
);
assertEqual(
  slotPlanSummary(squatTable, weeklyCycle.cycle),
  "4×9 70 % · свои подходы: Неделя 2 · без разминки",
  "summary names the phases with their own scheme",
);

// ---------- percent of 1RM (legacy `orm` load is the same max) ----------

const ormPlan: SlotPlan = {
  groups: [
    {
      sets: 5,
      reps: 3,
      reps_to: null,
      seconds: null,
      load: { type: "orm", percent: 80 },
    },
  ],
  intensity: null,
  warmup: false,
  note: null,
};
assertEqual(
  line(plannedSetsForSlot(ormPlan, ctx({ maxWeight: 100 }))),
  ["w1:80×3", "w2:80×3", "w3:80×3", "w4:80×3", "w5:80×3"],
  "legacy percent-of-1RM uses the exercise max",
);
assertEqual(
  plannedSetsForSlot(ormPlan, ctx({ maxWeight: null })),
  null,
  "no max: nothing to plan",
);
assertEqual(
  slotNeedsMax(ormPlan, barbell),
  true,
  "percent of a max needs the exercise max",
);
assertEqual(
  parseSlotPlan(ormPlan)?.groups?.[0]?.load,
  { type: "percent", percent: 80 },
  "stored orm loads collapse to percent",
);
assertEqual(
  line(
    plannedSetsForSlot({ ...ormPlan, warmup: true }, ctx({ maxWeight: 200 })),
  ).filter((row) => row.startsWith("w1")),
  ["w1:100×5"],
  "warmup for a table slot is counted from 1RM",
);

console.log("slot plans ok");
