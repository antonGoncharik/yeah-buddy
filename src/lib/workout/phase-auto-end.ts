import { getUserCalendarToday } from "@/lib/day/writable";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import {
  confirmTransition,
  previewTransition,
} from "@/lib/workout/macro-transition";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

/**
 * Закрывает этап сам, когда пройден круг дней программы — если так
 * настроен цикл. Последний этап не трогаем: там закрывается весь цикл и
 * поднимается 1ПМ, это решает человек.
 */
export async function maybeAutoEndPhase(userId: string): Promise<void> {
  const settings = await ensureWorkoutSettings(userId);
  if (settings.formulas.cycle_auto_end !== true) {
    return;
  }

  const state = await getCurrentMacroState(userId);
  if (!state.phase || !state.phase_circle?.suggest_end) {
    return;
  }
  if (state.phase_circle.last_in_cycle) {
    return;
  }

  const preview = await previewTransition(userId);
  if (preview.new_macro || preview.to_phase == null) {
    return;
  }
  if (preview.maxes.length === 0) {
    return;
  }

  await confirmTransition(userId, {
    end_date: await getUserCalendarToday(userId),
    maxes: preview.maxes.map((item) => ({
      exercise_id: item.exercise_id,
      max_weight: item.proposed_weight,
    })),
  });
}
