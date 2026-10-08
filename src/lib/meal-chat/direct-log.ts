import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";

import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { isIsoDate, withDateQuery } from "@/lib/day/dates";
import { commitPlateDraft } from "@/lib/meal-chat/commit";
import {
  formatMealChatHeader,
  formatMealChatItems,
} from "@/lib/meal-chat/format";
import { saveMealChatUndo } from "@/lib/meal-chat/store";
import {
  MEAL_CHAT_EDIT_BUTTON,
  MEAL_CHAT_TEXT_FAILED,
  MEAL_CHAT_TEXT_LOGGED,
  MEAL_CHAT_UNDO_BUTTON,
} from "@/lib/messages";
import { getMiniAppUrl } from "@/lib/telegram/bot";
import { miniAppHref } from "@/lib/telegram/share-url";
import type { MealType } from "@/lib/types";

const UNDO_CALLBACK_PREFIX = "meal_undo:";

export type MealChatLogTarget = {
  date: string;
  mealId: string;
  mealType: MealType;
};

export async function replyAfterDirectMealLog(
  ctx: Context,
  userId: string,
  target: MealChatLogTarget,
  items: PlateDraftItem[],
): Promise<boolean> {
  const saved = await commitPlateDraft(userId, target.mealId, items);
  if (!saved || saved.length === 0) {
    await ctx.reply(MEAL_CHAT_TEXT_FAILED);
    return false;
  }

  const undoToken = await saveMealChatUndo({
    userId,
    mealItemIds: saved.map((item) => item.id),
  });

  const miniAppUrl = getMiniAppUrl();
  const editPath = withDateQuery(
    `/today/meals/${target.mealId}/add`,
    isIsoDate(target.date) ? target.date : null,
    target.date,
  );
  const editUrl = miniAppUrl ? miniAppHref(miniAppUrl, editPath) : null;

  const lines = [
    MEAL_CHAT_TEXT_LOGGED,
    formatMealChatHeader(target.mealType, target.date),
    formatMealChatItems(items),
  ].join("\n");

  const keyboard = new InlineKeyboard();
  if (editUrl) {
    keyboard.webApp(MEAL_CHAT_EDIT_BUTTON, editUrl);
    keyboard.row();
  }
  keyboard.text(MEAL_CHAT_UNDO_BUTTON, `${UNDO_CALLBACK_PREFIX}${undoToken}`);

  await ctx.reply(lines, { reply_markup: keyboard });
  return true;
}

export { UNDO_CALLBACK_PREFIX };
