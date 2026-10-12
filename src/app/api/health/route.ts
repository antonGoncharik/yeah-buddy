import { jsonError, jsonOk } from "@/lib/api/respond";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const supabase = createSupabaseServerClient();
    const ping = await supabase.from("users").select("id").limit(1);
    if (ping.error) {
      return jsonError("unhealthy", 503);
    }
    return jsonOk({ ok: true });
  } catch {
    return jsonError("unhealthy", 503);
  }
}
