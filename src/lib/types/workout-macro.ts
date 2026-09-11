import type {
  CycleStatus,
  Exercise,
  ExerciseWithMax,
  MaxSource,
  PhaseType,
  WorkoutKind,
} from "@/lib/types/workout-core";

export interface MacroCycle {
  id: string;
  user_id: string;
  number: number;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  note: string | null;
  created_at: string;
}

export interface WorkoutPhase {
  id: string;
  user_id: string;
  macro_cycle_id: string;
  phase_type: PhaseType;
  name: string | null;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  sort_order: number;
  created_at: string;
}

export interface PhaseMax {
  id: string;
  user_id: string;
  phase_id: string;
  exercise_id: string;
  max_weight: number;
  source: MaxSource;
  set_at: string;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  kind: WorkoutKind;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  user_id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  created_at: string;
}

export interface WorkoutTemplateDetail extends WorkoutTemplate {
  exercises: Exercise[];
}

export interface PhaseMaxRow {
  exercise: ExerciseWithMax;
  phase_max: PhaseMax | null;
  proposed_weight: number | null;
}

export interface MacroGain {
  exercise_id: string;
  name: string;
  start_weight: number;
  end_weight: number;
  delta: number;
  percent: number | null;
}

export interface MacroRecap {
  macro_id: string;
  number: number;
  start_date: string;
  end_date: string | null;
  from_phase: PhaseType;
  to_phase: PhaseType;
  from_name: string;
  to_name: string;
  gains: MacroGain[];
  grown_count: number;
  avg_percent: number | null;
}

export interface PhaseCircleProgress {
  phase_type: PhaseType;
  phase_name: string;
  next_phase_type: PhaseType | null;
  next_phase_name: string | null;
  last_in_cycle: boolean;
  increases_on_end: boolean;
  completed_count: number;
  circle_size: number;
  suggest_end: boolean;
}

export interface CurrentMacroState {
  macro: MacroCycle | null;
  phase: WorkoutPhase | null;
  phases: WorkoutPhase[];
  maxes: PhaseMaxRow[];
  phase_circle: PhaseCircleProgress | null;
  last_recap: MacroRecap | null;
}

export interface TransitionMaxRow {
  exercise_id: string;
  name: string;
  current_weight: number;
  proposed_weight: number;
}

export interface TransitionPreview {
  from_phase: PhaseType;
  to_phase: PhaseType | null;
  from_name: string;
  to_name: string | null;
  new_macro: boolean;
  increased: boolean;
  maxes: TransitionMaxRow[];
}
