import {
  pendulumAngleDeg,
  pendulumInWindow,
  pendulumPeriodMs,
  pendulumPlateKg,
  pendulumWindowDeg,
} from "@/lib/workout/barbell-pendulum";

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

assertEqual(pendulumPlateKg(0), 25, "first plate");
assertEqual(pendulumPlateKg(1), 20, "second plate");
assertEqual(pendulumWindowDeg(0), 14, "open window");
assert(pendulumWindowDeg(1) < pendulumWindowDeg(0), "window shrinks");
assertEqual(pendulumWindowDeg(40), 3.5, "window floor");
assert(pendulumWindowDeg(0, true) > pendulumWindowDeg(0), "reduced window");
assertEqual(pendulumPeriodMs(0), 1400, "first period");
assert(pendulumPeriodMs(1) < pendulumPeriodMs(0), "period shrinks");
assertEqual(pendulumPeriodMs(40), 700, "period floor");
assertEqual(pendulumAngleDeg(0), 0, "centered");
assertEqual(pendulumAngleDeg(Math.PI / 2), 26, "swing end");
assertEqual(pendulumInWindow(0, 14), true, "center is a hit");
assertEqual(pendulumInWindow(14, 14), true, "edge is a hit");
assertEqual(pendulumInWindow(14.1, 14), false, "past the edge misses");

console.log("barbell pendulum ok");
