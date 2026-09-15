import { createSupabaseServerClient } from "@/lib/supabase/server";

const USER_ID_TABLES = [
  "user_settings",
  "foods",
  "days",
  "meals",
  "meal_items",
  "meal_templates",
  "meal_template_items",
  "named_meals",
  "named_meal_items",
  "workout_settings",
  "exercises",
  "global_maxes",
  "macro_cycles",
  "workout_phases",
  "phase_maxes",
  "workout_templates",
  "workout_template_exercises",
  "workout_sessions",
  "session_exercises",
  "workout_sets",
  "review_snapshots",
] as const;

const USAGE =
  "usage: npm run user:delete -- <telegram-username>";

async function countEq(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  const result = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  if (result.error) {
    throw result.error;
  }
  return result.count ?? 0;
}

async function main() {
  const username = process.argv[2];
  if (!username) {
    throw new Error(USAGE);
  }

  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("users")
    .select("id, telegram_id, username, first_name, created_at")
    .ilike("username", username);

  if (found.error) {
    throw found.error;
  }

  const matches = found.data ?? [];
  if (matches.length === 0) {
    throw new Error(`user not found: ${username}`);
  }
  if (matches.length > 1) {
    throw new Error(
      `multiple users match ${username}: ${matches.map((row) => row.id).join(", ")}`,
    );
  }

  const user = matches[0];
  if (!user || typeof user.id !== "string") {
    throw new Error(`user not found: ${username}`);
  }

  const counts: Record<string, number> = {};
  for (const table of USER_ID_TABLES) {
    counts[table] = await countEq(supabase, table, "user_id", user.id);
  }
  counts.share_packs = await countEq(
    supabase,
    "share_packs",
    "owner_user_id",
    user.id,
  );

  console.log(JSON.stringify({ user, counts }, null, 2));

  const deleted = await supabase.from("users").delete().eq("id", user.id);
  if (deleted.error) {
    throw deleted.error;
  }

  const leftover = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (leftover.error) {
    throw leftover.error;
  }
  if (leftover.data) {
    throw new Error("user still present after delete");
  }

  console.log(`deleted user ${user.username} (${user.id})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
