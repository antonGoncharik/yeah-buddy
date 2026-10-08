import type { InboxTopic } from "@/lib/inbox/letter";

/** Inbox (write to admin) wins over meal logging when a topic is open. */
export function mealChatBlockedByInbox(input: {
  inboxConfigured: boolean;
  inboxAdminId: number | null;
  chatId: number;
  inboxTopic: InboxTopic | null;
}): boolean {
  if (!input.inboxConfigured) {
    return false;
  }

  if (
    input.inboxAdminId != null &&
    input.chatId === input.inboxAdminId
  ) {
    return true;
  }

  return input.inboxTopic != null;
}
