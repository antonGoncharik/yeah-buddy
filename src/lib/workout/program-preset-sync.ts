import type { TemplateSlot } from "@/lib/types";
import type { ProgramDay } from "@/lib/workout/program-preset-data";
import { exerciseNameKey } from "@/lib/workout/dedupe-exercises";
import {
  archiveExercise,
  ensureNamedExercise,
  listExercises,
} from "@/lib/workout/exercises";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";
import {
  createTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/workout/template-store";

export async function buildExerciseNameMap(
  userId: string,
): Promise<Map<string, string>> {
  const catalog = await listExercises(userId, "all");
  const byName = new Map<string, string>();
  for (const exercise of catalog) {
    const key = exerciseNameKey(exercise.name);
    const currentId = byName.get(key);
    if (!currentId) {
      byName.set(key, exercise.id);
      continue;
    }
    const current = catalog.find((item) => item.id === currentId);
    if (!current) {
      byName.set(key, exercise.id);
      continue;
    }
    if (!current.is_active && exercise.is_active) {
      byName.set(key, exercise.id);
      continue;
    }
    if (
      current.is_active === exercise.is_active &&
      exercise.created_at < current.created_at
    ) {
      byName.set(key, exercise.id);
    }
  }
  return byName;
}

export async function slotsForProgramDay(
  userId: string,
  day: ProgramDay,
  byName: Map<string, string>,
): Promise<TemplateSlot[]> {
  const catalog = await listExercises(userId, "all");
  const archived = new Set(
    catalog.filter((exercise) => !exercise.is_active).map((item) => item.id),
  );
  const slots: TemplateSlot[] = [];

  for (const slot of day.exercises) {
    const nameKey = exerciseNameKey(slot.name);
    let exerciseId = byName.get(nameKey);
    if (!exerciseId) {
      const starter = STARTER_EXERCISES.find(
        (item) => exerciseNameKey(item.name) === nameKey,
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
      byName.set(nameKey, exerciseId);
    } else if (archived.has(exerciseId)) {
      await archiveExercise(userId, exerciseId, false);
      archived.delete(exerciseId);
    }
    slots.push({ exercise_id: exerciseId, plan: slot.plan });
  }

  return slots;
}

/** Writes program days into existing or new templates; returns active template ids. */
export async function syncProgramDaysToTemplates(
  userId: string,
  days: ProgramDay[],
): Promise<string[]> {
  const byName = await buildExerciseNameMap(userId);
  const existing = await listTemplates(userId);
  const byTemplateName = new Map(
    existing.map((template) => [template.name, template] as const),
  );
  const activeIds: string[] = [];

  for (const day of days) {
    const slots = await slotsForProgramDay(userId, day, byName);
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

  return activeIds;
}
