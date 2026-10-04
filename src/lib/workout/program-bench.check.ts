import { isDevTester, DEV_TELEGRAM_ID } from "@/lib/auth/dev-tester";
import {
  DEV_ONLY_PROGRAM_PRESET_IDS,
  isDevOnlyProgramPresetId,
} from "@/lib/workout/program-preset-access";
import { BENCH_UNCOMPROMISING_PRESET } from "@/lib/workout/program-guide-bench-uncompromising";
import { THIRTEEN_WEEK_CYCLE } from "@/lib/workout/cycle-templates";
import {
  pickerProgramPresetIds,
  programIsOffered,
  programPresetById,
} from "@/lib/workout/program-preset-utils";
import { validatePresetWeeks } from "@/lib/workout/program-preset-weeks";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";
import { parseSlotPlan } from "@/lib/workout/slot-plan-schema";

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label);
  }
}

const starterNames = new Set(STARTER_EXERCISES.map((item) => item.name));

assert(isDevOnlyProgramPresetId("bench_uncompromising"), "bench is dev-only");
assert(
  DEV_ONLY_PROGRAM_PRESET_IDS.includes("bench_uncompromising"),
  "dev list",
);

assert(!programIsOffered("bench_uncompromising", [], {}), "hidden without dev");
assert(
  programIsOffered("bench_uncompromising", [], { devTester: true }),
  "dev tester can apply",
);
assert(
  isDevTester({ userId: "u", telegramId: DEV_TELEGRAM_ID }),
  "dev telegram id",
);

assert(
  !pickerProgramPresetIds(null, [], {}).includes("bench_uncompromising"),
  "picker hides bench",
);
assert(
  pickerProgramPresetIds(null, [], { devTester: true }).includes(
    "bench_uncompromising",
  ),
  "picker shows bench for dev",
);

const preset = programPresetById("bench_uncompromising");
assert(preset != null, "preset exists");
assert(
  preset.cycle?.length === THIRTEEN_WEEK_CYCLE.length,
  "thirteen week cycle",
);
assert(preset.cycle_auto_end === true, "macro ends after week 13");
assert(validatePresetWeeks(preset) == null, "weeks validate");

for (const key of THIRTEEN_WEEK_CYCLE.map((phase) => phase.key)) {
  const days = preset.weeks?.[key];
  assert(days != null && days.length === 3, `${key} has three days`);
}

for (const day of preset.templates) {
  for (const slot of day.exercises) {
    assert(starterNames.has(slot.name), `w1 slot «${slot.name}» in starter`);
    if (slot.plan) {
      assert(parseSlotPlan(slot.plan) != null, `plan ok: ${slot.name}`);
    }
  }
}

for (const [weekKey, days] of Object.entries(preset.weeks ?? {})) {
  for (const day of days) {
    for (const slot of day.exercises) {
      assert(
        starterNames.has(slot.name),
        `${weekKey} «${slot.name}» in starter`,
      );
    }
  }
}

assert(BENCH_UNCOMPROMISING_PRESET.name.includes("жим"), "Russian title");

console.log("program bench ok");
