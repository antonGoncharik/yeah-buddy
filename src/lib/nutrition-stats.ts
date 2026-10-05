export {
  averageMacros,
  KCAL_HIT_RATIO,
  type MacroAverages,
  type NutritionHits,
  nutritionHits,
  splitAverages,
} from "@/lib/nutrition/averages";
export {
  macroGoalToleranceGrams,
  macroInGoal,
  MACRO_HIT_RATIO,
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
