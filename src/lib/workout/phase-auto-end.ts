import { getUserCalendarToday } from "@/lib/day/writable";
import type { PhaseCircleProgress } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import {
  confirmTransition,
  previewTransition,
} from "@/lib/workout/macro-transition";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-rebuild";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

/**
 * Закрывает этап сам, когда пройден круг дней программы — если так
 * настроен цикл. Последний этап и этап с подъёмом 1ПМ не трогаем:
 * там человек смотрит веса.
 */
export function shouldAutoEndPhase(
  autoEnd: boolean,
  progress: Pick<
    PhaseCircleProgress,
    "suggest_end" | "last_in_cycle" | "increases_on_end"
  > | null,
): boolean {
  if (!autoEnd || !progress?.suggest_end) {
    return false;
  }
  if (progress.last_in_cycle || progress.increases_on_end) {
    return false;
  }
  return true;
}

export async function maybeAutoEndPhase(userId: string): Promise<void> {
  const settings = await ensureWorkoutSettings(userId);
  const state = await getCurrentMacroState(userId);
  if (
    !shouldAutoEndPhase(
      settings.formulas.cycle_auto_end === true,
      state.phase_circle,
    )
  ) {
    return;
  }

  const preview = await previewTransition(userId);
  if (preview.new_macro || preview.to_phase == null) {
    return;
  }

  await confirmTransition(userId, {
    end_date: await getUserCalendarToday(userId),
    maxes: preview.maxes.map((item) => ({
      exercise_id: item.exercise_id,
      max_weight: item.proposed_weight,
    })),
  });
  await rebuildTodaysPlannedSession(userId);
}
