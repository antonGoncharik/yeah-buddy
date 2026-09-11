import { PACK_EMPTY_WORKOUTS } from "@/lib/messages";
import { PackEmptyError, type WorkoutsPackPayload } from "@/lib/share/payload";
import { ensureNamedExercise } from "@/lib/workout/exercises";
import {
  clearSkipTemplateIds,
  saveWorkoutSettings,
} from "@/lib/workout/settings";
import {
  createTemplate,
  listTemplates,
  saveRotation,
  updateTemplate,
} from "@/lib/workout/templates";

export async function applyWorkoutsPack(
  userId: string,
  payload: WorkoutsPackPayload,
): Promise<void> {
  const byName = new Map<string, string>();
  for (const exercise of payload.exercises) {
    const ensured = await ensureNamedExercise(userId, exercise);
    byName.set(exercise.name, ensured.id);
  }

  const existing = await listTemplates(userId);
  const byTemplateName = new Map(
    existing.map((template) => [template.name, template] as const),
  );
  const activeIds: string[] = [];

  for (const day of payload.templates) {
    const exerciseIds = day.exercises.flatMap((name) => {
      const id = byName.get(name);
      return id ? [id] : [];
    });
    if (exerciseIds.length === 0) {
      continue;
    }

    const current = byTemplateName.get(day.name);
    if (current) {
      await updateTemplate(userId, current.id, {
        name: day.name,
        kind: day.kind,
        is_active: true,
        exercise_ids: exerciseIds,
      });
      activeIds.push(current.id);
      continue;
    }

    const created = await createTemplate(userId, {
      name: day.name,
      kind: day.kind,
      is_active: true,
      exercise_ids: exerciseIds,
    });
    activeIds.push(created.id);
  }

  if (activeIds.length === 0) {
    throw new PackEmptyError(PACK_EMPTY_WORKOUTS);
  }

  const all = await listTemplates(userId);
  await saveRotation(userId, {
    rotation: all.map((template, index) => ({
      id: template.id,
      sort_order: activeIds.includes(template.id)
        ? (activeIds.indexOf(template.id) + 1) * 10
        : 1000 + index,
      is_active: activeIds.includes(template.id),
    })),
  });

  await saveWorkoutSettings(userId, {
    max_increase_percent: payload.max_increase_percent,
    formulas: payload.formulas,
  });
  await clearSkipTemplateIds(userId);
}
