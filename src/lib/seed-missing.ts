import type { SupabaseClient } from "@supabase/supabase-js";

export const UNIQUE_VIOLATION = "23505";

export async function seededNames(
  supabase: SupabaseClient,
  table: "foods" | "exercises",
  userId: string,
): Promise<Set<string>> {
  const existing = await supabase
    .from(table)
    .select("name")
    .eq("user_id", userId);

  if (existing.error) {
    throw existing.error;
  }

  return new Set(
    (existing.data ?? [])
      .map((row) => row.name)
      .filter((name): name is string => typeof name === "string"),
  );
}

export function throwUnlessUniqueViolation(
  error: { code?: string } | null,
): void {
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw error;
  }
}
