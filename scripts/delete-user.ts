import { deleteUserById } from "@/lib/account/delete";
import { ACCOUNT_USER_ID_TABLES } from "@/lib/account/tables";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const USAGE = "usage: npm run user:delete -- <telegram-username>";

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
  for (const table of ACCOUNT_USER_ID_TABLES) {
    counts[table] = await countEq(supabase, table, "user_id", user.id);
  }
  counts.share_packs = await countEq(
    supabase,
    "share_packs",
    "owner_user_id",
    user.id,
  );

  console.log(JSON.stringify({ user, counts }, null, 2));

  await deleteUserById(user.id);

  console.log(`deleted user ${user.username} (${user.id})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
