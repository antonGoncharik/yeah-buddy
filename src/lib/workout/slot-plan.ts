import type {
  CyclePhaseDef,
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
 * Work sets in the default scheme sit at 80 % of 1ПМ, so a kilogram-based
 * top set is treated as that 80 % when warmups are derived.
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
  percent: "% от 1ПМ",
  orm: "% от 1ПМ",
  track: "Линейка, кг",
  fixed: "Килограммы",
  feel: "По самочувствию",
};

export const SLOT_LOAD_HINTS: Record<SlotLoadType, string> = {
  percent:
    "Процент от 1ПМ в карточке. Цикл может сменить процент на другой неделе.",
  orm: "Процент от 1ПМ в карточке. Цикл может сменить процент на другой неделе.",
  track:
    "Ряд кг в упражнении. После тренировки — следующий шаг. Цикл этот ряд не двигает.",
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
  /** 1ПМ of the exercise (phase max inside a cycle). */
  maxWeight: number | null;
  /** Current step of the exercise's weight line. */
  trackWeight: number | null;
  /** Last weight actually lifted, for «по самочувствию». */
  feelWeight: number | null;
}

export function defaultSlotPlan(): SlotPlan {
  return { groups: null, intensity: null, warmup: true, note: null };
}

/**
 * Схема на конкретный этап цикла. Есть своя на этот этап — она; иначе
 * обычная схема слота; иначе null — значит по общему плану подходов.
 * `fromPhase` нужен планировщику: явная схема на этап не масштабируется
 * процентом этапа, иначе проценты умножатся дважды.
 */
export function slotGroupsForPhase(
  plan: SlotPlan | null,
  phaseKey: string | null,
): { groups: SlotSetGroup[] | null; fromPhase: boolean } {
  if (!plan) {
    return { groups: null, fromPhase: false };
  }
  const own = phaseKey ? plan.phases?.[phaseKey] : undefined;
  return own && own.length > 0
    ? { groups: own, fromPhase: true }
    : { groups: plan.groups, fromPhase: false };
}

/** Все группы слота: обычная схема плюс все схемы этапов. */
export function slotAllGroups(plan: SlotPlan | null): SlotSetGroup[] | null {
  if (!plan) {
    return null;
  }
  const phases = Object.values(plan.phases ?? {}).flat();
  if (plan.groups == null && phases.length === 0) {
    return null;
  }
  return [...(plan.groups ?? []), ...phases];
}

/** Ключи этапов, у которых на слоте своя схема. */
export function slotPhaseKeys(plan: SlotPlan | null): string[] {
  return Object.entries(plan?.phases ?? {})
    .filter(([, groups]) => groups.length > 0)
    .map(([key]) => key);
}

/** Ставит или убирает схему слота на этап. */
export function setSlotPhaseGroups(
  plan: SlotPlan | null,
  phaseKey: string,
  groups: SlotSetGroup[] | null,
): SlotPlan {
  const current = plan ?? defaultSlotPlan();
  const phases = { ...(current.phases ?? {}) };
  if (groups == null || groups.length === 0) {
    delete phases[phaseKey];
  } else {
    phases[phaseKey] = groups;
  }
  return Object.keys(phases).length > 0
    ? { ...current, phases }
    : { ...current, phases: undefined };
}

/** `undefined` этап — «где угодно в цикле»: для подсказок и предзагрузки. */
function groupsOf(
  plan: SlotPlan | null,
  phaseKey?: string | null,
): SlotSetGroup[] | null {
  return phaseKey === undefined
    ? slotAllGroups(plan)
    : slotGroupsForPhase(plan, phaseKey).groups;
}

export function defaultSlotGroup(kind: WorkoutKind): SlotSetGroup {
  return kind === "static"
    ? { sets: 3, reps: null, reps_to: null, seconds: 6, load: percentLoad(80) }
    : { sets: 3, reps: 5, reps_to: null, seconds: null, load: percentLoad(80) };
}

export function percentLoad(percent: number): SlotLoad {
  return { type: "percent", percent };
}

/** @deprecated Same as percentLoad: there is one max, and it is 1ПМ. */
export function ormLoad(percent: number): SlotLoad {
  return percentLoad(percent);
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
    case "orm":
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
  return (
    plan != null && (plan.groups != null || slotPhaseKeys(plan).length > 0)
  );
}

/** A plan that says nothing beyond the defaults is stored as null. */
export function normalizeSlotPlan(plan: SlotPlan | null): SlotPlan | null {
  if (!plan) {
    return null;
  }
  const collapsed = collapseOrmPlan(plan);
  const keys = slotPhaseKeys(collapsed);
  const phases =
    keys.length > 0
      ? Object.fromEntries(
          keys.map((key) => [key, collapsed.phases?.[key] ?? []] as const),
        )
      : undefined;
  if (
    collapsed.groups == null &&
    phases == null &&
    collapsed.intensity == null &&
    collapsed.note == null &&
    collapsed.warmup
  ) {
    return null;
  }
  return { ...collapsed, phases };
}

/** Old «% от 1ПМ» was a second max. Same number now — rewrite to percent. */
export function collapseOrmLoad(load: SlotLoad): SlotLoad {
  return load.type === "orm" ? percentLoad(load.percent) : load;
}

function collapseOrmGroup(group: SlotSetGroup): SlotSetGroup {
  return { ...group, load: collapseOrmLoad(group.load) };
}

export function collapseOrmPlan(plan: SlotPlan): SlotPlan {
  return {
    ...plan,
    groups: plan.groups?.map(collapseOrmGroup) ?? plan.groups,
    phases: plan.phases
      ? Object.fromEntries(
          Object.entries(plan.phases).map(([key, groups]) => [
            key,
            groups.map(collapseOrmGroup),
          ]),
        )
      : plan.phases,
  };
}

/** 1ПМ нужен, если схема считает подходы процентом от максимума. */
export function slotNeedsMax(
  plan: SlotPlan | null,
  exercise: Pick<Exercise, "formula_preset">,
  phaseKey?: string | null,
): boolean {
  const groups = groupsOf(plan, phaseKey);
  if (groups == null) {
    return exercise.formula_preset !== "none";
  }
  return groups.some(
    (group) => group.load.type === "percent" || group.load.type === "orm",
  );
}

export function slotNeedsTrack(
  plan: SlotPlan | null,
  phaseKey?: string | null,
): boolean {
  return Boolean(
    groupsOf(plan, phaseKey)?.some((group) => group.load.type === "track"),
  );
}

export function slotNeedsFeel(
  plan: SlotPlan | null,
  phaseKey?: string | null,
): boolean {
  return Boolean(
    groupsOf(plan, phaseKey)?.some((group) => group.load.type === "feel"),
  );
}

/** Whether this slot can produce a plan of sets at all (given the weights). */
export function slotCanPlan(
  plan: SlotPlan | null,
  exercise: Pick<Exercise, "formula_preset">,
  phaseKey?: string | null,
): boolean {
  const groups = groupsOf(plan, phaseKey);
  if (groups == null) {
    return exercise.formula_preset !== "none";
  }
  return groups.length > 0;
}

export function slotFor(
  slots: TemplateSlot[] | undefined,
  exerciseId: string,
): SlotPlan | null {
  return slots?.find((slot) => slot.exercise_id === exerciseId)?.plan ?? null;
}

/**
 * Planned sets for one slot. `null` means the slot cannot be planned yet:
 * a percent load without 1ПМ or a track load without a line.
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
  const { groups, fromPhase } = slotGroupsForPhase(plan, ctx.phaseKey);

  if (!plan || groups == null) {
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

  // Своя схема на этап — явная: процент этапа к ней не применяется.
  const scale = fromPhase ? 1 : (phase?.percent_scale ?? 1);
  const work: PlannedSetRow[] = [];
  for (const group of groups) {
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

  const warmup =
    plan.warmup && !skipWarmup ? warmupRows(groups, work, ctx) : [];
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
    case "percent":
    case "orm": {
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
  groups: SlotSetGroup[],
  work: PlannedSetRow[],
  ctx: SlotPlanContext,
): PlannedSetRow[] {
  const preset = ctx.exercise.formula_preset;
  if (preset === "none") {
    return [];
  }
  const top = work.reduce<number | null>((best, row) => {
    if (row.planned_weight == null || row.planned_weight <= 0) {
      return best;
    }
    return best == null || row.planned_weight > best
      ? row.planned_weight
      : best;
  }, null);
  const reference = warmupReference(groups, top, ctx);
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

/**
 * От чего считать разминку: проценты от 1ПМ — от максимума упражнения,
 * остальное (линейка, килограммы, самочувствие) — от верхнего рабочего
 * подхода, как от 80 % 1ПМ.
 */
function warmupReference(
  groups: SlotSetGroup[],
  top: number | null,
  ctx: SlotPlanContext,
): number | null {
  if (
    groups.some(
      (group) => group.load.type === "percent" || group.load.type === "orm",
    )
  ) {
    return ctx.maxWeight;
  }
  return top == null ? null : (top * 100) / WORK_REFERENCE_PERCENT;
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
    case "orm":
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

/** One line under the exercise in the template editor and the program. */
export function slotPlanSummary(
  plan: SlotPlan | null,
  cycle: CyclePhaseDef[] = [],
): string | null {
  if (!plan) {
    return null;
  }
  const parts: string[] = [];
  if (plan.groups) {
    parts.push(plan.groups.map(formatSlotGroup).join(" · "));
  } else if (slotPhaseKeys(plan).length > 0) {
    parts.push("по общему плану");
  }
  const phases = phaseNamesLabel(plan, cycle);
  if (phases) {
    parts.push(`свои подходы: ${phases}`);
  }
  if (plan.groups && !plan.warmup) {
    parts.push("без разминки");
  }
  if (plan.intensity) {
    parts.push(SLOT_INTENSITY_LABELS[plan.intensity].toLowerCase());
  }
  if (plan.note) {
    parts.push(plan.note);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function phaseNamesLabel(
  plan: SlotPlan,
  cycle: CyclePhaseDef[],
): string | null {
  const keys = slotPhaseKeys(plan);
  if (keys.length === 0) {
    return null;
  }
  if (cycle.length === 0) {
    return `${keys.length} ${phaseWord(keys.length)}`;
  }
  return cycle
    .filter((phase) => keys.includes(phase.key))
    .map((phase) => phase.name)
    .join(", ");
}

function phaseWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "этап";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "этапа";
  }
  return "этапов";
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
