import { ChartCaption, TrendPlot } from "@/components/chart/trend-plot";
import {
  COOKIE_VIEWBOX,
  CookieMark,
  Doodle,
} from "@/components/layout/doodles";
import type { chartLayout, chartSeries } from "@/lib/chart-shape";
import { formatIsoDate } from "@/lib/day/format";

export function NutritionTrendSvg({
  layout,
  factSeries,
  targetSeries,
  color,
  label,
  fillId,
  maxLabel,
  minLabel,
  lastDate,
  caption,
}: {
  layout: NonNullable<ReturnType<typeof chartLayout>>;
  factSeries: NonNullable<ReturnType<typeof chartSeries>>;
  targetSeries?: NonNullable<ReturnType<typeof chartSeries>>;
  color: string;
  label: string;
  fillId: string;
  maxLabel: string;
  minLabel: string;
  lastDate: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TrendPlot
        layout={layout}
        series={factSeries}
        overlay={targetSeries}
        color={color}
        fillId={`food-${fillId}`}
        ariaLabel={`${label} по дням`}
        maxLabel={maxLabel}
        minLabel={minLabel}
        endLabel={formatIsoDate(lastDate, "d MMM")}
      />
      {caption ? (
        <ChartCaption
          icon={
            <Doodle className="size-4" viewBox={COOKIE_VIEWBOX}>
              <CookieMark />
            </Doodle>
          }
        >
          {caption}
        </ChartCaption>
      ) : null}
    </div>
  );
}
