import { THIRTEEN_WEEK_CYCLE } from "@/lib/workout/cycle-templates";
import { programPresetById } from "@/lib/workout/program-preset-utils";
import {
  programDaysForWeek,
  validatePresetWeeks,
} from "@/lib/workout/program-preset-weeks";

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label);
  }
}

const bench = programPresetById("bench_uncompromising");
assert(bench != null, "bench preset exists");
assert(validatePresetWeeks(bench) == null, "bench weeks validate");

const cycleKeys = THIRTEEN_WEEK_CYCLE.map((phase) => phase.key);
assert(
  bench.cycle?.map((phase) => phase.key).join(",") === cycleKeys.join(","),
  "bench cycle matches THIRTEEN_WEEK_CYCLE",
);

const weekKeys = Object.keys(bench.weeks ?? {}).sort();
assert(
  weekKeys.join(",") === [...cycleKeys].sort().join(","),
  "bench weeks keys match cycle",
);

for (const key of cycleKeys) {
  const days = programDaysForWeek("bench_uncompromising", key);
  assert(days != null && days.length === 3, `${key} resolves to three days`);
  const names = days.map((day) => day.name);
  assert(
    names.join() === bench.templates.map((day) => day.name).join(),
    `${key} day names match template slots`,
  );
}

assert(
  programDaysForWeek("bench_uncompromising", "w99") == null,
  "unknown week returns null",
);

console.log("program preset weeks ok");
