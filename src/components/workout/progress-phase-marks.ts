import type { PhaseType, ProgressPoint } from "@/lib/types";
import { phaseLabel } from "@/lib/workout/labels";

export function phaseMarks(
  points: ProgressPoint[],
  dots: Array<{ x: number; y: number }>,
  width: number,
  pad: number,
): Array<{ x: number; label: string; anchor: "start" | "middle" | "end" }> {
  const marks: Array<{
    x: number;
    label: string;
    anchor: "start" | "middle" | "end";
  }> = [];
  let previous: PhaseType | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const dot = dots[index];
    if (!point || !dot || point.phase_type == null) {
      previous = point?.phase_type ?? null;
      continue;
    }

    if (point.phase_type !== previous) {
      marks.push({
        x: dot.x,
        label: phaseLabel(point.phase_type),
        anchor:
          dot.x < pad + 28
            ? "start"
            : dot.x > width - pad - 28
              ? "end"
              : "middle",
      });
    }
    previous = point.phase_type;
  }

  return marks;
}
