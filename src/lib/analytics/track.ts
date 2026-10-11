import type { ProductEvent } from "@/lib/analytics/events";
import { sanitizeProductProps } from "@/lib/analytics/props";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function trackEvent(
  userId: string,
  event: ProductEvent,
  props: Record<string, unknown> = {},
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const inserted = await supabase.from("product_events").insert({
      user_id: userId,
      event,
      props: sanitizeProductProps(props),
    });
    if (!inserted.error) {
      return;
    }
    if (isMissingProductEventsTable(inserted.error)) {
      return;
    }
    console.error("product event failed", event, inserted.error);
  } catch (error) {
    console.error("product event failed", event, error);
  }
}

function isMissingProductEventsTable(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" &&
      error.message.includes("product_events"))
  );
}
