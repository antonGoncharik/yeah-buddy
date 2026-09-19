import { mutateJson } from "@/lib/api-cache";
import { isTempId } from "@/lib/day/optimistic";
import { isNetworkError, isOffline } from "@/lib/offline";
import { enqueueOutbox, type OutboxInput } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-flush";

export async function queueMutate(input: OutboxInput): Promise<unknown | null> {
  if (isOffline() || isLocalOnly(input)) {
    enqueueOutbox(input);
    if (!isOffline()) {
      void flushOutbox();
    }
    return null;
  }

  try {
    return await mutateJson(input.url, {
      method: input.method,
      headers:
        input.body == null ? undefined : { "Content-Type": "application/json" },
      body: input.body == null ? undefined : JSON.stringify(input.body),
    });
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }
    enqueueOutbox(input);
    void flushOutbox();
    return null;
  }
}

function isLocalOnly(input: OutboxInput): boolean {
  if (input.url.includes("temp:")) {
    return true;
  }
  if (input.method === "POST") {
    return false;
  }
  return (input.clientIds ?? []).some((id) => isTempId(id));
}
