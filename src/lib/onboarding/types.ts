import type { ExerciseWithMax, UserSettings } from "@/lib/types";
import type { ProgramPresetId } from "@/lib/workout/program-presets";

export type OnboardingCircle = ProgramPresetId | "empty";

export type OnboardingState = {
  completed: boolean;
  settings: UserSettings;
  exercises: ExerciseWithMax[];
  circle: OnboardingCircle;
  maxesLocked: boolean;
};
