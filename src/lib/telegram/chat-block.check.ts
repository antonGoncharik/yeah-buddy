import assert from "node:assert/strict";

import { isPermanentChatBlock } from "@/lib/telegram/chat-block";

assert.equal(
  isPermanentChatBlock({
    error_code: 403,
    description: "Forbidden: bot was blocked by the user",
  }),
  true,
);
assert.equal(
  isPermanentChatBlock({
    error_code: 403,
    description: "Forbidden: user is deactivated",
  }),
  true,
);
assert.equal(
  isPermanentChatBlock({
    error_code: 400,
    description: "Bad Request: chat not found",
  }),
  true,
);
assert.equal(
  isPermanentChatBlock({
    error_code: 403,
    description: "Forbidden: not enough rights to send text messages",
  }),
  false,
);
assert.equal(isPermanentChatBlock({ error_code: 403, description: "" }), false);
assert.equal(
  isPermanentChatBlock({
    error_code: 429,
    description: "Too Many Requests: bot was blocked by the user",
  }),
  false,
);

export default Promise.resolve();
