import {
  ChartInsight,
  ChartLegend,
  TrendPlot,
} from "@/components/chart/trend-plot";
import { chartShape, chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean, chartSpan } from "@/lib/chart-stats";
import {
  formatBodyWeight,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";

export function ProgressBodyWeightChart({
  weights,
  from,
  to,
}: {
  weights: Array<{ date: string; weight: number }>;
  from: string | null;
  to: string;
}) {
  const points = weights.filter(
    (row) => (from == null || row.date >= from) && row.date <= to,
  );
  if (points.length < 2) {
    return null;
  }

  const values = points.map((row) => row.weight);
  const width = 320;
  const height = 128;
  const shape = chartShape(values, width, height, 14);
  if (!shape) {
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const mean = chartMean(values);
  const span = chartSpan(values);
  const delta =
    first && last ? formatSignedBodyWeight(last.weight - first.weight) : null;

  return (
    <section className="flex flex-col gap-2.5 border-t border-border/70 pt-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Вес тела</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Рядом с силой — чтобы видеть рекомпозицию, а не только кг на штанге.
        </p>
      </div>
      <ChartInsight>
        {chartInsight([
          span && span.first !== span.last
            ? `${formatBodyWeight(span.first)} → ${formatBodyWeight(span.last)} кг`
            : null,
          delta ? delta : null,
          mean != null ? `средний ${formatBodyWeight(mean)} кг` : null,
        ])}
      </ChartInsight>
      <TrendPlot
        layout={shape}
        series={shape}
        color="var(--foreground)"
        fillId="body-weight"
        ariaLabel="Вес тела за период"
        maxLabel={`${formatBodyWeight(shape.dataMax)} кг`}
        minLabel={`${formatBodyWeight(shape.dataMin)} кг`}
        endLabel={last ? formatIsoDate(last.date, "d MMM") : ""}
        guideY={
          mean != null && shape.dataMax !== shape.dataMin
            ? chartY(mean, shape)
            : undefined
        }
        endValue={last ? `${formatBodyWeight(last.weight)} кг` : undefined}
      />
      <ChartLegend
        items={[
          { label: "Взвешивания", color: "var(--foreground)", swatch: "line" },
        ]}
      />
    </section>
  );
}
