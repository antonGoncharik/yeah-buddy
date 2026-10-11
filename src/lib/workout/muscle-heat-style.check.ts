import type { MuscleCell } from "@/lib/types";
import { slugHeatFill } from "@/lib/workout/muscle-heat-style";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

function cell(patch: Partial<MuscleCell> & Pick<MuscleCell, "id">): MuscleCell {
  return {
    label: patch.id,
    view: "back",
    sets: 8,
    sets_per_week: 4,
    volume_band: 2,
    last_trained: "2026-10-10",
    days_since: 1,
    in_next_session: false,
    missed_sessions: 0,
    weekly_sets: [4],
    recovery_percent: 40,
    ...patch,
  };
}

const byId = new Map<MuscleCell["id"], MuscleCell>([
  ["rear_delts", cell({ id: "rear_delts", recovery_percent: 40, sets: 6 })],
  ["side_delts", cell({ id: "side_delts", recovery_percent: 95, sets: 10 })],
]);

const rearFill = slugHeatFill("deltoid_posterior_r", byId, "recovery");
const fresh = slugHeatFill(
  "deltoid_posterior_r",
  new Map([
    ["rear_delts", cell({ id: "rear_delts", recovery_percent: 95, sets: 6 })],
  ]),
  "recovery",
);

assert(
  rearFill !== fresh,
  "recovery paint uses the muscle, not an empty stand-in",
);
assert(
  rearFill.includes("22%"),
  "fatigued rear delt stays in the low recovery mix",
);
