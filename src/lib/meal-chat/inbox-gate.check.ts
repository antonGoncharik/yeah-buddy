import assert from "node:assert/strict";

import { mealChatBlockedByInbox } from "@/lib/meal-chat/inbox-gate";

assert.equal(
  mealChatBlockedByInbox({
    inboxConfigured: false,
    inboxAdminId: 1,
    chatId: 2,
    inboxTopic: "improve",
  }),
  false,
  "inbox off",
);

assert.equal(
  mealChatBlockedByInbox({
    inboxConfigured: true,
    inboxAdminId: 1,
    chatId: 2,
    inboxTopic: null,
  }),
  false,
  "no topic yet",
);

assert.equal(
  mealChatBlockedByInbox({
    inboxConfigured: true,
    inboxAdminId: 1,
    chatId: 2,
    inboxTopic: "program",
  }),
  true,
  "topic open",
);

assert.equal(
  mealChatBlockedByInbox({
    inboxConfigured: true,
    inboxAdminId: 7,
    chatId: 7,
    inboxTopic: null,
  }),
  true,
  "admin chat",
);

console.log("meal chat inbox gate ok");
