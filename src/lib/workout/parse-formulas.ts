import type { z } from "zod";

import { isRecord } from "@/lib/read";
import type { KindWarmups, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import {
  convertLegacyKind,
  hydrateCyclePhases,
  legacyCycle,
  legacyKeepsFourPhase,
} from "@/lib/workout/cycle";
import {
  cloneFormulas,
  DEFAULT_WARMUP_PRESETS,
  DEFAULT_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
import {
  formulasSchema,
  legacyFormulasSchema,
} from "@/lib/workout/formulas-schema";

export function fillFormulas(
  value: z.infer<typeof formulasSchema>,
): WorkoutFormulas {
  return hydrateCyclePhases({
    dynamic: {
      base: value.dynamic.base,
      phases: value.dynamic.phases ?? {},
    },
    static: {
      base: value.static.base,
      phases: value.static.phases ?? {},
    },
    warmups: normalizeWarmups(value.warmups),
    cycle: value.cycle ?? [],
  });
}

function normalizeWarmups(
  value: z.infer<typeof formulasSchema>["warmups"],
): Record<WorkoutKind, KindWarmups> {
  if (value == null) {
    return structuredClone(DEFAULT_WARMUP_PRESETS);
  }

  if ("dynamic" in value && "static" in value) {
    return structuredClone(value);
  }

  return {
    dynamic: structuredClone(value),
    static: structuredClone(DEFAULT_WARMUP_PRESETS.static),
  };
}

export function parseFormulas(value: unknown): WorkoutFormulas {
  const stripped = stripLegacyCableShort(value);
  const parsed = formulasSchema.safeParse(stripped);
  if (parsed.success) {
    return fillFormulas(parsed.data);
  }

  const legacy = legacyFormulasSchema.safeParse(stripped);
  if (legacy.success) {
    const keep = legacyKeepsFourPhase(legacy.data.dynamic);
    return hydrateCyclePhases({
      dynamic: convertLegacyKind(legacy.data.dynamic, keep),
      static: convertLegacyKind(legacy.data.static, keep),
      warmups: normalizeWarmups(legacy.data.warmups),
      cycle: legacyCycle(keep),
    });
  }

  return cloneFormulas(DEFAULT_WORKOUT_FORMULAS);
}

function stripLegacyCableShort(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const row: Record<string, unknown> = { ...value };
  delete row._skip_template_ids;
  const warmups = row.warmups;
  if (!isRecord(warmups)) {
    return row;
  }

  const nextWarmups: Record<string, unknown> = { ...warmups };
  delete nextWarmups.cable_short;
  return { ...row, warmups: nextWarmups };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseSkipTemplateIds(row: Record<string, unknown>): string[] {
  if ("skip_template_ids" in row) {
    return parseUuidList(row.skip_template_ids);
  }

  return parseSkipTemplateIdsFromFormulas(row.formulas);
}

function parseSkipTemplateIdsFromFormulas(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const raw = Reflect.get(value, "_skip_template_ids");
  return parseUuidList(raw);
}

function parseUuidList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && UUID_PATTERN.test(id),
      ),
    ),
  ];
}
