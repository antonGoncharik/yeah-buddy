import { chartLayout, chartSeries, chartShape } from "@/lib/chart-shape";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assert(chartLayout([10], 1, 320, 168, 16) == null, "one point is not a curve");
assert(chartLayout([], 2, 320, 168, 16) == null, "empty scale");
assert(chartShape([40], 64, 28, 2) == null, "sparkline waits for two points");

const two = chartShape([10, 20], 100, 50, 10);
assert(two != null, "two points draw");
assertEqual(two?.line.includes("C"), false, "two points stay a straight line");
assert(two?.line.startsWith("M ") === true, "line starts at first dot");
assert(two?.line.includes(" L ") === true, "two points use L");
assert(two?.area.endsWith("Z") === true, "area closes");

const climb = chartShape([10, 20, 40], 100, 50, 10);
assert(climb != null, "three points draw");
assert(climb?.line.includes(" C ") === true, "three points smooth");
assertEqual(climb?.dots.length, 3, "dots stay on data");
assert(
  (climb?.min ?? 0) < 10 && (climb?.max ?? 0) > 40,
  "scale leaves air around the line",
);
assertEqual(climb?.dataMin, 10, "label min stays on data");
assertEqual(climb?.dataMax, 40, "label max stays on data");

const peak = chartShape([10, 40, 10], 100, 50, 10);
assert(peak != null, "peak draws");
const mid = peak?.dots[1];
assert(mid != null, "peak has a middle dot");
if (peak && mid) {
  const controls = [
    ...peak.line.matchAll(/C ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/g),
  ];
  assert(controls.length === 2, "peak has two cubics");
  for (const match of controls) {
    const y1 = Number(match[2]);
    const y2 = Number(match[4]);
    assert(
      y1 + 0.01 >= mid.y,
      `control does not overshoot peak: ${y1} vs ${mid.y}`,
    );
    assert(
      y2 + 0.01 >= mid.y,
      `control does not overshoot peak: ${y2} vs ${mid.y}`,
    );
  }
}

const layout = chartLayout([80, 100, 90, 110], 2, 200, 80, 8);
assert(layout != null, "layout can scale from extra values");
const series = layout ? chartSeries([80, 110], layout) : null;
assert(series != null, "series follows layout count");
assertEqual(series?.dots.length, 2, "series uses its own values");
