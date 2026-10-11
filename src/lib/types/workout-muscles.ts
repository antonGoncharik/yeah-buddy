import type { UserSex } from "@/lib/types/user";

export type MuscleId =
  | "chest"
  | "lats"
  | "upper_back"
  | "traps"
  | "lower_back"
  | "abs"
  | "obliques"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "adductors"
  | "calves";

export type VolumeBand = 0 | 1 | 2 | 3 | 4;

export type MuscleBodyView = "front" | "back";

export type MuscleDisplayMode = "volume" | "recovery";

export interface MuscleCell {
  id: MuscleId;
  label: string;
  view: MuscleBodyView;
  sets: number;
  sets_per_week: number;
  volume_band: VolumeBand;
  last_trained: string | null;
  days_since: number | null;
  in_next_session: boolean;
  missed_sessions: number;
  weekly_sets: number[];
  /** Readiness 0–100; null if no load in the period. */
  recovery_percent: number | null;
}

export interface MuscleExerciseHit {
  exercise_id: string;
  name: string;
  last_date: string;
  sets: number;
  tonnage: number;
}

export interface MuscleMissedEvent {
  date: string;
  template_name: string | null;
  muscles: MuscleId[];
}

export interface MuscleBalancePair {
  a: MuscleId;
  b: MuscleId;
  ratio: number;
  label: string;
}

export interface MuscleSnapshot {
  horizon_days: number;
  since: string;
  until: string;
  /** Silhouette on the muscle map (from profile sex). */
  figure_sex: UserSex | null;
  muscles: MuscleCell[];
  hits_by_muscle: Partial<Record<MuscleId, MuscleExerciseHit[]>>;
  missed: MuscleMissedEvent[];
  balance: MuscleBalancePair[];
  insights: string[];
  planned_template_name: string | null;
  completed_sessions: number;
  skipped_sessions: number;
  unmapped_exercise_count: number;
}
