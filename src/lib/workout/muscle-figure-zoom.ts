export const MUSCLE_FIGURE_ZOOM_MIN = 1;
export const MUSCLE_FIGURE_ZOOM_MAX = 3;
export const MUSCLE_FIGURE_ZOOM_STEP = 0.5;

export type MuscleFigurePoint = { x: number; y: number };

export function clampMuscleZoom(scale: number): number {
  if (!Number.isFinite(scale)) {
    return MUSCLE_FIGURE_ZOOM_MIN;
  }
  return Math.min(
    MUSCLE_FIGURE_ZOOM_MAX,
    Math.max(MUSCLE_FIGURE_ZOOM_MIN, scale),
  );
}

export function clampMusclePan(
  pan: MuscleFigurePoint,
  scale: number,
  width: number,
  height: number,
): MuscleFigurePoint {
  if (scale <= 1 || width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

/** Keep the point under the fingers stable while scale changes around the center. */
export function muscleZoomPan(input: {
  startScale: number;
  nextScale: number;
  startPan: MuscleFigurePoint;
  focal: MuscleFigurePoint;
  finger: MuscleFigurePoint;
}): MuscleFigurePoint {
  const start = input.startScale > 0 ? input.startScale : 1;
  const ratio = input.nextScale / start;
  return {
    x: input.startPan.x * ratio + input.finger.x - input.focal.x * ratio,
    y: input.startPan.y * ratio + input.finger.y - input.focal.y * ratio,
  };
}
