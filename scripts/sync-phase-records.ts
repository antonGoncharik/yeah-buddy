import { calendarToday } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { raiseGlobalMax } from "@/lib/workout/exercises";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";

async function main() {
  const username = process.argv[2];
  if (!username) {
    throw new Error(
      "usage: tsx --env-file=.env.local scripts/sync-phase-records.ts <username>",
    );
  }

  const supabase = createSupabaseServerClient();
  const users = await supabase
    .from("users")
    .select("id, username")
    .ilike("username", username);

  if (users.error) {
    throw users.error;
  }

  const user = users.data?.[0];
  if (!user || typeof user.id !== "string") {
    throw new Error(`user not found: ${username}`);
  }

  const state = await getCurrentMacroState(user.id);
  if (!state.phase) {
    throw new Error("no current phase");
  }

  const today = calendarToday();
  const raised: string[] = [];
  for (const row of state.maxes) {
    if (!row.phase_max) {
      continue;
    }
    const before = row.exercise.current_max?.max_weight ?? null;
    const target = row.phase_max.max_weight;
    if (before == null) {
      await raiseGlobalMax({
        userId: user.id,
        exerciseId: row.exercise.id,
        maxWeight: target,
        achievedAt: today,
        phaseId: state.phase.id,
      });
    } else if (before !== target) {
      const currentId = row.exercise.current_max?.id;
      if (currentId) {
        const updated = await supabase
          .from("global_maxes")
          .update({ max_weight: target, achieved_at: today })
          .eq("id", currentId)
          .eq("user_id", user.id);
        if (updated.error) {
          throw updated.error;
        }
      }
    }
    const name = row.exercise.short_name || row.exercise.name;
    raised.push(
      `${name}: phase ${row.phase_max.max_weight}` +
        (before == null ? " (no record)" : ` record was ${before}`),
    );
  }

  await rebuildTodaysPlannedSession(user.id);
  console.log(`synced ${user.username ?? user.id}`);
  for (const line of raised) {
    console.log(line);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
