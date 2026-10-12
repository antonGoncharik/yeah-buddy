import { ApiError } from "@/lib/api-cache";
import { isNetworkError } from "@/lib/offline";

export type OutboxFlushErrorKind = "retryable" | "terminal" | "auth";

export const MAX_OUTBOX_RETRY_ATTEMPTS = 12;
export const OUTBOX_BACKOFF_MIN_MS = 1_000;
export const OUTBOX_BACKOFF_MAX_MS = 30_000;

export function classifyOutboxFlushError(error: unknown): OutboxFlushErrorKind {
  if (isNetworkError(error)) {
    return "retryable";
  }
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "auth";
    }
    if (error.status === 409) {
      return "retryable";
    }
    if (error.status === 429 || error.status >= 500) {
      return "retryable";
    }
    if (error.status >= 400 && error.status < 500) {
      return "terminal";
    }
  }
  return "terminal";
}

export function outboxBackoffMs(attempt: number): number {
  const safe = Math.max(1, attempt);
  const scaled = OUTBOX_BACKOFF_MIN_MS * 2 ** (safe - 1);
  return Math.min(OUTBOX_BACKOFF_MAX_MS, scaled);
}

export function readFlushErrorMeta(error: unknown): {
  status: number | null;
  message: string;
} {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof Error) {
    return { status: null, message: error.message };
  }
  return { status: null, message: "sync failed" };
}
