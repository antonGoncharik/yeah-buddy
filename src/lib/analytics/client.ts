import type { ClientProductEvent } from "@/lib/analytics/events";
import { postJson } from "@/lib/api-cache";

export async function trackClientEvent(
  event: ClientProductEvent,
  props: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  try {
    await postJson("/api/events", { event, props });
  } catch {
    // analytics must not break UX
  }
}
