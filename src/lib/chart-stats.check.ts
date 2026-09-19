import {
  chartInsight,
  chartMean,
  chartSpan,
  countChartHits,
} from "@/lib/chart-stats";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(chartMean([]), null, "mean of empty");
assertEqual(chartMean([10, 20, 30]), 20, "mean of three");

assertEqual(chartSpan([]), null, "span of empty");
assertEqual(chartSpan([12]), { first: 12, last: 12, delta: 0 }, "span of one");
assertEqual(
  chartSpan([100, 90, 120]),
  { first: 100, last: 120, delta: 20 },
  "span last minus first",
);

assertEqual(
  countChartHits([110, 90, 120], [100, 100, 100], "atLeast"),
  { hit: 2, total: 3 },
  "atLeast counts days on or above target",
);
assertEqual(
  countChartHits([110, 80], [100, 0], "atLeast"),
  { hit: 1, total: 1 },
  "zero target is skipped",
);
assertEqual(
  countChartHits([1910, 1500], [1900, 1900], "within", 0.1),
  { hit: 1, total: 2 },
  "within uses ratio",
);
assertEqual(countChartHits([10], [0], "atLeast"), null, "no countable targets");

assertEqual(
  chartInsight(["Среднее 118 г", null, "цель 120 г"]),
  "Среднее 118 г · цель 120 г",
  "join skips empty",
);
assertEqual(chartInsight([null, undefined]), null, "empty insight");
