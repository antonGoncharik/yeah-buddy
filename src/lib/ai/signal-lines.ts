import { gymSignalLines } from "@/lib/ai/signal-gym";
import { maxesSignalLines } from "@/lib/ai/signal-maxes";
import { nutritionSignalLines } from "@/lib/ai/signal-nutrition";
import type {
  ReviewAverages,
  ReviewMaxRow,
  ReviewWeight,
} from "@/lib/ai/types";
import type { FoodShare } from "@/lib/days";
import type { CurrentMacroState, DayHistoryRow } from "@/lib/types";
import type { PeakRecord, WeekTonnage } from "@/lib/workout/progress-control";

export function buildSignals(input: {
  days: DayHistoryRow[];
  from?: string;
  to?: string;
  windowDays?: number;
  rest: ReviewAverages | null;
  training: ReviewAverages | null;
  proteinHit: number;
  proteinTotal: number;
  kcalHit: number;
  kcalTotal: number;
  weight: ReviewWeight;
  foods: FoodShare[];
  gym: {
    completed: number;
    skipped: number;
    planHit: number;
    planTotal: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
    feels?: { easy: number; close: number; miss: number };
    perWeek?: number | null;
    circleSize?: number;
    records?: PeakRecord[];
    tonnageWeeks?: WeekTonnage[];
    rateHalves?: { first: number; second: number } | null;
    gapDays?: number | null;
  };
  phase: CurrentMacroState;
  maxes: { grown: ReviewMaxRow[]; stalled: ReviewMaxRow[] };
  categories?: Array<{ name: string; percent: number }>;
  avgPercent?: number | null;
  avgRelativePercent?: number | null;
}): string[] {
  return [
    ...nutritionSignalLines(input),
    ...gymSignalLines(input),
    ...maxesSignalLines(input),
  ];
}

export function reviewDetailSignals(signals: string[]): string[] {
  return signals.filter((line) => !isScoreboardSignal(line));
}

function isScoreboardSignal(line: string): boolean {
  if (
    line.startsWith("Белок дотянули:") ||
    line.startsWith("Калории около цели") ||
    line.startsWith("Вес ") ||
    line.startsWith("Зал:") ||
    line.startsWith("К весу тела") ||
    line.startsWith("По группам:")
  ) {
    return true;
  }
  if (
    line.startsWith("Частота:") ||
    line.startsWith("Тоннаж по неделям:") ||
    line.startsWith("Тоннаж за неделю:") ||
    line.startsWith("Рекорды:") ||
    line.startsWith("Как прошло:") ||
    line.startsWith("Дыра в зале:")
  ) {
    return true;
  }
  return line.startsWith("Белок ") && line.includes("г/кг при цели");
}
