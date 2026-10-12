import type { ErrorEvent } from "@sentry/core";

import { scrubSentryEvent } from "@/lib/monitoring/sentry-scrub";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const event = {
  request: {
    cookies: { session: "secret" },
    headers: {
      Authorization: "Bearer secret",
      cookie: "a=b",
      "X-Telegram-Init-Data": "init",
      "X-Request-Id": "req-1",
    },
    data: {
      initData: "raw-init",
      init_data: "also-raw",
      note: "x".repeat(240),
      nested: { ok: true },
    },
  },
} as unknown as ErrorEvent;

const scrubbed = scrubSentryEvent(event);
assert(scrubbed?.request?.cookies == null, "drops cookies");
assert(
  scrubbed?.request?.headers?.["X-Request-Id"] === "req-1",
  "keeps safe headers",
);
assert(
  scrubbed?.request?.headers?.Authorization == null &&
    scrubbed?.request?.headers?.cookie == null &&
    scrubbed?.request?.headers?.["X-Telegram-Init-Data"] == null,
  "drops auth headers",
);
const data = scrubbed?.request?.data as {
  initData?: string;
  init_data?: string;
  note?: string;
  nested?: { ok?: boolean };
};
assert(data.initData == null && data.init_data == null, "drops init data");
assert(
  data.note?.endsWith("…") === true && (data.note?.length ?? 0) < 240,
  "truncates long strings",
);
assert(data.nested?.ok === true, "keeps nested fields");

console.log("sentry scrub ok");
