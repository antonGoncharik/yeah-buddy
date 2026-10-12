import { GrammyError } from "grammy";

const MAX_RETRY_AFTER_SEC = 30;

function retryAfterSeconds(error: GrammyError): number | null {
  const raw = error.parameters?.retry_after;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  return Math.min(raw, MAX_RETRY_AFTER_SEC);
}

export async function withTelegramRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof GrammyError) || error.error_code !== 429) {
      throw error;
    }
    const waitSec = retryAfterSeconds(error);
    if (waitSec == null) {
      throw error;
    }
    if (waitSec > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
    }
    return await run();
  }
}
