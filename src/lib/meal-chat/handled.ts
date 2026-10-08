import type { Context } from "grammy";

const MEAL_CHAT_HANDLED = Symbol("mealChatHandled");

export function markMealChatHandled(ctx: Context): void {
  (ctx as Context & { [MEAL_CHAT_HANDLED]?: boolean })[MEAL_CHAT_HANDLED] =
    true;
}

export function isMealChatHandled(ctx: Context): boolean {
  return (
    (ctx as Context & { [MEAL_CHAT_HANDLED]?: boolean })[MEAL_CHAT_HANDLED] ===
    true
  );
}
