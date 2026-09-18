import type { ReactNode } from "react";

import type { chartLayout, chartSeries } from "@/lib/chart-shape";
import { cn } from "@/lib/utils";

type ChartLayout = NonNullable<ReturnType<typeof chartLayout>>;
type ChartSeries = NonNullable<ReturnType<typeof chartSeries>>;

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
  children?: ReactNode;
}) {
  const { width, height, pad } = layout;
  const dots = series.dots.length <= 16 ? series.dots : series.dots.slice(-1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full overflow-visible"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={`trend-fill-${fillId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={`trend-glow-${fillId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
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
          className="stroke-border/55"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}
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
          className="stroke-muted-foreground/65 motion-safe:animate-draw-line"
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
        strokeWidth="2.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
      />
      {dots.map((dot, index) => {
        const last = index === dots.length - 1;
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
                r="11"
                fill={`url(#trend-glow-${fillId})`}
                className="motion-safe:animate-chart-halo"
              />
            ) : null}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={last ? 5.2 : 3.4}
              fill={color}
              stroke="var(--card)"
              strokeWidth={last ? 2.4 : 1.6}
            />
          </g>
        );
      })}
      <text x={pad} y="12" className="fill-muted-foreground text-[11px]">
        {maxLabel}
      </text>
      {extraMaxLabel ? (
        <text
          x={width - pad}
          y="12"
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
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

export function ChartCaption({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center text-primary/80"
      >
        {icon}
      </span>
      <span>{children}</span>
    </p>
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
