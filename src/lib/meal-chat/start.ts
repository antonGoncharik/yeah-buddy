import { makePackStart } from "@/lib/share/start-prefix";

export const MEAL_DRAFT_START_PREFIX = "f_";

const mealDraftStart = makePackStart(MEAL_DRAFT_START_PREFIX);

export const mealDraftStartPayload = mealDraftStart.payload;
export const parseMealDraftStartPayload = mealDraftStart.parse;
