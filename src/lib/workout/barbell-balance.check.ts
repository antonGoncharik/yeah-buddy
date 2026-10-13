import {
  balanceHitsTarget,
  balancePlayLine,
  balanceTiltDeg,
  balanceWouldDump,
  findSafeOrder,
  proveBalanceDeal,
} from "@/lib/workout/barbell-balance";
import { dailyChallenge } from "@/lib/workout/barbell-daily";
import { BAR_KG, toKgUnits } from "@/lib/workout/rest-load";

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

assertEqual(balanceWouldDump([25], []), false, "one big plate can hang");
assertEqual(balanceWouldDump([25, 25], []), true, "two big plates dump");
assertEqual(balanceWouldDump([25], [25]), false, "a pair is level");
assertEqual(balanceHitsTarget([25, 15], [20, 20], 100), true, "split hit");
assertEqual(balanceHitsTarget([], [], 100), false, "empty bar is not a win");
assertEqual(balanceTiltDeg([], []), 0, "empty bar is flat");
assert(balanceTiltDeg([], [10]) > 0, "right side tips clockwise");
assertEqual(balancePlayLine([], [], 100, false), "20 / 100 кг", "start line");
assertEqual(balancePlayLine([25], [], 100, true), "Съехали.", "dump line");

for (let index = 1; index <= 28; index += 1) {
  const key = `2026-10-${String(index).padStart(2, "0")}`;
  const challenge = dailyChallenge(key);
  if (!challenge) {
    throw new Error(`${key} missing`);
  }
  const proof = proveBalanceDeal(challenge.parPlates, key);
  assert(proof.pile.length <= 10, `${key} pile is ${proof.pile.length}`);
  const pileUnits = proof.pile.reduce(
    (sum, plate) => sum + toKgUnits(plate),
    0,
  );
  assertEqual(
    pileUnits,
    toKgUnits(challenge.targetKg) - toKgUnits(BAR_KG),
    `${key} pile is the day's load`,
  );
  const order = findSafeOrder(proof.left, proof.right);
  if (!order) {
    throw new Error(`${key} no safe order`);
  }
  const left: number[] = [];
  const right: number[] = [];
  for (const move of order) {
    if (move.side === "left") {
      left.push(move.plate);
    } else {
      right.push(move.plate);
    }
    assert(!balanceWouldDump(left, right), `${key} step dumped`);
  }
  assert(
    balanceHitsTarget(left, right, challenge.targetKg),
    `${key} order misses the target`,
  );
  assertEqual(
    proveBalanceDeal(challenge.parPlates, key).pile,
    proof.pile,
    `${key} stable pile`,
  );
}

console.log("barbell balance ok");
