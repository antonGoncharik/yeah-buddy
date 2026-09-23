import { type Bot, type Context, GrammyError, InlineKeyboard } from "grammy";

import { getServerEnv } from "@/lib/env";
import {
  cleanInboxName,
  cleanInboxUsername,
  clipInboxDraft,
  type InboxTopic,
  inboxAdminHeader,
  inboxAdminMessage,
  inboxPrompt,
  messageHasRelayMedia,
  parseInboxCallback,
  parseInboxUserId,
  readInboxChatId,
} from "@/lib/inbox/letter";
import {
  findInboxRoute,
  readInboxThread,
  rememberInboxRoute,
  saveInboxThread,
} from "@/lib/inbox/store";
import {
  INBOX_AUTHOR,
  INBOX_CLOSED,
  INBOX_FAILED,
  INBOX_HOLD,
  INBOX_MENU,
  INBOX_OTHER,
  INBOX_PICK_FIRST,
  INBOX_REPLY_CLOSED,
  INBOX_REPLY_LOST,
  INBOX_REPLY_NEED,
  INBOX_SENT,
  INBOX_TEXT_ONLY,
  INBOX_TOPIC_CHANGE,
  INBOX_TOPIC_IMPROVE,
  INBOX_TOPIC_PROGRAM,
} from "@/lib/messages";

export function registerInbox(bot: Bot): void {
  bot.callbackQuery(/^inbox:/, async (ctx) => {
    try {
      await onInboxCallback(ctx);
    } catch (error) {
      console.error(error);
      await answerQuiet(ctx);
    }
  });

  bot.on("message", async (ctx) => {
    try {
      await onInboxMessage(ctx);
    } catch (error) {
      console.error(error);
    }
  });
}

export async function openInboxStart(
  ctx: Context,
  which: InboxTopic | "menu",
): Promise<void> {
  if (ctx.chat?.type !== "private" || !ctx.from) {
    return;
  }

  const adminId = inboxAdminId();
  if (adminId == null) {
    await ctx.reply(INBOX_CLOSED);
    return;
  }

  if (ctx.chat.id === adminId) {
    await ctx.reply(INBOX_AUTHOR);
    return;
  }

  if (which === "menu") {
    const cleared = await saveInboxThread(ctx.from.id, {
      topic: null,
      draft: null,
    });
    if (!cleared) {
      await ctx.reply(INBOX_FAILED);
      return;
    }
    await ctx.reply(INBOX_MENU, { reply_markup: menuKeyboard() });
    return;
  }

  const saved = await saveInboxThread(ctx.from.id, {
    topic: which,
    draft: null,
  });
  if (!saved) {
    await ctx.reply(INBOX_FAILED);
    return;
  }

  await ctx.reply(inboxPrompt(which), { reply_markup: otherKeyboard() });
}

async function onInboxCallback(ctx: Context): Promise<void> {
  await answerQuiet(ctx);
  if (ctx.chat?.type !== "private" || !ctx.from) {
    return;
  }

  const choice = parseInboxCallback(ctx.callbackQuery?.data ?? "");
  if (!choice) {
    return;
  }

  const adminId = inboxAdminId();
  if (adminId == null) {
    await ctx.reply(INBOX_CLOSED);
    return;
  }

  if (ctx.chat.id === adminId) {
    await present(ctx, INBOX_AUTHOR, null, true);
    return;
  }

  const thread = await readInboxThread(ctx.from.id);
  if (choice === "menu") {
    const saved = await saveInboxThread(ctx.from.id, {
      topic: null,
      draft: thread.draft,
    });
    if (!saved) {
      await ctx.reply(INBOX_FAILED);
      return;
    }
    await present(ctx, INBOX_MENU, menuKeyboard(), true);
    return;
  }

  const saved = await saveInboxThread(ctx.from.id, {
    topic: choice,
    draft: thread.draft,
  });
  if (!saved) {
    await ctx.reply(INBOX_FAILED);
    return;
  }

  if (thread.draft) {
    const sent = await sendToAdmin(ctx.api, adminId, ctx.from.id, choice, {
      username: cleanInboxUsername(ctx.from.username),
      firstName: cleanInboxName(ctx.from.first_name),
      body: thread.draft,
      media: null,
    });
    if (!sent) {
      await ctx.reply(INBOX_FAILED);
      return;
    }
    await saveInboxThread(ctx.from.id, { topic: choice, draft: null });
    await present(ctx, INBOX_SENT, otherKeyboard(), true);
    return;
  }

  await present(ctx, inboxPrompt(choice), otherKeyboard(), true);
}

async function onInboxMessage(ctx: Context): Promise<void> {
  const message = ctx.message;
  if (
    !message ||
    ctx.chat?.type !== "private" ||
    !ctx.from ||
    ctx.from.is_bot
  ) {
    return;
  }

  if (message.successful_payment) {
    return;
  }

  const adminId = inboxAdminId();
  if (adminId == null) {
    return;
  }

  if (ctx.chat.id === adminId) {
    await onAuthorMessage(ctx, adminId);
    return;
  }

  if (message.text?.startsWith("/")) {
    return;
  }

  const thread = await readInboxThread(ctx.from.id);
  if (!thread.topic) {
    await holdUntilTopic(ctx, message);
    return;
  }

  const body = message.text ?? message.caption ?? "";
  const media = messageHasRelayMedia(message);
  if (!body.trim() && !media) {
    await ctx.reply(INBOX_TEXT_ONLY);
    return;
  }

  const sent = await sendToAdmin(ctx.api, adminId, ctx.from.id, thread.topic, {
    username: cleanInboxUsername(ctx.from.username),
    firstName: cleanInboxName(ctx.from.first_name),
    body,
    media: media
      ? { chatId: ctx.chat.id, messageId: message.message_id }
      : null,
  });
  if (!sent) {
    await ctx.reply(INBOX_FAILED);
    return;
  }

  await ctx.reply(INBOX_SENT, { reply_markup: otherKeyboard() });
}

async function holdUntilTopic(
  ctx: Context,
  message: NonNullable<Context["message"]>,
): Promise<void> {
  const text = message.text?.trim() ?? "";
  if (text !== "" && !messageHasRelayMedia(message) && ctx.from) {
    const saved = await saveInboxThread(ctx.from.id, {
      topic: null,
      draft: clipInboxDraft(text),
    });
    if (!saved) {
      await ctx.reply(INBOX_FAILED);
      return;
    }
    await ctx.reply(INBOX_HOLD, { reply_markup: menuKeyboard() });
    return;
  }

  await ctx.reply(INBOX_PICK_FIRST, { reply_markup: menuKeyboard() });
}

async function onAuthorMessage(ctx: Context, adminId: number): Promise<void> {
  const message = ctx.message;
  const reply = message?.reply_to_message;
  if (!message || !reply) {
    if (message?.text && !message.text.startsWith("/")) {
      await ctx.reply(INBOX_AUTHOR);
    }
    return;
  }

  const quoted = reply.text ?? reply.caption ?? "";
  const userId =
    (quoted ? parseInboxUserId(quoted) : null) ??
    (await findInboxRoute(reply.message_id));
  if (userId == null || userId === adminId) {
    await ctx.reply(INBOX_REPLY_NEED);
    return;
  }

  try {
    await ctx.api.copyMessage(userId, adminId, message.message_id);
  } catch (error) {
    if (isBlockedChat(error)) {
      await ctx.reply(INBOX_REPLY_CLOSED);
      return;
    }
    console.error(error);
    await ctx.reply(INBOX_REPLY_LOST);
  }
}

async function sendToAdmin(
  api: Context["api"],
  adminId: number,
  userId: number,
  topic: InboxTopic,
  input: {
    username: string | null;
    firstName: string | null;
    body: string;
    media: { chatId: number; messageId: number } | null;
  },
): Promise<boolean> {
  const text = inboxAdminMessage(
    inboxAdminHeader({
      telegramId: userId,
      topic,
      username: input.username,
      firstName: input.firstName,
    }),
    input.body,
  );

  try {
    const sent = await api.sendMessage(adminId, text, {
      link_preview_options: { is_disabled: true },
    });
    await rememberInboxRoute(sent.message_id, userId);
  } catch (error) {
    console.error(error);
    return false;
  }

  if (!input.media) {
    return true;
  }

  try {
    const copied = await api.copyMessage(
      adminId,
      input.media.chatId,
      input.media.messageId,
    );
    await rememberInboxRoute(copied.message_id, userId);
  } catch (error) {
    console.error(error);
  }

  return true;
}

async function present(
  ctx: Context,
  text: string,
  keyboard: InlineKeyboard | null,
  edit: boolean,
): Promise<void> {
  const extra = keyboard ? { reply_markup: keyboard } : {};
  if (edit) {
    try {
      await ctx.editMessageText(text, extra);
      return;
    } catch (error) {
      if (isNotModified(error)) {
        return;
      }
      console.error(error);
    }
  }

  await ctx.reply(text, extra);
}

function menuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(INBOX_TOPIC_IMPROVE, "inbox:improve")
    .row()
    .text(INBOX_TOPIC_CHANGE, "inbox:change")
    .row()
    .text(INBOX_TOPIC_PROGRAM, "inbox:program");
}

function otherKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(INBOX_OTHER, "inbox:menu");
}

function inboxAdminId(): number | null {
  return readInboxChatId(getServerEnv().INBOX_CHAT_ID);
}

async function answerQuiet(ctx: Context): Promise<void> {
  try {
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error(error);
  }
}

function isNotModified(error: unknown): boolean {
  return (
    error instanceof GrammyError &&
    error.description.toLowerCase().includes("message is not modified")
  );
}

function isBlockedChat(error: unknown): boolean {
  if (!(error instanceof GrammyError)) {
    return false;
  }

  if (error.error_code === 403) {
    return true;
  }

  if (error.error_code !== 400) {
    return false;
  }

  const description = error.description.toLowerCase();
  return (
    description.includes("chat not found") ||
    description.includes("user is deactivated") ||
    description.includes("bot was blocked")
  );
}
