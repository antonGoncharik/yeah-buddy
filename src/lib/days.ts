export {
  getLastBodyWeight,
  listBodyWeights,
  setBodyWeight,
} from "@/lib/day/body-weight-store";
export {
  copyMealFromDate,
  copyMealFromYesterday,
  copyYesterday,
  listCopyDays,
  yesterdayCopyHint,
} from "@/lib/day/copy";
export { createDayFromTemplate } from "@/lib/day/create";
export {
  calendarToday,
  DayConflictError,
  isIsoDate,
  isPastDayDate,
  isWritableDayDate,
  MealConflictError,
  nextIsoDate,
  nutritionHistoryHref,
  nutritionWeekHref,
  PastDayLockedError,
  previousIsoDate,
  SourceDayMissingError,
  SourceMealEmptyError,
  todayHistoryDayHref,
  todayHomeHref,
  withDateQuery,
  YesterdayMealEmptyError,
  YesterdayMissingError,
} from "@/lib/day/dates";
export { markDateAsTrainingIfExists, setDayType } from "@/lib/day/day-type";
export { fillDayRemaining, fillMealRemaining } from "@/lib/day/fill";
export { type FoodShare, listFoodSharesInRange } from "@/lib/day/food-shares";
export { listDayHistory, listDaysInRange } from "@/lib/day/history";
export { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
export {
  addLumpMealItem,
  addMealItem,
  deleteMealItem,
  getDateForMeal,
  getMealItem,
  updateLumpMealItem,
  updateMealItemGrams,
} from "@/lib/day/meal-items";
export {
  formatRemainingLine,
  isFullTemplateGap,
  type RecipeLine,
  recipeFromTemplate,
  remainingFills,
  remainingRecipe,
} from "@/lib/day/remaining";
export { dateHasDay, getDayByDate } from "@/lib/day/store";
export {
  assertUserDayWritable,
  getUserCalendarToday,
  resolveRequestToday,
} from "@/lib/day/writable";
