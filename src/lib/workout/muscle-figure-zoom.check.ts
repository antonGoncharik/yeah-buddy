import {
  clampMusclePan,
  clampMuscleZoom,
  muscleZoomPan,
} from "@/lib/workout/muscle-figure-zoom";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(clampMuscleZoom(Number.NaN) === 1, "non-finite scale falls back to 1");
assert(clampMuscleZoom(0.2) === 1, "scale below 1 clamps to 1");
assert(clampMuscleZoom(4) === 3, "scale above 3 clamps to 3");
assert(clampMuscleZoom(1.75) === 1.75, "in-range scale is kept");

const reset = clampMusclePan({ x: 40, y: -20 }, 1, 200, 400);
assert(reset.x === 0 && reset.y === 0, "pan resets at 1x");

const limited = clampMusclePan({ x: 500, y: -500 }, 2, 200, 400);
assert(
  limited.x === 100 && limited.y === -200,
  "pan stays inside the zoomed frame",
);

const still = muscleZoomPan({
  startScale: 1,
  nextScale: 2,
  startPan: { x: 0, y: 0 },
  focal: { x: 40, y: 10 },
  finger: { x: 40, y: 10 },
});
assert(still.x === -40 && still.y === -10, "pinch keeps the focal point fixed");

const followed = muscleZoomPan({
  startScale: 1,
  nextScale: 2,
  startPan: { x: 0, y: 0 },
  focal: { x: 40, y: 0 },
  finger: { x: 50, y: 0 },
});
assert(followed.x === -30 && followed.y === 0, "pinch follows a moving finger");
