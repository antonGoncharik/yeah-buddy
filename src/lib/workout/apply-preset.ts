import type { WorkoutTemplateDetail } from "@/lib/types";
import { archiveExercise, listExercises } from "@/lib/workout/exercises";
import {
  type ProgramPresetId,
  programPresetById,
} from "@/lib/workout/program-presets";
import { saveRotation } from "@/lib/workout/rotation";
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
    catalog.map((exercise) => [exercise.name, exercise] as const),
  );
  const existing = await listTemplates(userId);
  const byTemplateName = new Map(
    existing.map((template) => [template.name, template] as const),
  );
  const activeIds: string[] = [];

  for (const day of preset.templates) {
    const exerciseIds: string[] = [];
    for (const name of day.exercises) {
      const exercise = byName.get(name);
      if (!exercise) {
        continue;
      }
      if (!exercise.is_active) {
        await archiveExercise(userId, exercise.id, false);
      }
      exerciseIds.push(exercise.id);
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

  const all = await listTemplates(userId);
  return saveRotation(userId, {
    rotation: all.map((template, index) => ({
      id: template.id,
      sort_order: activeIds.includes(template.id)
        ? (activeIds.indexOf(template.id) + 1) * 10
        : 1000 + index,
      is_active: activeIds.includes(template.id),
    })),
  });
}
