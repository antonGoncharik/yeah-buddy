import {
  mapCatalogExerciseDetail,
  parseCatalogExercisePayload,
} from "@/lib/workout/exercise-catalog-map";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}, got ${String(actual)}`);
  }
}

const fromDb = mapCatalogExerciseDetail({
  id: "uuid-1",
  source_exercise_id: "0054",
  name_en: "barbell lunge",
  name_ru: "Выпады",
  equipment: "barbell",
  body_part: "upper legs",
  gif_path: "videos/0054-t8iSghb.gif",
  image_path: "images/0054-t8iSghb.jpg",
  instruction_steps: { ru: ["шаг"] },
});

assertEqual(
  fromDb.gif_url.includes("videos/0054-t8iSghb.gif"),
  true,
  "db row builds gif url from gif_path",
);

const apiPayload = {
  exercise: {
    id: "uuid-1",
    source_exercise_id: "0054",
    name_en: "barbell lunge",
    name_ru: "Выпады",
    equipment: "barbell",
    body_part: "upper legs",
    gif_url:
      "https://cdn.jsdelivr.net/gh/antonGoncharik/yeah-buddy-exercises@main/videos/0054-t8iSghb.gif",
    image_url:
      "https://cdn.jsdelivr.net/gh/antonGoncharik/yeah-buddy-exercises@main/images/0054-t8iSghb.jpg",
    instruction_steps: { ru: ["шаг"] },
  },
};

const parsed = parseCatalogExercisePayload(apiPayload);
assertEqual(
  parsed?.gif_url,
  apiPayload.exercise.gif_url,
  "api json keeps absolute gif_url without gif_path",
);

const broken = mapCatalogExerciseDetail({
  id: "uuid-1",
  source_exercise_id: "0054",
  name_en: "barbell lunge",
  name_ru: null,
  equipment: null,
  body_part: null,
  instruction_steps: {},
});

assertEqual(broken.gif_url, "", "missing paths yield empty url not undefined string");
