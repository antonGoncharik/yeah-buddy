import type {
  ExerciseCategory,
  PhaseType,
  SessionFeel,
  WorkoutKind,
} from "@/lib/types/workout-core";

export interface ProgressPoint {
  date: string;
  weight: number;
  seconds: number | null;
  tonnage: number | null;
  circle_tonnage: number | null;
  body_weight: number | null;
  relative: number | null;
  phase_type: PhaseType | null;
  macro_number: number | null;
  /** Dynamic vs static session. Null on 1RM history without a session. */
  kind?: WorkoutKind | null;
  /** True when the working set was copied from the plan, not written. */
  from_plan?: boolean;
  label: string;
}

export interface ExerciseProgress {
  exercise_id: string;
  name: string;
  category: ExerciseCategory;
  current_weight: number | null;
  start_weight: number | null;
  delta: number | null;
  percent: number | null;
  current_relative: number | null;
  start_relative: number | null;
  relative_percent: number | null;
  current_tonnage: number | null;
  start_tonnage: number | null;
  tonnage_delta: number | null;
  tonnage_percent: number | null;
  points: ProgressPoint[];
  from_work: boolean;
}

export interface StrengthProgress {
  exercises: ExerciseProgress[];
  grown_count: number;
  avg_percent: number | null;
  avg_relative_percent: number | null;
  /** Logged weigh-ins, oldest first. Empty if the user never logged weight. */
  weights: Array<{ date: string; weight: number }>;
  /** Active program days (templates). 0 if there is no program. */
  circle_size: number;
  /** Completed sessions, oldest first. Used for feel counts and gym gaps. */
  sessions: Array<{ date: string; feel: SessionFeel | null }>;
}
