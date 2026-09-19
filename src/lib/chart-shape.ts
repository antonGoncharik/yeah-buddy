export interface ChartLayout {
  min: number;
  max: number;
  dataMin: number;
  dataMax: number;
  width: number;
  height: number;
  pad: number;
  innerW: number;
  innerH: number;
  count: number;
  gridY: number[];
}

export interface ChartSeries {
  line: string;
  area: string;
  dots: Array<{ x: number; y: number }>;
}

export function chartLayout(
  scaleValues: number[],
  count: number,
  width: number,
  height: number,
  pad: number,
): ChartLayout | null {
  if (count < 2 || scaleValues.length === 0) {
    return null;
  }

  let min = Math.min(...scaleValues);
  let max = Math.max(...scaleValues);
  const dataMin = min;
  const dataMax = max;
  if (min === max) {
    min = min * 0.92;
    max = max * 1.08 || 1;
  } else {
    const room = Math.max((max - min) * 0.18, Math.abs(max) * 0.04, 1);
    min -= room;
    max += room * 0.4;
  }
  if (min < 0 && dataMin >= 0) {
    min = 0;
  }

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  return {
    min,
    max,
    dataMin,
    dataMax,
    width,
    height,
    pad,
    innerW,
    innerH,
    count,
    gridY: [pad, pad + innerH / 2, pad + innerH],
  };
}

export function chartSeries(
  values: number[],
  layout: ChartLayout,
): ChartSeries | null {
  if (values.length === 0) {
    return null;
  }

  const dots = values.map((value, index) => ({
    x: xAt(index, layout),
    y: chartY(value, layout),
  }));
  const first = dots[0];
  const last = dots[dots.length - 1];
  if (!first || !last) {
    return null;
  }

  const line = linePath(dots);
  const baseline = layout.height - layout.pad;
  const area = `${line} L ${fmt(last.x)} ${fmt(baseline)} L ${fmt(first.x)} ${fmt(baseline)} Z`;

  return { line, area, dots };
}

export function chartShape(
  values: number[],
  width: number,
  height: number,
  pad: number,
): (ChartLayout & ChartSeries) | null {
  const layout = chartLayout(values, values.length, width, height, pad);
  if (!layout) {
    return null;
  }

  const series = chartSeries(values, layout);
  if (!series) {
    return null;
  }

  return { ...layout, ...series };
}

function xAt(index: number, layout: ChartLayout): number {
  if (layout.count <= 1) {
    return layout.pad + layout.innerW / 2;
  }

  return layout.pad + (layout.innerW / (layout.count - 1)) * index;
}

export function chartY(value: number, layout: ChartLayout): number {
  const span = layout.max - layout.min;
  if (span === 0) {
    return layout.pad + layout.innerH / 2;
  }

  return (
    layout.pad + layout.innerH - ((value - layout.min) / span) * layout.innerH
  );
}

function linePath(dots: Array<{ x: number; y: number }>): string {
  const first = dots[0];
  if (!first) {
    return "";
  }
  if (dots.length === 1) {
    return `M ${fmt(first.x)} ${fmt(first.y)}`;
  }
  if (dots.length === 2) {
    const last = dots[1];
    if (!last) {
      return `M ${fmt(first.x)} ${fmt(first.y)}`;
    }
    return `M ${fmt(first.x)} ${fmt(first.y)} L ${fmt(last.x)} ${fmt(last.y)}`;
  }

  return monotoneCubic(dots);
}

function monotoneCubic(dots: Array<{ x: number; y: number }>): string {
  const lastIndex = dots.length - 1;
  const dx: number[] = [];
  const slope: number[] = [];

  for (let index = 0; index < lastIndex; index += 1) {
    const current = dots[index];
    const next = dots[index + 1];
    if (!current || !next) {
      continue;
    }
    const span = next.x - current.x;
    dx.push(span);
    slope.push(span === 0 ? 0 : (next.y - current.y) / span);
  }

  const tangent = slope.map((value) => value);
  const firstSlope = slope[0];
  const lastSlope = slope[slope.length - 1];
  if (firstSlope != null) {
    tangent[0] = firstSlope;
  }
  if (lastSlope != null) {
    tangent[lastIndex] = lastSlope;
  }

  for (let index = 1; index < lastIndex; index += 1) {
    const left = slope[index - 1];
    const right = slope[index];
    if (left == null || right == null || left * right <= 0) {
      tangent[index] = 0;
      continue;
    }
    tangent[index] = (left + right) / 2;
  }

  for (let index = 0; index < lastIndex; index += 1) {
    const segment = slope[index];
    if (segment == null || segment === 0) {
      tangent[index] = 0;
      tangent[index + 1] = 0;
      continue;
    }

    const start = tangent[index];
    const end = tangent[index + 1];
    if (start == null || end == null) {
      continue;
    }

    const a = start / segment;
    const b = end / segment;
    const steep = a * a + b * b;
    if (steep <= 9) {
      continue;
    }

    const scale = 3 / Math.sqrt(steep);
    tangent[index] = scale * a * segment;
    tangent[index + 1] = scale * b * segment;
  }

  const first = dots[0];
  if (!first) {
    return "";
  }

  let path = `M ${fmt(first.x)} ${fmt(first.y)}`;
  for (let index = 0; index < lastIndex; index += 1) {
    const current = dots[index];
    const next = dots[index + 1];
    const span = dx[index];
    const startTangent = tangent[index];
    const endTangent = tangent[index + 1];
    if (
      !current ||
      !next ||
      span == null ||
      startTangent == null ||
      endTangent == null
    ) {
      continue;
    }

    path += ` C ${fmt(current.x + span / 3)} ${fmt(current.y + (startTangent * span) / 3)} ${fmt(next.x - span / 3)} ${fmt(next.y - (endTangent * span) / 3)} ${fmt(next.x)} ${fmt(next.y)}`;
  }

  return path;
}

function fmt(value: number): string {
  return String(Math.round(value * 100) / 100);
}
