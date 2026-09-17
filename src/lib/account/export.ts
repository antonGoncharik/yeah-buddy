import type { AccountExport } from "@/lib/account/export-shape";
import { ACCOUNT_USER_ID_TABLES } from "@/lib/account/tables";
import { isRecord } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE = 1000;

export async function exportUserAccount(
  userId: string,
): Promise<AccountExport> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("users")
    .select("id, telegram_id, username, first_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (found.error) {
    throw found.error;
  }

  const row = found.data;
  if (!row || typeof row.id !== "string") {
    throw new Error("Пользователь не найден.");
  }

  const telegramId = Number(row.telegram_id);
  const tables: Record<string, unknown[]> = {};
  for (const table of ACCOUNT_USER_ID_TABLES) {
    tables[table] = await listEq(supabase, table, "user_id", userId);
  }
  tables.share_packs = await listEq(
    supabase,
    "share_packs",
    "owner_user_id",
    userId,
  );

  return {
    v: 1,
    exported_at: new Date().toISOString(),
    user: {
      id: row.id,
      telegram_id: Number.isFinite(telegramId) ? telegramId : 0,
      username: typeof row.username === "string" ? row.username : null,
      first_name: typeof row.first_name === "string" ? row.first_name : null,
      created_at: String(row.created_at ?? ""),
    },
    tables,
  };
}

async function listEq(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  table: string,
  column: string,
  value: string,
): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = await supabase
      .from(table)
      .select("*")
      .eq(column, value)
      .range(from, from + PAGE - 1);
    if (page.error) {
      throw page.error;
    }
    const batch = page.data ?? [];
    for (const item of batch) {
      if (isRecord(item)) {
        rows.push(item);
      }
    }
    if (batch.length < PAGE) {
      break;
    }
  }
  return rows;
}
