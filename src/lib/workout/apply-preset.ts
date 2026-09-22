import { getUserCalendarToday } from "@/lib/day/writable";
import { getUserSettings } from "@/lib/settings";
import type { TemplateSlot, WorkoutTemplateDetail } from "@/lib/types";
import { withCycle } from "@/lib/workout/cycle";
import {
  archiveExercise,
  ensureNamedExercise,
  listExercises,
} from "@/lib/workout/exercises";
import {
  closeCurrentMacro,
  createFirstMacro,
} from "@/lib/workout/macro-create";
import {
  type ProgramPresetId,
  programIsOffered,
  programPresetById,
} from "@/lib/workout/program-presets";
import { saveRotation } from "@/lib/workout/rotation";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-rebuild";
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

export class ProgramNotOfferedError extends Error {
  constructor() {
    super("Этой программы нет.");
    this.name = "ProgramNotOfferedError";
  }
}

export async function applyProgramPreset(
  userId: string,
  presetId: ProgramPresetId,
): Promise<WorkoutTemplateDetail[]> {
  const preset = programPresetById(presetId);
  if (!preset) {
    throw new Error("Нет такой программы.");
  }

  const account = await getUserSettings(userId);
  if (!programIsOffered(presetId, account?.granted_programs ?? [])) {
    throw new ProgramNotOfferedError();
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

  // The program owns the weeks: its cycle, or none.
  const settings = await ensureWorkoutSettings(userId);
  await saveWorkoutSettings(userId, {
    formulas: withCycle(settings.formulas, preset.cycle ?? [], {
      auto_end: preset.cycle_auto_end,
      loop: preset.cycle_loop,
    }),
  });

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

  await restartPresetCycle(userId, Boolean(preset.cycle));
  await rebuildTodaysPlannedSession(userId);

  return templates;
}

/** Closes leftover weeks, then starts this program's weeks if it has any. */
async function restartPresetCycle(
  userId: string,
  start: boolean,
): Promise<void> {
  try {
    await closeCurrentMacro(userId);
    if (!start) {
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
