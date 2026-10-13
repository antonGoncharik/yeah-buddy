import type { SidePlate } from "@/lib/workout/rest-load";

export const PENDULUM_RULES =
  "Блин качается над грифом. Жми, когда он по центру. Мимо — башня падает.";

export const PENDULUM_AMPLITUDE_DEG = 26;
export const PENDULUM_START_WINDOW_DEG = 14;
export const PENDULUM_MIN_WINDOW_DEG = 3.5;
export const PENDULUM_WINDOW_SHRINK = 0.84;
export const PENDULUM_START_PERIOD_MS = 1400;
export const PENDULUM_MIN_PERIOD_MS = 700;
export const PENDULUM_PERIOD_SHRINK = 0.92;

const SWING_PLATES: readonly SidePlate[] = [
  25, 20, 15, 10, 5, 2.5, 1.25, 10, 15, 5, 20, 2.5,
];

export function pendulumPlateKg(height: number): SidePlate {
  const length = SWING_PLATES.length;
  const index = ((Math.floor(height) % length) + length) % length;
  return SWING_PLATES[index] ?? 10;
}

export function pendulumWindowDeg(height: number, reduced = false): number {
  const start = reduced ? 22 : PENDULUM_START_WINDOW_DEG;
  const shrink = reduced ? 0.92 : PENDULUM_WINDOW_SHRINK;
  const min = reduced ? 8 : PENDULUM_MIN_WINDOW_DEG;
  const steps = Math.max(0, Math.floor(height));
  return Math.max(min, start * shrink ** steps);
}

export function pendulumPeriodMs(height: number, reduced = false): number {
  const start = reduced ? 2400 : PENDULUM_START_PERIOD_MS;
  const shrink = reduced ? 0.96 : PENDULUM_PERIOD_SHRINK;
  const min = reduced ? 1400 : PENDULUM_MIN_PERIOD_MS;
  const steps = Math.max(0, Math.floor(height));
  return Math.max(min, start * shrink ** steps);
}

export function pendulumAngleDeg(phase: number): number {
  return Math.sin(phase) * PENDULUM_AMPLITUDE_DEG;
}

export function pendulumInWindow(angleDeg: number, windowDeg: number): boolean {
  return Math.abs(angleDeg) <= windowDeg;
}
