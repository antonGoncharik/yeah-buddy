import { measureTrendLine, weekAverageDelta } from "@/lib/day/measure-trend";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  weekAverageDelta({
    today: "2026-10-15",
    current: 80.2,
    points: [
      { date: "2026-10-08", value: 80.4 },
      { date: "2026-10-10", value: 80.8 },
      { date: "2026-10-15", value: 80.2 },
    ],
  }),
  { delta: -0.4, average: 80.6 },
  "today is not part of the previous week",
);

assertEqual(
  weekAverageDelta({
    today: "2026-10-15",
    current: 80,
    points: [{ date: "2026-10-14", value: 80 }],
  }),
  null,
  "one earlier weigh-in is not an average",
);

assertEqual(
  measureTrendLine({
    today: "2026-10-15",
    current: 80.2,
    unit: "кг",
    points: [
      { date: "2026-10-08", value: 80.4 },
      { date: "2026-10-10", value: 80.8 },
    ],
  }),
  "−0.4 кг к средней за 7 дней (80.6)",
  "signed delta against the week",
);
