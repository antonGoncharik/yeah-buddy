import type { FunnelEvent } from "@/lib/funnel/events";
import { UNIQUE_VIOLATION } from "@/lib/seed-missing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { FunnelEvent } from "@/lib/funnel/events";
export { FUNNEL_EVENTS, isFunnelEvent } from "@/lib/funnel/events";

export async function recordFunnelEvent(
  userId: string,
  event: FunnelEvent,
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const inserted = await supabase.from("funnel_events").insert({
      user_id: userId,
      event,
    });
    if (!inserted.error) {
      return;
    }
    if (
      inserted.error.code === UNIQUE_VIOLATION ||
      isMissingFunnelTable(inserted.error)
    ) {
      return;
    }
    console.error("funnel event failed", event, inserted.error);
  } catch (error) {
    console.error("funnel event failed", event, error);
  }
}

function isMissingFunnelTable(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" &&
      error.message.includes("funnel_events"))
  );
}
