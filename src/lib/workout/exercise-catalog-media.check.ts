import {
  catalogExerciseGifUrl,
  catalogExerciseImageUrl,
} from "@/lib/workout/exercise-catalog-media";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}, got ${String(actual)}`);
  }
}

assertEqual(
  catalogExerciseGifUrl("videos/0001-abc.gif"),
  "https://cdn.jsdelivr.net/gh/antonGoncharik/yeah-buddy-exercises@main/videos/0001-abc.gif",
  "gif url uses jsdelivr",
);

assertEqual(
  catalogExerciseImageUrl("/images/0001-abc.jpg"),
  "https://cdn.jsdelivr.net/gh/antonGoncharik/yeah-buddy-exercises@main/images/0001-abc.jpg",
  "image url strips leading slash",
);
