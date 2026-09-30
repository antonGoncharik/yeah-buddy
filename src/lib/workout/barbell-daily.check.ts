import {
  barbellDailyGrade,
  dailyChallenge,
  minMovesForTarget,
  minSidePlates,
  movesHitTarget,
} from "@/lib/workout/barbell-daily";
import { loadedKg } from "@/lib/workout/rest-load";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const day = dailyChallenge("2026-10-01");
if (!day) {
  throw new Error("daily challenge exists");
}
assertEqual(day.targetKg >= 60 && day.targetKg <= 140, true, "target range");
assertEqual(
  dailyChallenge("2026-10-01")?.targetKg,
  day.targetKg,
  "stable day target",
);
assertEqual(minMovesForTarget(80), 2, "80 is 25+5");
assertEqual(minSidePlates(120), [25, 5], "side plates for 30 kg per side");
assertEqual(movesHitTarget([25, 5], 80), true, "game plates match target");
assertEqual(loadedKg([25, 5]), 80, "loaded total");
assertEqual(barbellDailyGrade(2, 2), "perfect", "par is perfect");
assertEqual(barbellDailyGrade(3, 2), "solid", "one over is solid");
assertEqual(barbellDailyGrade(5, 2), "done", "many moves still done");

console.log("barbell daily ok");
