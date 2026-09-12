import type { phaseMarks } from "@/components/workout/progress-phase-marks";
import type { chartLayout, chartSeries, chartShape } from "@/lib/chart-shape";
import { formatTonnage } from "@/lib/workout/numbers";
import type { ProgressMetric } from "@/lib/workout/progress-stats";

type ChartShape = NonNullable<ReturnType<typeof chartShape>>;
type ChartSeries = NonNullable<ReturnType<typeof chartSeries>>;
type ChartLayout = NonNullable<ReturnType<typeof chartLayout>>;
type PhaseMark = ReturnType<typeof phaseMarks>[number];

export function ProgressChartPlot({
  metric,
  width,
  height,
  shape,
  marks,
  lastLabel,
  unit,
  formatValue,
  tonnageShape,
  tonnageLayout,
}: {
  metric: ProgressMetric;
  width: number;
  height: number;
  shape: ChartShape;
  marks: PhaseMark[];
  lastLabel: string;
  unit: string;
  formatValue: (value: number) => string;
  tonnageShape: ChartSeries | null;
  tonnageLayout: ChartLayout | null;
}) {
  const showTonnage = tonnageShape != null && tonnageLayout != null;

  return (
    <>
      <svg
        key={metric}
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label={
          metric === "seconds"
            ? "Прогресс удержания"
            : metric === "relative"
              ? "Прогресс к весу тела"
              : showTonnage
                ? "Прогресс весов и тоннажа"
                : "Прогресс весов"
        }
      >
        <defs>
          <linearGradient
            id={`progress-fill-${metric}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {shape.gridY.map((y) => (
          <line
            key={y}
            x1="16"
            x2={width - 16}
            y1={y}
            y2={y}
            className="stroke-border/80"
            strokeWidth="1"
          />
        ))}
        {marks.map((mark) => (
          <line
            key={`phase-${mark.x}-${mark.label}`}
            x1={mark.x}
            x2={mark.x}
            y1="28"
            y2={height - 16}
            className="stroke-muted-foreground/45"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ))}
        <path
          d={shape.area}
          fill={`url(#progress-fill-${metric})`}
          className="origin-bottom motion-safe:animate-fade"
        />
        <path
          d={shape.line}
          fill="none"
          className="stroke-primary motion-safe:animate-draw-line"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
        />
        {showTonnage ? (
          <path
            d={tonnageShape.line}
            fill="none"
            className="stroke-muted-foreground motion-safe:animate-draw-line"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="5 4"
            pathLength={1}
          />
        ) : null}
        {shape.dots.map((dot, index) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={index === shape.dots.length - 1 ? 5 : 3.5}
            className="fill-primary motion-safe:animate-fade"
            style={{ animationDelay: `${120 + index * 40}ms` }}
          />
        ))}
        {showTonnage
          ? tonnageShape.dots.map((dot, index) => (
              <circle
                key={`t-${dot.x}-${dot.y}`}
                cx={dot.x}
                cy={dot.y}
                r={index === tonnageShape.dots.length - 1 ? 3.5 : 2.5}
                className="fill-muted-foreground motion-safe:animate-fade"
                style={{ animationDelay: `${140 + index * 40}ms` }}
              />
            ))
          : null}
        {marks.map((mark) => (
          <text
            key={`label-${mark.x}-${mark.label}`}
            x={mark.x}
            y="22"
            textAnchor={mark.anchor}
            className="fill-muted-foreground text-[10px]"
          >
            {mark.label}
          </text>
        ))}
        <text x="16" y="12" className="fill-muted-foreground text-[11px]">
          {formatValue(shape.max)} {unit}
        </text>
        {showTonnage ? (
          <text
            x={width - 16}
            y="12"
            textAnchor="end"
            className="fill-muted-foreground text-[11px]"
          >
            {formatTonnage(tonnageLayout.max)}
          </text>
        ) : null}
        <text
          x="16"
          y={height - 4}
          className="fill-muted-foreground text-[11px]"
        >
          {formatValue(shape.min)} {unit}
        </text>
        <text
          x={width - 16}
          y={height - 4}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {lastLabel}
        </text>
      </svg>
      {showTonnage ? (
        <p className="text-[11px] text-muted-foreground">кг · тоннаж</p>
      ) : null}
    </>
  );
}
