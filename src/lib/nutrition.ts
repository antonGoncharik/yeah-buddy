export {
  DAY_TEMPLATE_TITLES,
  DAY_TYPE_LABELS,
} from "@/lib/nutrition/day-labels";
export {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  DEFAULT_REST_MACRO_GOALS,
  DEFAULT_TRAINING_MACRO_GOALS,
  defaultMacroGoals,
  formatKcal,
  formatMacro,
  type Macros,
  macroGoalsFromProtein,
  roundMacros,
  sumMealItems,
  sumMeals,
} from "@/lib/nutrition/macros";
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
  visibleMealTypes,
} from "@/lib/nutrition/meals";
