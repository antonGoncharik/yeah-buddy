import type {
  Exercise,
  SessionFeel,
  SessionStatus,
  SetType,
  WorkoutKind,
} from "@/lib/types/workout-core";
import type {
  PhaseCircleProgress,
  WorkoutPhase,
  WorkoutTemplate,
  WorkoutTemplateDetail,
} from "@/lib/types/workout-macro";

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  macro_cycle_id: string | null;
  phase_id: string | null;
  workout_type: WorkoutKind;
  template_id: string | null;
  status: SessionStatus;
  note: string | null;
  feel: SessionFeel | null;
  created_at: string;
}

export interface SessionMaxRaiseOffer {
  exercise_id: string;
  name: string;
  from_weight: number;
  to_weight: number;
}

export interface RecentWorkoutSession {
  session: WorkoutSession;
  template_name: string | null;
  summary: string | null;
  plan_hit: number;
  plan_total: number;
}

export interface TodayWorkoutState {
  session: WorkoutSession | null;
  next_template: WorkoutTemplateDetail | null;
  following_template: WorkoutTemplateDetail | null;
  session_template: WorkoutTemplateDetail | null;
  unfinished: RecentWorkoutSession[];
  recent: RecentWorkoutSession[];
  can_unskip: boolean;
  can_backfill_yesterday: boolean;
  phase_circle: PhaseCircleProgress | null;
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

export interface SessionPreviousWork {
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  feel: SessionFeel | null;
}

export interface SessionExerciseDetail extends SessionExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
  previous: SessionPreviousWork | null;
}

export interface SessionDetail {
  session: WorkoutSession;
  template: WorkoutTemplate | null;
  phase: WorkoutPhase | null;
  exercises: SessionExerciseDetail[];
  raise_offers: SessionMaxRaiseOffer[];
}
