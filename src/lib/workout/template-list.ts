import type { WorkoutTemplateDetail } from "@/lib/types";

export function activeWorkoutTemplates(
  templates: readonly WorkoutTemplateDetail[],
): WorkoutTemplateDetail[] {
  return templates.filter((template) => template.is_active);
}

export function inactiveWorkoutTemplates(
  templates: readonly WorkoutTemplateDetail[],
): WorkoutTemplateDetail[] {
  return templates.filter((template) => !template.is_active);
}
