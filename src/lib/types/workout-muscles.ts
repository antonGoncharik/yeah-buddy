export type MuscleId =
  | "chest"
  | "lats"
  | "upper_back"
  | "lower_back"
  | "abs"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export type MuscleStatus = "trained" | "stale" | "missed" | "planned" | "idle";

export type MuscleBodyView = "front" | "back";

export interface MuscleCell {
  id: MuscleId;
  label: string;
  view: MuscleBodyView;
  load: number;
  status: MuscleStatus;
  last_trained: string | null;
  work_sets: number;
  missed_sessions: number;
}

export interface MuscleExerciseHit {
  exercise_id: string;
  name: string;
  last_date: string;
  tonnage: number;
}

export interface MuscleSnapshot {
  horizon_days: number;
  since: string;
  until: string;
  muscles: MuscleCell[];
  hits_by_muscle: Partial<Record<MuscleId, MuscleExerciseHit[]>>;
  planned_template_name: string | null;
  completed_sessions: number;
  skipped_sessions: number;
}
