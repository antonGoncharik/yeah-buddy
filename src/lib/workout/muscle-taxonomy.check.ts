import { resolveExerciseMuscles } from "@/lib/workout/muscle-taxonomy";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const squat = resolveExerciseMuscles({
  body_part: "upper legs",
  name_en: "barbell squat",
  name_ru: "Приседания со штангой",
  equipment: "barbell",
});

assert((squat.quads ?? 0) > 0.4, "squat hits quads");

const pull = resolveExerciseMuscles({
  body_part: "back",
  name_en: "pull up",
  name_ru: "Подтягивания",
  equipment: "body weight",
});

assert((pull.lats ?? 0) > 0.5, "pull-up hits lats");

const curl = resolveExerciseMuscles({
  body_part: "upper arms",
  name_en: "dumbbell curl",
  name_ru: "Подъём гантелей на бицепс",
  equipment: "dumbbell",
});

assert((curl.biceps ?? 0) > 0.7, "curl is biceps");

const cardio = resolveExerciseMuscles({
  body_part: "cardio",
  name_en: "run",
  name_ru: "Бег",
  equipment: null,
});

assert(Object.keys(cardio).length === 0, "cardio has no muscle map");
