import { forgetJson, peekJson, writeJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import { sessionDateUrl } from "@/lib/workout/session-local";

const TEMPLATE_KEYS = [
  "next_template",
  "session_template",
  "following_template",
] as const;

/** Replace one program slot in a cached templates or hub payload. The old scheme does not follow the new lift. */
export function rewriteCachedTemplateExercise(
  data: unknown,
  templateId: string,
  fromExerciseId: string,
  nextExercise: Record<string, unknown>,
): unknown {
  if (!isRecord(data) || typeof nextExercise.id !== "string") {
    return data;
  }

  let changed = false;
  const next: Record<string, unknown> = { ...data };

  if (Array.isArray(data.templates)) {
    next.templates = data.templates.map((item) => {
      const swapped = rewriteTemplate(
        item,
        templateId,
        fromExerciseId,
        nextExercise,
      );
      if (swapped !== item) {
        changed = true;
      }
      return swapped;
    });
  }

  for (const key of TEMPLATE_KEYS) {
    if (!(key in data)) {
      continue;
    }
    const swapped = rewriteTemplate(
      data[key],
      templateId,
      fromExerciseId,
      nextExercise,
    );
    if (swapped !== data[key]) {
      changed = true;
      next[key] = swapped;
    }
  }

  if (isRecord(data.template)) {
    const swapped = rewriteTemplate(
      data.template,
      templateId,
      fromExerciseId,
      nextExercise,
    );
    if (swapped !== data.template) {
      changed = true;
      next.template = swapped;
    }
  }

  return changed ? next : data;
}

export function rememberTemplateSwap(input: {
  templateId: string;
  date: string;
  fromExerciseId: string;
  exerciseId: string;
}): void {
  const exercise = findCachedExercise(
    peekJson("/api/exercises?filter=active"),
    input.exerciseId,
  );
  const urls = [
    "/api/templates",
    `/api/templates/${input.templateId}`,
    sessionDateUrl(input.date),
  ];
  if (!exercise) {
    for (const url of urls) {
      forgetJson(url);
    }
    return;
  }

  for (const url of urls) {
    const cached = peekJson(url);
    if (cached == null) {
      continue;
    }
    writeJson(
      url,
      rewriteCachedTemplateExercise(
        cached,
        input.templateId,
        input.fromExerciseId,
        exercise,
      ),
    );
  }
}

function findCachedExercise(
  data: unknown,
  exerciseId: string,
): Record<string, unknown> | null {
  if (!isRecord(data) || !Array.isArray(data.exercises)) {
    return null;
  }
  const row = data.exercises.find(
    (item) => isRecord(item) && item.id === exerciseId,
  );
  return isRecord(row) ? row : null;
}

function rewriteTemplate(
  value: unknown,
  templateId: string,
  fromExerciseId: string,
  nextExercise: Record<string, unknown>,
): unknown {
  if (!isRecord(value) || value.id !== templateId) {
    return value;
  }

  let hit = false;
  const exercises = Array.isArray(value.exercises)
    ? value.exercises.map((row) => {
        if (!isRecord(row) || row.id !== fromExerciseId) {
          return row;
        }
        hit = true;
        return nextExercise;
      })
    : value.exercises;
  const slots = Array.isArray(value.slots)
    ? value.slots.map((row) => {
        if (!isRecord(row) || row.exercise_id !== fromExerciseId) {
          return row;
        }
        hit = true;
        return { ...row, exercise_id: nextExercise.id, plan: null };
      })
    : value.slots;

  if (!hit) {
    return value;
  }

  return { ...value, exercises, slots };
}
