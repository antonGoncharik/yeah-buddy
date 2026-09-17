import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteUserById(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase.from("users").delete().eq("id", userId);
  if (deleted.error) {
    throw deleted.error;
  }

  const leftover = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (leftover.error) {
    throw leftover.error;
  }
  if (leftover.data) {
    throw new Error("user still present after delete");
  }
}
