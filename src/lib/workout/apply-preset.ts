import { getUserCalendarToday } from "@/lib/day/writable";
import type { TemplateSlot, WorkoutTemplateDetail } from "@/lib/types";
import { withCycle } from "@/lib/workout/cycle";
import {
  archiveExercise,
  ensureNamedExercise,
  listExercises,
} from "@/lib/workout/exercises";
import { createFirstMacro } from "@/lib/workout/macro-create";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import {
  type ProgramPresetId,
  programPresetById,
} from "@/lib/workout/program-presets";
import { saveRotation } from "@/lib/workout/rotation";
import {
  ensureWorkoutSettings,
  saveWorkoutSettings,
} from "@/lib/workout/settings";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";
import {
  createTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/workout/template-store";

export async function applyProgramPreset(
  userId: string,
  presetId: ProgramPresetId,
): Promise<WorkoutTemplateDetail[]> {
  const preset = programPresetById(presetId);
  if (!preset) {
    throw new Error("Нет такой программы.");
  }

  const catalog = await listExercises(userId, "all");
  const byName = new Map(
    catalog.map((exercise) => [exercise.name, exercise.id] as const),
  );
  const archived = new Set(
    catalog.filter((exercise) => !exercise.is_active).map((item) => item.id),
  );
  const existing = await listTemplates(userId);
  const byTemplateName = new Map(
    existing.map((template) => [template.name, template] as const),
  );
  const activeIds: string[] = [];

  for (const day of preset.templates) {
    const slots: TemplateSlot[] = [];
    for (const slot of day.exercises) {
      let exerciseId = byName.get(slot.name);
      if (!exerciseId) {
        // A lift the user never had (e.g. added to the starter list later).
        const starter = STARTER_EXERCISES.find(
          (item) => item.name === slot.name,
        );
        if (!starter) {
          continue;
        }
        const created = await ensureNamedExercise(userId, {
          name: starter.name,
          short_name: starter.short_name,
          category: starter.category,
          workout_type: starter.workout_type,
          unit: starter.workout_type === "static" ? "seconds" : "reps",
          weight_step: starter.weight_step,
          formula_preset: starter.formula_preset,
        });
        exerciseId = created.id;
        byName.set(slot.name, exerciseId);
      } else if (archived.has(exerciseId)) {
        await archiveExercise(userId, exerciseId, false);
        archived.delete(exerciseId);
      }
      slots.push({ exercise_id: exerciseId, plan: slot.plan });
    }

    const current = byTemplateName.get(day.name);
    if (current) {
      await updateTemplate(userId, current.id, {
        name: day.name,
        kind: day.kind,
        is_active: true,
        slots,
      });
      activeIds.push(current.id);
      continue;
    }

    const created = await createTemplate(userId, {
      name: day.name,
      kind: day.kind,
      is_active: true,
      slots,
    });
    activeIds.push(created.id);
  }

  // Программа с неделями ставит свой цикл вместе с днями.
  if (preset.cycle) {
    const settings = await ensureWorkoutSettings(userId);
    await saveWorkoutSettings(userId, {
      formulas: withCycle(settings.formulas, preset.cycle, {
        auto_end: preset.cycle_auto_end,
        loop: preset.cycle_loop,
      }),
    });
  }

  const all = await listTemplates(userId);
  const templates = await saveRotation(userId, {
    rotation: all.map((template, index) => ({
      id: template.id,
      sort_order: activeIds.includes(template.id)
        ? (activeIds.indexOf(template.id) + 1) * 10
        : 1000 + index,
      is_active: activeIds.includes(template.id),
    })),
  });

  if (preset.cycle) {
    await startPresetCycle(userId);
  }

  return templates;
}

/** Starts the weeks if none are running. Missing 1ПМ can wait for the gym. */
async function startPresetCycle(userId: string): Promise<void> {
  try {
    const current = await getCurrentMacroState(userId);
    if (current.macro) {
      return;
    }
    await createFirstMacro(userId, {
      start_date: await getUserCalendarToday(userId),
      note: null,
      maxes: [],
    });
  } catch {
    // Days and weeks are saved; the cycle screen can start it later.
  }
}
