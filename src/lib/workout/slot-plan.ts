import type {
  Exercise,
  SlotIntensity,
  SlotLoad,
  SlotLoadType,
  SlotPlan,
  SlotSetGroup,
  TemplateSlot,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import { specForPhase } from "@/lib/workout/cycle";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import {
  calcPlannedWeight,
  floorToStep,
  plannedSetsFromFormula,
  resolvePhaseSpec,
} from "@/lib/workout/formulas";
import { formatSignedWeight, formatWeight } from "@/lib/workout/numbers";

/**
 * Work sets in the default scheme sit at 80 % of the working weight, so a
 * kilogram-based top set is treated as that 80 % when warmups are derived.
 */
export const WORK_REFERENCE_PERCENT = 80;

/** Planned RIR on the last work set for each intensity tag. */
export const INTENSITY_LAST_SET_RIR: Record<SlotIntensity, number> = {
  heavy: 0,
  light: 2,
};

export const SLOT_INTENSITIES = ["heavy", "light"] as const;

export const SLOT_INTENSITY_LABELS: Record<SlotIntensity, string> = {
  heavy: "Тяжело",
  light: "Легко",
};

export const SLOT_INTENSITY_HINTS: Record<SlotIntensity, string> = {
  heavy: "Последний подход до отказа, до него — с запасом в 1 повтор.",
  light: "Все подходы с запасом 2–3 повтора, техника чистая.",
};

export const SLOT_LOAD_TYPES: SlotLoadType[] = [
  "percent",
  "track",
  "fixed",
  "feel",
];

export const SLOT_LOAD_LABELS: Record<SlotLoadType, string> = {
  percent: "% от рабочего",
  track: "Линейка",
  fixed: "Килограммы",
  feel: "По самочувствию",
};

export const SLOT_LOAD_HINTS: Record<SlotLoadType, string> = {
  percent: "Как в общем плане: процент от рабочего веса упражнения.",
  track: "Вес по линейке упражнения: каждую тренировку следующий шаг.",
  fixed: "Один и тот же вес, пока сам не поменяешь.",
  feel: "План не давит: подставим вес прошлого раза, впишешь свой.",
};

export interface PlannedSetRow {
  set_type: "warmup" | "work";
  set_number: number;
  planned_weight: number | null;
  planned_reps: number | null;
  planned_reps_to: number | null;
  planned_seconds: number | null;
  planned_rir: number | null;
}

export interface SlotPlanContext {
  kind: WorkoutKind;
  exercise: Pick<Exercise, "weight_step" | "formula_preset">;
  formulas: WorkoutFormulas;
  phaseKey: string | null;
  /** Working weight of the exercise (phase max inside a cycle). */
  maxWeight: number | null;
  /** Current step of the exercise's weight line. */
  trackWeight: number | null;
  /** Last weight actually lifted, for «по самочувствию». */
  feelWeight: number | null;
}

export function defaultSlotPlan(): SlotPlan {
  return { groups: null, intensity: null, warmup: true, note: null };
}

export function defaultSlotGroup(kind: WorkoutKind): SlotSetGroup {
  return kind === "static"
    ? { sets: 3, reps: null, reps_to: null, seconds: 6, load: percentLoad(80) }
    : { sets: 3, reps: 5, reps_to: null, seconds: null, load: percentLoad(80) };
}

export function percentLoad(percent: number): SlotLoad {
  return { type: "percent", percent };
}

export function trackLoad(offset = 0, percent = 100): SlotLoad {
  return { type: "track", percent, offset };
}

export function fixedLoad(weight: number): SlotLoad {
  return { type: "fixed", weight };
}

export function feelLoad(): SlotLoad {
  return { type: "feel" };
}

/** Switching load type keeps sensible defaults so the row never goes blank. */
export function switchLoadType(
  load: SlotLoad,
  type: SlotLoadType,
  exampleWeight: number | null,
): SlotLoad {
  if (load.type === type) {
    return load;
  }
  switch (type) {
    case "percent":
      return percentLoad(80);
    case "track":
      return trackLoad();
    case "fixed":
      return fixedLoad(
        exampleWeight != null && exampleWeight > 0 ? exampleWeight : 20,
      );
    case "feel":
      return feelLoad();
  }
}

export function slotIsCustom(plan: SlotPlan | null): boolean {
  return plan != null && plan.groups != null;
}

/** A plan that says nothing beyond the defaults is stored as null. */
export function normalizeSlotPlan(plan: SlotPlan | null): SlotPlan | null {
  if (!plan) {
    return null;
  }
  if (
    plan.groups == null &&
    plan.intensity == null &&
    plan.note == null &&
    plan.warmup
  ) {
    return null;
  }
  return plan;
}

export function slotNeedsMax(
  plan: SlotPlan | null,
  exercise: Pick<Exercise, "formula_preset">,
): boolean {
  if (!plan || plan.groups == null) {
    return exercise.formula_preset !== "none";
  }
  return plan.groups.some((group) => group.load.type === "percent");
}

export function slotNeedsTrack(plan: SlotPlan | null): boolean {
  return Boolean(plan?.groups?.some((group) => group.load.type === "track"));
}

export function slotNeedsFeel(plan: SlotPlan | null): boolean {
  return Boolean(plan?.groups?.some((group) => group.load.type === "feel"));
}

/** Whether this slot can produce a plan of sets at all (given the weights). */
export function slotCanPlan(
  plan: SlotPlan | null,
  exercise: Pick<Exercise, "formula_preset">,
): boolean {
  if (!plan || plan.groups == null) {
    return exercise.formula_preset !== "none";
  }
  return plan.groups.length > 0;
}

export function slotFor(
  slots: TemplateSlot[] | undefined,
  exerciseId: string,
): SlotPlan | null {
  return slots?.find((slot) => slot.exercise_id === exerciseId)?.plan ?? null;
}

/**
 * Planned sets for one slot. `null` means the slot cannot be planned yet:
 * a percent load without a working weight or a track load without a line.
 */
export function plannedSetsForSlot(
  plan: SlotPlan | null,
  ctx: SlotPlanContext,
): PlannedSetRow[] | null {
  const phase = ctx.phaseKey
    ? ctx.formulas.cycle.find((item) => item.key === ctx.phaseKey)
    : undefined;
  const skipWarmup = Boolean(phase?.skip_warmup);
  const intensity = plan?.intensity ?? null;

  if (!plan || plan.groups == null) {
    if (ctx.exercise.formula_preset === "none") {
      return null;
    }
    if (ctx.maxWeight == null || ctx.maxWeight <= 0) {
      return null;
    }
    const spec = resolvePhaseSpec(
      specForPhase(ctx.formulas, ctx.kind, ctx.phaseKey),
      ctx.kind,
      skipWarmup,
      ctx.exercise.formula_preset,
      ctx.formulas.warmups,
    );
    const rows = plannedSetsFromFormula(
      spec,
      ctx.maxWeight,
      ctx.exercise.weight_step,
      ctx.kind,
    ).map<PlannedSetRow>((set) => ({
      ...set,
      planned_reps_to: null,
      planned_rir: null,
    }));
    return withIntensityRir(rows, intensity);
  }

  const scale = phase?.percent_scale ?? 1;
  const work: PlannedSetRow[] = [];
  for (const group of plan.groups) {
    const weight = groupWeight(group.load, ctx, scale);
    if (weight === undefined) {
      return null;
    }
    for (let index = 0; index < group.sets; index += 1) {
      work.push({
        set_type: "work",
        set_number: 0,
        planned_weight: weight,
        planned_reps: group.reps,
        planned_reps_to: group.reps_to,
        planned_seconds: group.seconds,
        planned_rir: null,
      });
    }
  }

  const warmup = plan.warmup && !skipWarmup ? warmupRows(plan, work, ctx) : [];
  const rows = [...warmup, ...work].map((row, index) => ({
    ...row,
    set_number: index + 1,
  }));
  return withIntensityRir(rows, intensity);
}

/** `undefined` — cannot resolve (missing max/line); `null` — no weight by design. */
function groupWeight(
  load: SlotLoad,
  ctx: SlotPlanContext,
  scale: number,
): number | null | undefined {
  switch (load.type) {
    case "percent": {
      if (ctx.maxWeight == null || ctx.maxWeight <= 0) {
        return undefined;
      }
      return calcPlannedWeight(
        ctx.maxWeight,
        load.percent * scale,
        ctx.exercise.weight_step,
      );
    }
    case "track": {
      if (ctx.trackWeight == null || ctx.trackWeight <= 0) {
        return undefined;
      }
      const raw = (ctx.trackWeight * load.percent) / 100 + load.offset;
      return Math.max(0, floorToStep(raw, ctx.exercise.weight_step));
    }
    case "fixed":
      return load.weight;
    case "feel":
      return ctx.feelWeight != null && ctx.feelWeight > 0
        ? ctx.feelWeight
        : null;
  }
}

function warmupRows(
  plan: SlotPlan,
  work: PlannedSetRow[],
  ctx: SlotPlanContext,
): PlannedSetRow[] {
  const preset = ctx.exercise.formula_preset;
  if (preset === "none") {
    return [];
  }
  const usesPercent = plan.groups?.some(
    (group) => group.load.type === "percent",
  );
  const top = work.reduce<number | null>((best, row) => {
    if (row.planned_weight == null || row.planned_weight <= 0) {
      return best;
    }
    return best == null || row.planned_weight > best
      ? row.planned_weight
      : best;
  }, null);
  const reference = usesPercent
    ? ctx.maxWeight
    : top != null
      ? (top * 100) / WORK_REFERENCE_PERCENT
      : null;
  if (reference == null || reference <= 0) {
    return [];
  }

  const pack =
    ctx.formulas.warmups[ctx.kind] ??
    DEFAULT_WORKOUT_FORMULAS.warmups[ctx.kind];
  const sets =
    pack[preset] ?? DEFAULT_WORKOUT_FORMULAS.warmups[ctx.kind][preset];
  const cap = top ?? Number.POSITIVE_INFINITY;
  return sets.map<PlannedSetRow>((set) => ({
    set_type: "warmup",
    set_number: 0,
    planned_weight: Math.min(
      cap,
      calcPlannedWeight(reference, set.percent, ctx.exercise.weight_step),
    ),
    planned_reps: set.reps,
    planned_reps_to: null,
    planned_seconds: set.seconds,
    planned_rir: null,
  }));
}

function withIntensityRir(
  rows: PlannedSetRow[],
  intensity: SlotIntensity | null,
): PlannedSetRow[] {
  if (!intensity) {
    return rows;
  }
  let lastWork = -1;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index]?.set_type === "work") {
      lastWork = index;
      break;
    }
  }
  if (lastWork < 0) {
    return rows;
  }
  return rows.map((row, index) =>
    index === lastWork
      ? { ...row, planned_rir: INTENSITY_LAST_SET_RIR[intensity] }
      : row,
  );
}

// ---------- labels ----------

export function formatGroupReps(
  group: Pick<SlotSetGroup, "reps" | "reps_to" | "seconds">,
): string {
  if (group.seconds != null) {
    return `${formatWeight(group.seconds)}с`;
  }
  if (group.reps == null) {
    return "—";
  }
  return group.reps_to != null
    ? `${group.reps}–${group.reps_to}`
    : `${group.reps}`;
}

export function formatSlotLoad(load: SlotLoad): string {
  switch (load.type) {
    case "percent":
      return `${formatWeight(load.percent)} %`;
    case "track": {
      const parts = ["линейка"];
      if (load.percent !== 100) {
        parts.push(`${formatWeight(load.percent)} %`);
      }
      if (load.offset !== 0) {
        parts.push(`${formatSignedWeight(load.offset)} кг`);
      }
      return parts.join(" ");
    }
    case "fixed":
      return `${formatWeight(load.weight)} кг`;
    case "feel":
      return "по самочувствию";
  }
}

export function formatSlotGroup(group: SlotSetGroup): string {
  return `${group.sets}×${formatGroupReps(group)} ${formatSlotLoad(group.load)}`;
}

/** One line under the exercise in the template editor and the queue. */
export function slotPlanSummary(plan: SlotPlan | null): string | null {
  if (!plan) {
    return null;
  }
  const parts: string[] = [];
  if (plan.groups) {
    parts.push(plan.groups.map(formatSlotGroup).join(" · "));
    if (!plan.warmup) {
      parts.push("без разминки");
    }
  }
  if (plan.intensity) {
    parts.push(SLOT_INTENSITY_LABELS[plan.intensity].toLowerCase());
  }
  if (plan.note) {
    parts.push(plan.note);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function rirLabel(rir: number): string {
  if (rir <= 0) {
    return "до отказа";
  }
  return `запас ${rir}`;
}

/** «6», «6-8», «6–8» → reps + optional top of the range. */
export function parseRepsRange(
  raw: string,
): { reps: number; reps_to: number | null } | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (trimmed === "") {
    return null;
  }
  const match = /^(\d+)(?:[-–—](\d+))?$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const reps = Number(match[1]);
  const to = match[2] != null ? Number(match[2]) : null;
  if (!Number.isInteger(reps) || reps <= 0) {
    return null;
  }
  if (to != null && (!Number.isInteger(to) || to <= reps)) {
    return { reps, reps_to: null };
  }
  return { reps, reps_to: to };
}

export function formatRepsRange(
  reps: number | null,
  to: number | null,
): string {
  if (reps == null) {
    return "";
  }
  return to != null ? `${reps}–${to}` : String(reps);
}
