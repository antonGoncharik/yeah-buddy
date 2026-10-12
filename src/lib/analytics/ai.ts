import type { AiKind } from "@/lib/ai/quota-copy";
import { trackEvent } from "@/lib/analytics/track";

export async function trackAiRequest(
  userId: string,
  kind: AiKind,
  ok: boolean,
  outcome?: "empty" | "error",
): Promise<void> {
  await trackEvent(userId, "ai_request", { kind, ok });
  if (!ok) {
    await trackEvent(userId, outcome === "empty" ? "ai_empty" : "ai_failed", {
      kind,
    });
  }
}
