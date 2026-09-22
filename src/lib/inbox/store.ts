import {
  EMPTY_THREAD,
  type InboxThread,
  type InboxTopic,
  isInboxTopic,
  readTelegramId,
} from "@/lib/inbox/letter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function readInboxThread(
  telegramId: number,
): Promise<InboxThread> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("inbox_threads")
    .select("topic, draft")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (found.error) {
    console.error(found.error);
    return EMPTY_THREAD;
  }

  const row = found.data;
  if (!row) {
    return EMPTY_THREAD;
  }

  const draft = typeof row.draft === "string" ? row.draft.trim() : "";
  return {
    topic: isInboxTopic(row.topic) ? row.topic : null,
    draft: draft === "" ? null : draft,
  };
}

export async function saveInboxThread(
  telegramId: number,
  thread: { topic: InboxTopic | null; draft: string | null },
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  if (thread.topic == null && thread.draft == null) {
    const deleted = await supabase
      .from("inbox_threads")
      .delete()
      .eq("telegram_id", telegramId);
    if (deleted.error) {
      console.error(deleted.error);
      return false;
    }
    return true;
  }

  const saved = await supabase.from("inbox_threads").upsert(
    {
      telegram_id: telegramId,
      topic: thread.topic,
      draft: thread.draft,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" },
  );
  if (saved.error) {
    console.error(saved.error);
    return false;
  }

  return true;
}

export async function rememberInboxRoute(
  adminMessageId: number,
  telegramId: number,
): Promise<void> {
  if (!Number.isSafeInteger(adminMessageId) || adminMessageId <= 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const saved = await supabase.from("inbox_routes").upsert(
    {
      admin_message_id: adminMessageId,
      telegram_id: telegramId,
    },
    { onConflict: "admin_message_id" },
  );
  if (saved.error) {
    console.error(saved.error);
  }
}

export async function findInboxRoute(
  adminMessageId: number,
): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("inbox_routes")
    .select("telegram_id")
    .eq("admin_message_id", adminMessageId)
    .maybeSingle();

  if (found.error) {
    console.error(found.error);
    return null;
  }

  return readTelegramId(found.data?.telegram_id);
}
