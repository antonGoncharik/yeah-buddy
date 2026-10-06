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
import type { SessionTrackInfo, SlotIntensity } from "@/lib/types/workout-plan";

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

export type SessionCloseKind = "as_planned" | "edited";

export interface RecentWorkoutSession {
  session: WorkoutSession;
  template_name: string | null;
  summary: string | null;
  plan_hit: number;
  plan_total: number;
  /** Null for skipped / unfinished. Completed sessions always have a kind. */
  close_kind: SessionCloseKind | null;
}

export interface TodayWorkoutState {
  session: WorkoutSession | null;
  next_template: WorkoutTemplateDetail | null;
  following_template: WorkoutTemplateDetail | null;
  session_template: WorkoutTemplateDetail | null;
  unfinished: RecentWorkoutSession[];
  recent: RecentWorkoutSession[];
  can_unskip: boolean;
  /** Last completed template in the current phase; drives queue order. */
  queue_last_template_id: string | null;
  skip_template_ids: string[];
  can_backfill_yesterday: boolean;
  phase_circle: PhaseCircleProgress | null;
  /** Current macro phase. Null when no cycle is running. */
  phase_id: string | null;
  completed_sessions: number;
  last_completed_before: string | null;
}

export interface SessionExercise {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  /** 1RM, от которого считались проценты; null для кг / одного веса / по самочувствию. */
  max_weight: number | null;
  intensity: SlotIntensity | null;
  note: string | null;
  track_id: string | null;
  track_step: number | null;
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
  planned_reps_to: number | null;
  planned_seconds: number | null;
  planned_rir: number | null;
  actual_weight: number | null;
  actual_reps: number | null;
  actual_seconds: number | null;
  actual_rir: number | null;
  is_completed: boolean;
  /** True when the lifter wrote this set. False if «Готово» copied the plan. */
  logged: boolean;
  created_at: string;
}

export interface SessionPreviousWork {
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  /** Запас на последнем рабочем подходе. Нет записи — подсказку не показываем. */
  rir: number | null;
  feel: SessionFeel | null;
  /** Прошлый раз был в том же этапе. Новый этап — подсказка молчит. */
  same_phase: boolean;
  /** Два «не зашло» подряд: вес не поднимаем. */
  hold: boolean;
}

export interface SessionExerciseDetail extends SessionExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
  previous: SessionPreviousWork | null;
  /** Серая подсказка: прибавить кг или повторы. Линейка и фиксированный вес — нет. */
  load_hint: boolean;
}

/** Prior working weights. Missing object means not loaded. */
export interface SessionBeats {
  body_weight: number | null;
  peaks: Array<{
    exercise_id: string;
    prior_peak: number | null;
    /** Day of the previous best. Null when there is no prior set. */
    prior_on: string | null;
  }>;
}

export interface SessionDetail {
  session: WorkoutSession;
  template: WorkoutTemplate | null;
  phase: WorkoutPhase | null;
  exercises: SessionExerciseDetail[];
  /** Template exercises left out of the plan because they have no 1RM yet. */
  missing_maxes: Exercise[];
  /** Template exercises whose slot uses working kg that is not set yet. */
  missing_tracks: Exercise[];
  tracks: SessionTrackInfo[];
  raise_offers: SessionMaxRaiseOffer[];
  /** Null until a completed session has been read from the server. */
  beats: SessionBeats | null;
}
