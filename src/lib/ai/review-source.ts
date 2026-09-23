import type { ReviewRange } from "@/lib/ai/range";
import type { FoodShare } from "@/lib/days";
import type {
  CurrentMacroState,
  DayHistoryRow,
  RecentWorkoutSession,
  StrengthProgress,
  UserTrainingAge,
} from "@/lib/types";

export type ReviewSource = {
  range: ReviewRange;
  from: string;
  to: string;
  days: DayHistoryRow[];
  sessions: RecentWorkoutSession[];
  foods: FoodShare[];
  foodsRest?: FoodShare[];
  foodsTraining?: FoodShare[];
  macro: CurrentMacroState;
  progress: StrengthProgress;
  seedWeight?: number | null;
  seedWaist?: number | null;
  trainingAge?: UserTrainingAge | null;
};
