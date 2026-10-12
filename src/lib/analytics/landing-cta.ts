import type { ProductEvent } from "@/lib/analytics/events";
import { sanitizeProductProps } from "@/lib/analytics/props";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EVENT: ProductEvent = "landing_cta_click";

export async function trackLandingCtaClick(src: string): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const inserted = await supabase.from("product_events").insert({
      user_id: null,
      event: EVENT,
      props: sanitizeProductProps({ src }),
    });
    if (!inserted.error) {
      return;
    }
    if (isMissingProductEventsTable(inserted.error)) {
      return;
    }
    console.error("landing cta event failed", inserted.error);
  } catch (error) {
    console.error("landing cta event failed", error);
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
