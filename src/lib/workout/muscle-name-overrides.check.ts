import type { ExerciseMuscleMeta } from "@/lib/workout/muscle-aggregate";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function weightsFor(name: string) {
  const meta: ExerciseMuscleMeta = {
    exercise_id: "custom",
    name: name.split(" ")[0] ?? name,
    body_part: null,
    name_en: null,
    name_ru: name,
    equipment: null,
    source_exercise_id: null,
    target: null,
    secondary_muscles: null,
  };
  return resolveExerciseMuscleWeights(meta);
}

const fingers = weightsFor(
  "сгибание проксимальный фаланг пальцев с ручкой на лямках на блоке",
);
assert(fingers.forearms === 1, "finger curl is forearms");
assert(Object.keys(fingers).length === 1, "finger curl stays on forearms");

const wrist = weightsFor("сгибание кисти с ручкой на лямках на блоке");
assert(wrist.forearms === 1, "wrist curl is forearms");

const larratt = weightsFor("сгибание кисти с ручкой Ларратта");
assert(larratt.forearms === 1, "Larratt handle is forearms");

const abduction = weightsFor("отведение кисти на блоке");
assert(abduction.forearms === 1, "wrist abduction is forearms");

const pronation = weightsFor("пронация предплечья с лямкой на блоке");
assert(pronation.forearms === 1, "pronation is forearms");

const brachioradialis = weightsFor(
  "подъем на плечелучевую с лямкой с нижнего блока",
);
assert(brachioradialis.forearms === 1, "brachioradialis is forearms");
assert((brachioradialis.biceps ?? 0) > 0, "brachioradialis also hits biceps");

const side = weightsFor("боковой нажим корпусом");
assert(side.chest === 1, "side pressure hits chest");
assert(side.front_delts === 1, "side pressure hits front delt");
assert(side.subscapularis === 1, "side pressure hits subscapularis");
assert((side.triceps ?? 0) > 0, "side pressure hits triceps");
assert((side.biceps ?? 0) > 0, "side pressure hits biceps");
assert((side.forearms ?? 0) > 0, "side pressure hits forearms");
assert((side.obliques ?? 0) > 0, "side pressure hits obliques");

const sideDelt = weightsFor("махи с гантелями на среднюю дельту");
assert(sideDelt.side_delts === 1, "lateral raise is side delt");
assert((sideDelt.lats ?? 0) === 0, "lateral raise is not lats");

const rear = weightsFor("махи с гантелями на заднюю дельту");
assert(rear.rear_delts === 1, "rear raise is rear delt");
assert((rear.lats ?? 0) === 0, "rear raise is not a row");
assert((rear.biceps ?? 0) === 0, "rear raise is not biceps");

const seated = weightsFor("жим со штангой сидя");
assert(seated.front_delts === 1, "seated press is front delt");
assert((seated.chest ?? 0) === 0, "seated press is not bench");
assert((seated.triceps ?? 0) > 0, "seated press hits triceps");
