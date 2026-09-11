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

export function buildSignals(input: {
  days: DayHistoryRow[];
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
