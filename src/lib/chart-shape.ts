export interface ChartLayout {
  min: number;
  max: number;
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
  if (count < 1 || scaleValues.length === 0) {
    return null;
  }

  let min = Math.min(...scaleValues);
  let max = Math.max(...scaleValues);
  if (min === max) {
    min = min * 0.92;
    max = max * 1.08 || 1;
  }

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  return {
    min,
    max,
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
    y: yAt(value, layout),
  }));

  const line = dots
    .map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`)
    .join(" ");
  const last = dots[dots.length - 1];
  const first = dots[0];
  if (!first || !last) {
    return null;
  }

  const area = `${line} L ${last.x} ${layout.height - layout.pad} L ${first.x} ${layout.height - layout.pad} Z`;

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

function yAt(value: number, layout: ChartLayout): number {
  const span = layout.max - layout.min;
  return (
    layout.pad + layout.innerH - ((value - layout.min) / span) * layout.innerH
  );
}
