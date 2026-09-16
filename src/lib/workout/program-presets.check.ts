import type { SlotPlan } from "@/lib/types";
import {
  CYCLE_TEMPLATES,
  TWO_WEEK_KG_CYCLE,
} from "@/lib/workout/cycle-templates";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  PROGRAM_PRESET_IDS,
  PROGRAM_PRESETS,
} from "@/lib/workout/program-preset-data";
import { plannedSetsForSlot, slotPhaseKeys } from "@/lib/workout/slot-plan";
import { parseSlotPlan } from "@/lib/workout/slot-plan-schema";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label);
  }
}

const starterNames = new Set(STARTER_EXERCISES.map((item) => item.name));

assert(
  PROGRAM_PRESETS.length === PROGRAM_PRESET_IDS.length,
  "every preset id has a preset",
);
assert(
  new Set(PROGRAM_PRESETS.map((preset) => preset.id)).size ===
    PROGRAM_PRESETS.length,
  "preset ids are unique",
);

for (const preset of PROGRAM_PRESETS) {
  const cycleKeys = new Set((preset.cycle ?? []).map((phase) => phase.key));
  assert(
    new Set(preset.templates.map((day) => day.name)).size ===
      preset.templates.length,
    `${preset.id}: day names are unique`,
  );

  for (const day of preset.templates) {
    for (const slot of day.exercises) {
      assert(
        starterNames.has(slot.name),
        `${preset.id}: «${slot.name}» is not in the starter list, the preset would skip it`,
      );
      if (!slot.plan) {
        continue;
      }
      assert(
        parseSlotPlan(slot.plan) != null,
        `${preset.id} / ${slot.name}: the scheme does not pass the schema`,
      );
      // Схема на этап без своего цикла указывала бы в пустоту.
      for (const key of slotPhaseKeys(slot.plan)) {
        assert(
          cycleKeys.has(key),
          `${preset.id} / ${slot.name}: phase «${key}» is missing from the preset cycle`,
        );
      }
    }
  }
}

// ---------- таблица: день × неделя × упражнение ----------

const squatTable = PROGRAM_PRESETS.find(
  (preset) => preset.id === "table_squat",
);
assert(squatTable?.cycle != null, "the squat table carries its own cycle");

function planWeights(plan: SlotPlan | null, phaseKey: string): number[] {
  const rows = plannedSetsForSlot(plan, {
    kind: "dynamic",
    exercise: { weight_step: 2.5, formula_preset: "barbell" },
    formulas: { ...DEFAULT_WORKOUT_FORMULAS, cycle: squatTable?.cycle ?? [] },
    phaseKey,
    maxWeight: 200,
    trackWeight: null,
    feelWeight: null,
  });
  assert(rows != null, `the table slot has no plan on «${phaseKey}»`);
  return (rows ?? [])
    .filter((row) => row.set_type === "work")
    .map((row) => row.planned_weight ?? 0);
}

const firstDay = squatTable?.templates[0]?.exercises[0]?.plan ?? null;
const byWeek = ["w1", "w2", "w3", "w4"].map((key) =>
  planWeights(firstDay, key),
);
assert(
  new Set(byWeek.map((weights) => weights.join("/"))).size === byWeek.length,
  "the same day is different on every week of the table",
);
assert(
  byWeek.every((weights, index) =>
    index === 0 ? true : (weights[0] ?? 0) > (byWeek[index - 1]?.[0] ?? 0),
  ),
  "the table gets heavier week by week",
);
assert(
  planWeights(firstDay, "deload").length < (byWeek[0]?.length ?? 0),
  "the deload week is shorter than a working week",
);

const threeLifts = PROGRAM_PRESETS.find(
  (preset) => preset.id === "table_three_lifts",
);
const [firstLift, secondLift] = threeLifts?.templates[0]?.exercises ?? [];
assert(
  planWeights(firstLift?.plan ?? null, "w3")[0] !==
    planWeights(secondLift?.plan ?? null, "w3")[0],
  "two lifts in one day run at their own percent on the same phase",
);

for (const template of CYCLE_TEMPLATES) {
  assert(template.cycle.length > 0, `${template.id}: cycle is empty`);
  assert(
    template.cycle.length <= 8,
    `${template.id}: no more than eight phases`,
  );
  assert(
    new Set(template.cycle.map((phase) => phase.key)).size ===
      template.cycle.length,
    `${template.id}: phase keys are unique`,
  );
  assert(
    template.cycle.every((phase) => /^[a-z][a-z0-9_]*$/.test(phase.key)),
    `${template.id}: phase keys are storable`,
  );
}

const press = PROGRAM_PRESETS.find((preset) => preset.id === "press_two_week");
assert(press != null, "press two week exists");
assert(press.templates.length === 3, "press two week is three days, not six");
assert(press.cycle != null, "press two week carries a two-week cycle");
assert(
  press.cycle_loop === true && press.cycle_auto_end === true,
  "press two week loops the weeks by itself",
);
assert(
  press.cycle.every((phase) => (phase.kg_increase_on_end ?? 0) === 2.5),
  "press two week adds 2.5 kg after each week",
);

const mondayPull = press.templates[0]?.exercises.find(
  (slot) => slot.name === "Подтягивания",
)?.plan;
assert(mondayPull != null, "monday has pull-ups");
const pullW1 = plannedSetsForSlot(mondayPull, {
  kind: "dynamic",
  exercise: { weight_step: 2.5, formula_preset: "barbell" },
  formulas: { ...DEFAULT_WORKOUT_FORMULAS, cycle: TWO_WEEK_KG_CYCLE },
  phaseKey: "w1",
  maxWeight: 100,
  trackWeight: null,
  feelWeight: null,
});
const pullW2 = plannedSetsForSlot(mondayPull, {
  kind: "dynamic",
  exercise: { weight_step: 2.5, formula_preset: "barbell" },
  formulas: { ...DEFAULT_WORKOUT_FORMULAS, cycle: TWO_WEEK_KG_CYCLE },
  phaseKey: "w2",
  maxWeight: 100,
  trackWeight: null,
  feelWeight: null,
});
assert(
  (pullW1?.find((row) => row.set_type === "work")?.planned_weight ?? 0) >
    (pullW2?.find((row) => row.set_type === "work")?.planned_weight ?? 0),
  "week 2 flips the heavy monday pull to a lighter percent",
);

console.log("program presets ok");
