import type { ExerciseCategory, PhaseType } from "@/lib/types/workout-core";

export interface ProgressPoint {
  date: string;
  weight: number;
  seconds: number | null;
  body_weight: number | null;
  relative: number | null;
  phase_type: PhaseType | null;
  macro_number: number | null;
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
  points: ProgressPoint[];
  from_work: boolean;
}

export interface StrengthProgress {
  exercises: ExerciseProgress[];
  grown_count: number;
  avg_percent: number | null;
  avg_relative_percent: number | null;
}
