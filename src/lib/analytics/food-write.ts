import type { FoodLogMethod } from "@/lib/analytics/food-log";
import { trackEvent } from "@/lib/analytics/track";
import { recordFunnelEvent } from "@/lib/funnel";

export async function logFoodWrite(
  userId: string,
  method: FoodLogMethod,
): Promise<void> {
  await recordFunnelEvent(userId, "first_food");
  await trackEvent(userId, "food_logged", { method });
}
