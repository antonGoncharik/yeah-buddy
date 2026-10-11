import type { AiKind } from "@/lib/ai/quota-copy";
import { trackEvent } from "@/lib/analytics/track";

export async function trackAiRequest(
  userId: string,
  kind: AiKind,
  ok: boolean,
): Promise<void> {
  await trackEvent(userId, "ai_request", { kind, ok });
}
