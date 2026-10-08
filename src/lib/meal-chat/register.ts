import { type Bot, type Context, InlineKeyboard } from "grammy";

import { analyzeDictate } from "@/lib/ai/dictate";
import { ReviewError } from "@/lib/ai/errors";
import { readGeminiKeys } from "@/lib/ai/gemini";
import { analyzePlate } from "@/lib/ai/plate";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { analyzeTextMeal } from "@/lib/ai/text-meal";
import { normalizeMealLogText } from "@/lib/ai/text-meal-input";
import { PLATE_IMAGE_MAX_BYTES } from "@/lib/ai/plate-image";
import { deleteMealItem } from "@/lib/day/meal-items";
import { getServerEnv } from "@/lib/env";
import { listFoods } from "@/lib/food/store";
import {
  messageHasRelayMedia,
  readInboxChatId,
} from "@/lib/inbox/letter";
import { readInboxThread } from "@/lib/inbox/store";
import {
  replyAfterDirectMealLog,
  UNDO_CALLBACK_PREFIX,
} from "@/lib/meal-chat/direct-log";
import {
  formatMealChatHeader,
  formatMealChatItems,
} from "@/lib/meal-chat/format";
import {
  isMealChatHandled,
  markMealChatHandled,
} from "@/lib/meal-chat/handled";
import { mealChatBlockedByInbox } from "@/lib/meal-chat/inbox-gate";
import { mealDraftStartPayload } from "@/lib/meal-chat/start";
import {
  consumeMealChatUndo,
  saveMealChatDraft,
} from "@/lib/meal-chat/store";
import { resolveMealChatTarget } from "@/lib/meal-chat/target";
import {
  audioMimeFromTelegram,
  downloadTelegramFile,
  HeavyTelegramFileError,
  imageMimeFromPath,
} from "@/lib/meal-chat/telegram-file";
import { findMealChatUser } from "@/lib/meal-chat/user";
import {
  AI_DICTATE_AUDIO_FAILED,
  AI_DICTATE_EMPTY,
  MEAL_CHAT_DRAFT_BUTTON,
  MEAL_CHAT_LOCKED,
  MEAL_CHAT_PHOTO_EMPTY,
  MEAL_CHAT_PHOTO_FAILED,
  MEAL_CHAT_TEXT_FAILED,
  MEAL_CHAT_UNDO_DONE,
  MEAL_CHAT_UNDO_EXPIRED,
} from "@/lib/messages";
import { getMiniAppUrl } from "@/lib/telegram/bot";
import { withStartApp } from "@/lib/telegram/share-url";

export function registerMealChat(bot: Bot): void {
  bot.callbackQuery(/^meal_undo:/, async (ctx) => {
    try {
      await onMealUndo(ctx);
    } catch (error) {
      console.error(error);
      await ctx.answerCallbackQuery();
    }
  });

  bot.on("message", async (ctx) => {
    try {
      await onMealChatMessage(ctx);
    } catch (error) {
      console.error(error);
    }
  });
}

export { isMealChatHandled };

async function onMealChatMessage(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (
    !message ||
    ctx.chat?.type !== "private" ||
    !ctx.from ||
    ctx.from.is_bot ||
    message.successful_payment
  ) {
    return;
  }

  if (message.text?.startsWith("/")) {
    return;
  }

  const adminId = readInboxChatId(getServerEnv().INBOX_CHAT_ID);
  const inboxConfigured = adminId != null;
  if (inboxConfigured && ctx.chat) {
    const thread = await readInboxThread(ctx.from.id);
    if (
      mealChatBlockedByInbox({
        inboxConfigured: true,
        inboxAdminId: adminId,
        chatId: ctx.chat.id,
        inboxTopic: thread.topic,
      })
    ) {
      return;
    }
  }

  const user = await findMealChatUser(ctx.from.id);
  if (!user) {
    return;
  }

  const photo = message.photo;
  if (photo && photo.length > 0) {
    if (readGeminiKeys("plate").length === 0) {
      return;
    }
    await handlePhoto(ctx, user);
    return;
  }

  const voice = message.voice;
  if (voice?.file_id) {
    if (readGeminiKeys("dictate").length === 0) {
      return;
    }
    await handleVoice(ctx, user, voice);
    return;
  }

  const text = message.text?.trim() ?? message.caption?.trim() ?? "";
  if (text === "" || messageHasRelayMedia(message)) {
    return;
  }

  if (readGeminiKeys("text").length === 0) {
    return;
  }

  const normalized = normalizeMealLogText(text);
  if (!normalized) {
    return;
  }

  await handleText(ctx, user, normalized);
}

async function requireWritableTarget(
  ctx: Context,
  user: { userId: string; timeZone: string },
) {
  const target = await resolveMealChatTarget(user.userId, user.timeZone);
  if (!target.ok) {
    if (target.reason === "locked") {
      markMealChatHandled(ctx);
      await ctx.reply(MEAL_CHAT_LOCKED);
    }
    return null;
  }

  markMealChatHandled(ctx);
  return target;
}

async function loadFoodCatalog(userId: string) {
  const [all, recent] = await Promise.all([
    listFoods(userId, "all"),
    listFoods(userId, "recent"),
  ]);
  const allRefs = all.map(toPlateFoodRef);
  const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
  return { allRefs, catalog };
}

async function handlePhoto(
  ctx: Context,
  user: { userId: string; timeZone: string },
): Promise<void> {
  const message = ctx.message;
  const photos = message?.photo;
  if (!photos || photos.length === 0) {
    return;
  }

  const target = await requireWritableTarget(ctx, user);
  if (!target) {
    return;
  }

  const fileId = photos[photos.length - 1]?.file_id;
  if (!fileId) {
    await ctx.reply(MEAL_CHAT_PHOTO_FAILED);
    return;
  }

  let image: { mimeType: string; data: string };
  try {
    const { buffer, path } = await downloadTelegramFile(
      ctx,
      fileId,
      PLATE_IMAGE_MAX_BYTES,
    );
    image = {
      mimeType: imageMimeFromPath(path),
      data: buffer.toString("base64"),
    };
  } catch (error) {
    console.error(error);
    await ctx.reply(MEAL_CHAT_PHOTO_FAILED);
    return;
  }

  try {
    const { allRefs, catalog } = await loadFoodCatalog(user.userId);
    const draft = await analyzePlate(user.userId, catalog, image, allRefs);

    if (draft.items.length === 0) {
      await ctx.reply(MEAL_CHAT_PHOTO_EMPTY);
      return;
    }

    const token = await saveMealChatDraft({
      userId: user.userId,
      mealId: target.mealId,
      date: target.date,
      items: draft.items,
    });

    const miniAppUrl = getMiniAppUrl();
    const lines = [
      formatMealChatHeader(target.mealType, target.date),
      formatMealChatItems(draft.items),
      "",
      "Проверь в дневнике и сохрани.",
    ].join("\n");

    const keyboard = new InlineKeyboard();
    if (miniAppUrl) {
      keyboard.webApp(
        MEAL_CHAT_DRAFT_BUTTON,
        withStartApp(miniAppUrl, mealDraftStartPayload(token)),
      );
    }

    await ctx.reply(lines, miniAppUrl ? { reply_markup: keyboard } : {});
  } catch (error) {
    const text =
      error instanceof ReviewError ? error.message : MEAL_CHAT_PHOTO_FAILED;
    await ctx.reply(text);
  }
}

async function handleVoice(
  ctx: Context,
  user: { userId: string; timeZone: string },
  voice: { file_id: string; mime_type?: string },
): Promise<void> {
  const target = await requireWritableTarget(ctx, user);
  if (!target) {
    return;
  }

  let audio: { mimeType: string; data: string };
  try {
    const { buffer, path } = await downloadTelegramFile(ctx, voice.file_id);
    const mimeType = audioMimeFromTelegram(path, voice.mime_type);
    if (!mimeType) {
      await ctx.reply(AI_DICTATE_AUDIO_FAILED);
      return;
    }
    audio = { mimeType, data: buffer.toString("base64") };
  } catch (error) {
    if (error instanceof HeavyTelegramFileError) {
      await ctx.reply(error.message);
      return;
    }
    console.error(error);
    await ctx.reply(AI_DICTATE_AUDIO_FAILED);
    return;
  }

  try {
    const { allRefs, catalog } = await loadFoodCatalog(user.userId);
    const draft = await analyzeDictate(
      user.userId,
      catalog,
      audio,
      allRefs,
    );

    if (draft.items.length === 0) {
      await ctx.reply(AI_DICTATE_EMPTY);
      return;
    }

    await replyAfterDirectMealLog(ctx, user.userId, target, draft.items);
  } catch (error) {
    const message =
      error instanceof ReviewError ? error.message : MEAL_CHAT_TEXT_FAILED;
    await ctx.reply(message);
  }
}

async function handleText(
  ctx: Context,
  user: { userId: string; timeZone: string },
  text: string,
): Promise<void> {
  const target = await requireWritableTarget(ctx, user);
  if (!target) {
    return;
  }

  try {
    const { allRefs, catalog } = await loadFoodCatalog(user.userId);
    const draft = await analyzeTextMeal(user.userId, catalog, text, allRefs);

    if (draft.items.length === 0) {
      await ctx.reply(MEAL_CHAT_PHOTO_EMPTY);
      return;
    }

    await replyAfterDirectMealLog(ctx, user.userId, target, draft.items);
  } catch (error) {
    const message =
      error instanceof ReviewError ? error.message : MEAL_CHAT_TEXT_FAILED;
    await ctx.reply(message);
  }
}

async function onMealUndo(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  if (!data.startsWith(UNDO_CALLBACK_PREFIX) || !ctx.from) {
    await ctx.answerCallbackQuery();
    return;
  }

  const token = data.slice(UNDO_CALLBACK_PREFIX.length);
  const user = await findMealChatUser(ctx.from.id);
  if (!user) {
    await ctx.answerCallbackQuery({ text: MEAL_CHAT_UNDO_EXPIRED });
    return;
  }

  const itemIds = await consumeMealChatUndo(user.userId, token);
  if (!itemIds || itemIds.length === 0) {
    await ctx.answerCallbackQuery({ text: MEAL_CHAT_UNDO_EXPIRED });
    return;
  }

  for (const id of itemIds) {
    await deleteMealItem(user.userId, id);
  }

  await ctx.answerCallbackQuery({ text: MEAL_CHAT_UNDO_DONE });
  if (ctx.callbackQuery?.message) {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    } catch {
      // message may be too old to edit
    }
  }
}
