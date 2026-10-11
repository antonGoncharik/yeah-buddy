export const FOOD_LOG_METHODS = [
  "manual",
  "quick",
  "copy",
  "template",
  "plate",
  "dictate",
  "text",
  "chat",
  "barcode",
] as const;

export type FoodLogMethod = (typeof FOOD_LOG_METHODS)[number];
