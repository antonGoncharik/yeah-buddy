import type { UserGoal } from "@/lib/types";

/** How many kg a week a pace may ask for, shared by onboarding and the offer. */
export const WEEKLY_KG_CAP: Record<UserGoal, { min: number; max: number }> = {
  lose: { min: 0.25, max: 0.7 },
  keep: { min: 0, max: 0 },
  gain: { min: 0.12, max: 0.35 },
};
