export {
  averageMacros,
  KCAL_HIT_RATIO,
  type MacroAverages,
  type NutritionHits,
  nutritionHits,
  splitAverages,
} from "@/lib/nutrition/averages";
export {
  MACRO_HIT_RATIO,
  macroGoalToleranceGrams,
  macroInGoal,
  macroOverGoal,
  macroReached,
  macroRoomGrams,
  macroShortfallGrams,
} from "@/lib/nutrition/macro-hit";
export {
  type HistoryMetric,
  metricFact,
  metricTarget,
  type NutritionMetric,
  pluralDays,
} from "@/lib/nutrition/metric-copy";
export {
  type ProteinPerKgStats,
  proteinPerKgStats,
} from "@/lib/nutrition/protein-per-kg";
export {
  chronological,
  hasOlderThanRange,
  isNutritionRange,
  type NutritionRange,
  windowDays,
} from "@/lib/nutrition/range";
