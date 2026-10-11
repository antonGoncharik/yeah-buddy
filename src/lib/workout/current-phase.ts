import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isCurrentPhaseDeload(userId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("phase_type")
    .eq("user_id", userId)
    .eq("status", "current")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data?.phase_type === "deload";
}
