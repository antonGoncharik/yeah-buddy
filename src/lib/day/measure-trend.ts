import {
  formatBodyWeight,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import { shiftIsoDate } from "@/lib/day/dates";

export function weekAverageDelta(input: {
  today: string;
  current: number | null;
  points: readonly { date: string; value: number }[];
  window?: number;
}): { delta: number; average: number } | null {
  if (input.current == null || !(input.current > 0)) {
    return null;
  }
  const window = input.window ?? 7;
  const start = shiftIsoDate(input.today, -window);
  const samples = input.points.filter(
    (point) =>
      point.date >= start && point.date < input.today && point.value > 0,
  );
  if (samples.length < 2) {
    return null;
  }
  const average =
    Math.round(
      (samples.reduce((sum, point) => sum + point.value, 0) / samples.length) *
        10,
    ) / 10;
  const delta = Math.round((input.current - average) * 10) / 10;
  return { delta, average };
}

export function measureTrendLine(input: {
  today: string;
  current: number | null;
  points: readonly { date: string; value: number }[];
  unit: "кг" | "см";
}): string | null {
  const trend = weekAverageDelta(input);
  if (!trend) {
    return null;
  }
  return `${formatSignedBodyWeight(trend.delta)} ${input.unit} к средней за 7 дней (${formatBodyWeight(trend.average)})`;
}
