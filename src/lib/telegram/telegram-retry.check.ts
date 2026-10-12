import { GrammyError } from "grammy";

import { withTelegramRetry } from "@/lib/telegram/telegram-retry";

export default (async () => {
  let attempts = 0;

  const result = await withTelegramRetry(async () => {
    attempts += 1;
    if (attempts === 1) {
      throw new GrammyError(
        "Too Many Requests",
        {
          ok: false,
          error_code: 429,
          description: "Too Many Requests",
          parameters: { retry_after: 0 },
        },
        "sendMessage",
        {},
      );
    }
    return "ok";
  });

  if (result !== "ok" || attempts !== 2) {
    throw new Error(`retry: got ${String(result)} after ${attempts} attempts`);
  }
})();
