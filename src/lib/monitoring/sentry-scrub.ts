import type { ErrorEvent } from "@sentry/core";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "initdata",
  "init_data",
  "x-telegram-init-data",
]);

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 200 ? `${value.slice(0, 200)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        continue;
      }
      out[key] = scrubValue(nested);
    }
    return out;
  }
  return value;
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(event.request.headers)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
          continue;
        }
        headers[key] = value;
      }
      event.request.headers = headers;
    }
    if (event.request.data !== undefined) {
      event.request.data = scrubValue(event.request.data);
    }
  }
  return event;
}
