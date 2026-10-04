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

function weekSignature(
  bench: NonNullable<typeof preset>,
  weekKey: string,
): string {
  const days = bench.weeks?.[weekKey];
  if (!days) {
    return "";
  }
  return JSON.stringify(
    days.map((day) =>
      day.exercises.map((slot) => [slot.name, slot.plan ?? null]),
    ),
  );
}

assert(
  weekSignature(preset, "w1") !== weekSignature(preset, "w2"),
  "w2 differs from w1",
);
assert(
  weekSignature(preset, "w2") !== weekSignature(preset, "w3"),
  "w3 differs from w2",
);
assert(
  weekSignature(preset, "w13") !== weekSignature(preset, "w1"),
  "w13 differs from w1",
);

const w13Wed = preset.weeks?.w13?.[1];
const w13Fri = preset.weeks?.w13?.[2];
assert(w13Wed != null && w13Fri != null, "w13 has wed and fri");
assert(
  w13Wed.exercises.length > 0 && w13Fri.exercises.length > 0,
  "w13 mid-week days have exercises",
);

for (const phase of THIRTEEN_WEEK_CYCLE) {
  const sig = weekSignature(preset, phase.key);
  assert(sig.length > 0, `${phase.key} has week data`);
  if (phase.key !== "w1") {
    assert(sig !== weekSignature(preset, "w1"), `${phase.key} is not a copy of w1`);
  }
}

console.log("program bench ok");
