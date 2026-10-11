import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getServerEnv } from "@/lib/env";
import { isInboxAuthor, readInboxChatId } from "@/lib/inbox/letter";
import { getInboxOpenUrl } from "@/lib/telegram/bot";

export const GET = sessionRoute(async (session) => {
  const inboxChatId = getServerEnv().INBOX_CHAT_ID;
  if (
    readInboxChatId(inboxChatId) == null ||
    isInboxAuthor(session.telegramId, inboxChatId)
  ) {
    return jsonOk({ url: null });
  }

  const url = await getInboxOpenUrl();
  return jsonOk({ url });
});
