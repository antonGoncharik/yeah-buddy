import type { ReactNode } from "react";

import type { chartLayout, chartSeries } from "@/lib/chart-shape";
import { cn } from "@/lib/utils";

type ChartLayout = NonNullable<ReturnType<typeof chartLayout>>;
type ChartSeries = NonNullable<ReturnType<typeof chartSeries>>;

export const CHART_OVERLAY_COLOR =
  "color-mix(in oklab, var(--muted-foreground) 72%, transparent)";

export function TrendPlot({
  layout,
  series,
  overlay,
  color,
  fillId,
  ariaLabel,
  maxLabel,
  minLabel,
  endLabel,
  extraMaxLabel,
  guideY,
  endValue,
  children,
}: {
  layout: ChartLayout;
  series: ChartSeries;
  overlay?: ChartSeries;
  color: string;
  fillId: string;
  ariaLabel: string;
  maxLabel: string;
  minLabel: string;
  endLabel: string;
  extraMaxLabel?: string;
  guideY?: number;
  endValue?: string;
  children?: ReactNode;
}) {
  const { width, height, pad } = layout;
  const lastDot = series.dots[series.dots.length - 1];
  const dots = notableDots(series.dots);
  const peak = peakDot(series.dots);
  const showPeak =
    peak != null &&
    lastDot != null &&
    (peak.x !== lastDot.x || peak.y !== lastDot.y);
  const callout = endValue;
  const showScaleMax = maxLabel !== endValue;
  const endAnchor =
    lastDot && callout ? endValueAnchor(lastDot, width, pad) : null;
  const showGuide =
    guideY != null && guideY > pad + 10 && guideY < height - pad - 10;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-48 w-full overflow-visible"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={`trend-fill-${fillId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="55%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id={`trend-glow-${fillId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {layout.gridY.map((y) => (
        <line
          key={y}
          x1={pad}
          x2={width - pad}
          y1={y}
          y2={y}
          className="stroke-border/40"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}
      {showGuide ? (
        <line
          x1={pad}
          x2={width - pad}
          y1={guideY}
          y2={guideY}
          stroke={color}
          strokeOpacity="0.38"
          strokeWidth="1.3"
        />
      ) : null}
      {children}
      <path
        d={series.area}
        fill={`url(#trend-fill-${fillId})`}
        className="origin-bottom motion-safe:animate-fade"
      />
      {overlay ? (
        <path
          d={overlay.line}
          fill="none"
          stroke={CHART_OVERLAY_COLOR}
          className="motion-safe:animate-draw-line"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="5 5"
          pathLength={1}
        />
      ) : null}
      <path
        d={series.line}
        fill="none"
        className="motion-safe:animate-draw-line"
        stroke={color}
        strokeWidth="2.85"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
      />
      {showPeak && peak ? (
        <circle
          cx={peak.x}
          cy={peak.y}
          r="7"
          fill="none"
          stroke={color}
          strokeWidth="1.3"
          strokeOpacity="0.55"
        />
      ) : null}
      {dots.map((dot, index) => {
        const last =
          lastDot != null && dot.x === lastDot.x && dot.y === lastDot.y;
        return (
          <g
            key={`${dot.x}-${dot.y}`}
            className="motion-safe:animate-fade"
            style={{ animationDelay: `${120 + index * 40}ms` }}
          >
            {last ? (
              <circle
                cx={dot.x}
                cy={dot.y}
                r="12"
                fill={`url(#trend-glow-${fillId})`}
                className="motion-safe:animate-chart-halo"
              />
            ) : null}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={last ? 5.4 : 3.3}
              fill={color}
              stroke="var(--card)"
              strokeWidth={last ? 2.4 : 1.6}
            />
          </g>
        );
      })}
      {lastDot && callout && endAnchor ? (
        <text
          x={endAnchor.x}
          y={endAnchor.y}
          textAnchor={endAnchor.anchor}
          fill={color}
          className="text-[11px] font-medium"
        >
          {callout}
        </text>
      ) : null}
      {showScaleMax ? (
        <text x={pad} y="12" fill={color} className="text-[11px] font-medium">
          {maxLabel}
        </text>
      ) : null}
      {extraMaxLabel ? (
        <text
          x={width - pad}
          y="12"
          textAnchor="end"
          fill={CHART_OVERLAY_COLOR}
          className="text-[11px] font-medium"
        >
          {extraMaxLabel}
        </text>
      ) : null}
      <text
        x={pad}
        y={height - 4}
        className="fill-muted-foreground text-[11px]"
      >
        {minLabel}
      </text>
      <text
        x={width - pad}
        y={height - 4}
        textAnchor="end"
        className="fill-muted-foreground text-[11px]"
      >
        {endLabel}
      </text>
    </svg>
  );
}

export type ChartLegendItem = {
  label: string;
  color?: string;
  swatch: "line" | "dash" | "bar";
};

export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <LegendSwatch swatch={item.swatch} color={item.color} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChartInsight({ children }: { children: ReactNode }) {
  if (children == null || children === "") {
    return null;
  }

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

function LegendSwatch({
  swatch,
  color,
}: {
  swatch: ChartLegendItem["swatch"];
  color?: string;
}) {
  const stroke = color ?? CHART_OVERLAY_COLOR;

  if (swatch === "bar") {
    const current = color != null;
    return (
      <span aria-hidden className="flex h-2.5 w-1.5 shrink-0 items-end">
        <span
          className={cn(
            "w-full rounded-t-sm",
            current ? "h-full bg-primary" : "h-[60%] bg-primary/28",
          )}
        />
      </span>
    );
  }

  if (swatch === "dash") {
    return (
      <svg aria-hidden viewBox="0 0 22 10" className="h-2.5 w-[22px] shrink-0">
        <line
          x1="1.5"
          y1="5"
          x2="20.5"
          y2="5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 22 10" className="h-2.5 w-[22px] shrink-0">
      <line
        x1="1.5"
        y1="5"
        x2="16"
        y2="5"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="18" cy="5" r="2.2" fill={stroke} />
    </svg>
  );
}

export function ChartEmpty({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "py-6 text-center text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

function notableDots(dots: Array<{ x: number; y: number }>) {
  if (dots.length <= 16) {
    return dots;
  }

  const first = dots[0];
  const last = dots[dots.length - 1];
  const peak = peakDot(dots);
  if (!first || !last) {
    return dots.slice(-1);
  }

  const picked = [first];
  if (
    peak &&
    (peak.x !== first.x || peak.y !== first.y) &&
    (peak.x !== last.x || peak.y !== last.y)
  ) {
    picked.push(peak);
  }
  if (last.x !== first.x || last.y !== first.y) {
    picked.push(last);
  }
  return picked;
}

function peakDot(dots: Array<{ x: number; y: number }>) {
  const first = dots[0];
  if (!first) {
    return null;
  }

  let peak = first;
  for (const dot of dots) {
    if (dot.y < peak.y) {
      peak = dot;
    }
  }
  return peak;
}

function endValueAnchor(
  dot: { x: number; y: number },
  width: number,
  pad: number,
): { x: number; y: number; anchor: "start" | "end" } {
  const nearRight = dot.x > width - pad - 52;
  const nearTop = dot.y < pad + 18;
  return {
    x: nearRight ? dot.x - 10 : dot.x + 10,
    y: nearTop ? dot.y + 16 : dot.y - 12,
    anchor: nearRight ? "end" : "start",
  };
}
