import {
  barbellDailyGrade,
  barbellDailyPlayLine,
  canTakePlate,
  dailyChallenge,
  formatSidePlateStack,
  minMovesForTarget,
  minSidePlates,
  movesHitTarget,
  rackAllows,
} from "@/lib/workout/barbell-daily";
import { BAR_KG, loadedKg, toKgUnits } from "@/lib/workout/rest-load";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const day = dailyChallenge("2026-10-01");
if (!day) {
  throw new Error("daily challenge exists");
}
assertEqual(dailyChallenge("nope"), null, "bad day key");
assertEqual(dailyChallenge("2026-10-01"), day, "stable day target");
assertEqual(minMovesForTarget(80), 2, "80 is 25+5");
assertEqual(minSidePlates(120), [25, 5], "side plates for 30 kg per side");
assertEqual(movesHitTarget([25, 5], 80), true, "game plates match target");
assertEqual(loadedKg([25, 5]), 80, "loaded total");
assertEqual(barbellDailyGrade(2, 2), "perfect", "par is perfect");
assertEqual(barbellDailyGrade(3, 2), "solid", "one over is solid");
assertEqual(barbellDailyGrade(5, 2), "done", "many moves still done");
assertEqual(formatSidePlateStack([25, 5]), "25+5", "stack label");
assertEqual(barbellDailyPlayLine(20, 80), "20 / 80 кг", "hint stays hidden");
assertEqual(
  barbellDailyPlayLine(20, 80, true),
  "20 / 80 кг · на сторону ещё 30 кг",
  "hint after a miss",
);
assertEqual(
  barbellDailyPlayLine(90, 80, true),
  "Много.",
  "over hides the hint",
);

const targets = new Set<number>();
for (let index = 1; index <= 28; index += 1) {
  const key = `2026-10-${String(index).padStart(2, "0")}`;
  const challenge = dailyChallenge(key);
  if (!challenge) {
    throw new Error(`${key} missing`);
  }
  targets.add(challenge.targetKg);
  assert(
    challenge.targetKg >= 80 && challenge.targetKg <= 220,
    `${key} target ${challenge.targetKg} out of range`,
  );
  assert(
    challenge.parMoves >= 4 && challenge.parMoves <= 6,
    `${key} par ${challenge.parMoves}`,
  );
  assertEqual(
    challenge.parPlates.length,
    challenge.parMoves,
    `${key} par length`,
  );
  assert(new Set(challenge.parPlates).size >= 2, `${key} plate variety`);
  assert(
    rackAllows(challenge.rack, challenge.parPlates),
    `${key} rack allows par`,
  );
  const perSide = (toKgUnits(challenge.targetKg) - toKgUnits(BAR_KG)) / 2;
  const greedy = minSidePlates(perSide);
  assert(
    greedy != null && !rackAllows(challenge.rack, greedy),
    `${key} greedy still fits`,
  );
  assertEqual(
    loadedKg(challenge.parPlates),
    challenge.targetKg,
    `${key} par loads the bar`,
  );
  const heavy = challenge.parPlates[0];
  if (heavy != null) {
    const used = Array.from({ length: 8 }, () => heavy);
    assertEqual(
      canTakePlate(challenge.rack, used, heavy),
      false,
      `${key} stock runs out`,
    );
  }
}
assert(targets.size >= 4, "month has more than one load");

console.log("barbell daily ok");
