import type { ExerciseTrack } from "@/lib/types/workout-plan";

export type ExerciseCategory = "base" | "isolation";

export type ExerciseWorkoutType = "dynamic" | "static" | "both";

export type ExerciseUnit = "reps" | "seconds";

export type WorkoutKind = "dynamic" | "static";

export type PhaseType = string;

export type CycleStatus = "current" | "completed";

export type MaxSource = "auto" | "manual";

export type SessionStatus = "planned" | "completed" | "skipped";

export type SessionFeel = "easy" | "close" | "miss";

export type SetType = "warmup" | "work";

export type FormulaPreset = "barbell" | "cable" | "none";

export type ExerciseSlot = "a" | "b" | "c";

export interface FormulaSetSpec {
  percent: number;
  reps: number | null;
  seconds: number | null;
}

export interface FormulaPhaseSpec {
  warmup: FormulaSetSpec[];
  work: FormulaSetSpec[];
}

export type WarmupPresetId = Exclude<FormulaPreset, "none">;

export type KindWarmups = Record<WarmupPresetId, FormulaSetSpec[]>;

export interface KindFormulas {
  base: FormulaPhaseSpec;
  phases: Record<string, FormulaPhaseSpec>;
}

export interface CyclePhaseDef {
  key: string;
  name: string;
  skip_warmup: boolean;
  increase_on_end: boolean;
  /** If set, phase work percents are base × this, not a copy of base. */
  percent_scale?: number;
  /** Own work sets. Used on dynamic days; static keeps base / deload. */
  work?: FormulaSetSpec[];
}

export interface WorkoutFormulas {
  dynamic: KindFormulas;
  static: KindFormulas;
  warmups: Record<WorkoutKind, KindWarmups>;
  cycle: CyclePhaseDef[];
  /** Этап закрывается сам, когда пройден круг дней программы. */
  cycle_auto_end?: boolean;
}

export interface WorkoutSettings {
  user_id: string;
  max_increase_percent: number;
  formulas: WorkoutFormulas;
  skip_template_ids: string[];
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  short_name: string | null;
  category: ExerciseCategory;
  workout_type: ExerciseWorkoutType;
  unit: ExerciseUnit;
  weight_step: number;
  formula_preset: FormulaPreset;
  /** Максимум на один раз (1ПМ). Не участвует в плане: проценты считаются от рабочего/фазового максимума, он и есть 1ПМ. */
  one_rm: number | null;
  slot: ExerciseSlot | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface GlobalMax {
  id: string;
  user_id: string;
  exercise_id: string;
  max_weight: number;
  achieved_at: string;
  phase_id: string | null;
  workout_session_id: string | null;
  created_at: string;
}

export interface ExerciseWithMax extends Exercise {
  current_max: GlobalMax | null;
  max_history: GlobalMax[];
  track: ExerciseTrack | null;
}
