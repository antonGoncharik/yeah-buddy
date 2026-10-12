import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function claimPackApplication(
  userId: string,
  packToken: string,
): Promise<"new" | "already"> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase.from("pack_applications").insert({
    user_id: userId,
    pack_token: packToken,
  });

  if (!inserted.error) {
    return "new";
  }

  if (inserted.error.code === "23505") {
    return "already";
  }

  if (inserted.error.code === "42P01" || inserted.error.code === "PGRST205") {
    return "new";
  }

  throw inserted.error;
}
