export {
  DAY_TEMPLATE_TITLES,
  DAY_TYPE_LABELS,
} from "@/lib/nutrition/day-labels";
export { QUICK_GRAMS } from "@/lib/nutrition/grams";
export {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  DEFAULT_REST_MACRO_GOALS,
  DEFAULT_TRAINING_MACRO_GOALS,
  defaultMacroGoals,
  formatGrams,
  formatKcal,
  formatMacro,
  type Macros,
  macroGoalsFromProtein,
  roundMacros,
  sumMealItems,
  sumMeals,
} from "@/lib/nutrition/macros";
export {
  isOnboardingGoal,
  isOnboardingSex,
  ONBOARDING_GOAL_OPTIONS,
  ONBOARDING_SEX_OPTIONS,
  type OnboardingGoal,
  type OnboardingSex,
  suggestFatGrams,
  suggestMacroGoals,
  suggestProteinGrams,
  suggestRestKcal,
} from "@/lib/nutrition/suggest-protein";
export {
  filledMealTypes,
  getMealLabel,
  getMealOrder,
  hiddenMealSlotsNote,
  isDayType,
  isMealType,
  isMealVisible,
  MEAL_DISPLAY_ORDER,
  mealExistsReplace,
  shareMealLine,
  visibleMealTypes,
} from "@/lib/nutrition/meals";
