import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function templateNamesById(
  userId: string,
  templateIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(templateIds)];
  if (unique.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("user_id", userId)
    .in("id", unique);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    if (typeof row.id === "string" && typeof row.name === "string") {
      names.set(row.id, row.name);
    }
  }

  return names;
}
