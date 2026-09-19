import type { UserSettings } from "@/lib/types";
import type { ProgramPresetId } from "@/lib/workout/program-presets";

export type OnboardingCircle = ProgramPresetId | "empty";

export type OnboardingState = {
  completed: boolean;
  settings: UserSettings;
  circle: OnboardingCircle;
};
