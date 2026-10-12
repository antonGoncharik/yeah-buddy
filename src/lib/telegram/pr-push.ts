import { getServerEnv } from "@/lib/env";
import { disableReminders, getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendDiaryMessage } from "@/lib/telegram/bot";
import {
  reminderExtraBlocked,
  reminderExtraSentCount,
  reminderLogClaim,
  reminderLogRelease,
} from "@/lib/telegram/reminder-log";
import type { SessionDetail } from "@/lib/types";
import { e1rmFromWorkSet } from "@/lib/workout/e1rm";

export function prExerciseNames(detail: SessionDetail): string[] {
  const names: string[] = [];
  for (const item of detail.exercises) {
    const previous = item.previous;
    if (!previous || previous.weight == null || previous.reps == null) {
      continue;
    }
    const prior = e1rmFromWorkSet({
      set_type: "work",
      planned_weight: previous.weight,
      actual_weight: previous.weight,
      planned_reps: previous.reps,
      actual_reps: previous.reps,
      planned_rir: previous.rir,
      actual_rir: previous.rir,
    });
    if (prior == null) {
      continue;
    }
    let best = 0;
    for (const set of item.sets) {
      const next = e1rmFromWorkSet(set);
      if (next != null && next > best) {
        best = next;
      }
    }
    if (best > prior + 0.4) {
      names.push(item.exercise.short_name ?? item.exercise.name);
    }
  }
  return names;
}

export function prPushLine(names: string[]): string | null {
  const first = names[0];
  if (!first) {
    return null;
  }
  if (names.length === 1) {
    return `Новый рекорд в «${first}». Карточку можно отправить из дневника.`;
  }
  return `Новые рекорды: ${names.slice(0, 3).join(", ")}.`;
}

export async function notifySessionPr(
  userId: string,
  detail: SessionDetail,
  date: string,
): Promise<void> {
  const names = prExerciseNames(detail);
  const line = prPushLine(names);
  if (!line) {
    return;
  }
  const settings = await getUserSettings(userId);
  if (!settings?.reminders_enabled || settings.pr_push_enabled === false) {
    return;
  }
  const sentExtras = await reminderExtraSentCount(userId, date);
  if (reminderExtraBlocked(sentExtras)) {
    return;
  }
  const claimed = await reminderLogClaim(userId, "pr", date);
  if (!claimed) {
    return;
  }
  let delivered = false;
  try {
    const supabase = createSupabaseServerClient();
    const user = await supabase
      .from("users")
      .select("telegram_id")
      .eq("id", userId)
      .maybeSingle();
    const telegramId = Number(user.data?.telegram_id);
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
      return;
    }
    const sent = await sendDiaryMessage(telegramId, line, getServerEnv());
    if (sent === "blocked") {
      await disableReminders(userId);
    }
    delivered = sent === "sent";
  } finally {
    if (!delivered) {
      try {
        await reminderLogRelease(userId, "pr", date);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
