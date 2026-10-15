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
        label: phaseMarkLabel(point),
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

/** Name the person gave the week. The label already carries it; the key is only a fallback. */
function phaseMarkLabel(point: ProgressPoint): string {
  const parts = point.label.split(" · ");
  const named = parts.length > 1 ? parts.slice(1).join(" · ").trim() : "";
  if (named) {
    return named;
  }
  return point.phase_type ? phaseLabel(point.phase_type) : "";
}
