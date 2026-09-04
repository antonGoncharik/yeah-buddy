export type FoodState = "raw" | "dry" | "cooked" | "as_is" | "liquid";

export type MealType =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "pre_workout"
  | "post_workout";

export type DayType = "rest" | "training";

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  rest_protein: number;
  rest_fat: number;
  rest_carbs: number;
  training_protein: number;
  training_fat: number;
  training_carbs: number;
  updated_at: string;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Day {
  id: string;
  user_id: string;
  date: string;
  is_training_day: boolean;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  target_kcal: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  day_id: string;
  meal_type: MealType;
  sort_order: number;
  created_at: string;
}

export interface MealItem {
  id: string;
  user_id: string;
  meal_id: string;
  food_id: string | null;
  name_snapshot: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  per_100_snapshot: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  day_type: DayType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealTemplateItem {
  id: string;
  user_id: string;
  template_id: string;
  meal_type: MealType;
  food_id: string;
  grams: number;
  sort_order: number;
  created_at: string;
}

export type ExerciseCategory = "base" | "armwrestling" | "isolation";

export type ExerciseWorkoutType = "dynamic" | "static" | "both";

export type ExerciseUnit = "reps" | "seconds";

export type WorkoutKind = "dynamic" | "static";

export type ScheduleWorkoutType = "dynamic" | "static" | "rest";

export type PhaseType = "ramp" | "volume" | "peak" | "deload";

export type CycleStatus = "current" | "completed";

export type MaxSource = "auto" | "manual";

export type SessionStatus = "planned" | "completed" | "skipped";

export type SetType = "warmup" | "work";

export type FormulaPreset = "barbell" | "cable" | "cable_short" | "none";

export type ExerciseSlot = "a" | "b" | "c";

export type WorkoutSlot = ExerciseSlot | "static";

export interface FormulaSetSpec {
  percent: number;
  reps: number | null;
  seconds: number | null;
}

export interface FormulaPhaseSpec {
  warmup: FormulaSetSpec[];
  work: FormulaSetSpec[];
}

export type WorkoutFormulas = Record<
  WorkoutKind,
  Record<PhaseType, FormulaPhaseSpec>
>;

export interface WorkoutSettings {
  user_id: string;
  weight_step: number;
  max_increase_percent: number;
  formulas: WorkoutFormulas;
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
}

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

export interface WorkoutScheduleDay {
  id: string;
  user_id: string;
  day_of_week: number;
  workout_type: ScheduleWorkoutType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  macro_cycle_id: string | null;
  phase_id: string | null;
  workout_type: WorkoutKind;
  template_id: string | null;
  slot: WorkoutSlot | null;
  status: SessionStatus;
  note: string | null;
  created_at: string;
}

export interface SessionExercise {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  max_weight: number;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  session_exercise_id: string;
  set_type: SetType;
  set_number: number;
  planned_weight: number | null;
  planned_reps: number | null;
  planned_seconds: number | null;
  actual_weight: number | null;
  actual_reps: number | null;
  actual_seconds: number | null;
  is_completed: boolean;
  created_at: string;
}

export interface PhaseMaxRow {
  exercise: ExerciseWithMax;
  phase_max: PhaseMax | null;
  proposed_weight: number | null;
}

export interface CurrentMacroState {
  macro: MacroCycle | null;
  phase: WorkoutPhase | null;
  phases: WorkoutPhase[];
  maxes: PhaseMaxRow[];
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
  new_macro: boolean;
  increased: boolean;
  maxes: TransitionMaxRow[];
}

export interface SessionExerciseDetail extends SessionExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface SessionDetail {
  session: WorkoutSession;
  template: WorkoutTemplate | null;
  phase: WorkoutPhase | null;
  exercises: SessionExerciseDetail[];
}
